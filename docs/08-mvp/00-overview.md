# MVP Overview

## What UBI Does (One-liner + Scope)
UBI is a mobile-first wallet for everyone with a farmer mode that adds agri tools.

### For General Users
- Send/receive money
- Pay bills
- Buy airtime/data
- Save
- Download statements
- USSD codes for transactions
- POS
- ATM cards

### For Farmers
Access to all general user features, plus:
- Farmer registration with a fee payable via Paystack (card payments) or direct bank transfer (account details displayed for the user to copy and complete payment through their banking app)
- Wallet powered by Keystone or Zenith Bank APIs
- Farm mapping via KoboCollect
- AI advisory
- Input loans
- Storage
- Agent support
- Repayment tracking

## Core Principle
Every AI output (eligibility score, repayment time, planting suggestion) must be backed by explicit inputs (transactions, farm data, location, season, mapping, etc.).

## User Types
1. General User – uses wallet (payments, airtime, bills, savings, statements). May switch to Farmer later.
2. Farmer – has wallet + agri features (registration fee via Paystack, mapping via KoboCollect, loans, advisory).
3. Field/Extension Agent (internal/assisted) – helps farmers onboard, capture mapping, verify details.
4. Admin/Operations – approvals, risk/eligibility oversight, content/advisory management, reconciliations.

## End-to-End Flows (High Level)

### A) Multi-Level Onboarding (General → Optional Farmer Upgrade)
1. Level 1 (All users): Email/Phone → OTP → name → PIN → wallet auto-provisioned (Keystone).
2. Level 2 (Profile hardening): BVN/NIN, photo/passport (optional; required before certain limits).
3. Level 3 (Farmer switch): Choose Farmer → farm type, location, Paystack registration fee → Farmer dashboard unlocked.
4. Level 4 (Farmer enrichment): Farm size, crops, season dates, expected yield, KoboCollect mapping (agent or self).

### B) General User Daily Flow
Open app → balance + quick actions → send money / pay bills / buy airtime / save → view/download statement.

### C) Farmer Value Flow
Farmer logs/enriches farm data → receives AI planting/advisory → requests input loan → eligibility scored → inputs disbursed → harvest logged → repayment deducted from loan repayment wallet → AI refines score/advice.
