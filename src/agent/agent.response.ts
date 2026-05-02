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
        metadata: { recommendation: 'recommended', applicationId: 'app-uuid-002' },
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
} as const;
