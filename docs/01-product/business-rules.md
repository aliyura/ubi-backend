# Business Rules

## Scope and Interpretation
This file documents implemented product rules in the current backend behavior.
Where implementation and ideal product policy differ, this document reflects current behavior first.

## Platform-Wide Access Rules
1. All public API routes are prefixed by `/api` and mostly grouped under `/v1`.
2. `ApiKeyMiddleware` enforces `x-api-key` for routes except whitelisted webhook paths.
3. `JwtMiddleware` enforces Bearer JWT on protected routes and attaches hydrated `req.user`.
4. Some routes are explicitly excluded from JWT middleware, including auth, registration, OTP validations, health, contact-us, and webhook endpoints.
5. JWT validity requires both signature correctness and token version match with persisted `user.tokenVersion`.

## Authentication and OTP Rules
1. Login accepts `username` lookup across email, phone number, and username fields.
2. Password login fails on any invalid credential combination with a generic invalid message.
3. If `enabledTwoFa` is true, login requires OTP verification before access token is returned.
4. Passcode login requires `isPasscodeSet = true` and a valid passcode hash match.
5. Auth OTP TTL is 10 minutes (`OTP_EXPIRES_IN = 600`) in auth service cache.
6. User-service OTP/verification states also use in-memory cache and are instance-local.
7. OTP bypass code `654321` is currently accepted in 2FA verification logic.
8. Password/passcode/PIN updates disallow setting new value equal to old value.

## Registration and Identity Rules
1. Registration enforces uniqueness for email, username, and phone number.
2. Password is hashed with bcrypt salt rounds (`12`) before persistence.
3. Registration derives business flags from `accountType`.
4. Email and phone verification flags during registration are determined by cached verification markers.
5. Referral flow rules:
- Referral code must map to an existing user.
- Referrer must have wallet in the registering user currency.
- Referrer wallet balance is credited by `REFERRAL_BONUS_PRICE`.
6. Referral code generation is 6 uppercase letters and must be unique.

## Wallet Setup and KYC Rules
1. Wallet PIN must be set and valid before transfers and bill payments.
2. `bvn-verification` flow rules:
- User cannot already have a wallet.
- BVN face verification status codes outside allowed set trigger failure.
- Face match must be true and score > 0.
- Successful flow updates user to tier one and creates NGN wallet.
3. `create-account` rules:
- Acquires row lock to prevent duplicate NGN wallet creation.
- Creates virtual account and marks user tier one and BVN verified.
4. `create-business-account` rules:
- User must be `BUSINESS` account type.
- Prevents duplicate NGN wallet.
5. `create-foreign-account` rules:
- Prevents duplicate wallet by user and target currency.
- Current behavior triggers provider creation but does not persist local wallet row in this method.
6. Tier upgrade rules:
- Tier 2 requires NIN verification with name match.
- Tier 3 requires address verification and exact normalized field match for state, address, and city/LGA.
- Tier upgrades set `dailyCummulativeTransactionLimit` and `cummulativeBalanceLimit` per constants.

## Transaction Limit and Fee Rules
1. Transfer limits are enforced against user `dailyCummulativeTransactionLimit` based on accumulated successful debit transfer amount for current day.
2. Transfer fee rules:
- First 10 transfer transactions are fee-free.
- Internal transfers to an existing platform wallet are fee-free.
- External transfer fee schedule (NGN):
- `< 500 => 0`
- `500 - 20000 => 20`
- `20001 - 60000 => 30`
- `60001 - 100000 => 100`
- `100001 - 500000 => 150`
- `> 500000 => 200`
3. If client submits `fee`, it must match backend-calculated fee or transfer is rejected.
4. Bill fee constants exist by bill category and are added to display/payable amount where applicable.

## Transfer Processing Rules
1. Transfer is blocked when user status is `restricted`.
2. Source wallet must exist for transfer currency.
3. Source and destination accounts must differ.
4. Source balance must cover `amount + fee`.
5. Internal transfer rules:
- Uses serializable transaction with row locks.
- Debits sender and credits recipient atomically.
- Writes debit and credit transaction records.
- Optional beneficiary save if requested and not already present.
6. External transfer rules (provider-backed):
- Creates pending transaction after debit under lock.
- Calls provider.
- On success, marks transaction success and keeps debit.
- On failure, marks transaction failed and refunds wallet.
- Retries on serialization/conflict errors with exponential backoff and jitter.
7. Beneficiary save rules for transfer:
- Saved when `saveBeneficiary` is true and no existing record for account number.

