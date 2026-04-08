# Sendar Integration

## Service
- `src/api-providers/providers/sendar.service.ts`

## Capabilities Used
- SMS send API.
- SMS status retrieval by UID.

## Authentication and Config Pattern
- Uses `Api-key` header with `SENDAR_API_KEY`.
- Base URL fixed to `https://sendar.io/api`.

## Request/Response Pattern
- Send payload includes transactional wallet type and sender id.
- Non-200 responses converted to `InternalServerErrorException`.
- Error message extraction uses provider response message where available.

## Usage Pattern
- Default SMS provider in `ApiProviderService.sendSms` when env override is not set.
