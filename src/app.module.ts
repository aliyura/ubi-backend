import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { JwtMiddleware } from './middlewares/JwtMiddleware';
import { ApiKeyMiddleware } from './middlewares/ApiKeyMiddleware';
import { UserModule } from './user/user.module';
import { ApiProvidersModule } from './api-providers/api-providers.module';
import { WebhookModule } from './webhook/webhook.module';
import { WalletModule } from './wallet/wallet.module';
import { BillModule } from './bill/bill.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { LoanResourceModule } from './loan-resource/loan-resource.module';
import { FarmModule } from './farm/farm.module';
import { LoanCartModule } from './loan-cart/loan-cart.module';
import { LoanEligibilityModule } from './loan-eligibility/loan-eligibility.module';
import { LoanApplicationModule } from './loan-application/loan-application.module';
import { AdminLoanModule } from './admin/loan/admin-loan.module';
import { AgentModule } from './agent/agent.module';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { RepaymentModule } from './repayment/repayment.module';
import { MarketplaceOrderModule } from './marketplace-order/marketplace-order.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
        SMTP_FROM: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        API_KEY: Joi.string().required(),
        AWS_S3_BUCKET: Joi.string().required(),
        AWS_S3_ACCESS_KEY: Joi.string().required(),
        AWS_S3_KEY_SECRET: Joi.string().required(),
        AWS_S3_BASEURL: Joi.string().required(),
        AWS_S3_ENDPOINT: Joi.string().required(),
        FLUTTERWAVE_PUBLIC_KEY: Joi.string().required(),
        FLUTTERWAVE_SECRET_KEY: Joi.string().required(),
        FLUTTERWAVE_BASE_URL: Joi.string().required(),
        FLUTTERWAVE_SECRET_HASH: Joi.string().required(),
        DOJAH_BASE_URL: Joi.string().required(),
        DOJAH_APPID: Joi.string().required(),
        DOJAH_SECRET_KEY: Joi.string().required(),
        DOJAH_PUBLIC_KEY: Joi.string().required(),
        RELOADLY_CLIENT_ID: Joi.string().required(),
        RELOADLY_SECRET_KEY: Joi.string().required(),
        SAFEHAVEN_BASE_URL: Joi.string().required(),
        SAFEHAVEN_CLIENT_ASSERTION: Joi.string().required(),
        SAFEHAVEN_CLIENT_ID: Joi.string().required(),
        SAFEHAVE_DEBIT_ACCOUNT_NUMBER: Joi.string().required(),
        GRAPH_API_KEY: Joi.string().required(),
        GRAPH_BASE_URL: Joi.string().required(),
        TERMII_API_KEY: Joi.string().required(),
        TERMII_BASE_URL: Joi.string().required(),
        OTP_BYPASS_CODE: Joi.string().optional(),
      }),
    }),
    HealthModule,
    PrismaModule,
    AuthModule,
    EmailModule,
    UserModule,
    ApiProvidersModule,
    WebhookModule,
    WalletModule,
    BillModule,
    AdminModule,
    LoanResourceModule,
    FarmModule,
    LoanCartModule,
    LoanEligibilityModule,
    LoanApplicationModule,
    AdminLoanModule,
    AgentModule,
    FulfillmentModule,
    RepaymentModule,
    MarketplaceOrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .exclude(
        { path: 'v1/health', method: RequestMethod.GET },
        {
          path: 'v1/webhook/flutterwave',
          method: RequestMethod.POST,
        },
        { path: 'v1/webhook/VFD/payment', method: RequestMethod.POST },
        { path: 'v1/webhook/safehaven', method: RequestMethod.POST },
        { path: 'v1/webhook/bellmfb', method: RequestMethod.POST },
      )
      .forRoutes('*');

    consumer
      .apply(JwtMiddleware)
      .exclude(
        { path: 'v1/health', method: RequestMethod.GET },
        { path: 'v1/user/existance-check', method: RequestMethod.POST },
        { path: 'v1/auth/login', method: RequestMethod.POST },
        { path: 'v1/auth/passcode-login', method: RequestMethod.POST },
        { path: 'v1/auth/resend-2fa', method: RequestMethod.POST },
        { path: 'v1/auth/verify-2fa', method: RequestMethod.POST },
        { path: 'v1/user/register', method: RequestMethod.POST },
        { path: 'v1/user/register-farmer', method: RequestMethod.POST },
        { path: 'v1/user/validate-email', method: RequestMethod.POST },
        { path: 'v1/user/verify-email', method: RequestMethod.POST },
        { path: 'v1/user/validate-phonenumber', method: RequestMethod.POST },
        { path: 'v1/user/verify-phonenumber', method: RequestMethod.POST },
        { path: 'v1/user/forgot-password', method: RequestMethod.POST },
        { path: 'v1/user/verify-forgot-password', method: RequestMethod.POST },
        { path: 'v1/user/reset-password', method: RequestMethod.POST },
        { path: 'v1/webhook/flutterwave', method: RequestMethod.POST },
        { path: 'v1/webhook/VFD/payment', method: RequestMethod.POST },
        { path: 'v1/webhook/safehaven', method: RequestMethod.POST },
        { path: 'v1/webhook/bellmfb', method: RequestMethod.POST },
        { path: 'v1/contact-us', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
