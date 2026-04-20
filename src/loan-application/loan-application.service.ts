import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanEligibilityService } from 'src/loan-eligibility/loan-eligibility.service';
import { LoanNotificationService } from './loan-notification.service';
import { CreateLoanApplicationDto, QueryLoanApplicationDto } from './dto';
import {
  LOAN_APPLICATION_STATUS,
  User,
} from '@prisma/client';
import { Helpers } from 'src/helpers';

const CANCELLABLE_STATUSES: LOAN_APPLICATION_STATUS[] = [
  LOAN_APPLICATION_STATUS.Draft,
  LOAN_APPLICATION_STATUS.Submitted,
];

// Valid status transitions map
const VALID_TRANSITIONS: Partial<Record<LOAN_APPLICATION_STATUS, LOAN_APPLICATION_STATUS[]>> = {
  [LOAN_APPLICATION_STATUS.Draft]: [LOAN_APPLICATION_STATUS.Submitted, LOAN_APPLICATION_STATUS.Cancelled],
  [LOAN_APPLICATION_STATUS.Submitted]: [LOAN_APPLICATION_STATUS.EligibilityReview, LOAN_APPLICATION_STATUS.Cancelled],
  [LOAN_APPLICATION_STATUS.EligibilityReview]: [LOAN_APPLICATION_STATUS.UnderReview, LOAN_APPLICATION_STATUS.Rejected],
  [LOAN_APPLICATION_STATUS.UnderReview]: [
    LOAN_APPLICATION_STATUS.PendingFieldVerification,
    LOAN_APPLICATION_STATUS.Approved,
    LOAN_APPLICATION_STATUS.Rejected,
    LOAN_APPLICATION_STATUS.MoreInfoRequired,
  ],
  [LOAN_APPLICATION_STATUS.PendingFieldVerification]: [
    LOAN_APPLICATION_STATUS.UnderReview,
    LOAN_APPLICATION_STATUS.Rejected,
  ],
  [LOAN_APPLICATION_STATUS.MoreInfoRequired]: [LOAN_APPLICATION_STATUS.UnderReview, LOAN_APPLICATION_STATUS.Cancelled],
  [LOAN_APPLICATION_STATUS.Approved]: [LOAN_APPLICATION_STATUS.FulfillmentInProgress, LOAN_APPLICATION_STATUS.Cancelled],
  [LOAN_APPLICATION_STATUS.FulfillmentInProgress]: [
    LOAN_APPLICATION_STATUS.ReadyForPickup,
    LOAN_APPLICATION_STATUS.OutForDelivery,
  ],
  [LOAN_APPLICATION_STATUS.ReadyForPickup]: [LOAN_APPLICATION_STATUS.Delivered],
  [LOAN_APPLICATION_STATUS.OutForDelivery]: [LOAN_APPLICATION_STATUS.Delivered],
  [LOAN_APPLICATION_STATUS.Delivered]: [LOAN_APPLICATION_STATUS.Active],
  [LOAN_APPLICATION_STATUS.Active]: [LOAN_APPLICATION_STATUS.PartiallyRepaid, LOAN_APPLICATION_STATUS.Overdue, LOAN_APPLICATION_STATUS.Completed],
  [LOAN_APPLICATION_STATUS.PartiallyRepaid]: [LOAN_APPLICATION_STATUS.Completed, LOAN_APPLICATION_STATUS.Overdue],
  [LOAN_APPLICATION_STATUS.Overdue]: [LOAN_APPLICATION_STATUS.PartiallyRepaid, LOAN_APPLICATION_STATUS.Completed],
};

