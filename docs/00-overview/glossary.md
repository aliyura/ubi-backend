# Glossary

## Core Business Terms
- **UBI**: Product/backend domain represented by this service.
- **Account Type**: User profile category (`PERSONAL` or `BUSINESS`).
- **Wallet**: Stored-value account tied to a user, including balance and virtual account details.
- **Virtual Account**: Bank account number provisioned for user funding/collections.
- **Beneficiary**: Saved transfer or bill recipient.
- **Bill Type**: Supported payment category (`data`, `airtime`, `cable`, etc.).
- **Transaction Category**: Broad purpose (`BILL_PAYMENT`, `TRANSFER`, `DEPOSIT`).
- **Transaction Type**: Movement direction (`DEBIT` or `CREDIT`).
- **Transaction Status**: Lifecycle state (`pending`, `success`, `failed`).
- **Tier Level**: User KYC/compliance level (`notSet`, `one`, `two`, `three`).

## Security and Access Terms
- **API Key**: Header-based app-level access control via `ApiKeyMiddleware`.
- **JWT**: User auth token validated by `JwtMiddleware`.
- **Token Version**: Per-user counter embedded in JWT payload; used to invalidate old tokens.
- **2FA (Two-Factor Authentication)**: OTP-based login confirmation over email/SMS.
- **OTP**: One-time passcode used for verification and secure actions.

## Integration Terms
- **ApiProviderService**: Internal facade that orchestrates third-party provider calls.
- **Webhook**: Provider-initiated callback used to confirm async payment/transfer outcomes.
- **Name Enquiry**: Account name resolution for bank account verification.
- **FX Rate**: Conversion quote for cross-currency products (e.g., international airtime/gift card).

## Data and Infrastructure Terms
- **Prisma**: ORM used for schema, migrations, and DB operations.
- **NodeCache**: In-memory cache used for OTP/verification state.
- **Plan Catalog**: Stored set of purchasable products (airtime/data/cable/etc).
- **Scam Ticket**: User-submitted fraud/scam report record.
- **BankAccountCache / BankNameCache**: Local tables used to speed account/bank lookups.

## Constants and Limits
- **Referral Bonus**: Fixed reward (`REFERRAL_BONUS_PRICE`) credited on valid referral flow.
- **Fees**: Bill-related constants such as `CABLE_FEE`, `ELECTRICITY_FEE`, etc.
- **Tier Limits**: Daily cumulative transaction and balance limits by KYC tier.
- **Default Bank**: Internal default bank mapping (`defaultBankName`, `defaultBankCode`).
