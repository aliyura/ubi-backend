import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  LOAN_APPLICATION_STATUS,
  LOAN_DECISION_TYPE,
  REPAYMENT_STATUS,
  SCAM_TICKET_STATUS,
  TRANSACTION_STATUS,
  USER_ACCOUNT_STATUS,
  USER_ROLE,
} from '@prisma/client';
import { AccountRegistryQueryDto, ActiveWalletsQueryDto, DateRangeDto, DisputesPipelineQueryDto, KycActivePipelineQueryDto, PaginationDto, TransactionsHistoryQueryDto, TransferPipelineQueryDto } from './admin-dashboard.dto';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDateRange(query: DateRangeDto) {
    return {
      from: query.fromDate ? new Date(query.fromDate) : undefined,
      to: query.toDate ? new Date(query.toDate) : undefined,
    };
  }

  private buildDateFilter(from?: Date, to?: Date) {
    if (!from && !to) return undefined;
    return {
      ...(from && { gte: from }),
      ...(to && { lte: to }),
    };
  }

  async getSummary(query: DateRangeDto) {
    const { from, to } = this.parseDateRange(query);
    const dateFilter = this.buildDateFilter(from, to);

    const [activeFarmers, activeAgents, loanVolume, pendingVerifications, walletBalancesResult] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            role: USER_ROLE.FARMER,
            status: USER_ACCOUNT_STATUS.active,
            ...(dateFilter && { createdAt: dateFilter }),
          },
        }),
        this.prisma.user.count({
          where: {
            role: USER_ROLE.AGENT,
            status: USER_ACCOUNT_STATUS.active,
            ...(dateFilter && { createdAt: dateFilter }),
          },
        }),
        this.prisma.loanApplication.aggregate({
          _sum: { totalEstimatedValue: true },
          where: {
            ...(dateFilter && { createdAt: dateFilter }),
          },
        }),
        this.prisma.loanApplication.count({
          where: {
            status: LOAN_APPLICATION_STATUS.PendingFieldVerification,
            ...(dateFilter && { createdAt: dateFilter }),
          },
        }),
        this.prisma.$queryRaw<[{ total: number }]>`
          SELECT COALESCE(SUM(w.balance), 0) AS total FROM wallet w
        `,
      ]);

    return {
      status: true,
      message: 'Dashboard summary retrieved',
      data: {
        activeFarmers,
        activeAgents,
        loanVolume: loanVolume._sum.totalEstimatedValue ?? 0,
        pendingVerifications,
        walletBalances: Number(walletBalancesResult[0].total),
      },
    };
  }

  async getMonthlyOnboarding(query: DateRangeDto) {
    const year = new Date().getFullYear();
    const { from, to } = this.parseDateRange(query);

    const farmers = await this.prisma.user.findMany({
      where: {
        role: USER_ROLE.FARMER,
        createdAt: {
          gte: from ?? new Date(`${year}-01-01T00:00:00.000Z`),
          lte: to ?? new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
      select: { createdAt: true },
    });

    const counts: Record<string, number> = {};
    for (const name of MONTH_NAMES) counts[name] = 0;
    for (const { createdAt } of farmers) {
      counts[MONTH_NAMES[new Date(createdAt).getUTCMonth()]]++;
    }

    return {
      status: true,
      message: 'Monthly onboarding retrieved',
      data: counts,
    };
  }

  async getLoanDisbursement(query: DateRangeDto) {
    const year = new Date().getFullYear();
    const { from, to } = this.parseDateRange(query);

    const rangeStart = from ?? new Date(`${year}-01-01T00:00:00.000Z`);
    const rangeEnd = to ?? new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const quarterBoundaries = [
      { q: 1, start: new Date(`${year}-01-01T00:00:00.000Z`), end: new Date(`${year}-04-01T00:00:00.000Z`) },
      { q: 2, start: new Date(`${year}-04-01T00:00:00.000Z`), end: new Date(`${year}-07-01T00:00:00.000Z`) },
      { q: 3, start: new Date(`${year}-07-01T00:00:00.000Z`), end: new Date(`${year}-10-01T00:00:00.000Z`) },
      { q: 4, start: new Date(`${year}-10-01T00:00:00.000Z`), end: new Date(`${year + 1}-01-01T00:00:00.000Z`) },
    ];

    const data = await Promise.all(
      quarterBoundaries.map(async ({ q, start, end }) => {
        const qStart = start < rangeStart ? rangeStart : start;
        const qEnd = end > rangeEnd ? rangeEnd : end;

        if (qStart >= qEnd) return { quarter: q, loansRequested: 0, loansDisbursed: 0 };

        const [requestedAgg, disbursedAgg] = await Promise.all([
          this.prisma.loanApplication.aggregate({
            _sum: { totalEstimatedValue: true },
            where: {
              status: { not: LOAN_APPLICATION_STATUS.Draft },
              submittedAt: { gte: qStart, lt: qEnd },
            },
          }),
          this.prisma.loanDecision.aggregate({
            _sum: { approvedTotalValue: true },
            where: {
              decision: LOAN_DECISION_TYPE.approved,
              decidedAt: { gte: qStart, lt: qEnd },
            },
          }),
        ]);

        return {
          quarter: q,
          loansRequested: requestedAgg._sum.totalEstimatedValue ?? 0,
          loansDisbursed: disbursedAgg._sum.approvedTotalValue ?? 0,
        };
      }),
    );

    return {
      status: true,
      message: 'Loan disbursement data retrieved',
      data,
    };
  }

  async getCropDistribution(query: DateRangeDto) {
    const { from, to } = this.parseDateRange(query);
    const dateFilter = this.buildDateFilter(from, to);
    const where = dateFilter ? { createdAt: dateFilter } : {};

    const [cropGroups, hectaresAgg] = await Promise.all([
      this.prisma.farm.groupBy({
        by: ['mainCropType'],
        _count: { mainCropType: true },
        where,
      }),
      this.prisma.farm.aggregate({
        _sum: { sizeValue: true },
        where,
      }),
    ]);

    const total = cropGroups.reduce((sum, g) => sum + g._count.mainCropType, 0);
    const crops = cropGroups
      .map((g) => ({
        crop: g.mainCropType,
        per: total > 0 ? Math.round((g._count.mainCropType / total) * 100) : 0,
      }))
      .sort((a, b) => b.per - a.per);

    return {
      status: true,
      message: 'Crop distribution retrieved',
      data: {
        hectares: hectaresAgg._sum.sizeValue ?? 0,
        crops,
      },
    };
  }

  async getUsersOverview() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const verifiedTiers = await this.prisma.tier.findMany({
      where: { kycLevel: { gt: 1 } },
      select: { level: true },
    });
    const verifiedTierLevels = verifiedTiers.map((t) => t.level);

    const [totalCustomers, activeNow, verifiedCustomers, flaggedUsers] =
      await Promise.all([
        this.prisma.user.count({ where: { role: USER_ROLE.USER } }),
        this.prisma.user.count({
          where: {
            role: USER_ROLE.USER,
            wallet: {
              some: {
                transactions: {
                  some: { createdAt: { gte: oneDayAgo } },
                },
              },
            },
          },
        }),
        verifiedTierLevels.length > 0
          ? this.prisma.user.count({
              where: {
                role: USER_ROLE.USER,
                tierLevel: { in: verifiedTierLevels },
              },
            })
          : Promise.resolve(0),
        this.prisma.user.count({
          where: { role: USER_ROLE.USER, scamTicketCount: { gt: 0 } },
        }),
      ]);

    return {
      status: true,
      message: 'Users overview retrieved',
      data: { totalCustomers, activeNow, verifiedCustomers, flaggedUsers },
    };
  }

  async getRecentActiveUsers(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    type RecentUserRow = {
      id: string;
      fullname: string;
      email: string;
      phoneNumber: string;
      status: string;
      tierLevel: string;
      profileImageUrl: string | null;
      lastActiveAt: Date;
    };

    const [rows, total] = await Promise.all([
      this.prisma.$queryRaw<RecentUserRow[]>`
        SELECT sub.id, sub.fullname, sub.email, sub."phoneNumber",
               sub.status, sub."tierLevel", sub."profileImageUrl",
               sub."lastActiveAt"
        FROM (
          SELECT DISTINCT ON (u.id)
            u.id, u.fullname, u.email, u."phoneNumber",
            u.status, u."tierLevel", u."profileImageUrl",
            t."createdAt" AS "lastActiveAt"
          FROM users u
          JOIN wallet w ON w."userId" = u.id
          JOIN transaction t ON t."walletId" = w.id
          WHERE u.role = 'USER'
          ORDER BY u.id, t."createdAt" DESC
        ) sub
        ORDER BY sub."lastActiveAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT u.id) AS count
        FROM users u
        JOIN wallet w ON w."userId" = u.id
        JOIN transaction t ON t."walletId" = w.id
        WHERE u.role = 'USER'
      `,
    ]);

    return {
      status: true,
      message: 'Recent active users retrieved',
      data: {
        users: rows,
        total: Number(total[0].count),
        page,
        limit,
      },
    };
  }

  async getAccountsOverview() {
    const [totalWalletAccounts, totalActiveWalletAccounts, depositVolumeResult] =
      await Promise.all([
        this.prisma.wallet.count(),
        this.prisma.wallet.count({
          where: { user: { status: USER_ACCOUNT_STATUS.active } },
        }),
        this.prisma.$queryRaw<[{ total: number }]>`
          SELECT COALESCE(SUM(t."currentBalance" - t."previousBalance"), 0) AS total
          FROM transaction t
          WHERE t.category = 'DEPOSIT' AND t.status = 'success'
        `,
      ]);

    return {
      status: true,
      message: 'Accounts overview retrieved',
      data: {
        totalWalletAccounts,
        totalActiveWalletAccounts,
        totalDepositVolume: Number(depositVolumeResult[0].total),
      },
    };
  }

  async getAccountRegistry(query: AccountRegistryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const search = query.search?.trim() ?? '';

    type AccountRow = {
      fullname: string;
      email: string;
      phoneNumber: string;
      accountNumber: string;
      balance: number;
      isBvnVerified: boolean;
      tierLevel: string;
    };

    const searchFilter = search
      ? Prisma.sql`AND (
          w."accountNumber" ILIKE ${`%${search}%`}
          OR u.bvn = ${search}
          OR u.fullname ILIKE ${`%${search}%`}
        )`
      : Prisma.empty;

    const [rows, countResult] = await Promise.all([
      this.prisma.$queryRaw<AccountRow[]>`
        SELECT
          u.fullname,
          u.email,
          u."phoneNumber",
          w."accountNumber",
          w.balance,
          u."isBvnVerified",
          u."tierLevel"
        FROM wallet w
        JOIN users u ON u.id = w."userId"
        WHERE TRUE
          ${searchFilter}
        ORDER BY w."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM wallet w
        JOIN users u ON u.id = w."userId"
        WHERE TRUE
          ${searchFilter}
      `,
    ]);

    const accounts = rows.map((row) => ({
      customer: {
        fullname: row.fullname,
        email: row.email,
        phoneNumber: row.phoneNumber,
      },
      accountNumber: row.accountNumber,
      balance: row.balance,
      bvnStatus: row.isBvnVerified ? 'verified' : 'unverified',
      tier: row.tierLevel,
      cardStatus: null,
    }));

    return {
      status: true,
      message: 'Account registry retrieved',
      data: {
        accounts,
        total: Number(countResult[0].count),
        page,
        limit,
      },
    };
  }

  async getLoanOverview() {
    const [
      totalApplications,
      pendingVerifications,
      approvedLoansAgg,
      overdueLoansAgg,
    ] = await Promise.all([
      this.prisma.loanApplication.count(),
      this.prisma.loanApplication.count({
        where: { status: LOAN_APPLICATION_STATUS.PendingFieldVerification },
      }),
      this.prisma.loanDecision.aggregate({
        _sum: { approvedTotalValue: true },
        where: { decision: LOAN_DECISION_TYPE.approved },
      }),
      this.prisma.repaymentPlan.aggregate({
        _sum: { outstandingBalance: true },
        where: { status: REPAYMENT_STATUS.overdue },
      }),
    ]);

    return {
      status: true,
      message: 'Loan overview retrieved',
      data: {
        totalApplications,
        pendingVerifications,
        totalApprovedLoansSum: approvedLoansAgg._sum.approvedTotalValue ?? 0,
        totalOverdueLoansSum: overdueLoansAgg._sum.outstandingBalance ?? 0,
      },
    };
  }

  async getTransactionsOverview(query: DateRangeDto) {
    const { from, to } = this.parseDateRange(query);

    const fromFilter = from ? Prisma.sql`AND t."createdAt" >= ${from}` : Prisma.empty;
    const toFilter = to ? Prisma.sql`AND t."createdAt" <= ${to}` : Prisma.empty;
    const dateFilter = this.buildDateFilter(from, to);

    const [total, successCount, failedCount, volumeResult] = await Promise.all([
      this.prisma.transaction.count({
        where: dateFilter ? { createdAt: dateFilter } : {},
      }),
      this.prisma.transaction.count({
        where: {
          status: TRANSACTION_STATUS.success,
          ...(dateFilter && { createdAt: dateFilter }),
        },
      }),
      this.prisma.transaction.count({
        where: {
          status: TRANSACTION_STATUS.failed,
          ...(dateFilter && { createdAt: dateFilter }),
        },
      }),
      this.prisma.$queryRaw<[{ volume: number }]>`
        SELECT COALESCE(SUM(ABS(t."currentBalance" - t."previousBalance")), 0) AS volume
        FROM transaction t
        WHERE t.status = 'success'
        ${fromFilter}
        ${toFilter}
      `,
    ]);

    return {
      status: true,
      message: 'Transactions overview retrieved',
      data: {
        totalVolume: Number(volumeResult[0].volume),
        totalTransactionCount: total,
        successPercentage: total > 0 ? Math.round((successCount / total) * 100) : 0,
        failurePercentage: total > 0 ? Math.round((failedCount / total) * 100) : 0,
      },
    };
  }

  async getTransactionsHistory(query: TransactionsHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};

    if (query.reference) {
      where.OR = [
        { reference: { contains: query.reference, mode: 'insensitive' } },
        { transactionRef: { contains: query.reference, mode: 'insensitive' } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          wallet: {
            select: {
              accountNumber: true,
              user: { select: { fullname: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const data = transactions.map((t) => ({
      status: t.status,
      reference: t.reference ?? t.transactionRef,
      type: t.type,
      category: t.category,
      description: t.description,
      amount: Math.abs(t.currentBalance - t.previousBalance),
      timestamp: t.createdAt,
      customer: {
        fullname: t.wallet.user.fullname,
        accountNumber: t.wallet.accountNumber,
      },
    }));

    return {
      status: true,
      message: 'Transactions history retrieved',
      data: { transactions: data, total, page, limit },
    };
  }

  async getWalletOverview() {
    const [systemBalanceResult, activeWalletCount, settlementResult, totalTxCount, failedTxCount] =
      await Promise.all([
        this.prisma.$queryRaw<[{ total: number }]>`
          SELECT COALESCE(SUM(w.balance), 0) AS total FROM wallet w
        `,
        this.prisma.wallet.count({
          where: { user: { status: USER_ACCOUNT_STATUS.active } },
        }),
        this.prisma.$queryRaw<[{ total: number }]>`
          SELECT COALESCE(SUM("settlementAmount"), 0) AS total FROM "paymentEvent"
        `,
        this.prisma.transaction.count(),
        this.prisma.transaction.count({ where: { status: TRANSACTION_STATUS.failed } }),
      ]);

    return {
      status: true,
      message: 'Wallet overview retrieved',
      data: {
        systemBalance: Number(systemBalanceResult[0].total),
        activeWalletCount,
        totalSettlementValue: Number(settlementResult[0].total),
        failureRate: totalTxCount > 0 ? Math.round((failedTxCount / totalTxCount) * 100) : 0,
      },
    };
  }

  async getActiveWallets(query: ActiveWalletsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const search = query.search?.trim() ?? '';

    type ActiveWalletRow = {
      accountHolder: string;
      accountNumber: string;
      availableBalance: number;
      assetType: string;
      isTwoFaEnabled: boolean;
    };

    const searchFilter = search
      ? Prisma.sql`AND (
          w."accountNumber" ILIKE ${`%${search}%`}
          OR u.fullname ILIKE ${`%${search}%`}
          OR u.id::text = ${search}
        )`
      : Prisma.empty;

    const [rows, countResult] = await Promise.all([
      this.prisma.$queryRaw<ActiveWalletRow[]>`
        SELECT
          u.fullname           AS "accountHolder",
          w."accountNumber",
          w.balance            AS "availableBalance",
          w.currency           AS "assetType",
          u."enabledTwoFa"     AS "isTwoFaEnabled"
        FROM wallet w
        JOIN users u ON u.id = w."userId"
        WHERE u.status = 'active'
          ${searchFilter}
        ORDER BY w."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM wallet w
        JOIN users u ON u.id = w."userId"
        WHERE u.status = 'active'
          ${searchFilter}
      `,
    ]);

    const wallets = rows.map((row) => ({
      accountHolder: row.accountHolder,
      accountNumber: row.accountNumber,
      availableBalance: row.availableBalance,
      assetType: row.assetType,
      security: { twoFaEnabled: row.isTwoFaEnabled },
    }));

    return {
      status: true,
      message: 'Active wallets retrieved',
      data: {
        wallets,
        total: Number(countResult[0].count),
        page,
        limit,
      },
    };
  }

  async getTransfersOverview() {
    const [totalCount, successCount, pendingCount, failedCount, volumeResult] =
      await Promise.all([
        this.prisma.transaction.count({
          where: { category: 'TRANSFER' },
        }),
        this.prisma.transaction.count({
          where: { category: 'TRANSFER', status: TRANSACTION_STATUS.success },
        }),
        this.prisma.transaction.count({
          where: { category: 'TRANSFER', status: TRANSACTION_STATUS.pending },
        }),
        this.prisma.transaction.count({
          where: { category: 'TRANSFER', status: TRANSACTION_STATUS.failed },
        }),
        this.prisma.$queryRaw<[{ volume: number }]>`
          SELECT COALESCE(SUM(("transferDetails"->>'amount')::numeric), 0) AS volume
          FROM transaction
          WHERE category = 'TRANSFER' AND status = 'success'
        `,
      ]);

    return {
      status: true,
      message: 'Transfers overview retrieved',
      data: {
        transferVolume: Number(volumeResult[0].volume),
        activeVelocityCount: pendingCount,
        successRatePercentage: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0,
        failedTaskCount: failedCount,
      },
    };
  }

  async getTransferPipeline(query: TransferPipelineQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const dateFilter = query.date
      ? Prisma.sql`AND t."createdAt" >= ${new Date(`${query.date}T00:00:00.000Z`)}
                  AND t."createdAt" <  ${new Date(`${query.date}T23:59:59.999Z`)}`
      : Prisma.empty;

    type TransferRow = {
      status: string;
      originator: string | null;
      operationType: string;
      value: number;
      settlementDate: Date;
    };

    const [rows, countResult] = await Promise.all([
      this.prisma.$queryRaw<TransferRow[]>`
        SELECT
          t.status,
          (t."transferDetails"->>'senderName')  AS originator,
          t.type                                AS "operationType",
          COALESCE((t."transferDetails"->>'amount')::numeric,
                   ABS(t."currentBalance" - t."previousBalance")) AS value,
          t."createdAt"                         AS "settlementDate"
        FROM transaction t
        WHERE t.category = 'TRANSFER'
          ${dateFilter}
        ORDER BY t."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM transaction t
        WHERE t.category = 'TRANSFER'
          ${dateFilter}
      `,
    ]);

    return {
      status: true,
      message: 'Transfer pipeline retrieved',
      data: {
        transfers: rows,
        total: Number(countResult[0].count),
        page,
        limit,
      },
    };
  }

  async getBillPaymentsOverview() {
    const [totalCount, successCount, settlementResult] = await Promise.all([
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM transaction
        WHERE category = 'BILL_PAYMENT'
          AND (billDetails->>'type') IN ('airtime', 'data')
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM transaction
        WHERE category = 'BILL_PAYMENT'
          AND (billDetails->>'type') IN ('airtime', 'data')
          AND status = 'success'
      `,
      this.prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM((billDetails->>'amountPaid')::numeric), 0) AS total
        FROM transaction
        WHERE category = 'BILL_PAYMENT'
          AND (billDetails->>'type') IN ('airtime', 'data')
          AND status = 'success'
      `,
    ]);

    const total = Number(totalCount[0].count);
    const success = Number(successCount[0].count);

    return {
      status: true,
      message: 'Bill payments overview retrieved',
      data: {
        totalSettlementsSum: Number(settlementResult[0].total),
        totalTransactionCount: total,
        reliabilityPercentage: total > 0 ? Math.round((success / total) * 100) : 0,
      },
    };
  }

  async getBillPaymentsAirtimeOverview() {
    const [airtimeVolume, dataVolume, avgResult, totalCount, successCount] = await Promise.all([
      this.prisma.$queryRaw<[{ volume: number }]>`
        SELECT COALESCE(SUM((billDetails->>'amountPaid')::numeric), 0) AS volume
        FROM transaction
        WHERE category = 'BILL_PAYMENT'
          AND (billDetails->>'type') = 'airtime'
          AND status = 'success'
      `,
      this.prisma.$queryRaw<[{ volume: number }]>`
        SELECT COALESCE(SUM((billDetails->>'amountPaid')::numeric), 0) AS volume
        FROM transaction
        WHERE category = 'BILL_PAYMENT'
          AND (billDetails->>'type') = 'data'
          AND status = 'success'
      `,
      this.prisma.$queryRaw<[{ avg: number }]>`
        SELECT COALESCE(AVG((billDetails->>'amountPaid')::numeric), 0) AS avg
        FROM transaction
        WHERE category = 'BILL_PAYMENT'
          AND (billDetails->>'type') IN ('airtime', 'data')
          AND status = 'success'
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM transaction
        WHERE category = 'BILL_PAYMENT'
          AND (billDetails->>'type') IN ('airtime', 'data')
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM transaction
        WHERE category = 'BILL_PAYMENT'
          AND (billDetails->>'type') IN ('airtime', 'data')
          AND status = 'success'
      `,
    ]);

    const total = Number(totalCount[0].count);
    const success = Number(successCount[0].count);

    return {
      status: true,
      message: 'Bill payments airtime overview retrieved',
      data: {
        airtimeVolume: Number(airtimeVolume[0].volume),
        dataVolume: Number(dataVolume[0].volume),
        averageTransactionAmount: Math.round(Number(avgResult[0].avg) * 100) / 100,
        uptimePercentage: total > 0 ? Math.round((success / total) * 100) : 0,
      },
    };
  }

  async getKycOverview() {
    const verifiedTiers = await this.prisma.tier.findMany({
      where: { kycLevel: { gt: 1 } },
      select: { level: true },
    });
    const verifiedTierLevels = verifiedTiers.map((t) => t.level);

    const [totalCustomers, totalVerifiedCustomers, totalKycPending, totalActiveCustomers] =
      await Promise.all([
        this.prisma.user.count({ where: { role: USER_ROLE.USER } }),
        verifiedTierLevels.length > 0
          ? this.prisma.user.count({
              where: { role: USER_ROLE.USER, tierLevel: { in: verifiedTierLevels } },
            })
          : Promise.resolve(0),
        this.prisma.user.count({
          where: { role: USER_ROLE.USER, bvn: { not: null }, isBvnVerified: false },
        }),
        this.prisma.user.count({
          where: { role: USER_ROLE.USER, status: USER_ACCOUNT_STATUS.active },
        }),
      ]);

    return {
      status: true,
      message: 'KYC overview retrieved',
      data: { totalCustomers, totalVerifiedCustomers, totalKycPending, totalActiveCustomers },
    };
  }

  async getKycActivePipeline(query: KycActivePipelineQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const search = query.search?.trim() ?? '';

    type KycPipelineRow = {
      securityLevel: number | null;
      identityHolder: string;
      governmentId: string | null;
      complianceStatus: string;
    };

    const searchFilter = search
      ? Prisma.sql`AND (
          u.fullname ILIKE ${`%${search}%`}
          OR u.bvn = ${search}
          OR u.email ILIKE ${`%${search}%`}
        )`
      : Prisma.empty;

    const [rows, countResult] = await Promise.all([
      this.prisma.$queryRaw<KycPipelineRow[]>`
        SELECT
          t."kycLevel"    AS "securityLevel",
          u.fullname      AS "identityHolder",
          u.bvn           AS "governmentId",
          u."tierLevel"   AS "complianceStatus"
        FROM users u
        LEFT JOIN tier t ON t.level = u."tierLevel"
        WHERE u.role = 'USER'
          ${searchFilter}
        ORDER BY u."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM users u
        WHERE u.role = 'USER'
          ${searchFilter}
      `,
    ]);

    return {
      status: true,
      message: 'KYC active pipeline retrieved',
      data: {
        pipeline: rows,
        total: Number(countResult[0].count),
        page,
        limit,
      },
    };
  }

  async getDisputesOverview() {
    const [totalTickets, openTickets, closedTickets] = await Promise.all([
      this.prisma.scamTicket.count(),
      this.prisma.scamTicket.count({ where: { status: SCAM_TICKET_STATUS.opened } }),
      this.prisma.scamTicket.count({ where: { status: SCAM_TICKET_STATUS.closed } }),
    ]);

    return {
      status: true,
      message: 'Disputes overview retrieved',
      data: {
        totalTickets,
        openTickets,
        closedTickets,
        successRatePercentage: totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0,
      },
    };
  }

  async getDisputesPipeline(query: DisputesPipelineQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const search = query.search?.trim() ?? '';

    const searchFilter = search
      ? Prisma.sql`AND (
          st.title ILIKE ${`%${search}%`}
          OR st.ref_number::text ILIKE ${`%${search}%`}
        )`
      : Prisma.empty;

    type DisputeRow = {
      status: string;
      identifier: string;
      subject: string;
      lastActivity: Date;
    };

    const [rows, countResult] = await Promise.all([
      this.prisma.$queryRaw<DisputeRow[]>`
        SELECT
          st.status,
          'SCM-' || LPAD(st.ref_number::text, 4, '0') AS identifier,
          st.title                                      AS subject,
          st."updatedAt"                                AS "lastActivity"
        FROM "scamTicket" st
        WHERE TRUE
          ${searchFilter}
        ORDER BY st."updatedAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM "scamTicket" st
        WHERE TRUE
          ${searchFilter}
      `,
    ]);

    return {
      status: true,
      message: 'Disputes pipeline retrieved',
      data: {
        disputes: rows,
        total: Number(countResult[0].count),
        page,
        limit,
      },
    };
  }

  async getAgentPerformance(query: DateRangeDto) {
    type AgentRow = {
      agentName: string;
      totalCustomersOnboarded: bigint;
      totalLoanVolumeDisbursed: number | null;
    };

    const { from, to } = this.parseDateRange(query);

    const laFromFilter = from ? Prisma.sql`AND la."createdAt" >= ${from}` : Prisma.empty;
    const laToFilter = to ? Prisma.sql`AND la."createdAt" <= ${to}` : Prisma.empty;
    const ldFromFilter = from ? Prisma.sql`AND ld."decidedAt" >= ${from}` : Prisma.empty;
    const ldToFilter = to ? Prisma.sql`AND ld."decidedAt" <= ${to}` : Prisma.empty;

    const rows = await this.prisma.$queryRaw<AgentRow[]>`
      SELECT
        u.fullname                                   AS "agentName",
        COUNT(DISTINCT la."userId")                  AS "totalCustomersOnboarded",
        COALESCE(SUM(ld."approvedTotalValue"), 0)    AS "totalLoanVolumeDisbursed"
      FROM users u
      LEFT JOIN loan_application la
        ON la."agentId" = u.id
        ${laFromFilter}
        ${laToFilter}
      LEFT JOIN loan_decision ld
        ON ld."applicationId" = la.id
       AND ld.decision = 'approved'
        ${ldFromFilter}
        ${ldToFilter}
      WHERE u.role = 'AGENT'
      GROUP BY u.id, u.fullname
      ORDER BY "totalCustomersOnboarded" DESC
      LIMIT 3
    `;

    const data = rows.map((row) => ({
      agentName: row.agentName,
      totalCustomersOnboarded: Number(row.totalCustomersOnboarded),
      totalLoanVolumeDisbursed: row.totalLoanVolumeDisbursed ?? 0,
    }));

    return {
      status: true,
      message: 'Agent performance retrieved',
      data,
    };
  }
}
