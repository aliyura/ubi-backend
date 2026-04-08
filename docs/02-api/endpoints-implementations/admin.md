# Admin Endpoint Implementations

## Domain
- Base path: `/api/v1/admin`
- Controller: `src/admin/admin.controller.ts`
- Service: `src/admin/admin.service.ts`
- Security: API key + JWT required.
- Note: Role guard annotation exists but is currently commented out.

## Endpoints
- `POST /data/add-plan` -> `addDataPlan(body)`
- `POST /airtime/add-plan` -> `addAirtimePlan(body)`
- `POST /cable/add-plan` -> `addCablePlan(body)`
- `POST /electricity/add-plan` -> `addElectricityPlan(body)`
- `POST /internet/add-plan` -> `addInternetServicePlan(body)`
- `POST /transport/add-plan` -> `addTransportPlan(body)`
- `POST /schoolfee/add-plan` -> `addSchoolFeePlan(body)`
- `DELETE /delete-plan/:id/:bill_type` -> `deletePlan(id, bill_type)`

## Implementation Details
- Add-plan endpoints:
- Check for duplicates using type-specific uniqueness lookups.
- Resolve country code from currency via provider helper.
- Insert into Prisma plan tables.
- Delete endpoint:
- `bill_type` is normalized to lowercase.
- Explicit delete branches currently implemented for `data` and `airtime`.
- Returns unified success response shape.
