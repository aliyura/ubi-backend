# Graph Integration

## Service
- `src/api-providers/providers/graph.service.ts`

## Capabilities Used
- Foreign bank account creation (`/bank_account`).
- Person creation helper method exists (`/person`) but is not fully active in current account flow.

## Authentication and Config Pattern
- Bearer token with `GRAPH_API_KEY`.
- Base URL from `GRAPH_BASE_URL`.

## Request/Response Pattern
- Expects `201` for success.
- Non-201 mapped to `InternalServerErrorException`.
- Builds label/currency payload and enables autosweep.

## Usage Pattern
- Used by `ApiProviderService.createForeignAccout`.
