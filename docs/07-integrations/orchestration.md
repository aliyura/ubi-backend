# Provider Orchestration Pattern

## Entry Point
- `src/api-providers/api-providers.service.ts` is the abstraction layer used by domain services (`user`, `wallet`, `bill`, `auth`).

## Capability Routing (Current)
- SMS sending: delegated to `HelperService.sendSms` with runtime provider selection (`SMS_SENDER_PROVIDER`, default `sendar`).
- Virtual account creation: currently Bell MFB path in active code.
- Business account creation: SafeHaven path.
- Account verification (name enquiry): Flutterwave path.
- Transfer execution: VFD transfer path for currently active transfer methods.
- Bill purchase and topup: Flutterwave/Reloadly-backed through API provider methods.
- Gift card flows: Reloadly-backed methods.
- BVN/NIN verification: Dojah and QoreID paths.
- Foreign account creation: Graph path.

## Shared Patterns
- Provider services are thin HTTP clients around axios or SDK clients.
- Config/secrets are read through `ConfigService`.
- Most provider methods convert non-success HTTP statuses to Nest exceptions.
- Some provider handlers write directly to DB in webhook processing (for settlement updates).
- Fallbacks and alternatives often exist as commented code blocks, indicating provider switching history.

## Known Integration Behavior Notes
- Webhook signatures are validated for Flutterwave and VFD in controller layer.
- SafeHaven/Bell webhook handlers currently accept payloads without signature validation in controller.
- Multiple provider options exist for SMS, controlled by env variable.
