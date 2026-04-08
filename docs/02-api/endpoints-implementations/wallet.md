# Wallet Endpoint Implementations

## Domain
- Base path: `/api/v1/wallet`
- Controller: `src/wallet/wallet.controller.ts`
- Service: `src/wallet/wallet.service.ts`
- Security: API key + JWT required for all endpoints.

## Endpoints

### GET `/api/v1/wallet/get-banks/:currency`
- Calls `getAllBanks(currency)`.
- Delegates to provider bank list retrieval and wraps response.

### GET `/api/v1/wallet/get-matched-banks/:accountNumber`
- Calls `getAllMatchedBanks(accountNumber)`.
- Flow:
- Tries `BankAccountCache` first.
- Verifies account with cached bank code when possible.
- Falls back to `BankNameCache` / provider bank list.
- Performs sequential/concurrent bank-code matching heuristics.
- Upserts account verification result into cache tables.

### GET `/api/v1/wallet/get-transfer-fee`
- Calls `fetchTransferFee(currency, amount, accountNumber)`.
- Fee is 0 for internal destination wallets; otherwise computed by tiered fee schedule.

### GET `/api/v1/wallet/transaction`
- Calls `getTransactions(page, limit, type, category, status, search, user)`.
- Supports paginated and non-paginated query modes.
- Applies filters against transaction metadata.

### POST `/api/v1/wallet/verify-account`
- DTO: `VerifyAccountDto`
- Calls `verifyAccount(body)`.
- Uses provider name enquiry and persists/upserts account cache.

### POST `/api/v1/wallet/initiate-transfer`
- DTO: `TransferDto`
- Calls `transferFund(body, user)`.
- Core flow:
- Validates wallet PIN and account restriction status.
- Resolves source and destination wallets.
- Enforces balance and daily transfer limits.
- Validates submitted fee when present.
- Internal transfers use atomic debit+credit transaction logic.
- External transfers create pending debit, call provider, finalize success/failure with refund on failure.
- Uses retry with exponential backoff for serialization conflicts.

### GET `/api/v1/wallet/generate-qrcode`
- Calls `generateQrCode(user, amount, CURRENCY.NGN)`.
- Verifies destination account, then serializes transfer payload into QR image data URL.

### POST `/api/v1/wallet/decode-qrcode`
- DTO: `DecodeQrCodeDto`
- Calls `decodeQrCode(qrCode)`.
- Decodes QR image using `jimp` + `jsqr`, parses embedded JSON payload.

### POST `/api/v1/wallet/bvn-verification`
- DTO: `BvnVerificationDto`
- Calls `bvnVerification(body, user)`.
- Flow:
- Checks wallet does not already exist.
- Verifies BVN face match via provider.
- Creates virtual account via provider.
- Updates user KYC/tier fields and creates wallet record.

## Implementation Notes
- Monetary operations rely on explicit row locks (`FOR UPDATE` / `FOR UPDATE SKIP LOCKED`) and serializable transactions.
- Transaction state transitions are persisted in `transaction` table for auditing.
