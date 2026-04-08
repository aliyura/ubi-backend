# Termii Integration

## Service
- `src/api-providers/providers/termii.service.ts`

## Capabilities Used
- SMS delivery through Termii send endpoint.

## Authentication and Config Pattern
- API key embedded in request payload (`TERMII_API_KEY`).
- Base URL from `TERMII_BASE_URL`.

## Request/Response Pattern
- POST to `/api/sms/send`.
- Non-200 responses mapped to `InternalServerErrorException`.

## Usage Pattern
- Invoked through `HelperService.sendSms` when selected provider is `termii`.
