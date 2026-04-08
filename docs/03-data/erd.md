# ERD Reference (Ubi Backend)

## How to Read This File
- This is a visual-first companion to `db-design.md`.
- It focuses on relationship diagrams and lifecycle diagrams.
- Field lists are intentionally compact to keep diagrams readable.

## Legend
- `||--o|`: one-to-zero-or-one
- `||--o{`: one-to-many
- `PK`: primary key
- `FK`: foreign key
- `UK`: unique key

## Core Domain ERD
```mermaid
erDiagram
  USERS ||--o| WALLET : has
  USERS ||--o{ BENEFICIARY : saves
  USERS ||--o{ SCAMTICKET : creates
  WALLET ||--o{ TRANSACTION : contains

  USERS {
    uuid id PK
    string email UK
    string username UK
    string phoneNumber UK
    enum accountType
    enum status
    enum tierLevel
    enum role
    datetime createdAt
    datetime updatedAt
  }

  WALLET {
    uuid id PK
    uuid userId FK UK
    enum currency
    float balance
    string accountNumber UK
    datetime createdAt
    datetime updatedAt
  }

  TRANSACTION {
    uuid id PK
    uuid walletId FK
    enum type
    enum category
    enum status
    string currency
    string transactionRef
    string reference
    datetime createdAt
    datetime updatedAt
  }

  BENEFICIARY {
    uuid id PK
    uuid userId FK
    enum type
    enum billType
    string accountNumber
    string bankCode
    string billerNumber
    int operatorId
    datetime createdAt
    datetime updatedAt
  }

  SCAMTICKET {
    uuid id PK
    uuid userId FK
    int ref_number
    enum status
    datetime createdAt
  }
```

## Bill and Catalog ERD
```mermaid
erDiagram
  AIRTIMEPLAN {
    uuid id PK
    enum network
    string planName
    int operatorId
  }

  DATAPLAN {
    uuid id PK
    enum network
    string planName
    int operatorId
  }

  CABLEPLAN {
    uuid id PK
    string planName
    string billerCode
  }

  ELECTRICITYPLAN {
    uuid id PK
    string planName
    string billerCode
  }

  INTERNETSERVICEPLAN {
    uuid id PK
    string planName
    string billerCode
  }

  TRANSPORTPLAN {
    uuid id PK
    string planName
    string billerCode
  }

  SCHOOLFEEPLAN {
    uuid id PK
    string planName
    string billerCode
  }

  BENEFICIARY {
    uuid id PK
    uuid userId FK
    enum type
    enum billType
    string billerNumber
    int operatorId
    string billerCode
  }

  TRANSACTION {
    uuid id PK
    uuid walletId FK
    enum category
    enum status
    json billDetails
    datetime createdAt
  }
```

## Webhook and Cache ERD
```mermaid
erDiagram
  PAYMENTEVENT {
    uuid id PK
    string refId
    string status
    string currency
    float amountPaid
    float settlementAmount
    float fee
    datetime createdAt
  }

  BANKACCOUNTCACHE {
    string id PK
    string accountNumber UK
    string accountName
    string bankCode
    datetime verifiedAt
  }

  BANKNAMECACHE {
    string id PK
    string bankCode UK
    string bankName
    datetime createdAt
    datetime updatedAt
  }
```

## User Lifecycle to Data Touchpoints
```mermaid
flowchart LR
  A[Register user] --> B[users row]
  B --> C[Email/phone verification flags updated]
  C --> D[Wallet setup]
  D --> E[wallet row]
  E --> F[Transfer or bill payment]
  F --> G[transaction pending]
  G --> H{Provider result}
  H -- success --> I[transaction success]
  H -- failure --> J[transaction failed + refund]
  F --> K[optional beneficiary save]
  K --> L[beneficiary row]
```

## Bill Payment Sequence and Table Writes
```mermaid
sequenceDiagram
  participant U as User/API
  participant S as Bill Service
  participant DB as Postgres
  participant P as Provider

  U->>S: pay request + wallet PIN
  S->>DB: lock wallet row
  S->>DB: debit wallet
  S->>DB: insert transaction(status=pending)
  S->>P: purchase call
  alt provider success
    P-->>S: success payload
    S->>DB: update transaction(status=success, billDetails)
  else provider failure
    P-->>S: error payload
    S->>DB: update transaction(status=failed)
    S->>DB: refund wallet
  end
  S-->>U: final response
```

## Data Ownership Summary
- User-owned and cascade-deleted: `wallet`, `beneficiary`, `scamTicket`, and indirectly user-linked `transaction` through wallet.
- System-owned reference data: all bill plan catalog tables.
- Integration-owned event capture: `paymentEvent`.
- Ephemeral optimization data: bank caches.

## Modeling Notes for Team Alignment
- Current wallet relation is one user to at most one wallet row.
- Transactions are the operational source of truth for movement history.
- JSON detail fields intentionally preserve provider payload context without frequent schema churn.
- If you adopt multi-currency wallets, update ERD cardinality to one user to many wallets.
