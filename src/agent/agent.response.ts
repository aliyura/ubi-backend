export const agentResponse = {
  getAssigned: {
    statusCode: 200,
    message: 'Assigned applications retrieved',
    data: [
      {
        id: 'app-uuid-002',
        applicationRef: 'UBI-2026-XY7ZW1',
        status: 'PendingFieldVerification',
        totalEstimatedValue: 45000,
        submittedAt: '2026-04-17T09:00:00.000Z',
        farm: {
          name: 'Emeka Delta Farm',
          address: '12 Farm Road, Ughelli',
          state: 'Delta',
          lga: 'Ughelli',
          mainCropType: 'Cassava',
          sizeValue: 3,
          sizeUnit: 'hectares',
        },
      },
    ],
  },
  submitVerification: {
    statusCode: 200,
    message: 'Field verification submitted',
    data: null,
  },
  getActivityLogs: {
    statusCode: 200,
    message: 'Activity logs retrieved',
    data: [
      {
        id: 'log-uuid-001',
        agentId: 'agent-uuid-001',
        action: 'SUBMIT_FIELD_VERIFICATION',
        description: 'Submitted field verification report',
        metadata: {
          recommendation: 'recommended',
          applicationId: 'app-uuid-002',
        },
        applicationId: 'app-uuid-002',
        createdAt: '2026-04-24T10:30:00.000Z',
      },
    ],
  },
  getAssignedFarmers: {
    statusCode: 200,
    message: 'Assigned farmers retrieved',
    data: [
      {
        id: 'user-uuid-001',
        fullname: 'Emeka Okafor',
        email: 'emeka@example.com',
        phoneNumber: '+2348012345678',
        state: 'Delta',
        city: 'Ughelli',
        profileImageUrl: null,
        createdAt: '2026-01-10T08:00:00.000Z',
        loanApplications: [
          {
            id: 'app-uuid-002',
            applicationRef: 'UBI-2026-XY7ZW1',
            status: 'PendingFieldVerification',
            fieldVerification: null,
          },
          {
            id: 'app-uuid-003',
            applicationRef: 'UBI-2026-AB1CD2',
            status: 'UnderReview',
            fieldVerification: {
              farmExists: true,
              visitedAt: '2026-04-20T09:00:00.000Z',
              cropConfirmed: true,
              estimatedFarmSize: 3.5,
              recommendation: 'recommended',
              note: 'Farm looks healthy',
              createdAt: '2026-04-20T10:00:00.000Z',
            },
          },
        ],
      },
    ],
  },

  // ─── Agent Onboarding Responses ────────────────────────────────────────────

  onboardFarmer: {
    status: true,
    message: 'Farmer onboarded successfully',
    data: {
      id: 'farmer-uuid-001',
      fullname: 'John Doe',
      email: 'farmer@example.com',
      phoneNumber: '08012345678',
      username: 'farmer123',
      role: 'FARMER',
      accountType: 'FARMER',
      onboardedByAgentId: 'agent-uuid-001',
      createdAt: '2026-05-10T12:00:00.000Z',
    },
  },

  bulkOnboardFarmers: {
    status: false,
    message: 'Bulk onboarding completed with partial failures',
    data: [
      {
        index: 0,
        email: 'farmer1@example.com',
        status: 'success',
        message: 'Farmer onboarded successfully',
        data: {
          id: 'farmer-uuid-001',
          fullname: 'John Doe',
          email: 'farmer1@example.com',
          phoneNumber: '08012345678',
          username: 'farmer123',
          role: 'FARMER',
          accountType: 'FARMER',
          onboardedByAgentId: 'agent-uuid-001',
          createdAt: '2026-05-10T12:00:00.000Z',
        },
      },
      {
        index: 1,
        email: 'farmer1@example.com',
        status: 'failed',
        message: 'User with this email, username, or phone number already exists',
      },
    ],
    meta: {
      total: 2,
      successCount: 1,
      failedCount: 1,
    },
  },

  createFarmForFarmer: {
    status: true,
    message: 'Farm created successfully',
    data: {
      id: 'farm-uuid-001',
      userId: 'farmer-uuid-001',
      name: 'Green Acres Farm',
      address: '12 Farm Road, Kano',
      state: 'Kano',
      lga: 'Kano Municipal',
      ownershipType: 'owned',
      mainCropType: 'Maize',
      sizeValue: 5.5,
      sizeUnit: 'hectares',
      createdAt: '2026-05-10T12:30:00.000Z',
    },
  },

  submitLoanForFarmer: {
    status: true,
    message: 'Loan application submitted successfully',
    data: {
      id: 'loan-uuid-001',
      userId: 'farmer-uuid-001',
      farmId: 'farm-uuid-001',
      applicationRef: 'UBI-2026-ABC123',
      status: 'Submitted',
      totalEstimatedValue: 150000,
      agentId: 'agent-uuid-001',
      submittedAt: '2026-05-10T13:00:00.000Z',
      eligibility: {
        eligible: 'pass',
        checks: [
          {
            checkName: 'HAS_ACTIVE_LOAN',
            result: 'pass',
            note: 'No active loans found',
          },
        ],
      },
    },
  },
  submitLoanForFarmerFromMarketplace: {
    status: true,
    message: 'Loan application submitted successfully',
    data: {
      id: 'loan-uuid-001',
      userId: 'farmer-uuid-001',
      farmId: 'farm-uuid-001',
      applicationRef: 'UBI-2026-ABC123',
      status: 'Submitted',
      totalEstimatedValue: 150000,
      agentId: 'agent-uuid-001',
      submittedAt: '2026-05-10T13:00:00.000Z',
      eligibility: {
        eligible: 'pass',
        checks: [
          {
            checkName: 'HAS_ACTIVE_LOAN',
            result: 'pass',
            note: 'No active loans found',
          },
        ],
      },
    },
  },

  getOnboardedFarmers: {
    status: true,
    message: 'Onboarded farmers retrieved',
    data: [
      {
        id: 'farmer-uuid-001',
        fullname: 'John Doe',
        email: 'farmer@example.com',
        phoneNumber: '08012345678',
        state: 'Kano',
        city: 'Kano',
        profileImageUrl: null,
        status: 'active',
        tierLevel: 'one',
        createdAt: '2026-05-10T12:00:00.000Z',
        farms: [
          {
            id: 'farm-uuid-001',
            name: 'Green Acres Farm',
            address: '12 Farm Road, Kano',
            state: 'Kano',
            mainCropType: 'Maize',
            sizeValue: 5.5,
            sizeUnit: 'hectares',
          },
        ],
        loanApplications: [
          {
            id: 'loan-uuid-001',
            applicationRef: 'UBI-2026-ABC123',
            status: 'Submitted',
            totalEstimatedValue: 150000,
            createdAt: '2026-05-10T13:00:00.000Z',
          },
        ],
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 20,
      pages: 1,
    },
  },

  getOnboardedFarmersLoanApplications: {
    status: true,
    message: 'Loan applications retrieved',
    data: [
      {
        id: 'loan-uuid-001',
        applicationRef: 'UBI-2026-ABC123',
        status: 'Submitted',
        totalEstimatedValue: 150000,
        createdAt: '2026-05-10T13:00:00.000Z',
        user: {
          id: 'farmer-uuid-001',
          fullname: 'John Doe',
          email: 'farmer@example.com',
          phoneNumber: '08012345678',
        },
        farm: {
          id: 'farm-uuid-001',
          name: 'Green Acres Farm',
          address: '12 Farm Road, Kano',
          mainCropType: 'Maize',
        },
        items: [
          {
            id: 'item-uuid-001',
            itemName: 'NPK Fertilizer',
            category: 'Inputs',
            unitPrice: 25000,
            quantity: 6,
            totalAmount: 150000,
          },
        ],
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 20,
      pages: 1,
    },
  },
  verifyFarmerTier2Kyc: {
    message: 'Tier2 kyc verification successful',
    statusCode: 200,
  },
  verifyFarmerTier3Kyc: {
    message: 'Tier3 kyc verification successful',
    statusCode: 200,
  },
  getFarmerCart: {
    status: true,
    message: 'Cart retrieved',
    data: {
      id: 'cart-uuid-001',
      userId: 'farmer-uuid-001',
      total: 50000,
      items: [
        {
          id: 'cart-item-uuid-001',
          cartId: 'cart-uuid-001',
          resourceId: 'resource-uuid-001',
          quantity: 2,
          resource: {
            id: 'resource-uuid-001',
            name: 'NPK Fertilizer',
            unitPrice: 25000,
            unitOfMeasure: 'bag',
          },
        },
      ],
    },
  },
  addFarmerCartItem: {
    status: true,
    message: 'Cart retrieved',
    data: {
      id: 'cart-uuid-001',
      userId: 'farmer-uuid-001',
      total: 75000,
      items: [
        {
          id: 'cart-item-uuid-001',
          cartId: 'cart-uuid-001',
          resourceId: 'resource-uuid-001',
          quantity: 3,
          resource: {
            id: 'resource-uuid-001',
            name: 'NPK Fertilizer',
            unitPrice: 25000,
            unitOfMeasure: 'bag',
          },
        },
      ],
    },
  },
  updateFarmerCartItem: {
    status: true,
    message: 'Cart retrieved',
    data: {
      id: 'cart-uuid-001',
      userId: 'farmer-uuid-001',
      total: 100000,
      items: [
        {
          id: 'cart-item-uuid-001',
          cartId: 'cart-uuid-001',
          resourceId: 'resource-uuid-001',
          quantity: 4,
          resource: {
            id: 'resource-uuid-001',
            name: 'NPK Fertilizer',
            unitPrice: 25000,
            unitOfMeasure: 'bag',
          },
        },
      ],
    },
  },
  removeFarmerCartItem: {
    status: true,
    message: 'Cart retrieved',
    data: {
      id: 'cart-uuid-001',
      userId: 'farmer-uuid-001',
      total: 0,
      items: [],
    },
  },
  clearFarmerCart: {
    status: true,
    message: 'Cart cleared',
    data: null,
  },
} as const;
