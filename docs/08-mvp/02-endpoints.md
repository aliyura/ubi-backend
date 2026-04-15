# MVP Endpoints (Proposed Additions)

## Conventions
- All routes are served under `/api`, so paths are written as `/api/v1/...`.
- Use JWT auth for authenticated routes.
- Use role-based access control (RBAC) for `ADMIN`, `AGENT`.
- Use idempotency keys for payment initialization and transfer-like operations.

## 1) Farmer Mode

### 1.1 Farmer switch (initiate)
- `POST /api/v1/farmer/switch`

Request (example):
- farmType
- farmLocation (GPS/manual)

Response (example):
- farmerProfile
- regFeeStatus (required/pending/paid/verified)
- nextActions

### 1.2 Farmer profile enrichment
- `PUT /api/v1/farmer/profile`

## 2) Farmer Registration Fee

### 2.1 Paystack initialize
- `POST /api/v1/farmer/registration-fee/paystack/initialize`

Stores:
- reference
- amount
- farmerId
- status
- timestamp

### 2.2 Paystack verify (pull)
- `GET /api/v1/farmer/registration-fee/paystack/verify/:reference`

### 2.3 Paystack webhook (push)
- `POST /api/v1/webhook/paystack`

Acceptance:
- Idempotent by event id / reference.
- Verifies Paystack signature.

### 2.4 Bank transfer details
- `GET /api/v1/farmer/registration-fee/bank-transfer/details`

### 2.5 Bank transfer reconcile
- `POST /api/v1/admin/farmer/registration-fee/bank-transfer/reconcile`

## 3) Farm Mapping (KoboCollect)

### 3.1 Submit mapping (self or agent-assisted)
- `POST /api/v1/farmers/:farmerId/plots`

Inputs:
- geojson
- areaHa (optional; server may calculate)
- photos
- cropTags
- source (Kobo/agent/self)

### 3.2 Update plot
- `PUT /api/v1/farmers/:farmerId/plots/:plotId`

### 3.3 List plots
- `GET /api/v1/farmers/:farmerId/plots`

### 3.4 KoboCollect ingestion
- `POST /api/v1/admin/kobo/ingest`

## 4) Agents

### 4.1 Agent farmer onboarding
- `POST /api/v1/agent/farmers`
- `PUT /api/v1/agent/farmers/:farmerId`

### 4.2 Agent mapping capture
- `POST /api/v1/agent/farmers/:farmerId/mapping`
- `PUT /api/v1/agent/farmers/:farmerId/mapping`

### 4.3 Agent verification
- `POST /api/v1/agent/farmers/:farmerId/verify`
- `POST /api/v1/agent/farmers/:farmerId/reject`

### 4.4 Agent work queue
- `GET /api/v1/agent/farmers`
- `GET /api/v1/agent/farmers/:farmerId`

## 5) Loans (Input Loans MVP)

### 5.1 Create loan request
- `POST /api/v1/farmer/loans`

Inputs:
- loanType (input)
- requestedBundle (optional)
- requestedValue

### 5.2 Eligibility decision
- `POST /api/v1/admin/loans/:loanId/score`
- `POST /api/v1/admin/loans/:loanId/approve`
- `POST /api/v1/admin/loans/:loanId/reject`

Outputs:
- eligibilityScore (0-100)
- maxLoanValue
- repaymentPlan
- reasonCodes
- decisionLog

### 5.3 Repayment tracking
- `GET /api/v1/farmer/loans/:loanId`
- `GET /api/v1/farmer/loans`

## 6) Advisory (Explainable)

### 6.1 Generate advisory event
- `POST /api/v1/farmer/advisory`

Acceptance:
- Response must include `inputs_used[]` referencing explicit inputs.

## 7) Storage
- `POST /api/v1/farmer/storage/bookings`
- `GET /api/v1/farmer/storage/bookings`

## 8) Farmer Issue Reporting
- `POST /api/v1/farmer/issues`
- `GET /api/v1/admin/farmer/issues`
- `PUT /api/v1/admin/farmer/issues/:issueId`
