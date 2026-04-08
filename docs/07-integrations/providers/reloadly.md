# Reloadly Integration

## Service
- `src/api-providers/providers/reloadly.service.ts`

## Capabilities Used
- OAuth token retrieval by audience.
- Operator fetch and auto-detect.
- Airtime FX rate.
- Airtime/data topup.
- Gift card FX rate.
- Gift card order and redemption.
- Gift card category/product catalog retrieval.

## Authentication and Config Pattern
- OAuth client credentials with `RELOADLY_CLIENT_ID` and `RELOADLY_SECRET_KEY`.
- Distinct audiences/base URLs for airtime and gift card APIs.

## Request/Response Pattern
- Axios requests with per-audience bearer token headers.
- Non-success provider responses mapped to `InternalServerErrorException`.
- 404 on giftcard redemption mapped to `NotFoundException`.

## Usage Pattern
- Routed through `ApiProviderService` for bill/giftcard operations and catalog endpoints.
