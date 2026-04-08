# Helper SMS Router Pattern

## Service
- `src/api-providers/providers/helper.service.ts`

## Purpose
- Central routing layer for SMS delivery provider selection.

## Capabilities
- Provider selection among: `dojah`, `termii`, `aws`, `sendar`.
- Unified phone normalization with Nigeria country-code handling.
- Channel support for providers that accept channel (`sms`, `whatsapp`).

## Routing Pattern
- Caller passes provider type.
- Helper delegates to provider-specific client.
- All branches normalize phone number via `addCountryCode` before send.

## Usage Pattern
- `ApiProviderService.sendSms` picks provider from env (`SMS_SENDER_PROVIDER`) and delegates to this helper.
- Default provider behavior is `sendar` when env is unset.
