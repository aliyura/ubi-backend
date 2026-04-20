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
} as const;
