import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanNotificationService } from 'src/loan-application/loan-notification.service';
import { NotificationService } from 'src/notification/notification.service';
import { RecordRepaymentDto } from './dto';
import {
  LOAN_APPLICATION_STATUS,
  NOTIFICATION_TYPE,
  REPAYMENT_STATUS,
} from '@prisma/client';
import { Helpers } from 'src/helpers';

@Injectable()
export class RepaymentService {
  private readonly logger = new Logger(RepaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: LoanNotificationService,
    private readonly notificationService: NotificationService,
  ) {}

  async getRepaymentSchedule(applicationId: string) {
    const plan = await this.prisma.repaymentPlan.findUnique({
      where: { applicationId },
      include: { repayments: { orderBy: { installmentNumber: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Repayment plan not found');
    return {
      status: true,
      message: 'Repayment schedule retrieved',
      data: plan,
    };
  }

  async adminListRepayments(page = 1, limit = 20, overdueOnly = false) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (overdueOnly) where.status = REPAYMENT_STATUS.overdue;

    const [items, total] = await Promise.all([
      this.prisma.repaymentPlan.findMany({
        where,
        include: {
          application: {
            select: {
              applicationRef: true,
              user: { omit: { createdAt: true, updatedAt: true } },
            },
          },
          repayments: { orderBy: { dueDate: 'asc' } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.repaymentPlan.count({ where }),
    ]);

    const enriched = items.map((plan) => {
      const overdueAmount = plan.repayments
        .filter((r) => r.status === REPAYMENT_STATUS.overdue)
        .reduce((sum, r) => Helpers.round2(sum + (r.amount - r.amountPaid)), 0);
      return { ...plan, overdueAmount };
    });

    return {
      status: true,
      message: 'Repayments retrieved',
      data: enriched,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async recordRepayment(applicationId: string, body: RecordRepaymentDto) {
    const plan = await this.prisma.repaymentPlan.findUnique({
      where: { applicationId },
      include: {
        repayments: {
          where: { status: { not: REPAYMENT_STATUS.completed } },
          orderBy: { dueDate: 'asc' },
        },
        application: true,
      },
    });
    if (!plan) throw new NotFoundException('Repayment plan not found');
    if (body.amountPaid > plan.outstandingBalance) {
      throw new BadRequestException(
        `Amount exceeds outstanding balance of ${plan.outstandingBalance}`,
      );
    }

    let remaining = body.amountPaid;

    for (const installment of plan.repayments) {
      if (remaining <= 0) break;
      const needed = Helpers.round2(
        installment.amount - installment.amountPaid,
      );
      const paying = Helpers.round2(Math.min(needed, remaining));
      remaining = Helpers.round2(remaining - paying);
      const newPaid = Helpers.round2(installment.amountPaid + paying);
      const newStatus =
        newPaid >= installment.amount
          ? REPAYMENT_STATUS.completed
          : REPAYMENT_STATUS.partial;
      await this.prisma.repayment.update({
        where: { id: installment.id },
        data: {
          amountPaid: newPaid,
          status: newStatus,
          paidAt:
            newStatus === REPAYMENT_STATUS.completed ? new Date() : undefined,
          reference: body.reference,
          note: body.note,
        },
      });
    }

    const newAmountRepaid = Helpers.round2(plan.amountRepaid + body.amountPaid);
    const newOutstanding = Helpers.round2(
      Math.max(0, plan.outstandingBalance - body.amountPaid),
    );
    const isFullyPaid = newOutstanding <= 0;

    await this.prisma.repaymentPlan.update({
      where: { id: plan.id },
      data: {
        amountRepaid: newAmountRepaid,
        outstandingBalance: newOutstanding,
        status: isFullyPaid
          ? REPAYMENT_STATUS.completed
          : REPAYMENT_STATUS.partial,
      },
    });

    if (isFullyPaid) {
      await this.prisma.loanApplication.update({
        where: { id: applicationId },
        data: { status: LOAN_APPLICATION_STATUS.Completed },
      });
      await this.prisma.loanStatusHistory.create({
        data: {
          applicationId,
          fromStatus: plan.application.status,
          toStatus: LOAN_APPLICATION_STATUS.Completed,
          reason: 'Loan fully repaid',
        },
      });
    } else {
      const activeStatuses: LOAN_APPLICATION_STATUS[] = [
        LOAN_APPLICATION_STATUS.Active,
        LOAN_APPLICATION_STATUS.Overdue,
      ];
      if (activeStatuses.includes(plan.application.status)) {
        await this.prisma.loanApplication.update({
          where: { id: applicationId },
          data: { status: LOAN_APPLICATION_STATUS.PartiallyRepaid },
        });
        await this.prisma.loanStatusHistory.create({
          data: {
            applicationId,
            fromStatus: plan.application.status,
            toStatus: LOAN_APPLICATION_STATUS.PartiallyRepaid,
            reason: 'Partial repayment recorded',
          },
        });
      }
    }

    await this.notificationService.create({
      userId: plan.application.userId,
      type: NOTIFICATION_TYPE.REPAYMENT_RECORDED,
      title: 'Repayment Recorded',
      message: `A repayment of ₦${body.amountPaid.toLocaleString()} has been recorded. Outstanding balance: ₦${newOutstanding.toLocaleString()}.`,
      resourceId: applicationId,
      resourceType: 'loan_application',
    });

    return {
      status: true,
      message: 'Repayment recorded',
      data: { amountPaid: body.amountPaid, outstandingBalance: newOutstanding },
    };
  }

  /**
   * Should be called daily via a cron job or scheduled task runner.
   * Marks overdue installments and sends SMS notifications.
   */
  async processOverdueRepayments() {
    this.logger.log('Running overdue repayment check...');
    const now = new Date();

    const overdueInstallments = await this.prisma.repayment.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: REPAYMENT_STATUS.completed },
      },
      include: {
        plan: {
          include: {
            application: {
              select: {
                id: true,
                userId: true,
                applicationRef: true,
                status: true,
              },
            },
          },
        },
      },
    });

    for (const installment of overdueInstallments) {
      await this.prisma.repayment.update({
        where: { id: installment.id },
        data: { status: REPAYMENT_STATUS.overdue },
      });

      const app = installment.plan.application;
      if (app.status !== LOAN_APPLICATION_STATUS.Overdue) {
        await this.prisma.loanApplication.update({
          where: { id: app.id },
          data: { status: LOAN_APPLICATION_STATUS.Overdue },
        });
        await this.prisma.loanStatusHistory.create({
          data: {
            applicationId: app.id,
            fromStatus: app.status,
            toStatus: LOAN_APPLICATION_STATUS.Overdue,
            reason: 'Repayment overdue',
          },
        });
      }

      const farmer = await this.prisma.user.findUnique({
        where: { id: app.userId },
        select: { phoneNumber: true },
      });
      if (farmer) {
        await this.notifications.notifyOnStatusChange(
          farmer.phoneNumber,
          LOAN_APPLICATION_STATUS.Overdue,
          app.applicationRef,
        );
      }

      if (app.status !== LOAN_APPLICATION_STATUS.Overdue) {
        await this.notificationService.create({
          userId: app.userId,
          type: NOTIFICATION_TYPE.REPAYMENT_OVERDUE,
          title: 'Repayment Overdue',
          message: `Your repayment for loan ${app.applicationRef} is overdue. Please make payment as soon as possible.`,
          resourceId: app.id,
          resourceType: 'loan_application',
        });
      }
    }

    this.logger.log(
      `Marked ${overdueInstallments.length} installments as overdue`,
    );
    return {
      status: true,
      message: `Processed ${overdueInstallments.length} overdue repayments`,
      data: null,
    };
  }

  /**
   * Sends upcoming repayment reminder SMS (3 days before due date).
   */
  async sendRepaymentReminders() {
    this.logger.log('Running repayment reminder check...');
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcoming = await this.prisma.repayment.findMany({
      where: {
        dueDate: { gte: tomorrow, lte: threeDaysFromNow },
        status: { not: REPAYMENT_STATUS.completed },
      },
      include: {
        plan: {
          include: {
            application: { select: { userId: true, applicationRef: true } },
          },
        },
      },
    });

    for (const installment of upcoming) {
      const app = installment.plan.application;
      const farmer = await this.prisma.user.findUnique({
        where: { id: app.userId },
        select: { phoneNumber: true },
      });
      if (farmer) {
        await this.notifications.sendRepaymentReminder(
          farmer.phoneNumber,
          app.applicationRef,
          installment.dueDate.toDateString(),
        );
      }
    }

    this.logger.log(`Sent ${upcoming.length} repayment reminders`);
    return {
      status: true,
      message: `Sent ${upcoming.length} reminders`,
      data: null,
    };
  }
}
