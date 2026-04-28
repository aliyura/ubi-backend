export const adminDashboardResponse = {
  summary: {
    status: true,
    message: 'Dashboard summary retrieved',
    data: {
      activeFarmers: 312,
      activeAgents: 18,
      loanVolume: 48500000,
      pendingVerifications: 14,
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
} as const;
