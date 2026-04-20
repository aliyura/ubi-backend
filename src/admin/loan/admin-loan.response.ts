export const adminLoanResponse = {
  listApplications: {
    statusCode: 200,
    message: 'Applications retrieved',
    data: [
      {
        id: 'app-uuid-001',
        applicationRef: 'UBI-2026-AB3CD7E',
        userId: 'user-uuid-001',
        status: 'UnderReview',
        totalEstimatedValue: 61500,
        submittedAt: '2026-04-18T10:30:00.000Z',
        farm: { name: 'Abubakar North Farm', state: 'Katsina', lga: 'Kankia', mainCropType: 'Maize', sizeValue: 5 },
        agentRecommendation: null,
        items: [
          { itemName: 'Maize Seeds (OPV)', quantity: 5, totalAmount: 17500 },
          { itemName: 'Urea Fertilizer', quantity: 2, totalAmount: 44000 },
        ],
      },
    ],
    meta: { total: 1, page: 1, limit: 20, pages: 1 },
  },
  verificationQueue: {
    statusCode: 200,
    message: 'Verification queue retrieved',
    data: [
      {
        id: 'app-uuid-002',
        applicationRef: 'UBI-2026-XY7ZW1',
        status: 'PendingFieldVerification',
        agentId: 'agent-uuid-001',
        farm: { name: 'Emeka Delta Farm', state: 'Delta', lga: 'Ughelli' },
        fieldVerification: null,
      },
    ],
    meta: { total: 1, page: 1, limit: 20, pages: 1 },
  },
  getApplicationDetail: {
    statusCode: 200,
    message: 'Application retrieved',
    data: {
      id: 'app-uuid-001',
      applicationRef: 'UBI-2026-AB3CD7E',
      status: 'UnderReview',
      totalEstimatedValue: 61500,
      farm: { name: 'Abubakar North Farm', state: 'Katsina', photos: [] },
      items: [{ itemName: 'Maize Seeds (OPV)', quantity: 5, unitPrice: 3500, totalAmount: 17500 }],
      eligibilityChecks: [
        { checkName: 'KYC Verification', result: 'pass' },
        { checkName: 'Active Loan Conflict', result: 'pass' },
      ],
      agentRecommendation: null,
      fieldVerification: null,
      decisions: [],
      statusHistory: [
        { toStatus: 'Submitted', changedBy: 'user-uuid-001', createdAt: '2026-04-18T10:30:00.000Z' },
        { toStatus: 'UnderReview', changedBy: 'admin-uuid-001', createdAt: '2026-04-18T11:00:00.000Z' },
      ],
      fulfillment: null,
      repaymentPlan: null,
      auditLogs: [
        { action: 'APPLICATION_SUBMITTED', performedByRole: 'FARMER', createdAt: '2026-04-18T10:30:00.000Z' },
        { action: 'STATUS_UPDATED_TO_UNDERREVIEW', performedByRole: 'ADMIN', createdAt: '2026-04-18T11:00:00.000Z' },
      ],
    },
  },
  decision: {
    statusCode: 200,
    message: 'Decision recorded successfully',
    data: null,
  },
  assignAgent: {
    statusCode: 200,
    message: 'Agent assigned',
    data: null,
  },
  updateStatus: {
    statusCode: 200,
    message: 'Status updated',
    data: null,
  },
  auditLog: {
    statusCode: 200,
    message: 'Audit log retrieved',
    data: [
      { id: 'log-uuid-001', action: 'APPLICATION_SUBMITTED', performedById: 'user-uuid-001', performedByRole: 'FARMER', details: { eligibilityResult: 'pass' }, createdAt: '2026-04-18T10:30:00.000Z' },
      { id: 'log-uuid-002', action: 'DECISION_APPROVED', performedById: 'admin-uuid-001', performedByRole: 'ADMIN', details: { decision: 'approved', reason: 'All checks passed' }, createdAt: '2026-04-19T09:00:00.000Z' },
    ],
  },
  summaryReport: {
    statusCode: 200,
    message: 'Summary report retrieved',
    data: {
      total: 240,
      approved: 180,
      rejected: 32,
      overdue: 12,
      approvalRate: '75.0%',
      rejectionRate: '13.3%',
    },
  },
  overdueReport: {
    statusCode: 200,
    message: 'Overdue loans retrieved',
    data: [
      {
        id: 'app-uuid-003',
        applicationRef: 'UBI-2026-OV1234',
        status: 'Overdue',
        totalEstimatedValue: 45000,
        farm: { name: 'Bello Rice Farm', state: 'Kebbi' },
        repaymentPlan: { outstandingBalance: 22500, nextDueDate: '2026-04-01' },
      },
    ],
    meta: { total: 1, page: 1, limit: 20, pages: 1 },
  },
  topItems: {
    statusCode: 200,
    message: 'Top items retrieved',
    data: [
      { itemName: 'Maize Seeds (OPV)', _sum: { quantity: 1250, totalAmount: 4375000 }, _count: { itemName: 180 } },
      { itemName: 'Urea Fertilizer', _sum: { quantity: 620, totalAmount: 13640000 }, _count: { itemName: 95 } },
      { itemName: 'NPK Fertilizer', _sum: { quantity: 380, totalAmount: 7220000 }, _count: { itemName: 70 } },
    ],
  },
} as const;
