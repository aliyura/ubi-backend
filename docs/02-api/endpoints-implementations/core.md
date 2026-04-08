# Core Endpoint Implementations

## Domain
- Base path: `/api/v1`
- Controller: `src/app.controller.ts`
- Service: `src/app.service.ts`

## Security Scope
- Endpoint requires API key.
- JWT is excluded for this route in `AppModule`.

## Endpoint
### POST `/api/v1/contact-us`
- DTO: `ContactUsDto`
- Calls: `AppService.contactUs(body)`
- Flow:
- Sends acknowledgement email to requester using `contact/user-acknowledgement.hbs`.
- Sends support notification email to `support@ubi.com` using `contact/support-notification.hbs`.
- Returns success response when flow completes.
- Throws internal server error if either send phase fails in service-level try/catch.
