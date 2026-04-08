# Flutterwave Integration

## Service
- `src/api-providers/providers/flutterwave.service.ts`

## Capabilities Used
- Virtual account operations (create, deactivate).
- Transfer initiation.
- Biller info retrieval.
- Biller number validation.
- Bank list retrieval.
- Account name enquiry (bank + account resolve).
- Bill purchase endpoints.
- Transaction verification and webhook-related success/failure handlers.

## Authentication and Config Pattern
- Bearer auth using `FLUTTERWAVE_SECRET_KEY`.
- Base URL from `FLUTTERWAVE_BASE_URL`.

## Request/Response Pattern
- Axios HTTP calls with provider-specific headers.
- Non-200 responses mapped to `InternalServerErrorException` or `BadRequestException`.
- Some responses normalized into app payload shape (e.g., name enquiry with `sessionId` fallback).

## Data and Side-Effect Pattern
- In success/failure webhook handlers, updates wallet/transaction/payment-event records.
- Emits email/SMS notifications best-effort in downstream service paths.
