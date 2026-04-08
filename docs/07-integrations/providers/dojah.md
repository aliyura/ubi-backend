# Dojah Integration

## Service
- `src/api-providers/providers/dojah.service.ts`

## Capabilities Used
- SMS sending.
- BVN lookup and validation.
- Address/KYC data lookup.
- NIN verification.
- NIN + selfie verification.

## Authentication and Config Pattern
- Uses `Authorization` header with `DOJAH_SECRET_KEY`.
- Uses `Appid` header with `DOJAH_APPID`.
- Base URL from `DOJAH_BASE_URL`.

## Request/Response Pattern
- Mostly GET/POST with query params for KYC endpoints.
- Non-200 responses mapped to `InternalServerErrorException`.

## Usage Pattern
- Called via `ApiProviderService` for identity and compliance checks.
- Can also be used as one SMS backend via `HelperService`.
