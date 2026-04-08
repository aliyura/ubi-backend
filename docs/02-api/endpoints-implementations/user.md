# User Endpoint Implementations

## Domain
- Base path: `/api/v1/user`
- Controller: `src/user/user.controller.ts`
- Service: `src/user/user.service.ts`

## Security Scope
- Public user routes (JWT excluded):
- `register`, `existance-check`, `validate-email`, `verify-email`, `validate-phonenumber`, `verify-phonenumber`, `forgot-password`, `verify-forgot-password`, `reset-password`.
- All other user routes require JWT.
- All routes require API key.

## Endpoint Groups

### Registration and Availability
- `POST /register` -> `register(body)`
- `POST /register-business` -> `register(body)`
- `POST /existance-check` -> `checkUserExistance(body)`
- Key logic:
- Duplicate checks for email/username/phone.
- Password hashing.
- Referral code validation and referral bonus credit.
- Welcome + verification emails.

### Verification (Email/Phone)
- `POST /validate-email` -> `validateEmail(body)`
- `POST /verify-email` -> `verifyEmail(body)`
- `POST /validate-phonenumber` -> `validatePhoneNumber(body)`
- `POST /verify-phonenumber` -> `verifyPhoneNumber(body)`
- Key logic:
- OTP generation and cache storage.
- Email and SMS delivery integration.
- Cache markers (`verified`) used in registration flow.

### Auth Credentials and Recovery
- `POST /create-passcode` -> `createPasscode(body, user)`
- `POST /forgot-password` -> `forgotPassword(body)`
- `POST /verify-forgot-password` -> `verifyForgotPassword(body)`
- `POST /reset-password` -> `resetPassword(body)`
- `GET /request-change-password` -> `requestChangePassword(user)`
- `PUT /change-password` -> `changePassword(body, user)`
- `PUT /change-passcode` -> `changePasscode(body, user)`
- Key logic:
- Old credential validation with bcrypt.
- OTP gate supported for password change/reset flows.
- New value cannot equal old value.

### Wallet and KYC from User Domain
- `POST /create-account` -> `createAccount(bvn, user)`
- `POST /create-business-account` -> `createBusinessAccount(body, user)`
- `POST /create-foreign-account` -> `createForeignAccount(currency, user)`
- `POST /set-wallet-pin` -> `setWalletPin(body, user)`
- `POST /verify-wallet-pin` -> `verifyWalletPin(body, user)`
- `POST /verify-nin` -> `verifyNinDetails(nin, user)`
- `POST /kyc-tier2` -> `verifyTier2Kyc(body, user)`
- `POST /kyc-tier3` -> `verifyTier3Kyc(body, user)`
- Key logic:
- Serializable transactions + row locking prevent duplicate wallet creation.
- Tier and transaction limit updates on successful verification.

### PIN Reset and Profile
- `POST /forget-pin` -> `forgetPin(user)`
- `POST /reset-pin` -> `resetPin(body, user)`
- `PUT /edit-profile` -> `editProfile(body, user, file)`
- `PUT /change-pin` -> `changePin(body, user)`

### User Data and Analytics
- `GET /me` -> returns `UserEntity` from `req.user`
- `GET /get-beneficiaries` -> `getBeneficiaries(category, transferType, billType, user)`
- `GET /statistics-line-chart` -> `getStatisticsLineChart(user)`
- `GET /statistics-pie-chart` -> `getStatisticsPieChart(user, sort)`

### Reporting and Account Lifecycle
- `POST /report-scam` -> `reportScam(body, user, file)`
- `DELETE /:id` -> `deleteUserAccount(userId)`
- Key logic:
- Scam reports increment user ticket counter and create `ScamTicket`.
- Account deletion attempts provider-side virtual account cleanup before deleting user record.
