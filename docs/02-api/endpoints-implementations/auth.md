# Auth Endpoint Implementations

## Domain
- Base path: `/api/v1/auth`
- Controller: `src/auth/auth.controller.ts`
- Service: `src/auth/auth.service.ts`
- Security: API key required, JWT not required.

## Endpoints

### POST `/api/v1/auth/login`
- DTO: `LoginDto`
- Calls: `AuthService.login`
- Flow:
- Resolves user by username/email/phone.
- Verifies password with bcrypt.
- Generates OTP token in cache.
- If `enabledTwoFa` is true, sends OTP and returns without access token.
- If `enabledTwoFa` is false, issues JWT (`48h`) and sends login notification.
- JWT contains `sub`, `email`, and `version`.

### POST `/api/v1/auth/passcode-login`
- DTO: `PasscodeLoginDto`
- Calls: `AuthService.passcodeLogin`
- Flow:
- Validates user exists and has passcode set.
- Verifies passcode hash.
- Issues JWT.
- Optionally sends login notification if device metadata fields are present.

### POST `/api/v1/auth/resend-2fa`
- DTO: `ValidateTwoFaDto`
- Calls: `AuthService.sendTwoFa`
- Flow:
- Resolves user.
- Creates OTP in cache.
- Sends OTP by email and attempts SMS dispatch via `ApiProviderService.sendSms`.

### POST `/api/v1/auth/verify-2fa`
- DTO: `VerifyTwoFaDto`
- Calls: `AuthService.verifyTwoFaCode`
- Flow:
- Resolves user.
- Verifies cached OTP.
- Also accepts bypass code `654321` in current implementation.
- Deletes OTP and issues JWT on success.

## Implementation Notes
- Token invalidation model uses `tokenVersion` increment before signing each token.
- OTP cache is in-memory (`NodeCache`) and instance-local.
