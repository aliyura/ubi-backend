export const walletResponse = {
  getAllBanks: {
    statusCode: 200,
    message: 'Banks fetched successfully',
    data: [{ code: '058', name: 'GTBank' }],
  },
  getAllMatchedBanks: {
    statusCode: 200,
    message: 'Matched banks fetched successfully',
    data: [{ code: '058', name: 'GTBank' }],
  },
  getTransferDetails: {
    statusCode: 200,
    message: 'Transfer fee fetched successfully',
    data: {
      amount: 10000,
      fee: 25,
      total: 10025,
    },
  },
  getTransactions: {
    statusCode: 200,
    message: 'Transactions fetched successfully',
    data: {
      page: 1,
      limit: 10,
      total: 1,
      items: [
        {
          id: 'txn_001',
          amount: 10000,
          status: 'SUCCESS',
          type: 'debit',
        },
      ],
    },
  },
  verifyAccountNumber: {
    statusCode: 200,
    message: 'Account verified successfully',
    data: {
      accountName: 'John Doe',
      accountNumber: '0123456789',
    },
  },
  initiateTransfer: {
    statusCode: 200,
    message: 'Transfer initiated successfully',
    data: {
      transactionId: 'txn_002',
      status: 'PENDING',
    },
  },
  generateQrCode: {
    statusCode: 200,
    message: 'QR code generated successfully',
    data: {
      qrCode: 'base64-encoded-qrcode-string',
      amount: 5000,
    },
  },
  decodeQrCode: {
    statusCode: 201,
    message: 'QR code decoded successfully',
    data: {
      accountName: 'John Doe',
      accountNumber: '0123456789',
      amount: 5000,
    },
  },
  bvnVerification: {
    statusCode: 201,
    message: 'BVN verification completed successfully',
    data: {
      bvnVerified: true,
      tier: 2,
    },
  },
} as const;
