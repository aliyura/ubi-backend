# Engineering Conventions (As Implemented)

This document captures conventions already used in the codebase under `src/`.

## 1) Project Structure
- Framework: NestJS with module-per-domain organization.
- Domain modules: `auth`, `user`, `wallet`, `bill`, `admin`, `webhook`, `health`, plus shared modules (`prisma`, `email`, `api-providers`).
- Typical layout per domain:
- `*.controller.ts`: route handlers and request binding.
- `*.service.ts`: business logic.
- `dto/`: request schema/validation.
- Optional `serializer/`: response data shaping.

## 2) Routing and Prefixes
- Global API prefix: `/api` (configured in `src/main.ts`).
- Controller paths use versioned base paths like `v1/auth`, `v1/user`, `v1/wallet`, etc.
- Effective route format: `/api/v1/...`.

## 3) Request Validation Pattern
- Global request validation is enabled with `ValidationPipe` in `src/main.ts`.
- DTOs use `class-validator` + `class-transformer` decorators.
- Common DTO rules in use:
- Required fields: `@IsNotEmpty`.
- Type checks: `@IsString`, `@IsNumber`, `@IsEnum`, `@IsBoolean`.
- Format checks: `@Matches`, `@Length`, `@MaxLength`, `@Min`.
- Optional fields: `@IsOptional`.
- Custom validator exists: `Match` decorator in `src/decorators/match.decorator.ts`.

## 4) Controller and Service Responsibilities
- Controllers are thin wrappers that delegate to service methods.
- Services own validation beyond DTO shape (business rules, DB checks, provider interaction).
- Controllers return service response objects directly (no centralized response interceptor).

## 5) Response Shape Convention
- Most service methods return objects shaped like:
- `message`
- `statusCode`
- optional `data`
- Shared utility exists (`src/common/response.util.ts`) with `ResponseDto`, but many services construct response objects directly.

## 6) Authentication and Access Convention
- API key and JWT are enforced via middlewares in `AppModule.configure`.
- API key middleware (`ApiKeyMiddleware`) is applied broadly with route exclusions.
- JWT middleware (`JwtMiddleware`) is applied broadly with route exclusions.
- JWT payload includes `sub`, `email`, `version`; middleware compares `payload.version` with `user.tokenVersion`.

## 7) Money-Movement Convention
- Wallet-impacting operations use explicit DB transactions.
- High-contention flows commonly use:
- `isolationLevel: 'Serializable'`
- row locking via raw SQL: `FOR UPDATE` / `FOR UPDATE SKIP LOCKED`
- retry loops using `CONCURRENT_MAX_RETRIES` and `CONCURRENT_BASE_DELAY`.
- Pending -> terminal transaction status transitions are used for provider-backed flows.
- On failed provider execution, refund logic is attempted and transaction marked `failed`.

## 8) Beneficiary Convention
- Beneficiaries are optionally persisted during transfer/bill operations when client requests it (`saveBeneficiary` / `addBeneficiary`).
- Duplicate prevention is primarily done in service logic (`findFirst` then `create`), not by strict DB unique constraints.

## 9) Serialization Convention
- Sensitive fields are excluded through serializer entities using `class-transformer` `@Exclude`.
- Example: `UserEntity` excludes `password`, `passcode`, `walletPin`, and sensitive identity fields.

## 10) Constants and Rule Configuration
- Business limits/fees/retry knobs are centralized in `src/constants.ts`.
- Examples: transfer retries, referral bonus, bill fees, and tier limits.

## 11) Logging Convention
- Logging is mixed:
- `Logger` from NestJS in some services.
- `console.log` / `console.error` in many paths.
- Some non-critical failures (e.g., SMS send errors) are logged but do not fail the main request path.

## 12) Naming and Style Notes (Current)
- File naming mixes cases (e.g., `JwtMiddleware.ts`, `PasscodeLoginDto.ts`, `validatePhoneNumberDto.ts`).
- Message text has inconsistent spelling/wording in some responses.
- These are current-state conventions rather than enforced style guarantees.
