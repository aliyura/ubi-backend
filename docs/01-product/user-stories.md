# User Stories

## Scope

This document captures product stories represented by the current backend implementation in `src`.
All endpoints below are served under `/api`, so `v1` routes resolve as `/api/v1/...`.

## Personas

- Guest user (not authenticated)
- Registered user (authenticated)
- Business user (account type business)
- Admin/operator (using admin endpoints)
- Farmer (account type/role farmer)
- Agent (account type/role agent)
- External payment partner (webhook sender)
- Support-contacting visitor

## Roles and Account Types

The platform supports the following user roles and account types:

- `USER`
- `ADMIN`
- `FARMER`
- `AGENT`

Notes:

- `AGENT` helps farmers onboard, captures mapping, and verifies farmer details.
- `ADMIN` is responsible for operations and administrative actions.
- `FARMER` represents a farmer user profile/account.
- `USER` represents a standard end user profile/account.

## Onboarding and Account Setup

1. As a guest, I want to check if my username/email/phone is available before registering, so that I can fix duplicates early.
   Acceptance:

- `POST /api/v1/user/existance-check`
- Returns availability success or explicit duplicate error by field.

2. As a guest, I want to validate my email with OTP, so that my account can be marked email-verified.
   Acceptance:

- `POST /api/v1/user/validate-email` sends OTP to email.
- `POST /api/v1/user/verify-email` verifies OTP and marks state in cache.

3. As a guest, I want to validate my phone number with OTP, so that my account can be marked phone-verified.
   Acceptance:

- `POST /api/v1/user/validate-phonenumber` sends OTP via SMS.
- `POST /api/v1/user/verify-phonenumber` verifies OTP and marks state in cache.

4. As a guest, I want to register a personal account, so that I can use wallet features.
   Acceptance:

- `POST /api/v1/user/register`
- Duplicate checks on email, username, and phone constraints.
- Password is hashed and saved.
- Welcome email and verification email are sent.
- Referral code can be applied and referral bonus is credited to referrer wallet when valid.

5. As a guest, I want to register a business account, so that I can open business wallet flows.
   Acceptance:

- `POST /api/v1/user/register-business`
- Uses same register flow with business-related fields.

6. As a signed-in user, I want to create a passcode, so that I can log in quickly.
   Acceptance:

- `POST /api/v1/user/create-passcode`
- Stores hashed passcode and marks passcode as set.

## Authentication and Session Management

1. As a user, I want to log in with username/email/phone + password, so that I can access my account.
   Acceptance:

- `POST /api/v1/auth/login`
- Validates credentials.
- If 2FA enabled, returns success flow without token until OTP verification.
- If 2FA disabled, returns access token immediately.

2. As a user, I want to log in with passcode, so that returning access is faster.
   Acceptance:

- `POST /api/v1/auth/passcode-login`
- Requires passcode to be set and valid.
- Returns JWT access token.

3. As a user, I want to receive and verify 2FA OTP, so that login is secure.
   Acceptance:

- `POST /api/v1/auth/resend-2fa` sends OTP via email and SMS.
- `POST /api/v1/auth/verify-2fa` verifies OTP and returns JWT.

4. As a user, I want old sessions to become invalid after new login events, so that token theft risk is reduced.
   Acceptance:

- JWT payload includes token version.
- Middleware checks user `tokenVersion` against token `version`.

## Password, Passcode, and PIN Recovery

1. As a user, I want to request a password reset, so that I can recover access if I forget password.
   Acceptance:

- `POST /api/v1/user/forgot-password` sends OTP by email.
- `POST /api/v1/user/verify-forgot-password` verifies OTP.
- `POST /api/v1/user/reset-password` updates password.

2. As an authenticated user, I want to request a password-change OTP, so that I can do secure in-session password updates.
   Acceptance:

- `GET /api/v1/user/request-change-password` sends OTP email.
- `PUT /api/v1/user/change-password` can validate OTP when provided.

3. As an authenticated user, I want to change my passcode and wallet PIN, so that I can rotate sensitive secrets.
   Acceptance:

- `PUT /api/v1/user/change-passcode`
- `PUT /api/v1/user/change-pin`
- Old secret must match; new cannot equal old.

4. As an authenticated user, I want to reset my wallet PIN when forgotten, so that I can continue transacting.
   Acceptance:

- `POST /api/v1/user/forget-pin` sends OTP email.
- `POST /api/v1/user/reset-pin` verifies OTP and resets PIN.

## Profile and Identity

