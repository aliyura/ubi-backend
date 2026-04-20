# Loan Module — End-to-End Testing Guide

This guide walks through every endpoint in the loan module in the exact order they should be exercised. Steps marked **[ADMIN]** require an admin JWT. Steps marked **[FARMER]** require a farmer JWT. Steps marked **[AGENT]** require an agent JWT.

Replace all `{placeholder}` values with IDs returned by earlier steps.

---

## Prerequisites — Accounts

Before testing the loan flow you need three active accounts:

**P1. Register an admin account** (or use an existing one) and obtain a JWT token.

**P2. Register a farmer account**

```
POST /v1/user/register
{
  "username": "testfarmer01",
  "fullname": "Test Farmer",
  "email": "farmer@test.com",
  "phoneNumber": "08031234567",
  "dateOfBirth": "15-Jan-1990",
  "password": "Password123!",
  "accountType": "FARMER"
}
```

Verify the farmer's email and phone via OTP, then log in to obtain the farmer JWT.

**P3. Register an agent account**

```
POST /v1/user/register
{
  "username": "testagent01",
  "fullname": "Test Agent",
  "email": "agent@test.com",
  "phoneNumber": "08037654321",
  "dateOfBirth": "20-Mar-1988",
  "password": "Password123!",
  "accountType": "AGENT"
}
```

Log in with the agent account to obtain the agent JWT.

**P4. Ensure the farmer's KYC tier is Tier 2 or higher** (required for eligibility). Update this via the admin panel or seed data before proceeding.

---

## Phase 0 — Admin: Seed the Marketplace Catalog

These steps must be completed before a farmer can browse or build a cart.

**Step 1: [ADMIN] Create a resource category**

```
POST /v1/admin/loan-resource-categories
{
  "name": "Seeds",
  "description": "High-yield crop seeds"
}
```

Save the returned `id` as `{categoryId}`.

**Step 2: [ADMIN] Create a second resource category**

```
POST /v1/admin/loan-resource-categories
{
  "name": "Fertilizers",
  "description": "NPK and organic fertilizers"
}
```

**Step 3: [ADMIN] Create a loan resource (first item)**

```
POST /v1/admin/loan-resources
{
  "categoryId": "{categoryId}",
  "name": "Maize Hybrid Seeds (2kg)",
  "description": "High-yield drought-resistant maize",
  "unitPrice": 4500,
  "unitOfMeasure": "bag",
  "stockQuantity": 200,
  "minQuantity": 1,
  "supplier": "AgroSupplies Ltd",
  "suitableCrops": "maize",
  "isEligibleForLoan": true
}
```

Save the returned `id` as `{resourceId1}`.

**Step 4: [ADMIN] Create a second loan resource**

```
POST /v1/admin/loan-resources
{
  "categoryId": "{categoryId}",
  "name": "NPK Fertilizer (50kg)",
  "description": "Premium NPK 15-15-15",
  "unitPrice": 32000,
  "unitOfMeasure": "bag",
  "stockQuantity": 100,
  "minQuantity": 1,
  "supplier": "AgroSupplies Ltd",
  "suitableCrops": "maize,cassava",
  "isEligibleForLoan": true
}
```

Save the returned `id` as `{resourceId2}`.

**Step 5: [ADMIN] Create a supplier** (needed for fulfillment later)

```
POST /v1/admin/suppliers
{
  "name": "AgroSupplies Ltd",
  "location": "Abuja",
  "contactPerson": "Musa Ibrahim",
  "contactPhone": "08099887766",
  "contactEmail": "musa@agrosupplies.com",
  "deliveryCoverage": "FCT, Kaduna, Kano"
}
```

Save the returned `id` as `{supplierId}`.

---

## Phase 1 — Farmer: Browse Resources & Build Cart

**Step 6: [FARMER] List resource categories**

```
GET /v1/loan-resource-categories
```

Confirm "Seeds" and "Fertilizers" appear.

**Step 7: [FARMER] Search loan resources**

```
GET /v1/loan-resources?search=maize
```

Confirm "Maize Hybrid Seeds" appears with `isEligibleForLoan: true`.

**Step 8: [FARMER] View a single resource**

```
GET /v1/loan-resources/{resourceId1}
```

Confirm price, stock quantity, and supplier are returned.

**Step 9: [FARMER] Add first item to cart**

```
POST /v1/loan-cart/items
{
  "resourceId": "{resourceId1}",
  "quantity": 5
}
```

Save the returned cart item `id` as `{cartItemId1}`.

