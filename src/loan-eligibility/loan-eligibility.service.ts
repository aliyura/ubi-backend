import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ELIGIBILITY_CHECK_RESULT, LOAN_APPLICATION_STATUS, TIER_LEVEL, User } from '@prisma/client';
import { EligibilityCheckDto } from './dto';

const BLOCKING_STATUSES: LOAN_APPLICATION_STATUS[] = [
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

export interface CheckResult {
  checkName: string;
  result: ELIGIBILITY_CHECK_RESULT;
  note?: string;
  source?: string;
}

@Injectable()
export class LoanEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async runChecks(user: User, body: EligibilityCheckDto, applicationId?: string) {
    const checks: CheckResult[] = [];

    // 1. KYC check
    const kycPassed = user.tierLevel === TIER_LEVEL.two || user.tierLevel === TIER_LEVEL.three;
    checks.push({
      checkName: 'KYC Verification',
      result: kycPassed ? ELIGIBILITY_CHECK_RESULT.pass : ELIGIBILITY_CHECK_RESULT.fail,
      note: kycPassed ? 'KYC tier is sufficient' : 'Please complete KYC tier 2 or higher',
      source: 'system',
    });

    // 2. Active loan conflict
    const activeLoan = await this.prisma.loanApplication.findFirst({
      where: { userId: user.id, status: { in: BLOCKING_STATUSES } },
    });
    checks.push({
      checkName: 'Active Loan Conflict',
      result: activeLoan ? ELIGIBILITY_CHECK_RESULT.fail : ELIGIBILITY_CHECK_RESULT.pass,
      note: activeLoan
        ? `You have an active application (${activeLoan.applicationRef}) that must be resolved first`
        : 'No conflicting loan found',
      source: 'system',
    });

    // 3. Farm validity
    const farm = await this.prisma.farm.findFirst({
      where: { id: body.farmId, userId: user.id },
    });
    checks.push({
      checkName: 'Farm Exists',
      result: farm ? ELIGIBILITY_CHECK_RESULT.pass : ELIGIBILITY_CHECK_RESULT.fail,
      note: farm ? 'Farm record found' : 'Farm not found or does not belong to you',
      source: 'system',
    });

    // 4. Cart has items
    const cart = await this.prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });
    const cartHasItems = cart && cart.items.length > 0;
    checks.push({
      checkName: 'Cart Not Empty',
      result: cartHasItems ? ELIGIBILITY_CHECK_RESULT.pass : ELIGIBILITY_CHECK_RESULT.fail,
      note: cartHasItems ? 'Cart has items' : 'Your cart is empty',
      source: 'system',
    });

    // 5. Repayment history (check for overdue)
    const overdueRepayment = await this.prisma.repayment.findFirst({
      where: {
        plan: { application: { userId: user.id } },
        status: 'overdue',
      },
    });
    checks.push({
      checkName: 'Repayment History',
      result: overdueRepayment
        ? ELIGIBILITY_CHECK_RESULT.conditional
        : ELIGIBILITY_CHECK_RESULT.pass,
      note: overdueRepayment
        ? 'You have overdue repayments; application may require manual review'
        : 'No overdue repayments',
      source: 'system',
    });

    // 6. Phone and email verified
    const contactVerified = user.isPhoneVerified && user.isEmailVerified;
    checks.push({
      checkName: 'Contact Verification',
      result: contactVerified ? ELIGIBILITY_CHECK_RESULT.pass : ELIGIBILITY_CHECK_RESULT.fail,
      note: contactVerified
        ? 'Phone and email are verified'
        : 'Please verify your phone number and email',
      source: 'system',
    });

    // Persist checks if applicationId provided
    if (applicationId) {
      await this.prisma.eligibilityCheck.deleteMany({ where: { applicationId } });
      await this.prisma.eligibilityCheck.createMany({
        data: checks.map((c) => ({ ...c, applicationId })),
      });
    }

    const blockingIssues = checks
      .filter((c) => c.result === ELIGIBILITY_CHECK_RESULT.fail)
      .map((c) => c.note);
    const warnings = checks
      .filter((c) => c.result === ELIGIBILITY_CHECK_RESULT.conditional)
      .map((c) => c.note);

    const eligible =
      blockingIssues.length === 0
        ? warnings.length > 0
          ? 'conditional'
          : 'pass'
        : 'fail';

    return { eligible, checks, blockingIssues, warnings };
  }
}
