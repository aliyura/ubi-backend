# Webhook Endpoint Implementations

## Domain
- Base path: `/api/v1/webhook`
- Controller: `src/webhook/webhook.controller.ts`
- Service: `src/webhook/webhook.service.ts`
- Security: API key and JWT are both excluded for webhook endpoints.

## Endpoints

### POST `/api/v1/webhook/flutterwave`
- Validates header `verif-hash` against `FLUTTERWAVE_SECRET_HASH`.
- Calls `resolveFlutterwaveWebhook(body)`.
- Returns HTTP 401 when signature mismatches, otherwise 200.

### POST `/api/v1/webhook/VFD/payment`
- Validates header `secret-hash` against `VFD_SECRET_HASH`.
- Calls `resolveVFDWebhook(body)`.
- Returns 401 on mismatch, 200 on success path.

### POST `/api/v1/webhook/safehaven`
- Calls `resolveSafeHavenWebhook(body)`.
- No signature validation in controller.

### POST `/api/v1/webhook/bellmfb`
- Calls `resolveBellBankWebhook(body)`.
- No signature validation in controller.

## Dispatch Logic
- Flutterwave:
- `charge.completed` => success/failure handler by `data.status`.
- `transfer.completed` => success/failure handler by `data.status`.
- VFD: forwards payload to VFD success handler.
- SafeHaven: handles `type=transfer` branch.
- Bell: handles `event=collection` branch.
