import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { LOAN_APPLICATION_STATUS, LOAN_DECISION_TYPE, USER_ROLE, User } from '@prisma/client';
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
    const skip = (page - 1) * limit;

    const where: any = { role: USER_ROLE.AGENT };
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const agentSelect = {
      id: true, fullname: true, email: true, phoneNumber: true,
      status: true, createdAt: true,
    };

    const [agents, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: agentSelect, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    const data = await Promise.all(agents.map(async (agent) => {
      const applications = await this.prisma.loanApplication.findMany({
        where: { agentId: agent.id },
        select: { userId: true },
        distinct: ['userId'],
      });
      const farmerIds = applications.map((a) => a.userId);
      const farmers = farmerIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: farmerIds } },
            select: { id: true, fullname: true, email: true, phoneNumber: true, status: true },
          })
        : [];
      return { ...agent, farmers };
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
    const skip = (page - 1) * limit;
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
        include: { farm: true, items: true, agentRecommendation: true },
        skip,
        take: limit,
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
      [LOAN_DECISION_TYPE.more_info_required]: LOAN_APPLICATION_STATUS.MoreInfoRequired,
      [LOAN_DECISION_TYPE.hold]: LOAN_APPLICATION_STATUS.UnderReview,
      [LOAN_DECISION_TYPE.send_for_verification]: LOAN_APPLICATION_STATUS.PendingFieldVerification,
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
        const { numberOfInstallments, frequency, firstDueDate, serviceCharge = 0 } =
          body.repaymentTerms;
        const totalRepayment = Helpers.round2(body.approvedTotalValue + serviceCharge);
        const installmentAmount = Helpers.round2(totalRepayment / numberOfInstallments);
        const firstDate = new Date(firstDueDate);

        const lastDueDate = new Date(firstDate);
        if (frequency === 'monthly') lastDueDate.setMonth(lastDueDate.getMonth() + (numberOfInstallments - 1));
        else if (frequency === 'weekly') lastDueDate.setDate(lastDueDate.getDate() + (numberOfInstallments - 1) * 7);

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
                if (frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + i);
                else if (frequency === 'weekly') dueDate.setDate(dueDate.getDate() + i * 7);
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

    return { status: true, message: 'Decision recorded successfully', data: null };
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
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where: { status: LOAN_APPLICATION_STATUS.PendingFieldVerification },
        include: { farm: true, fieldVerification: true },
        skip,
        take: limit,
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
      this.prisma.loanApplication.count({ where: { status: LOAN_APPLICATION_STATUS.Approved } }),
      this.prisma.loanApplication.count({ where: { status: LOAN_APPLICATION_STATUS.Rejected } }),
      this.prisma.loanApplication.count({ where: { status: LOAN_APPLICATION_STATUS.Overdue } }),
    ]);

    return {
      status: true,
      message: 'Summary report retrieved',
      data: {
        total,
        approved,
        rejected,
        overdue,
        approvalRate: total ? ((approved / total) * 100).toFixed(1) + '%' : '0%',
        rejectionRate: total ? ((rejected / total) * 100).toFixed(1) + '%' : '0%',
      },
    };
  }

  async getOverdueReport(query: AdminQueryLoanDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where: { status: LOAN_APPLICATION_STATUS.Overdue },
        include: { farm: true, repaymentPlan: true },
        skip,
        take: limit,
        orderBy: { updatedAt: 'asc' },
      }),
      this.prisma.loanApplication.count({ where: { status: LOAN_APPLICATION_STATUS.Overdue } }),
    ]);

    return {
      status: true,
      message: 'Overdue loans retrieved',
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
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
}
