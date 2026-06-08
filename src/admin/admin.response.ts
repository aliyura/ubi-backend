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
    message: 'Agent invitation sent successfully',
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
      twoFaEnabled: true,
    },
  },
  getAgents: {
    statusCode: 200,
    message: 'Agents fetched successfully',
    data: {
      agents: [
        {
          id: 'agent-uuid-1',
          fullname: 'Aminu Bello',
          email: 'aminu@example.com',
          phoneNumber: '08012345678',
          address: '14 Kano Road',
          state: 'Kano',
          city: 'Kano Municipal',
          isAddressVerified: false,
          status: 'active',
          createdAt: '2026-01-10T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    },
  },
  verifyAgentAddress: {
    statusCode: 200,
    message: 'Agent home address verified successfully',
  },
  getAgentFarmers: {
    statusCode: 200,
    message: 'Farmers fetched successfully',
    data: {
      agent: {
        id: 'agent-uuid',
        fullname: 'Agent Name',
        email: 'agent@example.com',
      },
      farmers: [
        {
          id: 'farmer-uuid-1',
          email: 'farmer1@example.com',
          fullname: 'Farmer One',
          phoneNumber: '+2348012345678',
          country: 'NG',
          status: 'active',
          tierLevel: 'one',
          profileImageUrl: 'https://example.com/profile.jpg',
          verification: {
            isPhoneVerified: true,
            isEmailVerified: true,
            isBvnVerified: false,
            isNinVerified: true,
            isAddressVerified: false,
          },
          loanApplicationCount: 3,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'farmer-uuid-2',
          email: 'farmer2@example.com',
          fullname: 'Farmer Two',
          phoneNumber: '+2348023456789',
          country: 'NG',
          status: 'active',
          tierLevel: 'two',
          profileImageUrl: null,
          verification: {
            isPhoneVerified: true,
            isEmailVerified: false,
            isBvnVerified: true,
            isNinVerified: false,
            isAddressVerified: true,
          },
          loanApplicationCount: 1,
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ],
      totalFarmers: 2,
    },
  },
  setKoboFormUrl: {
    statusCode: 201,
    message: 'Kobo form URL saved successfully',
    data: {
      id: 'uuid-here',
      url: 'https://ee.kobotoolbox.org/x/abc123',
      label: 'Farm Verification Form',
      createdAt: '2026-06-08T10:00:00.000Z',
      updatedAt: '2026-06-08T10:00:00.000Z',
    },
  },
  updateKoboFormUrl: {
    statusCode: 200,
    message: 'Kobo form URL updated successfully',
    data: {
      id: 'uuid-here',
      url: 'https://ee.kobotoolbox.org/x/xyz789',
      label: 'Farm Verification Form',
      createdAt: '2026-06-08T10:00:00.000Z',
      updatedAt: '2026-06-08T11:00:00.000Z',
    },
  },
  deleteKoboFormUrl: {
    statusCode: 200,
    message: 'Kobo form URL deleted successfully',
  },
} as const;
