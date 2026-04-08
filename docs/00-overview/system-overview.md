# System Overview

## What This Service Is
`ubi-backend` is a NestJS + Prisma backend for a fintech wallet platform.
It supports:
- User onboarding and authentication (password, passcode, 2FA)
- Wallet account creation and transfers
- Bill payments (airtime, data, cable, electricity, internet, transport, school fees, gift cards)
- KYC and identity verification flows
- Provider webhook processing
- Admin management of bill plans

## Runtime and Stack
- Framework: NestJS (TypeScript)
- Database: PostgreSQL via Prisma ORM
- Auth: JWT + API key middleware
- Cache: in-memory NodeCache (OTP/verification state)
- Email: `@nestjs-modules/mailer` + Handlebars templates
- File upload: Multer + Cloudinary integration
- External providers: Flutterwave, SafeHaven, VFD, Bell MFB, Dojah, QoreID, Reloadly, Graph, Termii, AWS SMS

## API Shape
- Global prefix: `/api`
- Versioned controllers: mostly `/v1/*`
- Effective common base path: `/api/v1/*`

Major route groups:
- `/api/v1/auth/*`
- `/api/v1/user/*`
- `/api/v1/wallet/*`
- `/api/v1/bill/*`
- `/api/v1/admin/*`
- `/api/v1/webhook/*`
- `/api/v1/health`
- `/api/v1/contact-us`

## Core Domains
- **User**: identity, KYC status, auth flags, role, limits
- **Wallet**: one wallet per user/currency context, account details and balance
- **Transaction**: debits/credits with status/category metadata
- **Beneficiary**: saved transfer and bill recipients
- **Plan catalogs**: airtime/data/cable/electricity/internet/transport/school fee plans
- **Webhook events**: payment and transfer events from partner systems

## Request Lifecycle (Typical)
1. Client calls an endpoint with `x-api-key`.
2. `ApiKeyMiddleware` validates API key (except whitelisted webhook path).
3. `JwtMiddleware` validates bearer token on protected routes and attaches `req.user`.
4. Controller validates DTO input and calls service.
5. Service performs business logic + Prisma DB operations.
6. Service calls `ApiProviderService` for third-party actions when needed.
7. Response is returned; errors pass through `AllExceptionsFilter`.

## Security and Validation Controls
- Env var validation at boot via Joi in `AppModule`
- Global `ValidationPipe` for DTO validation
- JWT token-version check to invalidate stale tokens
- Webhook signature checks for Flutterwave and VFD callbacks

## Notable Operational Characteristics
- OTP and some verification state are stored in process memory (`NodeCache`) and are not shared across instances.
- External provider calls are centralised behind `ApiProviderService`.
- Prisma migrations are present and include bank-account cache related updates.