**Step 10: [FARMER] Add second item to cart**

```
POST /v1/loan-cart/items
{
  "resourceId": "{resourceId2}",
  "quantity": 2
}
```

Save the returned cart item `id` as `{cartItemId2}`.

**Step 11: [FARMER] Update cart item quantity**

```
PATCH /v1/loan-cart/items/{cartItemId1}
{
  "quantity": 10
}
```

Confirm updated quantity and recalculated `totalAmount`.

**Step 12: [FARMER] Remove one item from cart**

```
DELETE /v1/loan-cart/items/{cartItemId2}
```

**Step 13: [FARMER] Add the second item back**

```
POST /v1/loan-cart/items
{
  "resourceId": "{resourceId2}",
  "quantity": 3
}
```

**Step 14: [FARMER] View full cart**

```
GET /v1/loan-cart
```

Confirm both items appear with a correct `totalValue`.

---

## Phase 2 — Farmer: Register Farm & Check Eligibility

**Step 15: [FARMER] List existing farms**

```
GET /v1/farms
```

If a farm already exists, save its `id` as `{farmId}` and skip Step 16.

**Step 16: [FARMER] Create a farm**

```
POST /v1/farms
{
  "name": "Adamu's Maize Farm",
  "address": "Kubwa, Abuja",
  "state": "FCT",
  "lga": "Bwari",
  "ward": "Kubwa",
  "latitude": 9.0765,
  "longitude": 7.3986,
  "sizeValue": 5,
  "sizeUnit": "hectares",
  "ownershipType": "owned",
  "mainCropType": "maize",
  "secondaryCropType": "cassava",
  "farmingSeason": "wet",
  "expectedPlantingDate": "2026-05-01",
  "expectedHarvestDate": "2026-10-01",
  "hasIrrigation": false
}
```

Save the returned `id` as `{farmId}`.

**Step 17: [FARMER] Run eligibility check**

```
POST /v1/loan-applications/eligibility-check
{
  "farmId": "{farmId}",
  "season": "wet",
  "plantingDate": "2026-05-01",
  "fulfillmentMethod": "delivery"
}
```

Expected: `eligible: "pass"` with all checks passing. If any check fails (e.g. KYC, active loan conflict, unverified contact), resolve the blocker before continuing.

---

## Phase 3 — Farmer: Submit Loan Application

**Step 18: [FARMER] Submit the loan application**

```
POST /v1/loan-applications
{
  "farmId": "{farmId}",
  "purpose": "Purchase seeds and fertilizer for 2026 wet season maize",
  "season": "wet",
  "expectedPlantingDate": "2026-05-01",
  "expectedHarvestDate": "2026-10-01",
  "fulfillmentMethod": "delivery",
  "deliveryAddress": "Plot 5, Kubwa Extension, Abuja",
  "deliveryContact": "08031234567",
  "farmerNotes": "Prefer morning delivery"
}
```

Expected: `status: "Submitted"`, `applicationRef: "UBI-2026-XXXXX"`, cart cleared. Save the returned `id` as `{applicationId}`.

**Step 19: [FARMER] Verify SMS received**

Check the farmer's phone for: *"Your Farm Input Loan request UBI-2026-XXXXX has been submitted and is being reviewed."*

**Step 20: [FARMER] List my applications**

```
GET /v1/loan-applications
```

Confirm the application appears with status `Submitted`.

**Step 21: [FARMER] View application detail**

```
GET /v1/loan-applications/{applicationId}
```

Confirm farm, items, and eligibility checks are included.

**Step 22: [FARMER] View status timeline**

```
GET /v1/loan-applications/{applicationId}/timeline
```

Confirm one history entry: `→ Submitted`.

---

## Phase 4 — Admin: Review Application

**Step 23: [ADMIN] List submitted applications**

```
GET /v1/admin/loan-applications?status=Submitted
```

Confirm the application appears.

**Step 24: [ADMIN] View full application detail**

```
GET /v1/admin/loan-applications/{applicationId}
```

Confirm all tabs: farmer info, farm, items, eligibility checks, decisions (empty), status history.

**Step 25: [ADMIN] View audit log**

```
GET /v1/admin/loan-applications/{applicationId}/audit-log
```

Confirm `APPLICATION_SUBMITTED` entry.

**Step 26: [ADMIN] Advance status to EligibilityReview**

```
POST /v1/admin/loan-applications/{applicationId}/status
{
  "status": "EligibilityReview",
  "reason": "Beginning eligibility assessment"
}
```

**Step 27: [ADMIN] Advance status to UnderReview**

