# AWS Pinpoint SMS Integration

## Service
- `src/api-providers/providers/aws.service.ts`

## Capabilities Used
- Transactional SMS sending via AWS Pinpoint SMS Voice V2 client.


## Request/Response Pattern
- Uses SDK command `SendTextMessageCommand`.
- TTL configured to 600 seconds and message type set to `TRANSACTIONAL`.
- Errors are logged and rethrown as-is.

## Usage Pattern
- Routed through `HelperService.sendSms` when provider selection is `aws`.
