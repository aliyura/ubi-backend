# SafeHaven Integration

## Service
- `src/api-providers/providers/safe-haven.service.ts`

## Capabilities Used
- OAuth token retrieval.
- Identity verification initiation/validation.
- Subaccount creation.
- Bank list retrieval.
- Name enquiry.
- Fund transfer.
- Transfer verification.
- Webhook transfer event handling.

## Authentication and Config Pattern
- OAuth2 client-assertion flow.
- Uses `SAFEHAVEN_BASE_URL`, `SAFEHAVEN_CLIENT_ID`, `SAFEHAVEN_CLIENT_ASSERTION`.
- Some transfer payload fields use configured debit account env values.

## Request/Response Pattern
- Token fetched and attached to request headers (`Authorization` + IBS client fields).
- Status-code based exception mapping (`201` for several create/verification operations).
- Logs and rethrows in several catch blocks.

## Current Usage Pattern
- Exposed through `ApiProviderService` for selected account/transfer operations.
- Webhook handler exists and is routed by `WebhookService.resolveSafeHavenWebhook`.