```
POST /v1/admin/loan-applications/{applicationId}/status
{
  "status": "UnderReview",
  "reason": "Eligibility passed, moving to underwriting"
}
```

---

### Phase 4a — Optional: Field Verification Path

Skip to Step 33 if you want to approve directly without field verification.

**Step 28: [ADMIN] Assign a field agent**

```
POST /v1/admin/loan-applications/{applicationId}/assign-agent
{
  "agentId": "{agentUserId}",
  "note": "Please visit the farm within 5 days"
}
```

**Step 29: [ADMIN] Update status to PendingFieldVerification**

```
POST /v1/admin/loan-applications/{applicationId}/status
{
  "status": "PendingFieldVerification",
  "reason": "Sent for field verification"
}
```

**Step 30: [ADMIN] Check the verification queue**

```
GET /v1/admin/loan-applications/verification-queue
```

Confirm the application appears.

**Step 31: [AGENT] View assigned applications**

```
GET /v1/agent/loan-applications
```

Confirm the application appears.

**Step 32: [AGENT] Submit field verification report**

```
POST /v1/agent/loan-applications/{applicationId}/verification
{
  "farmExists": true,
  "visitedAt": "2026-04-22",
  "cropConfirmed": true,
  "estimatedFarmSize": 4.8,
  "recommendation": "recommended",
  "note": "Farm is well maintained. Farmer is experienced.",
  "photos": []
}
```

Expected: application status automatically returns to `UnderReview`.

---

### Phase 4b — Optional: Request More Information

**Step 33: [ADMIN] Request more information**

```
POST /v1/admin/loan-applications/{applicationId}/decision
{
  "decision": "more_info_required",
  "reason": "Farm ownership documents missing",
  "note": "Please upload land certificate or lease agreement"
}
```

Expected: status → `MoreInfoRequired`, farmer receives SMS.

**Step 34: [ADMIN] Return to UnderReview after info received**

```
POST /v1/admin/loan-applications/{applicationId}/status
{
  "status": "UnderReview",
  "reason": "Additional documents received and reviewed"
}
```

---

### Phase 4c — Reject Path (Optional)

**Step 35: [ADMIN] Reject the application**

```
POST /v1/admin/loan-applications/{applicationId}/decision
{
  "decision": "rejected",
  "reason": "Insufficient repayment capacity based on farm income projection"
}
```

Expected: status → `Rejected`, farmer receives rejection SMS. Stop here if testing rejection. Start a fresh application for the approval path.

---

### Phase 4d — Approve Path

**Step 36: [ADMIN] Approve the application**

```
POST /v1/admin/loan-applications/{applicationId}/decision
{
  "decision": "approved",
  "reason": "All checks passed. Farm verified. Creditworthy.",
  "approvedTotalValue": 109500,
  "supplierId": "{supplierId}",
  "repaymentTerms": {
    "numberOfInstallments": 6,
    "frequency": "monthly",
    "firstDueDate": "2026-11-01",
    "serviceCharge": 5475
  }
}
```

Expected: status → `Approved`, repayment plan created (6 installments, `lastDueDate` = 2027-04-01), farmer receives approval SMS.

**Step 37: [FARMER] Verify approval SMS received**

Check phone for: *"Great news! Your Farm Input Loan UBI-2026-XXXXX has been approved."*

---

## Phase 4.5 — Farmer: Marketplace Redemption

**Step 38: [FARMER] Check credit summary**

```
GET /v1/loan-applications/{applicationId}/marketplace-orders/credit-summary
```

Expected: `approved: 109500`, `spent: 0`, `available: 109500`.

**Step 39: [FARMER] Browse the marketplace catalog**

```
GET /v1/loan-resources?search=maize
```

**Step 40: [FARMER] Place a marketplace order**

```
POST /v1/loan-applications/{applicationId}/marketplace-orders
{
  "items": [
    { "resourceId": "{resourceId1}", "quantity": 5 },
    { "resourceId": "{resourceId2}", "quantity": 2 }
  ],
  "deliveryMethod": "delivery",
  "deliveryAddress": "Plot 5, Kubwa Extension, Abuja",
  "deliveryContact": "08031234567"
}
```

Expected: order created with status `pending`, ref `MKT-2026-XXXXX`, farmer receives SMS. Save the returned `id` as `{orderId}`.

**Step 41: [FARMER] Verify credit updated**

```
GET /v1/loan-applications/{applicationId}/marketplace-orders/credit-summary
```

Confirm `spent` and `available` reflect the order total.

