export const adminDashboardResponse = {
  summary: {
    status: true,
    message: 'Dashboard summary retrieved',
    data: {
      activeFarmers: 312,
      activeAgents: 18,
      loanVolume: 48500000,
      pendingVerifications: 14,
      walletBalances: 274500000,
    },
  },
  monthlyOnboarding: {
    status: true,
    message: 'Monthly onboarding retrieved',
    data: {
      January: 12,
      February: 8,
      March: 21,
      April: 18,
      May: 9,
      June: 15,
      July: 7,
      August: 11,
      September: 6,
      October: 20,
      November: 14,
      December: 3,
    },
  },
  loanDisbursement: {
    status: true,
    message: 'Loan disbursement data retrieved',
    data: [
      { quarter: 1, loansRequested: 12000000, loansDisbursed: 10800000 },
      { quarter: 2, loansRequested: 17500000, loansDisbursed: 15900000 },
      { quarter: 3, loansRequested: 19200000, loansDisbursed: 17760000 },
      { quarter: 4, loansRequested: 16000000, loansDisbursed: 14400000 },
    ],
  },
  agentPerformance: {
    status: true,
    message: 'Agent performance retrieved',
    data: [
      {
        agentName: 'Ibrahim Musa',
        totalCustomersOnboarded: 45,
        totalLoanVolumeDisbursed: 5000000,
      },
      {
        agentName: 'Fatima Yusuf',
        totalCustomersOnboarded: 38,
        totalLoanVolumeDisbursed: 4200000,
      },
      {
        agentName: 'Emeka Obi',
        totalCustomersOnboarded: 31,
        totalLoanVolumeDisbursed: 3750000,
      },
    ],
  },
  cropDistribution: {
    status: true,
    message: 'Crop distribution retrieved',
    data: {
      hectares: 1250.5,
      crops: [
        { crop: 'Maize', per: 43 },
        { crop: 'Cassava', per: 31 },
        { crop: 'Sorghum', per: 16 },
        { crop: 'Rice', per: 10 },
      ],
    },
  },
  usersOverview: {
    status: true,
    message: 'Users overview retrieved',
    data: {
      totalCustomers: 1240,
      activeNow: 87,
      verifiedCustomers: 934,
      flaggedUsers: 12,
    },
  },
  recentActiveUsers: {
    status: true,
    message: 'Recent active users retrieved',
    data: {
      users: [
        {
          id: 'a1b2c3d4-0000-0000-0000-000000000001',
          fullname: 'Amara Okafor',
          email: 'amara@example.com',
          phoneNumber: '+2348012345678',
          status: 'active',
          tierLevel: 'two',
          profileImageUrl: null,
          lastActiveAt: '2026-04-28T10:23:00.000Z',
        },
      ],
      total: 980,
      page: 1,
      limit: 20,
    },
  },
  accountsOverview: {
    status: true,
    message: 'Accounts overview retrieved',
    data: {
      totalWalletAccounts: 3200,
      totalActiveWalletAccounts: 2750,
      totalDepositVolume: 182500000,
    },
  },
  loanOverview: {
    status: true,
    message: 'Loan overview retrieved',
    data: {
      totalApplications: 520,
      pendingVerifications: 34,
      totalApprovedLoansSum: 64800000,
      totalOverdueLoansSum: 8250000,
    },
  },
  accountRegistry: {
    status: true,
    message: 'Account registry retrieved',
    data: {
      accounts: [
        {
          customer: {
            fullname: 'Amara Okafor',
            email: 'amara@example.com',
            phoneNumber: '+2348012345678',
          },
          accountNumber: '0123456789',
          balance: 45000,
          bvnStatus: 'verified',
          tier: 'two',
          cardStatus: null,
        },
      ],
      total: 3200,
      page: 1,
      limit: 20,
    },
  },
  transactionsOverview: {
    status: true,
    message: 'Transactions overview retrieved',
    data: {
      totalVolume: 94500000,
      totalTransactionCount: 3840,
      successPercentage: 91,
      failurePercentage: 6,
    },
  },
  transactionsHistory: {
    status: true,
    message: 'Transactions history retrieved',
    data: {
      transactions: [
        {
          status: 'success',
          reference: 'TXN-20260428-001',
          type: 'DEBIT',
          category: 'TRANSFER',
          description: 'Transfer to Chidi Nwosu',
          amount: 15000,
          timestamp: '2026-04-28T10:23:00.000Z',
          customer: {
            fullname: 'Amara Okafor',
            accountNumber: '0123456789',
          },
        },
      ],
      total: 3840,
      page: 1,
      limit: 20,
    },
  },
  walletOverview: {
    status: true,
    message: 'Wallet overview retrieved',
    data: {
      systemBalance: 274500000,
      activeWalletCount: 2750,
      totalSettlementValue: 198000000,
      failureRate: 6,
    },
  },
  activeWallets: {
    status: true,
    message: 'Active wallets retrieved',
    data: {
      wallets: [
        {
          accountHolder: 'Amara Okafor',
          accountNumber: '0123456789',
          availableBalance: 45000,
          assetType: 'NGN',
          security: { twoFaEnabled: true },
        },
      ],
      total: 2750,
      page: 1,
      limit: 20,
    },
  },
  transfersOverview: {
    status: true,
    message: 'Transfers overview retrieved',
    data: {
      transferVolume: 74200000,
      activeVelocityCount: 43,
      successRatePercentage: 94,
      failedTaskCount: 18,
    },
  },
  billPaymentsOverview: {
    status: true,
    message: 'Bill payments overview retrieved',
    data: {
      totalSettlementsSum: 18750000,
      totalTransactionCount: 4320,
      reliabilityPercentage: 97,
    },
  },
  billPaymentsAirtimeOverview: {
    status: true,
    message: 'Bill payments airtime overview retrieved',
    data: {
      airtimeVolume: 11200000,
      dataVolume: 7550000,
      averageTransactionAmount: 4340.28,
      uptimePercentage: 97,
    },
  },
  transferPipeline: {
    status: true,
    message: 'Transfer pipeline retrieved',
    data: {
      transfers: [
        {
          status: 'success',
          originator: 'Amara Okafor',
          operationType: 'DEBIT',
          value: 25000,
          settlementDate: '2026-04-29T09:15:00.000Z',
        },
      ],
      total: 128,
      page: 1,
      limit: 20,
    },
  },
  kycOverview: {
    status: true,
    message: 'KYC overview retrieved',
    data: {
      totalCustomers: 1240,
      totalVerifiedCustomers: 934,
      totalKycPending: 87,
      totalActiveCustomers: 1180,
    },
  },
  kycActivePipeline: {
    status: true,
    message: 'KYC active pipeline retrieved',
    data: {
      pipeline: [
        {
          securityLevel: 2,
          identityHolder: 'Amara Okafor',
          governmentId: '22345678901',
          complianceStatus: 'two',
          user: {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            email: 'amara.okafor@example.com',
            username: 'amaraokafor',
            phoneNumber: '+2348012345678',
            fullname: 'Amara Okafor',
            gender: 'female',
            country: 'NG',
            status: 'active',
            tierLevel: 'two',
            isBvnVerified: true,
            isNinVerified: false,
            isEmailVerified: true,
            isPhoneVerified: true,
            isAddressVerified: false,
            dateOfBirth: '1995-06-15',
            createdAt: '2025-01-10T08:22:00.000Z',
          },
          wallet: {
            id: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890',
            balance: 52400.0,
            accountNumber: '8012345678',
            accountName: 'Amara Okafor',
            bankName: 'Providus Bank',
            bankCode: '101',
            currency: 'NGN',
          },
        },
      ],
      total: 934,
      page: 1,
      limit: 20,
    },
  },
  disputesOverview: {
    status: true,
    message: 'Disputes overview retrieved',
    data: {
      totalTickets: 142,
      openTickets: 38,
      closedTickets: 104,
      successRatePercentage: 73,
    },
  },
  disputesPipeline: {
    status: true,
    message: 'Disputes pipeline retrieved',
    data: {
      disputes: [
        {
          status: 'opened',
          identifier: 'SCM-0012',
          subject: 'Unauthorized transfer from my account',
          lastActivity: '2026-04-28T14:32:00.000Z',
        },
      ],
      total: 142,
      page: 1,
      limit: 20,
    },
  },
} as const;
