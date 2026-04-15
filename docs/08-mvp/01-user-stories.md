# MVP User Stories

## 1) Authentication & Multi-Level Onboarding

### 1.1 Level 1 Onboarding (All users)
As a guest, I want to onboard with email/phone OTP and set my PIN, so that I can access a provisioned wallet.

Acceptance:
- `POST /api/v1/user/validate-email` sends OTP (email).
- `POST /api/v1/user/verify-email` verifies OTP.
- `POST /api/v1/user/validate-phonenumber` sends OTP (SMS).
- `POST /api/v1/user/verify-phonenumber` verifies OTP.
- `POST /api/v1/user/register` creates user.
- `POST /api/v1/user/create-passcode` (or equivalent PIN/passcode endpoint) sets a secret used for sensitive actions.
- Wallet provisioning is triggered automatically (Keystone) on successful onboarding.
- Failures in wallet provisioning are handled as a first-class state (retryable / supportable).

### 1.2 Level 2 Profile Hardening (KYC)
As an authenticated user, I want to add BVN/NIN and photo/passport, so that I can increase limits and access gated features.

Acceptance:
- `POST /api/v1/user/verify-nin` verifies NIN.
- `POST /api/v1/wallet/bvn-verification` verifies BVN and provisions virtual account.
- `POST /api/v1/user/kyc-tier2` and `POST /api/v1/user/kyc-tier3` update tier.

### 1.3 Level 3 Farmer Switch
As a general user, I want to switch to Farmer mode by providing farm type/location and paying the registration fee, so that I can access farmer tools.

Acceptance:
- Farmer mode remains locked until registration fee is verified.
- Registration fee can be paid via Paystack card payment or via direct bank transfer (manual copy of account details).

### 1.4 Level 4 Farmer Enrichment
As a farmer, I want to enrich my profile with farm size, crops, season dates, expected yield, and mapping, so that eligibility scoring and advisory is accurate.

Acceptance:
- Mapping can be self-submitted or agent-assisted.
- Mapping supports multiple plots.

## 2) Wallet (Keystone or Zenith)

### 2.1 Balance & Ledger
As a user, I want to see my balance and transaction history, so that I can manage my money.

Acceptance:
- `GET /api/v1/user/me` includes wallet and status summary.
- `GET /api/v1/wallet/transaction` returns paginated ledger.

### 2.2 Transfers (P2P + NIP)
As a user, I want to send money to other users and bank accounts, so that I can make payments.

Acceptance:
- `POST /api/v1/wallet/initiate-transfer` supports internal and NIP transfers.
- Transfer requests use idempotency keys.
- Typical transaction time ≤ 3s.

## 3) Bills & Airtime
As a user, I want to purchase airtime/data and pay bills, so that I can meet recurring needs.

Acceptance:
- Existing `/api/v1/bill/*` endpoints remain authoritative.
- Receipt returned for each payment.
- Reversal path exists on failure.

## 4) Savings / Goals
As a user, I want to create savings goals and schedule contributions, so that I can save consistently.

Acceptance:
- Auto-moves are scheduled from the main wallet.
- Failures notify the user.

## 5) Statements
As a user, I want to download statements (PDF/CSV), so that I can keep records.

Acceptance:
- Generation time-bounded (<5s for 3 months).
- PDF is hashed/signed.

## 6) Farmer Registration Fee (Paystack + Bank Transfer)

### 6.1 Paystack Card Payment
As a farmer, I want to pay the registration fee via Paystack card payment, so that I can unlock farmer features.

Acceptance:
- Farmer features are gated unless payment is verified.
- Webhook handling is idempotent.

### 6.2 Direct Bank Transfer
As a farmer, I want to see bank account details to transfer the registration fee, so that I can pay from my banking app.

Acceptance:
- System displays account details.
- System can reconcile incoming payment to a farmer (manual review or automated matching).

## 7) Farm Mapping (KoboCollect)
As a farmer or agent, I want to capture farm mapping (GPS polygon/points, farm size, photos, crop tags), so that the platform has a verified geofence.

Acceptance:
- CRS consistency is enforced.
- Area can be auto-calculated.
- Multiple plots are supported.
- Agent attribution is captured.

## 8) Input Loans (MVP)

### 8.1 Eligibility Scoring (AI + Rules)
As a farmer, I want to request an input loan and get an eligibility decision, so that I can access farming inputs.

Acceptance:
- Hard rules enforced (e.g., ≥ 3 months wallet activity; KYC verified; reg fee paid).
- Eligibility output includes a deterministic decision log (explainable factors).
- Decision SLA ≤ 24h.

### 8.2 Disbursement
As operations, I want to disburse approved inputs through a warehouse/partner, so that fulfillment is trackable.

Acceptance:
- Disbursement recorded as an inventory issue / fulfillment event.

### 8.3 Repayment
As a farmer, I want repayments tracked and auto-deducted by defined priority rules, so that I can repay without friction.

Acceptance:
- Notifications are sent (SMS + push).
- Grace periods supported.
- Pro-rata early payoff supported.

## 9) Storage & Extension Agents

### 9.1 Storage Booking
As a farmer, I want to book storage, so that my harvest can be stored safely.

Acceptance:
- Fee transparency.
- Booking confirmation and history.

### 9.2 Agent Support Requests
As a farmer, I want to request agent support (pest, fertilizer plan, soil issue), so that I can get help.

Acceptance:
- Location-based matching.
- SLA logging.

## 10) In-app Form (Farmer Issue Reporting)
As a farmer, I want to submit an issue report tied to my farmer ID and plot, so that it can be triaged and resolved.

Acceptance:
- Issue category list includes: Drought, Flooding, Pests, Erosion, Grazing Dispute, Others.
- Short description is required.
- Media upload is optional.
- Location is auto-pulled from the farmer profile / plot.
- Submission confirmation is immediate.
- Admin/staff/agents can see new reports for triage.
