import { Injectable, Logger } from '@nestjs/common';
import { TermiiService } from 'src/api-providers/providers/termii.service';
import { LOAN_APPLICATION_STATUS, MARKETPLACE_ORDER_STATUS } from '@prisma/client';

@Injectable()
export class LoanNotificationService {
  private readonly logger = new Logger(LoanNotificationService.name);

  constructor(private readonly termii: TermiiService) {}

  private getMessage(status: LOAN_APPLICATION_STATUS, ref: string): string | null {
    const messages: Partial<Record<LOAN_APPLICATION_STATUS, string>> = {
      [LOAN_APPLICATION_STATUS.Submitted]: `Your Farm Input Loan request ${ref} has been submitted and is being reviewed.`,
      [LOAN_APPLICATION_STATUS.UnderReview]: `Your application ${ref} is now under review by the loan team.`,
      [LOAN_APPLICATION_STATUS.MoreInfoRequired]: `Action needed: Your application ${ref} requires additional information. Please check the app.`,
      [LOAN_APPLICATION_STATUS.FulfillmentInProgress]: `Your farm inputs for ${ref} are being prepared for delivery.`,
      [LOAN_APPLICATION_STATUS.Approved]: `Great news! Your Farm Input Loan ${ref} has been approved. Fulfillment will begin shortly.`,
      [LOAN_APPLICATION_STATUS.Rejected]: `We regret to inform you that your Farm Input Loan ${ref} was not approved. Please check the app for details.`,
      [LOAN_APPLICATION_STATUS.ReadyForPickup]: `Your approved inputs for ${ref} are ready for pickup. Please visit the designated center.`,
      [LOAN_APPLICATION_STATUS.OutForDelivery]: `Your inputs for ${ref} are on their way to you.`,
      [LOAN_APPLICATION_STATUS.Delivered]: `Your farm inputs for ${ref} have been delivered. Your loan is now active.`,
      [LOAN_APPLICATION_STATUS.Overdue]: `Your repayment for loan ${ref} is overdue. Please make payment to avoid penalties.`,
      [LOAN_APPLICATION_STATUS.Completed]: `Congratulations! Your Farm Input Loan ${ref} has been fully repaid and closed.`,
    };
    return messages[status] ?? null;
  }

  async notifyOnStatusChange(
    phoneNumber: string,
    status: LOAN_APPLICATION_STATUS,
    applicationRef: string,
  ) {
    const message = this.getMessage(status, applicationRef);
    if (!message) return;

    try {
      await this.termii.sendSms({ phoneNumber, message });
    } catch (err) {
      this.logger.error(`Failed to send SMS notification for ${applicationRef}`, err?.message);
    }
  }

  async sendRepaymentReminder(phoneNumber: string, ref: string, dueDate: string) {
    const message = `Reminder: Your repayment for loan ${ref} is due on ${dueDate}. Please ensure timely payment.`;
    try {
      await this.termii.sendSms({ phoneNumber, message });
    } catch (err) {
      this.logger.error(`Failed to send repayment reminder for ${ref}`, err?.message);
    }
  }

  async notifyMarketplaceOrderStatus(
    phoneNumber: string,
    status: MARKETPLACE_ORDER_STATUS,
    orderRef: string,
  ) {
    const messages: Partial<Record<MARKETPLACE_ORDER_STATUS, string>> = {
      [MARKETPLACE_ORDER_STATUS.pending]: `Your marketplace order ${orderRef} has been placed and is awaiting confirmation.`,
      [MARKETPLACE_ORDER_STATUS.confirmed]: `Your marketplace order ${orderRef} has been confirmed. Items are being prepared.`,
      [MARKETPLACE_ORDER_STATUS.dispatched]: `Your marketplace order ${orderRef} is on its way to you.`,
      [MARKETPLACE_ORDER_STATUS.delivered]: `Your marketplace order ${orderRef} has been delivered. Enjoy your farm inputs!`,
      [MARKETPLACE_ORDER_STATUS.cancelled]: `Your marketplace order ${orderRef} has been cancelled. Your loan credit has been restored where applicable.`,
    };
    const message = messages[status];
    if (!message) return;

    try {
      await this.termii.sendSms({ phoneNumber, message });
    } catch (err) {
      this.logger.error(`Failed to send marketplace order SMS for ${orderRef}`, err?.message);
    }
  }
}
