# VFD Bank Integration

## Service
- `src/api-providers/providers/VFDBank.service.ts`

## Capabilities Used
- Access token generation and in-memory token cache.
- Virtual account creation (no-consent flow).
- Transfer execution (intra/inter-bank).
- Merchant/sender/recipient detail lookups.
- Tier upgrade operations.
- Transfer verification and webhook settlement handling.

## Authentication and Config Pattern
- Environment-based base URL switch (`VFD_MODE`, test/live URLs).
- Access token fetched with consumer key/secret then used as `AccessToken` header.

## Request/Response Pattern
- Provider-specific status checks with `InternalServerErrorException` mapping.
- Transfer payload includes generated signature and reference.

## Reliability Pattern
- Access token reused via in-memory cache until expiry.
- Webhook and verification flows update transaction status paths.
