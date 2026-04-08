# Smile ID Integration

## Service
- `src/api-providers/providers/smile-id.service.ts`

## Capabilities Used
- Basic KYC verification request construction and submission.

## Authentication and Signature Pattern
- HMAC signature generated from partner/timestamp (`sha256`).
- Uses `SMILE_ID_API_KEY` and `SMILE_ID_PARTNER_ID`.
- Environment chooses production vs test verify endpoint.

## Request/Response Pattern
- Builds rich payload from local user profile and supplied identity data.
- For missing local user, throws standard `Error`.
- Provider errors are logged and rethrown.

## Usage Pattern
- Exposed via `ApiProviderService.verifyBasicKyc` helper path.
