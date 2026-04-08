export const authResponse = {
  login: {
    statusCode: 201,
    message: 'Login successful',
    data: {
      requires2fa: true,
      userId: 'usr_12345',
      token: 'jwt_token_here',
    },
  },
  passcodeLogin: {
    statusCode: 201,
    message: 'Passcode login successful',
    data: {
      userId: 'usr_12345',
      token: 'jwt_token_here',
    },
  },
  resend2fa: {
    statusCode: 201,
    message: '2FA code sent successfully',
    data: {
      channel: 'email',
      expiresIn: 300,
    },
  },
  verify2fa: {
    statusCode: 201,
    message: '2FA verification successful',
    data: {
      token: 'jwt_token_here',
      refreshToken: 'refresh_token_here',
    },
  },
} as const;
