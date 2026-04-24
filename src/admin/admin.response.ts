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
} as const;
