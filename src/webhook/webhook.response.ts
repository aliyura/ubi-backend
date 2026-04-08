export const webhookResponse = {
  flutterwaveWebhookHanlder: {
    statusCode: 200,
    message: 'Flutterwave webhook processed successfully',
  },
  vfdWebhookHanlder: {
    statusCode: 200,
    message: 'VFD webhook processed successfully',
  },
  safeHavenHandler: {
    statusCode: 200,
    message: 'SafeHaven webhook processed successfully',
  },
  bellBankHandler: {
    statusCode: 200,
    message: 'Bell MFB webhook processed successfully',
  },
  unauthorizedWebhook: {
    statusCode: 401,
    message: 'Unauthorized webhook request',
  },
} as const;