1. As an authenticated user, I want to update my profile and avatar, so that my account details stay current.
   Acceptance:

- `PUT /api/v1/user/edit-profile` with optional uploaded profile image.

2. As an authenticated user, I want to verify my NIN, so that I can progress KYC.
   Acceptance:

- `POST /api/v1/user/verify-nin`
- Name match check is enforced against user fullname.

3. As an authenticated user, I want tiered KYC upgrades, so that I can unlock higher limits.
   Acceptance:

- `POST /api/v1/user/kyc-tier2` verifies NIN and upgrades user to tier 2.
- `POST /api/v1/user/kyc-tier3` verifies address details and upgrades user to tier 3.

4. As an authenticated user, I want to perform selfie + BVN verification to open my wallet account.
   Acceptance:

- `POST /api/v1/wallet/bvn-verification`
- Creates virtual account and wallet when verification succeeds.

## Wallet Accounts and Transfers

1. As an authenticated user, I want to create my NGN wallet account, so that I can receive funds.
   Acceptance:

- `POST /api/v1/user/create-account`
- Prevents duplicate NGN wallet creation.

2. As a business user, I want to create a business wallet account, so that business transactions are supported.
   Acceptance:

- `POST /api/v1/user/create-business-account`
- Requires account type `BUSINESS`.

3. As an authenticated user, I want to create foreign accounts, so that I can transact in other currencies.
   Acceptance:

- `POST /api/v1/user/create-foreign-account`
- Prevents duplicate wallet per currency.

4. As an authenticated user, I want bank list and account verification tools, so that I can transfer safely.
   Acceptance:

- `GET /api/v1/wallet/get-banks/:currency`
- `GET /api/v1/wallet/get-matched-banks/:accountNumber`
- `POST /api/v1/wallet/verify-account`

5. As an authenticated user, I want transparent transfer fee calculation, so that I know total payable before transfer.
   Acceptance:

- `GET /api/v1/wallet/get-transfer-fee`

6. As an authenticated user, I want to transfer funds to internal/external accounts, so that I can pay other accounts.
   Acceptance:

- `POST /api/v1/wallet/initiate-transfer`
- Requires valid wallet PIN.
- Checks restrictions, balance, fee consistency, and transaction limit rules.
- Supports beneficiary save option.

7. As an authenticated user, I want QR-based transfer initiation, so that receiving money is easier.
   Acceptance:

- `GET /api/v1/wallet/generate-qrcode`
- `POST /api/v1/wallet/decode-qrcode`

8. As an authenticated user, I want to view transaction history, so that I can track spending.
   Acceptance:

- `GET /api/v1/wallet/transaction` supports pagination and filters.

## Bill Payments

1. As an authenticated user, I want to discover plans and variations for airtime/data/billers, so that I can choose products.
   Acceptance:

- Airtime/data plan and variation endpoints under `/api/v1/bill/*`.
- Cable/electricity/internet/transport/school plan + bill info endpoints.

2. As an authenticated user, I want to verify biller identifiers before paying, so that failed transactions are reduced.
   Acceptance:

- `POST /api/v1/bill/cable/verify-cable-number`
- `POST /api/v1/bill/electricity/verify-meter-number`

3. As an authenticated user, I want to pay airtime/data/international airtime/cable/electricity/internet/transport/school fee/gift card, so that I can settle recurring needs.
   Acceptance:

- Payment endpoints:
- `POST /api/v1/bill/data/pay`
- `POST /api/v1/bill/airtime/pay`
- `POST /api/v1/bill/airtime/international/pay`
- `POST /api/v1/bill/cable/pay`
- `POST /api/v1/bill/electricity/pay`
- `POST /api/v1/bill/internet/pay`
- `POST /api/v1/bill/transport/pay`
- `POST /api/v1/bill/school/pay`
- `POST /api/v1/bill/giftcard/pay`
- Requires wallet PIN and sufficient balance.
- Uses pending transaction + provider execution + success/failure update and refund handling.

4. As an authenticated user, I want gift card catalog/rate/redeem support, so that gift card flows are complete.
   Acceptance:

- `GET /api/v1/bill/giftcard/get-categories`
- `GET /api/v1/bill/giftcard/get-product`
- `GET /api/v1/bill/giftcard/get-fx-rate`
- `GET /api/v1/bill/giftcard/get-redeem-code`

5. As an authenticated user, I want saved beneficiaries for bill payments, so that repeated transactions are faster.
   Acceptance:

- `GET /api/v1/bill/beneficiary/list`
- Beneficiaries are auto-created when `addBeneficiary` is requested during pay.

## Insights and Personal Data

1. As an authenticated user, I want to fetch my account summary details, so that the app can render profile state.
   Acceptance:

- `GET /api/v1/user/me`

2. As an authenticated user, I want beneficiary retrieval by category, so that transfer and bill quick-pick lists are filtered.
   Acceptance:

- `GET /api/v1/user/get-beneficiaries`

3. As an authenticated user, I want line and pie chart transaction analytics, so that I can understand activity trends.
   Acceptance:

- `GET /api/v1/user/statistics-line-chart`
- `GET /api/v1/user/statistics-pie-chart?sort=all|today|week|month|year`

## Scam Reporting and Safety

1. As an authenticated user, I want to report scams with evidence, so that support can investigate.
   Acceptance:

- `POST /api/v1/user/report-scam` with screenshot upload.
- Creates incrementing ticket reference and sends acknowledgement email.

## Customer Contact and Support

1. As a visitor or user, I want to contact support, so that I can request help.
   Acceptance:

- `POST /api/v1/contact-us`
- Sends acknowledgement to requester and notification to support mailbox.

## Admin/Product Operations

1. As an admin/operator, I want to maintain bill plan catalogs, so that products remain current.
   Acceptance:

- Add plan endpoints under `/api/v1/admin/*/add-plan`.
- Delete plan endpoint `DELETE /api/v1/admin/delete-plan/:id/:bill_type`.

## Agent (Farmer Onboarding, Mapping, and Verification)

1. As an agent, I want to onboard a farmer by collecting their identity and contact details, so that the farmer can be registered correctly.
   Acceptance:

- Agent must be authenticated and have role/account type `AGENT`.
- Agent can submit farmer biodata (e.g., fullname, phone, email where applicable).
- System prevents duplicates on primary identifiers (e.g., phone/email/username when used).
- Farmer record is created/updated in a traceable way (who onboarded the farmer, when).

2. As an agent, I want to capture a farmer's farm mapping details, so that the platform can link the farmer to a location and land information.
   Acceptance:

- Agent must be able to submit mapping coordinates and farm descriptors.
- Mapping payload must validate required fields (coordinates format, required area/units when used).
- Mapping can be saved as draft and later completed.

3. As an agent, I want to verify a farmer's details (identity and mapping), so that only verified farmers proceed to program/benefit flows.
   Acceptance:

- Agent must be able to mark submitted farmer details as verified/rejected.
- Verification requires capturing a reason and supporting metadata where applicable.
- Verified status is visible on the farmer profile.

4. As an agent, I want to view my assigned farmers and onboarding progress, so that I can manage my workload.
   Acceptance:

- Agent can list farmers assigned to them.
- Each farmer entry shows progress state (onboarded, mapping captured, verified, rejected).

### Agent Feature / EMSPoint Endpoints (Proposed)

These endpoints are the recommended “emspoint” surface for the AGENT role. If you already have equivalents, align names/paths accordingly.

1. **Farmer onboarding**
   Acceptance:

- `POST /api/v1/agent/farmers` creates a farmer profile.
- `PUT /api/v1/agent/farmers/:farmerId` updates farmer details.

2. **Mapping capture**
   Acceptance:

- `POST /api/v1/agent/farmers/:farmerId/mapping` creates or replaces mapping details.
- `PUT /api/v1/agent/farmers/:farmerId/mapping` updates mapping details.

3. **Verification**
   Acceptance:

- `POST /api/v1/agent/farmers/:farmerId/verify` marks farmer as verified.
- `POST /api/v1/agent/farmers/:farmerId/reject` marks farmer as rejected with reason.

4. **Work queue / assignment**
   Acceptance:

- `GET /api/v1/agent/farmers` lists farmers assigned to the agent (filterable by status).
- `GET /api/v1/agent/farmers/:farmerId` fetches a single farmer with mapping + verification state.

## Partner and Backoffice Integrations

1. As an external partner, I want to notify payment outcomes asynchronously, so that wallet states reconcile.
   Acceptance:

- Webhook endpoints:
- `POST /api/v1/webhook/flutterwave`
- `POST /api/v1/webhook/VFD/payment`
- `POST /api/v1/webhook/safehaven`
- `POST /api/v1/webhook/bellmfb`

2. As operations, I want service liveness checks, so that uptime monitoring is simple.
   Acceptance:

- `GET /api/v1/health` returns `{ status: "ok" }`.
