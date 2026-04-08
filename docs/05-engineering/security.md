# Security (As Implemented)

This document summarizes implemented security controls and observable gaps from the codebase.

## 1) Access Controls
### API Key Layer
- Implemented in `ApiKeyMiddleware`.
- Requires `x-api-key` header to match configured `API_KEY`.
- Applied globally in `AppModule` with route exclusions for health and webhook endpoints.

### JWT Layer
- Implemented in `JwtMiddleware` (and also `JwtAuthGuard` exists).
- Requires `Authorization: Bearer <token>`.
- Verifies JWT signature with `JWT_SECRET`.
- Loads user from DB and enforces token invalidation through `tokenVersion` match.

## 2) Authentication Controls
- Password, passcode, and wallet PIN are validated with bcrypt compare and stored hashed.
- Login can require 2FA based on `enabledTwoFa`.
- Auth OTP TTL is 10 minutes (NodeCache-backed).
- New JWT issuance increments `tokenVersion` to invalidate previous tokens.

## 3) Input Validation
- Global `ValidationPipe` is enabled.
- DTO-level constraints enforce format/type/length on user input.
- Custom validation helper (`Match`) supports equality validation patterns.

## 4) Webhook Security
- Flutterwave webhook verifies `verif-hash` against `FLUTTERWAVE_SECRET_HASH`.
- VFD webhook verifies `secret-hash` against `VFD_SECRET_HASH`.
- SafeHaven and BellMFB webhook handlers currently do not validate webhook signatures in controller logic.

## 5) Sensitive Data Handling
- Serializer entities exclude sensitive fields from outbound user/wallet payloads.
- Secrets are read from environment variables through `ConfigService`.
- Startup environment validation is enforced using Joi in `ConfigModule.forRoot`.

## 6) CORS Policy
- CORS is explicitly enabled with an allowlist of origins in `main.ts`.
- `credentials: true` is enabled.

## 7) Transaction Safety as Security Control
- Critical wallet and bill operations use serializable DB transactions + row locking.
- Retry-and-compensation logic reduces race-condition and double-spend risk.

## 8) Current Security Gaps to Track
- 2FA bypass code is accepted in auth verification (`otpCode == "654321"`).
- OTP storage uses in-memory `NodeCache`, which is instance-local and not shared across multiple app instances.
- Admin role annotation is commented out in `admin.controller.ts`; admin endpoints rely on API key + JWT middleware but not explicit role decorator enforcement at controller level.
- Some webhook endpoints are unauthenticated by signature in controller (`safehaven`, `bellmfb`).
- `ApiKeyMiddleware` logs request base URL and has an internal whitelist that may not align with route matching semantics.

## 9) Defense-in-Depth Recommendations (Aligned to Existing Design)
- Remove 2FA bypass code from production paths.
- Replace OTP storage with centralized store (e.g., Redis) for multi-instance correctness.
- Enforce role decorators on admin routes and keep guard active.
- Add signature verification for all webhook providers.
- Standardize structured logging and reduce sensitive output in logs.
