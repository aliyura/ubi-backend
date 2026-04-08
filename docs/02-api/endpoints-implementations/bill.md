# Bill Endpoint Implementations

## Domain
- Base path: `/api/v1/bill`
- Controller: `src/bill/bill.controller.ts`
- Service: `src/bill/bill.service.ts`
- Security: API key + JWT required for all endpoints.

## Plan and Catalog Endpoints
- `GET /airtime/get-plan` -> `getAirtimePlan(phone, currency)`
- `GET /airtime/network-providers` -> `getAirtimeNetworkProviders()`
- `GET /data/get-plan/:network` -> `getDataPlanByNetwork(network)`
- `GET /airtime/international/get-plan` -> `getInternationalAirtimePlan(phone)`
- `GET /airtime/international/get-fx-rate` -> `getAirtimeFxRate(amount, operatorId)`
- `GET /data/get-plan` -> `getDataPlan(phone, currency)`
- `GET /cable/get-plan` -> `getCablePlan(currency)`
- `GET /electricity/get-plan` -> `getElectricityPlan(currency)`
- `GET /internet/get-plan` -> `getInternetPlan(currency)`
- `GET /transport/get-plan` -> `getTransportPlan(currency)`
- `GET /school/get-plan` -> `getSchoolfeePlan(currency)`
- `GET /airtime/get-variation` and `GET /data/get-variation` -> `getVariation(operatorId)`

## Verification and Biller Info
- `GET /{domain}/get-bill-info` endpoints call `getBillInfo(billerCode, type)`.
- `POST /cable/verify-cable-number` and `POST /electricity/verify-meter-number` call `verifyBillerNumber(body, type)`.
- Provider 400 errors are mapped to domain-specific messages where implemented.

## Payment Endpoints
- `POST /data/pay`, `POST /airtime/pay`, `POST /airtime/international/pay`
- `POST /cable/pay`, `POST /electricity/pay`, `POST /internet/pay`, `POST /transport/pay`, `POST /school/pay`
- `POST /giftcard/pay`
- All call: `pay(body, user, BILL_TYPE.*)`.

### Payment Engine (`BillService.pay`)
- Validates wallet PIN with bcrypt.
- Optionally saves beneficiary when `addBeneficiary` is requested.
- Opens serializable transaction, locks wallet row, checks balance, debits balance, writes pending transaction.
- Calls provider purchase path (`purchaseTopup`, `purchaseGiftcard`, `purchaseBill`, or `purchaseBillWithIdentifier`).
- On success: updates pending transaction to `success` with normalized `billDetails`.
- On failure: marks transaction `failed` and refunds wallet.
- Retries on serialization/conflict errors with exponential backoff.
- Sends SMS alert best-effort without breaking core success path.

## Gift Card Endpoints
- `GET /giftcard/get-categories` -> `getGiftCardCategories()`
- `GET /giftcard/get-product` -> `getProductByISOCode(currency)`
- `GET /giftcard/get-fx-rate` -> `getGiftCardFxRate(amount, currency)`
- `GET /giftcard/get-redeem-code` -> `redeemGiftCard(transactionId)`
- Product endpoint enriches provider payload with payable amount mapping.

## Beneficiaries
- `GET /beneficiary/list` -> `getBenafiaries(user, billType)`
- Payment flow can auto-create bill beneficiaries keyed by bill type and identifier.