## Bill Payment Rules
1. Bill payment requires valid wallet PIN.
2. Payment flow debits wallet and creates pending transaction before provider call.
3. On provider success, transaction is updated to success with detailed `billDetails` payload.
4. On provider failure, transaction is marked failed and wallet amount is refunded.
5. Concurrency control for bill payment uses serializable transaction and row locks.
6. Bill payment retries on serialization conflicts with exponential backoff.
7. Beneficiary creation for bill payment:
- Happens only when `addBeneficiary` is true.
- Match keys depend on bill type:
- Airtime/data/international airtime: phone + bill type.
- Cable/electricity: biller number + bill type.
8. Network detection rules for local phone numbers are based on configured prefix maps (`MTN_PREFIXES`, `GLO_PREFIXES`, `AIRTEL_PREFIXES`, `ETISALAT_PREFIXES`).
9. Invalid/unsupported network strings in some plan APIs are rejected.

## Biller and Gift Card Rules
1. Cable/electricity biller verification maps provider 400 errors to friendly messages:
- Electricity: `Invalid meter number`.
- Cable: `Invalid smartcard number`.
2. Gift card product pricing maps provider denominations to payable amounts including sender fee plus `GIFT_CARD_FEE`.
3. Gift card redeem flow returns provider transaction/redeem data without additional transformation beyond response wrapping.

## Statistics and Reporting Rules
1. Line chart:
- Last 7 days cumulative credit and debit sums.
- Uses successful transactions only.
- Amount source resolution order is bill, transfer, then deposit details.
2. Pie chart:
- Supports `all`, `today`, `week`, `month`, `year` filters.
- Aggregates successful transaction totals by category: deposit, transfer, bill payment.
3. If user has no wallet, chart endpoints return success with zeroed datasets.

## Webhook Rules
1. Flutterwave webhook requires `verif-hash` header equal to configured `FLUTTERWAVE_SECRET_HASH`.
2. VFD webhook requires `secret-hash` header equal to configured `VFD_SECRET_HASH`.
3. SafeHaven and Bell webhook handlers currently process payloads without header signature checks in controller layer.
4. Webhook event routing:
- Flutterwave `charge.completed` and `transfer.completed` map to success/failure handlers by status.
- SafeHaven currently handles `transfer` type.
- Bell currently handles `collection` event.

## Admin Catalog Rules
1. Add-plan endpoints reject duplicates by key fields for each catalog.
2. Add-plan endpoints resolve `countryISOCode` from currency.
3. Delete-plan currently has explicit logic for `data` and `airtime` cases.
4. Admin role guard is present in codebase but currently commented out on controller.

## Data Integrity and Concurrency Rules
1. High-contention monetary operations use DB transactions with row-level locks (`FOR UPDATE` / `FOR UPDATE SKIP LOCKED`).
2. Isolation level is often `Serializable` for wallet-impacting writes.
3. Transaction records are the source-of-truth audit trail for debit/credit state transitions.
4. Account/bank verification results are cached in `BankAccountCache` and `BankNameCache` to reduce repeated provider calls.

## Notification Rules
1. Email notifications are sent for onboarding, verification, password/PIN flows, transaction alerts, scam tickets, and contact-us interactions.
2. SMS alerts are best-effort in many flows and should not fail core transaction processing when SMS send fails.
3. Notification templates are Handlebars files under `src/templates`.

## Operational Rules
1. Required environment variables are validated on startup with Joi; missing values block application boot.
2. Global exception filter wraps errors into JSON HTTP responses.
3. CORS allows a fixed set of configured origins.
4. Health endpoint is public and intended for liveness checks.

## Known Behavior Notes
1. OTP and verification caches are in-memory and not shared across multiple instances.
2. Some response/error text contains minor typos; messages are documented as behavior, not corrected copy.
3. There is duplicated transfer orchestration for multiple providers, but entrypoint currently routes internal transfers to internal flow and external transfers to SafeHaven flow.