@Injectable()
export class LoanApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibility: LoanEligibilityService,
    private readonly notifications: LoanNotificationService,
  ) {}

  validateTransition(from: LOAN_APPLICATION_STATUS, to: LOAN_APPLICATION_STATUS) {
    const allowed = VALID_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`,
      );
    }
  }

  private generateRef(): string {
    const year = new Date().getFullYear();
    const unique = Helpers.getUniqueId().toUpperCase();
    return `UBI-${year}-${unique}`;
  }

  async submitApplication(body: CreateLoanApplicationDto, user: User) {
    // Run eligibility checks
    const eligResult = await this.eligibility.runChecks(user, {
      farmId: body.farmId,
      season: body.season,
      plantingDate: body.expectedPlantingDate,
      fulfillmentMethod: body.fulfillmentMethod,
    });

    if (eligResult.eligible === 'fail') {
      throw new BadRequestException({
        status: false,
        message: 'Eligibility check failed',
        errors: eligResult.blockingIssues.map((issue) => ({ field: 'eligibility', message: issue })),
        data: eligResult,
      });
    }

    // Snapshot cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: { resource: { include: { category: true } } } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const totalEstimatedValue = Helpers.round2(
      cart.items.reduce(
        (sum, item) => sum + Helpers.round2(item.resource.unitPrice * item.quantity),
        0,
      ),
    );

    const applicationRef = this.generateRef();

    const application = await this.prisma.$transaction(async (tx) => {
      const app = await tx.loanApplication.create({
        data: {
          userId: user.id,
          farmId: body.farmId,
          applicationRef,
          status: LOAN_APPLICATION_STATUS.Submitted,
          purpose: body.purpose,
          season: body.season,
          expectedPlantingDate: body.expectedPlantingDate
            ? new Date(body.expectedPlantingDate)
            : undefined,
          expectedHarvestDate: body.expectedHarvestDate
            ? new Date(body.expectedHarvestDate)
            : undefined,
          fulfillmentMethod: body.fulfillmentMethod,
          deliveryAddress: body.deliveryAddress,
          deliveryContact: body.deliveryContact,
          agentId: body.agentId,
          farmerNotes: body.farmerNotes,
          totalEstimatedValue,
          submittedAt: new Date(),
        },
      });

      // Snapshot items
      await tx.loanApplicationItem.createMany({
        data: cart.items.map((item) => ({
          applicationId: app.id,
          resourceId: item.resourceId,
          itemName: item.resource.name,
          category: item.resource.category?.name,
          unitPrice: item.resource.unitPrice,
          quantity: item.quantity,
          unitOfMeasure: item.resource.unitOfMeasure,
          totalAmount: Helpers.round2(item.resource.unitPrice * item.quantity),
          supplier: item.resource.supplier,
        })),
      });

      // Persist eligibility checks
      await tx.eligibilityCheck.createMany({
        data: eligResult.checks.map((c) => ({
          applicationId: app.id,
          checkName: c.checkName,
          result: c.result,
          note: c.note,
          source: c.source ?? 'system',
        })),
      });

      // Append status history
      await tx.loanStatusHistory.create({
        data: {
          applicationId: app.id,
          toStatus: LOAN_APPLICATION_STATUS.Submitted,
          changedBy: user.id,
          reason: 'Application submitted by farmer',
        },
      });

      // Audit log
      await tx.loanAuditLog.create({
        data: {
          applicationId: app.id,
          action: 'APPLICATION_SUBMITTED',
          performedById: user.id,
          performedByRole: user.role,
          details: { eligibilityResult: eligResult.eligible },
        },
      });

      // Clear cart after successful submission
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return app;
    });

    // Send SMS
    await this.notifications.notifyOnStatusChange(
      user.phoneNumber,
      LOAN_APPLICATION_STATUS.Submitted,
      applicationRef,
    );

    return {
      status: true,
      message: 'Loan application submitted successfully',
      data: { ...application, eligibility: eligResult },
    };
  }

  async getMyApplications(user: User, query: QueryLoanApplicationDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { userId: user.id };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        include: { farm: true, items: true },
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

  async getApplication(id: string, user: User) {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id },
      include: {
        farm: { include: { photos: true } },
        items: true,
        eligibilityChecks: true,
        agentRecommendation: true,
        decisions: { orderBy: { decidedAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        fulfillment: { include: { items: true } },
        repaymentPlan: { include: { repayments: true } },
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.userId !== user.id) throw new ForbiddenException('Access denied');
    return { status: true, message: 'Application retrieved', data: app };
  }

  async getTimeline(id: string, user: User) {
    const app = await this.prisma.loanApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.userId !== user.id) throw new ForbiddenException('Access denied');

    const history = await this.prisma.loanStatusHistory.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'asc' },
    });
    return { status: true, message: 'Timeline retrieved', data: history };
  }

  async cancelApplication(id: string, user: User) {
    const app = await this.prisma.loanApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.userId !== user.id) throw new ForbiddenException('Access denied');
    if (!CANCELLABLE_STATUSES.includes(app.status)) {
      throw new BadRequestException(`Application in status ${app.status} cannot be cancelled`);
    }

    await this.prisma.$transaction([
      this.prisma.loanApplication.update({
        where: { id },
        data: { status: LOAN_APPLICATION_STATUS.Cancelled },
      }),
      this.prisma.loanStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: app.status,
          toStatus: LOAN_APPLICATION_STATUS.Cancelled,
          changedBy: user.id,
          reason: 'Cancelled by farmer',
        },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId: id,
          action: 'APPLICATION_CANCELLED',
          performedById: user.id,
          performedByRole: user.role,
        },
      }),
    ]);

    return { status: true, message: 'Application cancelled', data: null };
  }

  async runEligibilityCheck(body: any, user: User) {
    const result = await this.eligibility.runChecks(user, body);
    return {
      status: true,
      message: 'Eligibility check completed',
      data: result,
    };
  }

  async getRepaymentSchedule(id: string, user: User) {
    const app = await this.prisma.loanApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.userId !== user.id) throw new ForbiddenException('Access denied');

    const plan = await this.prisma.repaymentPlan.findUnique({
      where: { applicationId: id },
      include: { repayments: { orderBy: { installmentNumber: 'asc' } } },
    });
    return { status: true, message: 'Repayment schedule retrieved', data: plan };
  }
}
