# Implementation Guide (Additive to Existing API)

## Goal
Introduce farmer-mode, mapping, registration fee, loans, advisory, storage, agent support, and farmer issue reporting endpoints as **additive modules** alongside existing `/api/v1` endpoints.

## 1) Routing and Module Layout
Recommended (align to your existing structure):
- `src/routes/v1/farmer.*` for farmer-mode routes
- `src/routes/v1/agent.*` for agent routes
- `src/routes/v1/admin.*` for admin-only routes
- `src/controllers/*` for request handlers
- `src/services/*` for business logic
- `src/validators/*` for request validation

Implementation rules:
- Keep existing endpoints stable.
- Add new endpoints under new route prefixes:
  - `/api/v1/farmer/*`
  - `/api/v1/agent/*`
  - `/api/v1/admin/*` (for scoring/approval/ingestion/reconciliation)

## 2) AuthN/AuthZ

### 2.1 Authentication
- Reuse existing JWT auth middleware.
- Ensure new routes are protected consistently.

### 2.2 Authorization (RBAC)
- Enforce `USER_ROLE` / `ACCOUNT_TYPE` checks.
- `AGENT` may:
  - create/update farmer onboarding records
  - submit mapping
  - verify/reject farmers
  - view assigned farmers
- `ADMIN` may:
  - reconcile bank transfer registration fees
  - ingest Kobo submissions
  - score/approve/reject loans
  - manage advisory content/rules

## 3) Data Model Additions (MVP)
Create new Prisma models for the MVP entities (names can vary):
- `FarmerProfile`
- `FarmPlot`
- `RegistrationFeePayment`
- `Loan`
- `LoanDecisionLog`
- `DisbursementEvent`
- `RepaymentSchedule`
- `StorageBooking`
- `AdvisoryEvent`
- `FarmerIssue`

Important invariants:
- Farmer mode gating: `FarmerProfile.reg_fee_status` must be verified before unlocking farmer tools.
- Mapping attribution: every plot must record `source` and `agentId` when agent-assisted.
- Explainability: `AdvisoryEvent.inputs_used[]` and `LoanDecisionLog` must reference explicit inputs.

## 4) Paystack Integration (Registration Fee)

### 4.1 Initialize
- Endpoint: `POST /api/v1/farmer/registration-fee/paystack/initialize`
- Create a payment record in DB with status `pending`.
- Call Paystack `POST /transaction/initialize`.
- Store returned `reference`.

### 4.2 Verify
- Endpoint: `GET /api/v1/farmer/registration-fee/paystack/verify/:reference`
- Call Paystack `GET /transaction/verify/:reference`.
- If success:
  - mark payment `verified`
  - set farmer mode active / unlock features

### 4.3 Webhook
- Endpoint: `POST /api/v1/webhook/paystack`
- Verify Paystack signature.
- Apply idempotency: ignore duplicates by event id/reference.
- Transition payment state and unlock farmer features.

## 5) Bank Transfer Registration Fee

### 5.1 Details
- Endpoint: `GET /api/v1/farmer/registration-fee/bank-transfer/details`
- Return account details (account number, bank name) and instructions.

### 5.2 Reconciliation
- Endpoint: `POST /api/v1/admin/farmer/registration-fee/bank-transfer/reconcile`
- Admin submits evidence/reference.
- System matches and marks registration fee as `verified`.

## 6) KoboCollect Mapping

### 6.1 Ingestion
- Endpoint: `POST /api/v1/admin/kobo/ingest`
- Pull new submissions.
- Normalize:
  - geometry → GeoJSON
  - area_ha calculated server-side when missing
  - attach `farmerId`, `agentId` where provided

### 6.2 Validation
- Enforce CRS consistency.
- Validate polygon closure/point order.
- Support multiple plots per farmer.

## 7) Loans MVP (Input Loans)

### 7.1 Eligibility inputs
Eligibility engine must only use explicit inputs:
- wallet history (transactions)
- KYC status
- registration fee payment status
- farm size and mapping
- season dates
- prior repayment history

### 7.2 Deterministic audit trail
- Store `score_snapshot` and `reason_codes[]`.
- Store decision log with:
  - rule hits
  - feature contributions
  - timestamps
  - actor (system/admin)

### 7.3 Admin workflow
- `POST /api/v1/admin/loans/:loanId/score`
- `POST /api/v1/admin/loans/:loanId/approve`
- `POST /api/v1/admin/loans/:loanId/reject`

## 8) Advisory (Explainable)
- Every advisory response must include:
  - `inputs_used[]`
  - references to stored farm/txn/season/mapping facts

## 9) Farmer Issues (In-app Form)

### 9.1 Farmer submission
- `POST /api/v1/farmer/issues`
- Requires:
  - category
  - shortDescription
- Optional:
  - media

### 9.2 Auto-linking
- Link issue to:
  - `farmerId`
  - `plotId`
  - derived location from profile/plot

### 9.3 Triage
- `GET /api/v1/admin/farmer/issues`
- `PUT /api/v1/admin/farmer/issues/:issueId`

## 10) Non-functional Requirements Checklist
- Performance: wallet actions ≤ 3s; advisory ≤ 3s; statements ≤ 5s (90th pct).
- Reliability: queue + retry for external APIs (Paystack/Keystone/Kobo).
- Security: NDPR/CBN; TLS 1.2+; AES-256 at rest.
- Observability: structured logs, trace ids, audit trails for AI decisions.
- Offline: queue and sync for agent/mapping flows.
