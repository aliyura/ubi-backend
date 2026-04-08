# API Endpoints

## Notes
- All routes are prefixed with `/api` from `main.ts`.
- Paths below are shown as full resolved paths.
- Security labels:
- `API Key`: requires `x-api-key`.
- `JWT`: requires bearer token.

## Auth Domain (`/api/v1/auth`)
| Method | Endpoint | API Key | JWT |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Yes | No |
| POST | `/api/v1/auth/passcode-login` | Yes | No |
| POST | `/api/v1/auth/resend-2fa` | Yes | No |
| POST | `/api/v1/auth/verify-2fa` | Yes | No |

## User Domain (`/api/v1/user`)
| Method | Endpoint | API Key | JWT |
|---|---|---|---|
| POST | `/api/v1/user/register` | Yes | No |
| POST | `/api/v1/user/register-business` | Yes | Yes |
| POST | `/api/v1/user/create-passcode` | Yes | Yes |
| POST | `/api/v1/user/forgot-password` | Yes | No |
| POST | `/api/v1/user/verify-forgot-password` | Yes | No |
| POST | `/api/v1/user/reset-password` | Yes | No |
| POST | `/api/v1/user/create-account` | Yes | Yes |
| POST | `/api/v1/user/create-business-account` | Yes | Yes |
| POST | `/api/v1/user/create-foreign-account` | Yes | Yes |
| POST | `/api/v1/user/set-wallet-pin` | Yes | Yes |
| POST | `/api/v1/user/verify-wallet-pin` | Yes | Yes |
| POST | `/api/v1/user/verify-nin` | Yes | Yes |
| POST | `/api/v1/user/forget-pin` | Yes | Yes |
| POST | `/api/v1/user/reset-pin` | Yes | Yes |
| POST | `/api/v1/user/report-scam` | Yes | Yes |
| POST | `/api/v1/user/kyc-tier2` | Yes | Yes |
| POST | `/api/v1/user/kyc-tier3` | Yes | Yes |
| POST | `/api/v1/user/existance-check` | Yes | No |
| POST | `/api/v1/user/validate-phonenumber` | Yes | No |
| POST | `/api/v1/user/verify-phonenumber` | Yes | No |
| POST | `/api/v1/user/validate-email` | Yes | No |
| POST | `/api/v1/user/verify-email` | Yes | No |
| PUT | `/api/v1/user/edit-profile` | Yes | Yes |
| PUT | `/api/v1/user/change-pin` | Yes | Yes |
| PUT | `/api/v1/user/change-passcode` | Yes | Yes |
| PUT | `/api/v1/user/change-password` | Yes | Yes |
| DELETE | `/api/v1/user/:id` | Yes | Yes |
| GET | `/api/v1/user/me` | Yes | Yes |
| GET | `/api/v1/user/get-beneficiaries` | Yes | Yes |
| GET | `/api/v1/user/statistics-line-chart` | Yes | Yes |
| GET | `/api/v1/user/statistics-pie-chart` | Yes | Yes |
| GET | `/api/v1/user/request-change-password` | Yes | Yes |

## Wallet Domain (`/api/v1/wallet`)
| Method | Endpoint | API Key | JWT |
|---|---|---|---|
| GET | `/api/v1/wallet/get-banks/:currency` | Yes | Yes |
| GET | `/api/v1/wallet/get-matched-banks/:accountNumber` | Yes | Yes |
| GET | `/api/v1/wallet/get-transfer-fee` | Yes | Yes |
| GET | `/api/v1/wallet/transaction` | Yes | Yes |
| POST | `/api/v1/wallet/verify-account` | Yes | Yes |
| POST | `/api/v1/wallet/initiate-transfer` | Yes | Yes |
| GET | `/api/v1/wallet/generate-qrcode` | Yes | Yes |
| POST | `/api/v1/wallet/decode-qrcode` | Yes | Yes |
| POST | `/api/v1/wallet/bvn-verification` | Yes | Yes |

