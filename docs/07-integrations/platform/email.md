# Email Integration

## Service
- `src/email/email.service.ts`

## Capability
- Template-based email sending via Nest mailer module.

## Pattern
- `sendEmail` takes `to`, `subject`, `template`, and optional `context`.
- Sends through configured mail transport in module setup.
- Errors are caught and logged inside service; mail failure does not throw upward from this method.

## Usage Pattern
- Used broadly for OTP, onboarding, transaction alerts, scam reports, and contact-us notifications.
