# Health Endpoint Implementations

## Domain
- Base path: `/api/v1/health`
- Controller: `src/health/health.controller.ts`
- Security: public (no API key, no JWT).

## Endpoint
### GET `/api/v1/health`
- Returns static liveness payload:
- `{ "status": "ok" }`
- No service/database dependency in handler.
