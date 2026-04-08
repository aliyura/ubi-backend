# QoreID Integration

## Service
- `src/api-providers/providers/qoreid.service.ts`

## Capabilities Used
- Access token retrieval.
- BVN face verification.
- NIN face verification.

## Authentication and Config Pattern
- Token endpoint called with `QOREID_CLIENT_ID` and `QOREID_SECRET`.
- Subsequent calls use bearer token.

## Request/Response Pattern
- BVN face verification returns provider result object; on failure returns structured fallback payload with `statusCode` and `message`.
- NIN face verification throws `InternalServerErrorException` on failure.

## Usage Pattern
- `ApiProviderService.verifyBvnWithFace` delegates to QoreID.
- Supports wallet setup/identity hardening flows.