**Step 42: [FARMER] List my orders**

```
GET /v1/loan-applications/{applicationId}/marketplace-orders
```

Confirm the order appears with status `pending`.

**Step 43: [FARMER] View order detail**

```
GET /v1/loan-applications/{applicationId}/marketplace-orders/{orderId}
```

**Step 44: [FARMER] Cancel the order (optional — to test cancellation)**

```
POST /v1/loan-applications/{applicationId}/marketplace-orders/{orderId}/cancel
```

Expected: status → `cancelled`, no stock change, farmer receives SMS. Place the order again (Step 40) with a new `{orderId}` before continuing.

---

**Step 45: [ADMIN] List pending marketplace orders**

```
GET /v1/admin/marketplace-orders?status=pending
```

**Step 46: [ADMIN] View order detail**

```
GET /v1/admin/marketplace-orders/{orderId}
```

**Step 47: [ADMIN] Confirm the order (deducts stock)**

```
POST /v1/admin/marketplace-orders/{orderId}/confirm
{
  "supplierId": "{supplierId}",
  "adminNote": "Stock verified at warehouse"
}
```

Expected: status → `confirmed`, `LoanResource.stockQuantity` decremented, farmer receives SMS.

**Step 48: [ADMIN] Verify stock was decremented**

```
GET /v1/loan-resources/{resourceId1}
```

Confirm `stockQuantity` decreased by the ordered quantity.

**Step 49: [ADMIN] Pack the order**

```
POST /v1/admin/marketplace-orders/{orderId}/pack
```

Expected: status → `packed`.

**Step 50: [ADMIN] Dispatch the order**

```
POST /v1/admin/marketplace-orders/{orderId}/dispatch
{
  "adminNote": "Dispatched via GIG Logistics, waybill #GL123456"
}
```

Expected: status → `dispatched`, farmer receives SMS.

**Step 51: [ADMIN] Deliver the order**

```
POST /v1/admin/marketplace-orders/{orderId}/deliver
{
  "receivedBy": "Test Farmer",
  "deliveryProofUrl": "https://s3.example.com/proof/mkt-delivery.jpg",
  "deliveryNote": "Delivered and signed by farmer"
}
```

Expected: status → `delivered`, farmer receives SMS. Loan application status stays `Approved` throughout.

---

### Phase 4.5 — Admin Cancel Confirmed Order (Optional)

**Step 52: [ADMIN] Place and confirm a second order, then cancel it**

Place a new order (repeat Step 40 with remaining credit), confirm it (Step 47), then:

```
POST /v1/admin/marketplace-orders/{orderId2}/cancel
{
  "cancelReason": "Farmer requested cancellation after stock confirmation"
}
```

Expected: status → `cancelled`, stock re-credited (verify with Step 48 pattern), farmer receives SMS.

---

## Phase 5 — Admin: Fulfillment of Original Loan Package

*This phase runs after approval, in parallel with marketplace orders. The loan application must be in `Approved` status.*

**Step 53: [ADMIN] List active suppliers**

```
GET /v1/admin/suppliers
```

Confirm `{supplierId}` appears.

**Step 54: [ADMIN] Create fulfillment record**

```
POST /v1/admin/loan-applications/{applicationId}/fulfillment
{
  "supplierId": "{supplierId}",
  "deliveryMethod": "delivery",
  "deliveryAddress": "Plot 5, Kubwa Extension, Abuja",
  "deliveryOfficer": "Emeka Okafor",
  "deliveryPhone": "08055443322",
  "items": [
    { "itemName": "Maize Hybrid Seeds (2kg)", "quantity": 10, "unitOfMeasure": "bag" },
    { "itemName": "NPK Fertilizer (50kg)", "quantity": 3, "unitOfMeasure": "bag" }
  ]
}
```

Expected: fulfillment record created with auto-generated `fulfillmentRef: "FUL-2026-XXXXX"`, application status → `FulfillmentInProgress`, farmer receives SMS: *"Your farm inputs for UBI-2026-XXXXX are being prepared for delivery."* Save the returned fulfillment `id` as `{fulfillmentId}`.

**Step 55: [FARMER] Confirm status update**

```
GET /v1/loan-applications/{applicationId}
```

Expected: status is `FulfillmentInProgress`.

**Step 56: [ADMIN] List all fulfillments**

```
GET /v1/admin/fulfillments
```

Confirm the record appears.

**Step 57: [ADMIN] Dispatch the fulfillment**

```
POST /v1/admin/fulfillments/{fulfillmentId}/dispatch
```

