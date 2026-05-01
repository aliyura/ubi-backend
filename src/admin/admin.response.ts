export const adminResponse = {
  addDataPlan: {
    statusCode: 200,
    message: 'Data plan added successfully',
    data: {
      id: 1,
      name: '1GB Weekly',
      amount: 1000,
    },
  },
  addAirtimePlan: {
    statusCode: 200,
    message: 'Airtime plan added successfully',
    data: {
      id: 2,
      network: 'MTN',
      amount: 500,
    },
  },
  addCablePlan: {
    statusCode: 200,
    message: 'Cable plan added successfully',
    data: {
      id: 3,
      provider: 'DSTV',
      amount: 4500,
    },
  },
  addElectricityPlan: {
    statusCode: 200,
    message: 'Electricity plan added successfully',
    data: {
      id: 4,
      disco: 'Ikeja Electric',
      amount: 5000,
    },
  },
  addInternetServicePlan: {
    statusCode: 200,
    message: 'Internet plan added successfully',
    data: {
      id: 5,
      provider: 'Smile',
      amount: 7000,
    },
  },
  addTransportPlan: {
    statusCode: 200,
    message: 'Transport plan added successfully',
    data: {
      id: 6,
      provider: 'BRT',
      amount: 3000,
    },
  },
  addSchoolFeePlan: {
    statusCode: 200,
    message: 'School fee plan added successfully',
    data: {
      id: 7,
      institution: 'University Example',
      amount: 50000,
    },
  },
  deletePlan: {
    statusCode: 200,
    message: 'Plan deleted successfully',
    data: {
      id: 7,
      billType: 'data',
    },
  },
  inviteAgent: {
    statusCode: 200,
    message: 'Agent invited successfully',
    data: null,
  },
  systemSettings: {
    statusCode: 200,
    message: 'System settings fetched successfully',
    data: {
      transferLimits: {
        tier1: {
          dailyCumulativeLimit: 1000000,
          perTransactionLimit: 50000,
          walletBalanceLimit: 5000000,
        },
        tier2: {
          dailyCumulativeLimit: 5000000,
          perTransactionLimit: 200000,
          walletBalanceLimit: 10000000,
        },
        tier3: {
          dailyCumulativeLimit: 9999999999999,
          perTransactionLimit: 9999999999999,
          walletBalanceLimit: 9999999999999,
        },
        businessTier1: {
          dailyCumulativeLimit: 1000000,
          walletBalanceLimit: 5000000,
        },
      },
      fees: {
        cable: 50,
        electricity: 50,
        internet: 10,
        schoolFee: 10,
        transport: 10,
        internationalAirtime: 100,
        giftCard: 0,
        referralBonus: 500,
      },
    },
  },
  adminProfile: {
    statusCode: 200,
    message: 'Profile fetched successfully',
    data: {
      adminId: 'uuid',
      fullName: 'John Doe',
      email: 'admin@example.com',
      role: 'ADMIN',
      passwordLastChangedAt: '2024-01-01T00:00:00.000Z',
    },
  },
} as const;
