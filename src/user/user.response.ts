export const userResponse = {
  register: {
    statusCode: 201,
    message: 'User registered successfully',
    data: { userId: 'usr_12345', email: 'john@example.com', up: true },
  },
  registerFarmerAccount: {
    statusCode: 201,
    message: 'Farmer account registered successfully',
    data: { userId: 'usr_12345', farmerName: 'Acme Farms' },
  },
  createPasscode: {
    statusCode: 201,
    message: 'Passcode created successfully',
    data: { updated: true },
  },
  forgotPassword: {
    statusCode: 201,
    message: 'Password reset OTP sent successfully',
    data: { expiresIn: 300 },
  },
  verifyForgotPassword: {
    statusCode: 201,
    message: 'OTP verified successfully',
    data: { verified: true },
  },
  resetPassword: {
    statusCode: 201,
    message: 'Password reset successful',
    data: { updated: true },
  },
  createAccount: {
    statusCode: 201,
    message: 'Wallet account created successfully',
    data: { accountNumber: '0123456789', bankName: 'SafeHaven MFB' },
  },
  createFarmerAccount: {
    statusCode: 201,
    message: 'Farmer wallet account created successfully',
    data: { accountNumber: '0123456789', farmerName: 'Acme Farms' },
  },
  createForeignAccount: {
    statusCode: 201,
    message: 'Foreign account created successfully',
    data: { currency: 'USD', accountNumber: '1234567890' },
  },
  setWalletPin: {
    statusCode: 201,
    message: 'Wallet PIN set successfully',
    data: { updated: true },
  },
  verifyWalletPin: {
    statusCode: 200,
    message: 'Wallet PIN verified successfully',
    data: { verified: true },
  },
  verifyNin: {
    statusCode: 200,
    message: 'NIN verified successfully',
    data: { verified: true, tier: 2 },
  },
  forgetPin: {
    statusCode: 201,
    message: 'PIN reset OTP sent successfully',
    data: { expiresIn: 300 },
  },
  resetPin: {
    statusCode: 201,
    message: 'Wallet PIN reset successful',
    data: { updated: true },
  },
  reportScam: {
    statusCode: 201,
    message: 'Scam report submitted successfully',
    data: { reportId: 'rpt_001' },
  },
  verifyTier2Kyc: {
    statusCode: 200,
    message: 'Tier 2 KYC verified successfully',
    data: { tier: 2, status: 'approved' },
  },
  verifyTier3Kyc: {
    statusCode: 200,
    message: 'Tier 3 KYC verified successfully',
    data: { tier: 3, status: 'approved' },
  },
  checkUserExistance: {
    statusCode: 200,
    message: 'User existence check completed',
    data: { exists: true },
  },
  validatePhoneNumber: {
    statusCode: 200,
    message: 'Phone number validation OTP sent',
    data: { expiresIn: 300 },
  },
  verifyPhoneNumber: {
    statusCode: 200,
    message: 'Phone number verified successfully',
    data: { verified: true },
  },
  validateEmail: {
    statusCode: 200,
    message: 'Email validation OTP sent',
    data: { expiresIn: 300 },
  },
  verifyEmail: {
    statusCode: 200,
    message: 'Email verified successfully',
    data: { verified: true },
  },
  editProfile: {
    statusCode: 200,
    message: 'Profile updated successfully',
    data: { firstName: 'John', lastName: 'Doe' },
  },
  changePin: {
    statusCode: 200,
    message: 'PIN changed successfully',
    data: { updated: true },
  },
  changePasscode: {
    statusCode: 200,
    message: 'Passcode changed successfully',
    data: { updated: true },
  },
  changePassword: {
    statusCode: 200,
    message: 'Password changed successfully',
    data: { updated: true },
  },
  deleteAccount: {
    statusCode: 200,
    message: 'User account deleted successfully',
    data: { userId: 'usr_12345' },
  },
  getDetails: {
    id: 'usr_12345',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '2348012345678',
  },
  getBeneficiaryByCategory: {
    statusCode: 200,
    message: 'Beneficiaries fetched successfully',
    data: [
      {
        id: 'bnf_001',
        name: 'Jane Doe',
        accountNumber: '0123456789',
      },
    ],
  },
  getStatisticsLineChart: {
    statusCode: 200,
    message: 'Line chart statistics fetched successfully',
    data: [{ month: 'Jan', debit: 50000, credit: 70000 }],
  },
  getStatisticsPieChart: {
    statusCode: 200,
    message: 'Pie chart statistics fetched successfully',
    data: [{ category: 'airtime', value: 40 }],
  },
  requestChangePassword: {
    statusCode: 200,
    message: 'Password change request OTP sent',
    data: { expiresIn: 300 },
  },
} as const;