Expected: application status → `OutForDelivery` (or `ReadyForPickup` if `deliveryMethod` was `pickup`), farmer receives SMS.

**Step 58: [FARMER] Confirm dispatch status**

```
GET /v1/loan-applications/{applicationId}
```

Expected: status is `OutForDelivery`.

**Step 59: [ADMIN] Confirm delivery — loan becomes Active**

```
POST /v1/admin/fulfillments/{fulfillmentId}/deliver
{
  "receivedBy": "Test Farmer",
  "deliveryProofUrl": "https://s3.example.com/proof/fulfillment-delivery.jpg",
  "deliveryNote": "All items received in good condition"
}
```

Expected: application status → `Active` (transitions through `Delivered → Active` atomically), two new status history entries created, farmer receives SMS: *"Your farm inputs for UBI-2026-XXXXX have been delivered. Your loan is now active."*

**Step 60: [FARMER] Confirm loan is Active**

```
GET /v1/loan-applications/{applicationId}
```

Expected: status is `Active`.

---

## Phase 6 — Repayment Lifecycle

**Step 61: [FARMER] View repayment schedule**

```
GET /v1/loan-applications/{applicationId}/repayment-schedule
```

Expected: 6 installments with due dates from 2026-11-01 to 2027-04-01, each approximately `19162.50` (114,975 ÷ 6). Confirm `lastDueDate` is set.

**Step 62: [ADMIN] List all repayment plans**

```
GET /v1/admin/repayments
```

**Step 63: [ADMIN] List overdue repayment plans only**

```
GET /v1/admin/repayments?overdueOnly=true
```

Expected: empty (none overdue yet).

**Step 64: [ADMIN] Record a partial repayment**

```
POST /v1/admin/repayments/{applicationId}/record
{
  "amountPaid": 19162.50,
  "reference": "TXN-001-TEST",
  "note": "First installment paid via bank transfer"
}
```

Expected: application status → `PartiallyRepaid`, status history entry created, `outstandingBalance` reduced.

**Step 65: [ADMIN] Trigger the overdue processing job** (simulate a missed payment)

```
POST /v1/admin/repayments/jobs/process-overdue
```

Expected: any installments with `dueDate < now` and not completed are marked `overdue`, application moves to `Overdue`, farmer receives SMS.

**Step 66: [ADMIN] Trigger the reminder job**

```
POST /v1/admin/repayments/jobs/send-reminders
```

Expected: SMS sent for any installments due within 3 days.

**Step 67: [ADMIN] Record remaining balance to fully repay**

```
POST /v1/admin/repayments/{applicationId}/record
{
  "amountPaid": 95812.50,
  "reference": "TXN-FINAL-TEST",
  "note": "Full settlement of remaining balance"
}
```

Expected: `outstandingBalance: 0`, repayment plan status → `completed`, application status → `Completed`, farmer receives SMS: *"Congratulations! Your Farm Input Loan UBI-2026-XXXXX has been fully repaid and closed."*

---

## Optional — Cancel Application

**Step 68: [FARMER] Cancel an application in Draft or Submitted status**

*(Use a separate test application that has not yet been advanced past Submitted.)*

```
POST /v1/loan-applications/{draftApplicationId}/cancel
```

Expected: status → `Cancelled`. Attempting to cancel an application in any other status returns a 400 error.

---

## Admin Reports

**Step 69: [ADMIN] Portfolio summary report**

```
GET /v1/admin/loan-reports/summary
```

Expected: counts for total, approved, rejected, overdue with approval and rejection rate percentages.

**Step 70: [ADMIN] Overdue loans report**

```
GET /v1/admin/loan-reports/overdue
```

Expected: list of applications currently in `Overdue` status with repayment plan details.

**Step 71: [ADMIN] Top 10 most requested resources**

```
GET /v1/admin/loan-reports/top-items
```

Expected: ranked list by total quantity ordered across all loan applications.

---

## ID Reference Cheat Sheet

| Variable | Where it comes from |
|----------|---------------------|
| `{categoryId}` | Response of Step 1 |
| `{resourceId1}` | Response of Step 3 |
| `{resourceId2}` | Response of Step 4 |
| `{supplierId}` | Response of Step 5 |
| `{cartItemId1}` | Response of Step 9 |
| `{farmId}` | Response of Step 16 |
| `{applicationId}` | Response of Step 18 |
| `{agentUserId}` | Agent account user ID from P3 |
| `{orderId}` | Response of Step 40 |
| `{fulfillmentId}` | Response of Step 54 |
