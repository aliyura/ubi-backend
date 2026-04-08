# Error Handling (As Implemented)

This document describes how errors are created, propagated, transformed, and returned.

## 1) Exception Types Used
The codebase primarily throws Nest HTTP exceptions from services:
- `BadRequestException` for validation/business rule errors.
- `UnauthorizedException` for auth/authz failures.
- `NotFoundException` when resources are missing.
- `ConflictException` for concurrency/locking contention.
- `InternalServerErrorException` for provider/system failures.

## 2) Global Exception Filter
- `src/main.ts` registers `AllExceptionsFilter` globally.
- `src/helpers/errorHandler.helpers.ts` behavior:
- If exception is `HttpException`: returns `exception.getResponse()` with `exception.getStatus()`.
- Otherwise: attempts to return internal-server response with generic top-level message and raw `message/stack` payload.

## 3) Service-Level Error Mapping
Common pattern:
1. Call provider or database.
2. Catch low-level error.
3. Map to a domain HTTP exception.

Examples in codebase:
- Provider 400 mapped to user-friendly `BadRequestException`.
- Serialization/lock conflict mapped to retryable behavior or temporary-service error.
- Unknown payment/transfer failures mapped to generic `InternalServerErrorException`.

## 4) Concurrency and Retry Errors
For money flows (`wallet.service.ts`, `bill.service.ts`):
- Serializable transactions + row locks are used.
- Retry loops handle conflict/serialization codes (for example `P2034`, `P40001`) with exponential backoff + jitter.
- After retries are exhausted, services throw a generic temporary failure response.

## 5) Compensation Behavior (Refunds)
Provider-backed debit flows generally follow this pattern:
1. Debit wallet and create pending transaction.
2. Call provider.
3. On provider failure:
- mark transaction as `failed`.
- attempt wallet refund.
- throw domain/internal error.

This provides eventual consistency around failed external calls.

## 6) Middleware Error Behavior
- `ApiKeyMiddleware`: throws `UnauthorizedException` for missing/invalid key.
- `JwtMiddleware`: throws `UnauthorizedException` for missing/invalid/expired token and token-version mismatch.
- JWT middleware catches any token decode/verify error and rethrows unauthorized.

## 7) Response Error Shape (Current State)
- HTTP exceptions returned by the global filter mostly preserve each exception's own response body.
- Service success responses usually contain `{ message, statusCode, data? }`.
- Error response shape is not uniformly standardized across every path because exceptions are thrown directly from many layers.

## 8) Non-Fatal Side-Effect Failures
Certain side effects intentionally do not fail the main operation:
- SMS notification failures in auth/bill flows are often logged and ignored.
- Some email send errors are logged in safe wrappers.

## 9) Operational Crash Handling
`src/main.ts` defines process-level listeners:
- `uncaughtException`
- `unhandledRejection`

Both log the incident and keep the process running (current behavior).

## 10) Known Gaps and Risks
- `AllExceptionsFilter` has fragile handling for non-`HttpException` errors (it writes to `resObj` before initialization in that branch).
- Some paths use generic `throw new Error(...)` which rely on global filter fallback.
- There is no single enforced error envelope for every module/provider path.
- Logging strategy is inconsistent (`Logger` + `console.*` mix), making production triage noisier.
