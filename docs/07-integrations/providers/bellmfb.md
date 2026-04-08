# Bell MFB Integration

## Service
- `src/api-providers/providers/bellmfb.service.ts`

## Capabilities Used
- Consumer token generation.
- Individual client account creation.
- Transfer operations and account verification helpers.
- Bank name lookup.
- Funding webhook handling (deposit crediting).

## Authentication and Config Pattern
- Token generation endpoint using consumer key/secret headers.
- Token cached in `NodeCache` (10-minute TTL).
- Authenticated requests use `Authorization: Bearer <token>`.

## Data Update Pattern
- Funding webhook handler:
- resolves wallet by virtual account.
- updates wallet balance.
- records `paymentEvent` and `transaction` (deposit credit).
- triggers credit alert notifications.

## Operational Notes
- Used as active account creation path in `ApiProviderService.createVirtualAccount`.
- Webhook route wired as `/api/v1/webhook/bellmfb`.