## Bill Domain (`/api/v1/bill`)
| Method | Endpoint | API Key | JWT |
|---|---|---|---|
| GET | `/api/v1/bill/airtime/get-plan` | Yes | Yes |
| GET | `/api/v1/bill/airtime/network-providers` | Yes | Yes |
| GET | `/api/v1/bill/data/get-plan/:network` | Yes | Yes |
| GET | `/api/v1/bill/airtime/international/get-plan` | Yes | Yes |
| GET | `/api/v1/bill/airtime/international/get-fx-rate` | Yes | Yes |
| GET | `/api/v1/bill/data/get-plan` | Yes | Yes |
| GET | `/api/v1/bill/cable/get-plan` | Yes | Yes |
| GET | `/api/v1/bill/electricity/get-plan` | Yes | Yes |
| GET | `/api/v1/bill/internet/get-plan` | Yes | Yes |
| GET | `/api/v1/bill/transport/get-plan` | Yes | Yes |
| GET | `/api/v1/bill/school/get-plan` | Yes | Yes |
| GET | `/api/v1/bill/airtime/get-variation` | Yes | Yes |
| GET | `/api/v1/bill/data/get-variation` | Yes | Yes |
| POST | `/api/v1/bill/data/pay` | Yes | Yes |
| POST | `/api/v1/bill/airtime/pay` | Yes | Yes |
| POST | `/api/v1/bill/airtime/international/pay` | Yes | Yes |
| GET | `/api/v1/bill/giftcard/get-categories` | Yes | Yes |
| GET | `/api/v1/bill/giftcard/get-product` | Yes | Yes |
| GET | `/api/v1/bill/giftcard/get-fx-rate` | Yes | Yes |
| GET | `/api/v1/bill/cable/get-bill-info` | Yes | Yes |
| GET | `/api/v1/bill/electricity/get-bill-info` | Yes | Yes |
| GET | `/api/v1/bill/internet/get-bill-info` | Yes | Yes |
| GET | `/api/v1/bill/transport/get-bill-info` | Yes | Yes |
| GET | `/api/v1/bill/school/get-bill-info` | Yes | Yes |
| POST | `/api/v1/bill/cable/verify-cable-number` | Yes | Yes |
| POST | `/api/v1/bill/electricity/verify-meter-number` | Yes | Yes |
| POST | `/api/v1/bill/cable/pay` | Yes | Yes |
| POST | `/api/v1/bill/electricity/pay` | Yes | Yes |
| POST | `/api/v1/bill/giftcard/pay` | Yes | Yes |
| GET | `/api/v1/bill/giftcard/get-redeem-code` | Yes | Yes |
| GET | `/api/v1/bill/beneficiary/list` | Yes | Yes |
| POST | `/api/v1/bill/internet/pay` | Yes | Yes |
| POST | `/api/v1/bill/transport/pay` | Yes | Yes |
| POST | `/api/v1/bill/school/pay` | Yes | Yes |

## Admin Domain (`/api/v1/admin`)
| Method | Endpoint | API Key | JWT |
|---|---|---|---|
| POST | `/api/v1/admin/data/add-plan` | Yes | Yes |
| POST | `/api/v1/admin/airtime/add-plan` | Yes | Yes |
| POST | `/api/v1/admin/cable/add-plan` | Yes | Yes |
| POST | `/api/v1/admin/electricity/add-plan` | Yes | Yes |
| POST | `/api/v1/admin/internet/add-plan` | Yes | Yes |
| POST | `/api/v1/admin/transport/add-plan` | Yes | Yes |
| POST | `/api/v1/admin/schoolfee/add-plan` | Yes | Yes |
| DELETE | `/api/v1/admin/delete-plan/:id/:bill_type` | Yes | Yes |

## Webhook Domain (`/api/v1/webhook`)
| Method | Endpoint | API Key | JWT |
|---|---|---|---|
| POST | `/api/v1/webhook/flutterwave` | No | No |
| POST | `/api/v1/webhook/VFD/payment` | No | No |
| POST | `/api/v1/webhook/safehaven` | No | No |
| POST | `/api/v1/webhook/bellmfb` | No | No |

## Health Domain (`/api/v1/health`)
| Method | Endpoint | API Key | JWT |
|---|---|---|---|
| GET | `/api/v1/health` | No | No |

## Core Domain (`/api/v1`)
| Method | Endpoint | API Key | JWT |
|---|---|---|---|
| POST | `/api/v1/contact-us` | Yes | No |
