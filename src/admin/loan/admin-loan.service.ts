import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanApplicationService } from 'src/loan-application/loan-application.service';
import { LoanNotificationService } from 'src/loan-application/loan-notification.service';
import {
  AdminDecisionDto,
  AdminQueryAgentsDto,
  AdminQueryLoanDto,
  AssignAgentDto,
  ManualStatusDto,
} from './dto';
import {
  LOAN_APPLICATION_STATUS,
  LOAN_DECISION_TYPE,
  AGENT_RECOMMENDATION_TYPE,
  USER_ROLE,
  USER_ACCOUNT_STATUS,
  User,
} from '@prisma/client';
import { Helpers } from 'src/helpers';

@Injectable()
export class AdminLoanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loanAppService: LoanApplicationService,
    private readonly notifications: LoanNotificationService,
  ) {}

  async listAgentsWithFarmers(query: AdminQueryAgentsDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { role: USER_ROLE.AGENT };
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const agentSelect = {
      id: true,
      fullname: true,
      email: true,
      phoneNumber: true,
      username: true,
      gender: true,
      country: true,
      address: true,
      state: true,
      city: true,
      profileImageUrl: true,
      dateOfBirth: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      isBvnVerified: true,
      isNinVerified: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    };

    const [agents, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: agentSelect,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const agentIds = agents.map((a) => a.id);

    const activeStatuses = [
      LOAN_APPLICATION_STATUS.Draft,
      LOAN_APPLICATION_STATUS.Submitted,
      LOAN_APPLICATION_STATUS.EligibilityReview,
      LOAN_APPLICATION_STATUS.PendingFieldVerification,
      LOAN_APPLICATION_STATUS.UnderReview,
      LOAN_APPLICATION_STATUS.MoreInfoRequired,
      LOAN_APPLICATION_STATUS.Approved,
      LOAN_APPLICATION_STATUS.FulfillmentInProgress,
      LOAN_APPLICATION_STATUS.ReadyForPickup,
      LOAN_APPLICATION_STATUS.OutForDelivery,
      LOAN_APPLICATION_STATUS.Delivered,
      LOAN_APPLICATION_STATUS.Active,
      LOAN_APPLICATION_STATUS.PartiallyRepaid,
      LOAN_APPLICATION_STATUS.Overdue,
    ];

    const [farmerGroups, activeLoanGroups] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where: {
          agentId: { in: agentIds },
          user: { role: USER_ROLE.FARMER },
        },
        distinct: ['agentId', 'userId'],
        select: { agentId: true, userId: true },
      }),
      this.prisma.loanApplication.groupBy({
        by: ['agentId'],
        where: { agentId: { in: agentIds }, status: { in: activeStatuses } },
        _count: { id: true },
      }),
    ]);

    const farmerCountMap: Record<string, number> = {};
    for (const g of farmerGroups) {
      farmerCountMap[g.agentId] = (farmerCountMap[g.agentId] ?? 0) + 1;
    }

    const activeLoanCountMap: Record<string, number> = {};
    for (const g of activeLoanGroups) {
      activeLoanCountMap[g.agentId] = g._count.id;
    }

    const data = agents.map((agent) => ({
      ...agent,
      farmersCount: farmerCountMap[agent.id] ?? 0,
      activeLoanApplicationsCount: activeLoanCountMap[agent.id] ?? 0,
    }));

    return {
      status: true,
      message: 'Agents retrieved',
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async listApplications(query: AdminQueryLoanDto) {
    const { status, search, state, agentId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (agentId) where.agentId = agentId;
    if (search) {
      where.OR = [
        { applicationRef: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (state) {
      where.farm = { state: { contains: state, mode: 'insensitive' } };
    }

    const [items, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        include: {
          farm: true,
          items: true,
          agentRecommendation: true,
          user: {
            select: {
              id: true,
              fullname: true,
              email: true,
              phoneNumber: true,
            },
          },
          agent: {
            select: {
              id: true,
              fullname: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      status: true,
      message: 'Applications retrieved',
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getApplicationDetail(id: string) {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id },
      include: {
        farm: { include: { photos: true } },
        user: { omit: { createdAt: true, updatedAt: true } },
        agent: { omit: { createdAt: true, updatedAt: true } },
        items: true,
        eligibilityChecks: true,
        agentRecommendation: true,
        fieldVerification: true,
        decisions: { orderBy: { decidedAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        fulfillment: { include: { items: true, supplier: true } },
        repaymentPlan: { include: { repayments: true } },
        auditLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    return { status: true, message: 'Application retrieved', data: app };
  }

  async makeDecision(id: string, body: AdminDecisionDto, admin: User) {
    const app = await this.prisma.loanApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    // Determine new status based on decision
    const statusMap: Record<LOAN_DECISION_TYPE, LOAN_APPLICATION_STATUS> = {
      [LOAN_DECISION_TYPE.approved]: LOAN_APPLICATION_STATUS.Approved,
      [LOAN_DECISION_TYPE.rejected]: LOAN_APPLICATION_STATUS.Rejected,
      [LOAN_DECISION_TYPE.more_info_required]:
        LOAN_APPLICATION_STATUS.MoreInfoRequired,
      [LOAN_DECISION_TYPE.hold]: LOAN_APPLICATION_STATUS.UnderReview,
      [LOAN_DECISION_TYPE.send_for_verification]:
        LOAN_APPLICATION_STATUS.PendingFieldVerification,
    };
    const newStatus = statusMap[body.decision];
    this.loanAppService.validateTransition(app.status, newStatus);

    await this.prisma.$transaction(async (tx) => {
      await tx.loanDecision.create({
        data: {
          applicationId: id,
          decidedBy: admin.id,
          decision: body.decision,
          reason: body.reason,
          note: body.note,
          approvedTotalValue: body.approvedTotalValue,
          repaymentTerms: body.repaymentTerms as any,
          supplierId: body.supplierId,
        },
      });

      // Update approved items if provided
      if (body.approvedItems?.length) {
        await Promise.all(
          body.approvedItems.map((item) =>
            tx.loanApplicationItem.update({
              where: { id: item.applicationItemId },
              data: {
                approvedQuantity: item.approvedQuantity,
                approvedAmount: item.approvedAmount,
              },
            }),
          ),
        );
      }

      await tx.loanApplication.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.loanStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: app.status,
          toStatus: newStatus,
          changedBy: admin.id,
          reason: body.reason,
          note: body.note,
        },
      });

      await tx.loanAuditLog.create({
        data: {
          applicationId: id,
          action: `DECISION_${body.decision.toUpperCase()}`,
          performedById: admin.id,
          performedByRole: admin.role,
          details: { decision: body.decision, reason: body.reason },
        },
      });

      // Generate repayment plan if approved
      if (
        body.decision === LOAN_DECISION_TYPE.approved &&
        body.repaymentTerms &&
        body.approvedTotalValue
      ) {
        const {
          numberOfInstallments,
          frequency,
          firstDueDate,
          serviceCharge = 0,
        } = body.repaymentTerms;
        const totalRepayment = Helpers.round2(
          body.approvedTotalValue + serviceCharge,
        );
        const installmentAmount = Helpers.round2(
          totalRepayment / numberOfInstallments,
        );
        const firstDate = new Date(firstDueDate);

        const lastDueDate = new Date(firstDate);
        if (frequency === 'monthly')
          lastDueDate.setMonth(
            lastDueDate.getMonth() + (numberOfInstallments - 1),
          );
        else if (frequency === 'weekly')
          lastDueDate.setDate(
            lastDueDate.getDate() + (numberOfInstallments - 1) * 7,
          );

        await tx.repaymentPlan.create({
          data: {
            applicationId: id,
            principalEquivalent: body.approvedTotalValue,
            serviceCharge,
            totalRepaymentAmount: totalRepayment,
            repaymentFrequency: frequency,
            numberOfInstallments,
            installmentAmount,
            firstDueDate: firstDate,
            lastDueDate,
            outstandingBalance: totalRepayment,
            repayments: {
              create: Array.from({ length: numberOfInstallments }, (_, i) => {
                const dueDate = new Date(firstDate);
                if (frequency === 'monthly')
                  dueDate.setMonth(dueDate.getMonth() + i);
                else if (frequency === 'weekly')
                  dueDate.setDate(dueDate.getDate() + i * 7);
                return {
                  installmentNumber: i + 1,
                  dueDate,
                  amount: installmentAmount,
                };
              }),
            },
          },
        });
      }
    });

    // Notify farmer
    const farmer = await this.prisma.user.findUnique({
      where: { id: app.userId },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyOnStatusChange(
        farmer.phoneNumber,
        newStatus,
        app.applicationRef,
      );
    }

    return {
      status: true,
      message: 'Decision recorded successfully',
      data: null,
    };
  }

  async assignAgent(id: string, body: AssignAgentDto, admin: User) {
    const app = await this.prisma.loanApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    await this.prisma.$transaction([
      this.prisma.loanApplication.update({
        where: { id },
        data: { agentId: body.agentId },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId: id,
          action: 'AGENT_ASSIGNED',
          performedById: admin.id,
          performedByRole: admin.role,
          details: { agentId: body.agentId, note: body.note },
        },
      }),
    ]);

    return { status: true, message: 'Agent assigned', data: null };
  }

  async updateStatus(id: string, body: ManualStatusDto, admin: User) {
    const app = await this.prisma.loanApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    this.loanAppService.validateTransition(app.status, body.status);

    await this.prisma.$transaction([
      this.prisma.loanApplication.update({
        where: { id },
        data: { status: body.status },
      }),
      this.prisma.loanStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: app.status,
          toStatus: body.status,
          changedBy: admin.id,
          reason: body.reason,
          note: body.note,
        },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId: id,
          action: `STATUS_UPDATED_TO_${body.status.toUpperCase()}`,
          performedById: admin.id,
          performedByRole: admin.role,
          details: { from: app.status, to: body.status, reason: body.reason },
        },
      }),
    ]);

    const farmer = await this.prisma.user.findUnique({
      where: { id: app.userId },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyOnStatusChange(
        farmer.phoneNumber,
        body.status,
        app.applicationRef,
      );
    }

    return { status: true, message: 'Status updated', data: null };
  }

  async getVerificationQueue(query: AdminQueryLoanDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where: { status: LOAN_APPLICATION_STATUS.PendingFieldVerification },
        include: { farm: true, fieldVerification: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.loanApplication.count({
        where: { status: LOAN_APPLICATION_STATUS.PendingFieldVerification },
      }),
    ]);

    return {
      status: true,
      message: 'Verification queue retrieved',
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getAuditLog(id: string) {
    const logs = await this.prisma.loanAuditLog.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'asc' },
    });
    return { status: true, message: 'Audit log retrieved', data: logs };
  }

  // Reports
  async getSummaryReport() {
    const [total, approved, rejected, overdue] = await Promise.all([
      this.prisma.loanApplication.count(),
      this.prisma.loanApplication.count({
        where: { status: LOAN_APPLICATION_STATUS.Approved },
      }),
      this.prisma.loanApplication.count({
        where: { status: LOAN_APPLICATION_STATUS.Rejected },
      }),
      this.prisma.loanApplication.count({
        where: { status: LOAN_APPLICATION_STATUS.Overdue },
      }),
    ]);

    return {
      status: true,
      message: 'Summary report retrieved',
      data: {
        total,
        approved,
        rejected,
        overdue,
        approvalRate: total
          ? ((approved / total) * 100).toFixed(1) + '%'
          : '0%',
        rejectionRate: total
          ? ((rejected / total) * 100).toFixed(1) + '%'
          : '0%',
      },
    };
  }

  async getOverdueReport(query: AdminQueryLoanDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where: { status: LOAN_APPLICATION_STATUS.Overdue },
        include: { farm: true, repaymentPlan: true },
        skip,
        take: Number(limit),
        orderBy: { updatedAt: 'asc' },
      }),
      this.prisma.loanApplication.count({
        where: { status: LOAN_APPLICATION_STATUS.Overdue },
      }),
    ]);

    return {
      status: true,
      message: 'Overdue loans retrieved',
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getOverview() {
    const [
      totalAgents,
      inactiveAgents,
      pendingVerifications,
      assignedFarmerGroups,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: USER_ROLE.AGENT } }),
      this.prisma.user.count({
        where: {
          role: USER_ROLE.AGENT,
          status: {
            in: [USER_ACCOUNT_STATUS.restricted, USER_ACCOUNT_STATUS.frozen],
          },
        },
      }),
      this.prisma.loanApplication.count({
        where: { status: LOAN_APPLICATION_STATUS.PendingFieldVerification },
      }),
      this.prisma.loanApplication.groupBy({
        by: ['userId'],
        where: { agentId: { not: null } },
      }),
    ]);

    return {
      status: true,
      message: 'Overview retrieved',
      data: {
        totalAgents,
        pendingLoanVerifications: pendingVerifications,
        farmersAssignedToAgents: assignedFarmerGroups.length,
        inactiveAgents,
      },
    };
  }

  async getTopRequestedItems() {
    const items = await this.prisma.loanApplicationItem.groupBy({
      by: ['itemName'],
      _sum: { quantity: true, totalAmount: true },
      _count: { itemName: true },
      orderBy: { _count: { itemName: 'desc' } },
      take: 10,
    });
    return { status: true, message: 'Top items retrieved', data: items };
  }

  async getAgentFarmersList(id: string, query: AdminQueryAgentsDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      role: USER_ROLE.FARMER,
      loanApplications: { some: { agentId: id } },
    };
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const farmerSelect = {
      id: true,
      fullname: true,
      email: true,
      phoneNumber: true,
      username: true,
      gender: true,
      country: true,
      address: true,
      state: true,
      city: true,
      profileImageUrl: true,
      dateOfBirth: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      isBvnVerified: true,
      isNinVerified: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    };

    const [farmers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: farmerSelect,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      status: true,
      message: 'Farmers retrieved',
      data: farmers,
      meta: { total, page, limit, pages: Math.ceil(total / Number(limit)) },
    };
  }

  async getAgentApplications(id: string, query: AdminQueryLoanDto) {
    return this.listApplications({ ...query, agentId: id });
  }

  async getAgentVerificationTasks(id: string, query: AdminQueryLoanDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      agentId: id,
      OR: [
        { status: LOAN_APPLICATION_STATUS.PendingFieldVerification },
        { fieldVerification: { isNot: null } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        include: {
          fieldVerification: true,
          farm: true,
          user: {
            select: {
              id: true,
              fullname: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      status: true,
      message: 'Verification tasks retrieved',
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / Number(limit)) },
    };
  }

  async getAgentPerformance(id: string) {
    const agent = await this.prisma.user.findUnique({ where: { id } });
    if (!agent || agent.role !== USER_ROLE.AGENT) {
      throw new NotFoundException('Agent not found');
    }

    const agentApps = await this.prisma.loanApplication.findMany({
      where: { agentId: id },
      select: { id: true },
    });
    const applicationIds = agentApps.map((a) => a.id);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const approvedStatuses: LOAN_APPLICATION_STATUS[] = [
      LOAN_APPLICATION_STATUS.Approved,
      LOAN_APPLICATION_STATUS.FulfillmentInProgress,
      LOAN_APPLICATION_STATUS.ReadyForPickup,
      LOAN_APPLICATION_STATUS.OutForDelivery,
      LOAN_APPLICATION_STATUS.Delivered,
      LOAN_APPLICATION_STATUS.Active,
      LOAN_APPLICATION_STATUS.PartiallyRepaid,
      LOAN_APPLICATION_STATUS.Completed,
      LOAN_APPLICATION_STATUS.Overdue,
    ];

    const [
      disbursementAgg,
      activeFarmerGroups,
      approvedCount,
      rejectedCount,
      pendingCount,
      agentRecommendations,
      recentApps,
    ] = await Promise.all([
      this.prisma.loanDecision.aggregate({
        where: {
          applicationId: { in: applicationIds },
          decision: LOAN_DECISION_TYPE.approved,
        },
        _sum: { approvedTotalValue: true },
      }),
      this.prisma.loanApplication.groupBy({
        by: ['userId'],
        where: {
          agentId: id,
          status: {
            in: [
              LOAN_APPLICATION_STATUS.Active,
              LOAN_APPLICATION_STATUS.PartiallyRepaid,
              LOAN_APPLICATION_STATUS.Overdue,
            ],
          },
        },
      }),
      this.prisma.loanApplication.count({
        where: { agentId: id, status: { in: approvedStatuses } },
      }),
      this.prisma.loanApplication.count({
        where: {
          agentId: id,
          status: {
            in: [
              LOAN_APPLICATION_STATUS.Rejected,
              LOAN_APPLICATION_STATUS.Cancelled,
            ],
          },
        },
      }),
      this.prisma.loanApplication.count({
        where: {
          agentId: id,
          status: {
            in: [
              LOAN_APPLICATION_STATUS.Draft,
              LOAN_APPLICATION_STATUS.Submitted,
              LOAN_APPLICATION_STATUS.EligibilityReview,
              LOAN_APPLICATION_STATUS.PendingFieldVerification,
              LOAN_APPLICATION_STATUS.UnderReview,
              LOAN_APPLICATION_STATUS.MoreInfoRequired,
            ],
          },
        },
      }),
      this.prisma.agentRecommendation.findMany({
        where: { agentId: id },
        include: {
          application: {
            include: { decisions: { orderBy: { decidedAt: 'desc' }, take: 1 } },
          },
        },
      }),
      this.prisma.loanApplication.findMany({
        where: { agentId: id, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, status: true },
      }),
    ]);

    const TERMINAL = new Set<LOAN_DECISION_TYPE>([
      LOAN_DECISION_TYPE.approved,
      LOAN_DECISION_TYPE.rejected,
    ]);
    let correct = 0,
      total = 0;
    for (const rec of agentRecommendations) {
      const latest = rec.application.decisions[0];
      if (!latest || !TERMINAL.has(latest.decision)) continue;
      total++;
      const match =
        (rec.recommendation === AGENT_RECOMMENDATION_TYPE.recommended &&
          latest.decision === LOAN_DECISION_TYPE.approved) ||
        (rec.recommendation === AGENT_RECOMMENDATION_TYPE.not_recommended &&
          latest.decision === LOAN_DECISION_TYPE.rejected);
      if (match) correct++;
    }
    const verificationAccuracy =
      total > 0 ? Math.round((correct / total) * 100) : 0;

    const DAY_NAMES = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayBuckets: Record<string, { total: number; approved: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayBuckets[DAY_NAMES[d.getDay()]] = { total: 0, approved: 0 };
    }
    for (const app of recentApps) {
      const key = DAY_NAMES[app.createdAt.getDay()];
      dayBuckets[key].total++;
      if (approvedStatuses.includes(app.status)) dayBuckets[key].approved++;
    }
    const sevenDaySuccessRate = Object.fromEntries(
      Object.entries(dayBuckets).map(([day, { total, approved }]) => [
        day,
        total > 0 ? Math.round((approved / total) * 100) : 0,
      ]),
    );

    return {
      status: true,
      message: 'Agent performance retrieved',
      data: {
        totalDisbursementsFacilitated:
          disbursementAgg._sum.approvedTotalValue ?? 0,
        activeFarmers: activeFarmerGroups.length,
        verificationAccuracy,
        approvedCount,
        rejectedCount,
        pendingCount,
        sevenDaySuccessRate,
      },
    };
  }

  async getAgentById(id: string) {
    const agent = await this.prisma.user.findUnique({ where: { id } });
    if (!agent || agent.role !== USER_ROLE.AGENT) {
      throw new NotFoundException('Agent not found');
    }

    // LoanDecision has no agentId — must collect applicationIds first
    const agentApps = await this.prisma.loanApplication.findMany({
      where: { agentId: id },
      select: { id: true },
    });
    const applicationIds = agentApps.map((a) => a.id);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const approvedStatuses: LOAN_APPLICATION_STATUS[] = [
      LOAN_APPLICATION_STATUS.Approved,
      LOAN_APPLICATION_STATUS.FulfillmentInProgress,
      LOAN_APPLICATION_STATUS.ReadyForPickup,
      LOAN_APPLICATION_STATUS.OutForDelivery,
      LOAN_APPLICATION_STATUS.Delivered,
      LOAN_APPLICATION_STATUS.Active,
      LOAN_APPLICATION_STATUS.PartiallyRepaid,
      LOAN_APPLICATION_STATUS.Completed,
      LOAN_APPLICATION_STATUS.Overdue,
    ];

    const [
      disbursementAgg,
      activeFarmerGroups,
      approvedCount,
      rejectedCount,
      pendingCount,
      agentRecommendations,
      recentApps,
    ] = await Promise.all([
      this.prisma.loanDecision.aggregate({
        where: {
          applicationId: { in: applicationIds },
          decision: LOAN_DECISION_TYPE.approved,
        },
        _sum: { approvedTotalValue: true },
      }),
      this.prisma.loanApplication.groupBy({
        by: ['userId'],
        where: {
          agentId: id,
          status: {
            in: [
              LOAN_APPLICATION_STATUS.Active,
              LOAN_APPLICATION_STATUS.PartiallyRepaid,
              LOAN_APPLICATION_STATUS.Overdue,
            ],
          },
        },
      }),
      this.prisma.loanApplication.count({
        where: { agentId: id, status: { in: approvedStatuses } },
      }),
      this.prisma.loanApplication.count({
        where: {
          agentId: id,
          status: {
            in: [
              LOAN_APPLICATION_STATUS.Rejected,
              LOAN_APPLICATION_STATUS.Cancelled,
            ],
          },
        },
      }),
      this.prisma.loanApplication.count({
        where: {
          agentId: id,
          status: {
            in: [
              LOAN_APPLICATION_STATUS.Draft,
              LOAN_APPLICATION_STATUS.Submitted,
              LOAN_APPLICATION_STATUS.EligibilityReview,
              LOAN_APPLICATION_STATUS.PendingFieldVerification,
              LOAN_APPLICATION_STATUS.UnderReview,
              LOAN_APPLICATION_STATUS.MoreInfoRequired,
            ],
          },
        },
      }),
      this.prisma.agentRecommendation.findMany({
        where: { agentId: id },
        include: {
          application: {
            include: { decisions: { orderBy: { decidedAt: 'desc' }, take: 1 } },
          },
        },
      }),
      this.prisma.loanApplication.findMany({
        where: { agentId: id, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, status: true },
      }),
    ]);

    const TERMINAL = new Set<LOAN_DECISION_TYPE>([
      LOAN_DECISION_TYPE.approved,
      LOAN_DECISION_TYPE.rejected,
    ]);
    let correct = 0,
      total = 0;
    for (const rec of agentRecommendations) {
      const latest = rec.application.decisions[0];
      if (!latest || !TERMINAL.has(latest.decision)) continue;
      total++;
      const match =
        (rec.recommendation === AGENT_RECOMMENDATION_TYPE.recommended &&
          latest.decision === LOAN_DECISION_TYPE.approved) ||
        (rec.recommendation === AGENT_RECOMMENDATION_TYPE.not_recommended &&
          latest.decision === LOAN_DECISION_TYPE.rejected);
      if (match) correct++;
    }
    const verificationAccuracy =
      total > 0 ? Math.round((correct / total) * 100) : 0;

    const DAY_NAMES = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayBuckets: Record<string, { total: number; approved: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayBuckets[DAY_NAMES[d.getDay()]] = { total: 0, approved: 0 };
    }
    for (const app of recentApps) {
      const key = DAY_NAMES[app.createdAt.getDay()];
      dayBuckets[key].total++;
      if (approvedStatuses.includes(app.status)) dayBuckets[key].approved++;
    }
    const sevenDaySuccessRate = Object.fromEntries(
      Object.entries(dayBuckets).map(([day, { total, approved }]) => [
        day,
        total > 0 ? Math.round((approved / total) * 100) : 0,
      ]),
    );

    return {
      status: true,
      message: 'Agent retrieved',
      data: {
        id: agent.id,
        fullname: agent.fullname,
        email: agent.email,
        phoneNumber: agent.phoneNumber,
        status: agent.status,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        totalDisbursementsFacilitated:
          disbursementAgg._sum.approvedTotalValue ?? 0,
        activeFarmers: activeFarmerGroups.length,
        verificationAccuracy,
        approvedCount,
        rejectedCount,
        pendingCount,
        sevenDaySuccessRate,
      },
    };
  }
}
