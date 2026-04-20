UBI App Agricultural Input Loan Module
Product, API, UI, and Workflow Guide

1. Document Purpose
   This document defines how the Agricultural Input Loan feature in UBI App should work.
   The goal is to enable farmers to request loans in kind rather than in cash. Instead of giving money directly to farmers, the platform allows them to apply for agricultural resources such as:

- Seeds
- Fertilizers
- Herbicides
- Pesticides
- Farm tools
- Animal feed
- Irrigation materials
- Other approved farming inputs
  The feature should behave like an e-commerce experience, but behind the scenes it is a loan request and approval workflow.
  This guide is written for:
- Backend developers
- Mobile app developers
- Frontend/web developers
- Product designers
- QA testers
- Back-office/operations teams

2. Business Objective
   The purpose of this module is to:

- Help real farmers access farming inputs without cash misuse
- Ensure loans are tied to productive farming activity
- Reduce fraud and default risk
- Create traceable, controlled agricultural financing
- Allow farmers to track their loan request from start to completion
- Give the organization operational control through back-office approval workflows

3. Core Business Idea
   A farmer opens the UBI App and goes to the Loan / Farm Input Loan section.
   The farmer:
1. Browses available farming materials and resources
1. Adds desired items to cart
1. Proceeds to checkout
1. Completes required loan and farm details
1. System performs eligibility checks
1. If eligible, request is submitted to back office
1. Back office reviews and decides
1. Farmer tracks status in the app
1. SMS and in-app notifications are sent on every status change
1. Farmer cannot apply for another input loan while there is an active or pending one

1. Recommended Improvement to the Idea
   Your idea is good. Below are improvements to make it stronger for a real agricultural loan product.
   4.1 Use “Input Loan” instead of generic “Loan”
   This helps users understand that the loan is for farm resources, not cash.
   Suggested labels:

- Farm Input Loan
- Agricultural Resource Loan
- Crop Input Financing
  4.2 Separate product catalog from loan application
  The resources should appear like a marketplace, but loan submission should be a controlled process with validations.
  4.3 Add farm verification steps
  To reduce fraud, include:
- Farm location
- Farm size
- Crop type
- Planting season
- Agent visit report or recommendation
- Geo-coordinates
- Farm photos if possible
  4.4 Add disbursement fulfillment workflow
  Since money is not paid directly, the system must support:
- Supplier assignment
- Input reservation
- Fulfillment/delivery
- Delivery confirmation
- Proof of collection or delivery
  4.5 Add repayment schedule
  Even if the loan is non-cash, repayment still exists.The system should generate:
- Loan amount equivalent
- Repayment amount
- Repayment due dates
- Installment plan if applicable
  4.6 Add stronger loan restrictions
  A farmer should not be able to apply if:
- There is a pending loan
- There is an approved but undisbursed loan
- There is an active loan not yet completed
- There is an overdue unpaid loan
- The farmer fails credit or farm verification checks

5. Key Users / Actors
   5.1 Farmer
   Uses mobile app to:

- Browse resources
- Add items to cart
- Apply for input loan
- Track status
- View repayment details
- Receive notifications
  5.2 Field Agent / Extension Officer
  May:
- Recommend farmer
- Verify farm
- Upload assessment
- Confirm farm existence
- Verify delivery or usage
  5.3 Back-office Admin / Loan Officer
  Uses dashboard to:
- View submitted applications
- Review farmer details
- Review eligibility check results
- Approve, reject, request more info, or send for field verification
- Assign supplier
- Update loan status
- Monitor repayments
  5.4 Supplier / Vendor
  May receive approved order for:
- Fulfilling requested materials
- Confirming stock availability
- Delivering inputs
  5.5 System
  Performs:
- Eligibility checks
- Loan status rules
- Notification sending
- Audit logging
- Preventing duplicate or conflicting applications

6. High-Level User Flow
   6.1 Farmer Flow
1. Login to app
1. Open Loan section
1. Choose “Farm Input Loan”
1. Browse resource catalog
1. View product details
1. Add items to cart
1. Go to cart
1. Proceed to checkout
1. Fill farm and loan details
1. System performs pre-checks
1. If passed, farmer submits application
1. Application enters review
1. Farmer tracks statuses
1. On approval, fulfillment begins
1. Inputs delivered or collected
1. Loan becomes active
1. Repayment begins
1. Loan closes after full repayment
   6.2 Back-office Flow
1. Login to admin dashboard
1. View loan applications queue
1. Open application details
1. Review farmer profile
1. Review farm details
1. Review cart items
1. Review check results
1. Review agent recommendation
1. Take action:
   - Approve
   - Decline
   - Request more information
   - Send for farm verification
   - Put on hold
1. On approval, assign supplier or initiate fulfillment
1. Update delivery/disbursement status
1. Monitor repayment lifecycle
1. Close loan when repaid

1. Main Loan Lifecycle Statuses
   The statuses should be standardized so mobile, frontend, backend, SMS, and reports all use the same lifecycle.
   7.1 Suggested Statuses
   Draft
   Farmer is still selecting items or has not submitted
   Submitted
   Application has been submitted successfully
   Eligibility Review
   System and initial checks are being processed
   Pending Field Verification
   Awaiting field/agent/farm verification
   Under Review
   Back office is reviewing application
   More Information Required
   Farmer needs to provide additional details or correction
   Approved
   Loan request has been approved
   Rejected
   Loan request has been declined
   Fulfillment In Progress
   Approved items are being prepared by supplier
   Ready for Pickup
   Items are ready for collection
   Out for Delivery
   Items are on the way to farmer
   Delivered / Collected
   Farmer has received resources
   Active
   Loan is active and repayment is ongoing
   Partially Repaid
   Some repayment has been made
   Completed
   Loan fully repaid
   Overdue
   Repayment date has passed without full repayment
   Cancelled
   Application cancelled before approval or fulfillment

1. Key Business Rules
   8.1 Single active application rule
   A farmer cannot create a new loan application if they have any of the following:

- Submitted
- Eligibility Review
- Pending Field Verification
- Under Review
- Approved
- Fulfillment In Progress
- Ready for Pickup
- Out for Delivery
- Delivered / Collected
- Active
- Partially Repaid
- Overdue
  8.2 Duplicate prevention
  Farmer cannot submit exact same cart/application multiple times.
  8.3 Eligibility requirement
  Application can only proceed if the farmer:
- Has completed KYC
- Has valid profile and contact details
- Has verified farm details
- Has no conflicting loan
- Meets credit criteria
- Passes farm availability validation
- Has positive agent recommendation if required
  8.4 Resource-only loan
  No cash disbursement to the farmer.
  8.5 Admin-controlled approval
  Final approval must come from back office.
  8.6 Audit trail
  Every status change and decision must be logged with:
- who performed it
- when
- reason
- notes
  8.7 Notification on every major event
  SMS and in-app notifications should be triggered on:
- submission
- more info required
- approval
- rejection
- fulfillment start
- ready for pickup
- delivery
- repayment due reminder
- overdue notice
- completion

9. Modules Required
   The system should be broken into these modules:
1. Resource Catalog (Marketplace)
1. Cart
1. Eligibility Engine
1. Loan Application
1. Farm Verification
1. Agent Recommendation
1. Back-office Loan Management
1. Supplier Fulfillment
1. Marketplace Order (Loan Redemption)
1. Loan Tracking
1. Repayment Management
1. Notifications
1. Reports and Audit Logs

1. Data to Collect
   10.1 Farmer Profile Data
   These should already exist in the main profile/KYC area, but must be validated before loan submission.
   Required:

- Farmer ID
- Full name
- Phone number
- Email
- Gender
- Date of birth
- National ID type
- National ID number
- BVN/NIN if applicable
- Address
- State
- LGA
- Community / village
- Profile photo
- Occupation
- Years of farming experience
  Recommended:
- Household size
- Cooperative membership
- Guarantor details if needed
- Bank account details for repayment reference, if applicable

  10.2 Farm Details
  These are very important.
  Required:

- Farm name or identifier
- Farm address / descriptive location
- State
- LGA
- Ward / village
- Farm geo-coordinates
- Farm size
- Farm size unit
- Ownership type
  - owned
  - leased
  - family land
  - cooperative land
- Main crop type
- Secondary crop type
- Farming season
- Expected planting date
- Expected harvest date
- Irrigation availability
- Previous harvest history
  Recommended:
- Farm photos
- Satellite or map pin
- Soil type
- Farm accessibility
- Existing farm assets
- Number of workers

  10.3 Loan Application Header
  Required:

- Application ID
- Farmer ID
- Loan type = agricultural_input_loan
- Application date
- Total estimated loan value
- Currency
- Season / cycle
- Purpose of loan
- Preferred fulfillment method
  - pickup
  - delivery
- Preferred delivery location
- Agent ID if linked
- Agent recommendation status
- Current status
  Recommended:
- Requested tenure
- Repayment plan
- Notes by farmer
- Emergency contact

  10.4 Cart / Requested Items
  For each selected item:

- Item ID
- Item name
- Category
- Unit price
- Quantity requested
- Unit of measure
- Total amount
- Supplier or source
- Stock availability
- Eligible for loan = true/false
  Examples:
- Maize seeds, 5 bags
- Urea fertilizer, 10 bags
- Herbicide, 4 bottles
- Water pump, 1 unit

  10.5 Eligibility Check Fields
  The backend should store full eligibility results.
  Checks:

- KYC complete
- Farmer profile valid
- Active/pending loan exists
- Credit score/status
- Repayment history
- Farm exists
- Farm size adequate for requested items
- Agent recommendation available
- Blacklist status
- Fraud flags
- Seasonal relevance check
- Max loan threshold check
- Geo-verification check
  Store:
- check name
- pass/fail
- score
- note
- checked at
- checked by system/manual
- source/reference

  10.6 Agent Recommendation
  Fields:

- Agent ID
- Agent name
- Farmer known by agent = yes/no
- Farm visited = yes/no
- Visit date
- Farm exists = yes/no
- Crop confirmed
- Estimated farm size
- Recommendation
  - recommended
  - not_recommended
  - conditional
- Agent note
- Photos uploaded
- Signature / confirmation

  10.7 Back-office Decision Fields
  Fields:

- Decision
  - approved
  - rejected
  - more_info_required
  - hold
  - send_for_verification
- Decision date
- Decision by user ID
- Reason
- Internal note
- Approved amount/value
- Approved items list
- Changes made to quantities if any
- Repayment plan approved
- Supplier assigned

  10.8 Fulfillment / Delivery Fields
  Fields:

- Supplier ID
- Fulfillment reference
- Stock confirmed
- Dispatch date
- Delivery method
- Pickup center or delivery address
- Delivery officer name
- Delivery contact phone
- Received by
- Delivery proof image/signature
- Delivery status
- Delivery note

  10.9 Repayment Fields
  Fields:

- Loan account/reference
- Principal equivalent
- Service charge / markup if any
- Total repayment amount
- Repayment frequency
- First due date
- Number of installments
- Installment amount
- Amount repaid
- Outstanding balance
- Next due date
- Last repayment date
- Repayment status

11. Mobile App Screens
    11.1 Loan Home Screen
    Purpose:Main entry into loan services.
    Sections:

- Banner for Farm Input Loan
- Brief explanation
- Eligibility tips
- Active loan summary if any
- Button to apply
- Loan history preview
  Display:
- “Apply for Farm Input Loan”
- “Track Existing Loan”
- “Loan History”
- “Repayment Schedule”
  If user has active or pending loan:
- show warning
- disable new application button
- show “Track your existing loan”

  11.2 Resource Catalog Screen
  Purpose:Display available farming inputs like an e-commerce store.
  Components:

- Search bar
- Category tabs
- Filter by crop type / season / price / supplier
- Product cards
- Stock availability indicator
  Each product card should show:
- image
- item name
- category
- short description
- unit price/value
- minimum quantity
- available stock
- add to cart button
  Suggested categories:
- Seeds
- Fertilizers
- Agrochemicals
- Tools & Equipment
- Irrigation
- Feed
- Others

  11.3 Product Detail Screen
  Purpose:Detailed view of a selected farm resource.
  Fields to show:

- product image
- product name
- category
- description
- recommended usage
- unit price/value
- available quantity
- supplier
- suitable crops
- add to cart button
- quantity selector

  11.4 Cart Screen
  Purpose:Review selected items before checkout.
  Display:

- list of selected items
- quantity editor
- remove item
- total value
- estimated repayment summary
- continue to checkout button
  Additional validations:
- cannot exceed stock
- cannot exceed max loan threshold
- cannot proceed if cart empty

  11.5 Checkout Screen
  Purpose:Capture final loan request details and run validations.
  Sections:
  A. Applicant Summary

- full name
- phone
- farmer ID
- address
  B. Farm Summary
- farm name
- location
- crop type
- farm size
- edit/add farm button
  C. Delivery Preference
- pickup or delivery
- preferred location
- contact person
  D. Loan Purpose
- reason for request
- season
- expected planting date
- expected harvest date
  E. Agent Recommendation
- assigned agent
- request agent verification if needed
  F. Declaration
  Checkboxes:
- I confirm the farm details are correct
- I understand this is not a cash loan
- I agree to repayment terms
- I do not have another unpaid conflicting loan
  Buttons:
- Run eligibility check
- Submit application

  11.6 Eligibility Check Result Screen
  Purpose:Let user know pre-check result before submission or immediately after.
  Possible outcomes:
  Passed

- show success message
- allow submission
  Conditional
- show warnings
- allow submission but mark as requiring review
  Failed
- show reasonExamples:
- incomplete KYC
- existing pending loan
- farm verification needed
- poor repayment history

  11.7 Loan Submission Success Screen
  Show:

- application reference
- date submitted
- current status
- next step
- expected review timeline
- track application button

  11.8 Loan Tracking Screen
  This is very important.
  Display:

- application reference
- status timeline
- requested items
- approved items
- total value
- repayment summary
- delivery status
- notes from admin
- notification history
  Timeline example:
- Submitted
- Under Review
- Field Verification
- Approved
- Fulfillment
- Delivered
- Active
- Repaid

  11.9 Loan Detail Screen
  Detailed single application view.
  Sections:

- Application summary
- Farm details
- Requested items
- Eligibility results
- Admin remarks
- Fulfillment details
- Repayment schedule
- Payment history

  11.10 Loan History Screen
  Purpose:Show all past and current applications.
  Tabs:

- Active
- Pending
- Completed
- Rejected
  Each card shows:
- reference
- date
- amount/value
- status
- item count
- view details button

  11.11 Repayment Schedule Screen
  Show:

- repayment plan
- installment dates
- paid vs outstanding
- overdue alerts
- payment methods
- repayment history

12. Admin / Web Dashboard Screens
    12.1 Loan Applications List Page
    Columns:

- Application ID
- Farmer name
- Farmer ID
- Phone number
- Location
- Farm size
- Total requested amount
- Current status
- Agent recommendation
- Submitted date
- Assigned officer
- Action button
  Filters:
- status
- date
- location
- crop type
- loan amount
- agent
- supplier
- overdue
- verification pending

  12.2 Application Detail Page
  Should contain tabs:
  Overview

- applicant summary
- farm summary
- current status
- overall loan summary
  Requested Items
- itemized cart
- value
- quantity
- stock availability
  Eligibility Checks
- system checks
- pass/fail
- notes
  Agent Verification
- recommendation
- photos
- visit report
  Review & Decision
- approve / reject / hold / request more info
  Fulfillment
- assign supplier
- track dispatch
- confirm delivery
  Repayment
- repayment plan
- repayments made
- overdue status
  Audit Log
- every action taken

  12.3 Admin Decision Modal / Screen
  Required fields:

- decision
- reason
- internal note
- approved quantities
- approved total
- next action
- supplier assignment if approved
- repayment terms
  Reject reason examples:
- insufficient farm verification
- poor credit history
- conflicting active loan
- ineligible request size
- invalid information

  12.4 Field Verification Queue
  For applications awaiting farm checks.
  Columns:

- farmer
- application ID
- agent assigned
- location
- visit date
- verification status

  12.5 Supplier Fulfillment Page
  Shows approved applications ready for fulfillment.
  Columns:

- application ID
- farmer
- supplier
- approved items
- stock status
- delivery type
- fulfillment status
  Actions:
- confirm stock
- mark packed
- mark dispatched
- mark delivered
- upload proof

  12.6 Repayment Monitoring Page
  Columns:

- loan reference
- farmer
- total loan value
- balance
- next due date
- overdue days
- repayment status

  12.7 Reports Dashboard
  Suggested reports:

- number of applications
- approval rate
- rejection rate
- overdue loans
- top requested items
- loans by state/LGA
- supplier fulfillment turnaround time
- average loan size
- repayment performance by crop type

13. API Design Guide
    Use REST APIs with clear modules. Below is a practical structure.
    13.1 Resource Catalog APIs
    GET /loan-resources
    Returns list of available farming resources
    Filters:

- category
- cropType
- season
- search
- page
- limit
  GET /loan-resources/:id
  Returns single resource detail

  13.2 Cart APIs
  GET /loan-cart
  Get current user cart
  POST /loan-cart/items
  Add item to cart
  Request:

- resourceId
- quantity
  PATCH /loan-cart/items/:itemId
  Update quantity
  DELETE /loan-cart/items/:itemId
  Remove item
  DELETE /loan-cart
  Clear cart

  13.3 Farm APIs
  GET /farms
  Get farmer farms
  POST /farms
  Create farm
  PATCH /farms/:id
  Update farm
  GET /farms/:id
  Get farm detail
  POST /farms/:id/verify-request
  Request farm verification

  13.4 Eligibility APIs
  POST /loan-applications/eligibility-check
  Checks if farmer can proceed
  Request:

- farmId
- cartId or items
- season
- plantingDate
- fulfillmentMethod
  Response:
- eligible: true/false/conditional
- reasons
- checks[]
- blockingIssues[]
- warnings[]

  13.5 Loan Application APIs
  POST /loan-applications
  Submit application
  Request:

- farmId
- cart items
- purpose
- season
- plantingDate
- harvestDate
- fulfillmentMethod
- deliveryAddress
- declarations
- agentId if any
  GET /loan-applications
  Get farmer applications
  GET /loan-applications/:id
  Get application detail
  GET /loan-applications/:id/timeline
  Get status timeline
  POST /loan-applications/:id/cancel
  Cancel if still allowed

  13.6 Admin Loan APIs
  GET /admin/loan-applications
  List applications with filters
  GET /admin/loan-applications/:id
  Get full admin detail
  POST /admin/loan-applications/:id/decision
  Approve / reject / hold / request info
  Request:

- decision
- reason
- note
- approvedItems[]
- repaymentPlan
- supplierId
  POST /admin/loan-applications/:id/assign-agent
  Assign verification agent
  POST /admin/loan-applications/:id/status
  Manual status update with validation

  13.7 Agent Verification APIs
  GET /admin/loan-applications/verification-queue
  List pending farm verifications
  POST /agent/loan-applications/:id/verification
  Submit field verification
  Request:

- farmExists
- visitedAt
- cropConfirmed
- estimatedFarmSize
- recommendation
- note
- photos[]

  13.8 Fulfillment APIs
  POST /admin/loan-applications/:id/fulfillment
  Create fulfillment record
  POST /admin/fulfillments/:id/dispatch
  Mark dispatched
  POST /admin/fulfillments/:id/deliver
  Mark delivered
  GET /admin/fulfillments
  List fulfillments

  13.9 Repayment APIs
  GET /loan-applications/:id/repayment-schedule
  Farmer view
  GET /admin/repayments
  Admin view
  POST /admin/repayments/:loanId/record
  Record manual repayment if needed

  13.10 Notification APIs
  Usually internal, but may expose logs.
  GET /notifications
  Farmer notification history
  GET /loan-applications/:id/notifications
  Application-specific notifications

14. API Response Standards
    All APIs should use standard response format.
    Example:
    {
      "status": true,
      "message": "Eligibility check completed successfully",
      "data": {},
      "meta": {}
    }

Error example:
{
  "status": false,
  "message": "You already have an active loan application",
  "errors": [
    {
      "field": "application",
      "code": "ACTIVE_LOAN_EXISTS"
    }
  ]
}

15. Suggested Core Database Entities
    Backend should likely have these entities:

- users
- farmer_profiles
- farms
- farm_photos
- loan_resources
- loan_resource_categories
- carts
- cart_items
- loan_applications
- loan_application_items
- eligibility_checks
- agent_recommendations
- field_verifications
- loan_decisions
- suppliers
- fulfillments
- fulfillment_items
- repayment_plans
- repayments
- notifications
- audit_logs
- status_histories

16. Status Transition Rules
    The backend must validate transitions.
    Examples:

- Draft -> Submitted
- Submitted -> Eligibility Review
- Eligibility Review -> Under Review
- Under Review -> Pending Field Verification
- Under Review -> Approved
- Under Review -> Rejected
- Approved -> Fulfillment In Progress
- Fulfillment In Progress -> Ready for Pickup
- Fulfillment In Progress -> Out for Delivery
- Out for Delivery -> Delivered
- Delivered -> Active
- Active -> Partially Repaid
- Partially Repaid -> Completed
- Active or Partially Repaid -> Overdue
  Invalid transitions should be blocked.
  Example:
- Rejected -> Approved directly should not happen unless there is formal resubmission or override flow

17. Notifications and SMS Rules
    SMS and in-app notifications should be sent on these events:
    Farmer messages

- Application submitted
- Application under review
- More information required
- Application approved
- Application rejected
- Inputs ready for pickup
- Inputs dispatched
- Inputs delivered
- Repayment due reminder
- Loan overdue
- Loan completed
  Example SMS:“Your Farm Input Loan request UBI-2026-00123 has been approved. Fulfillment will begin shortly.”
  Example in-app notification:“Your application is under review by the loan team.”

18. Security and Control Requirements
    18.1 Access control

- Farmers only access their own applications
- Agents only access assigned verification cases
- Admin roles must be permission-based
- Audit log required for all admin actions
  18.2 Data integrity
- Status updates must be controlled
- Decision changes must be logged
- Item price at application time must be stored for audit
  18.3 Fraud prevention
- Prevent multiple active applications
- Device and login monitoring if needed
- Geo-check farm locations
- Flag suspicious repeated applications
  18.4 File upload validation
  For farm photos, agent verification photos, proof of delivery:
- size limits
- type restrictions
- malware scan if possible

19. UX Recommendations
    For farmer app

- Keep language simple
- Use step-by-step process
- Show why an application failed
- Show progress visually
- Allow saving draft if needed
- Show support contact
  For admin dashboard
- Fast filters
- Strong status colors
- Timeline history
- Decision reasons
- Bulk reporting
- Export capability

20. Things Missing That Should Be Added
    These are important additions beyond the initial idea.
    20.1 Loan policy configuration
    Admin should configure:

- max loan amount by farmer type
- max item quantity
- crop-season eligibility
- repayment rules
- blacklist rules
  20.2 Supplier management
  The system should support suppliers because the loan is fulfilled through resources, not cash.
  Supplier fields:
- supplier name
- location
- contact person
- stock capacity
- item catalog
- delivery coverage
  20.3 More info / correction flow
  Instead of only approve or reject, admin should be able to request correction from farmer.
  Example:
- incomplete farm details
- unclear photo
- wrong planting season
  20.4 Loan offer summary before final approval
  Admin may revise requested quantities and create an approved offer.
  20.5 Delivery confirmation
  Need farmer acknowledgment:
- OTP confirmation
- signature
- photo
- agent confirmation
  20.6 Repayment reminders
  Automatic reminders before due date and after due date.
  20.7 Resubmission flow
  Rejected application should not necessarily mean permanent lock.Farmer can start a new application after correction if policy allows.

21. Suggested Farmer Journey in Steps
    Step 1: Open Loan Module
    User sees explanation and available options
    Step 2: Browse Resources
    User sees catalog of agricultural inputs
    Step 3: Add to Cart
    User selects desired materials
    Step 4: Review Cart
    User sees totals and proceeds
    Step 5: Provide Farm and Loan Details
    User selects farm, season, purpose, delivery option
    Step 6: Eligibility Check
    System checks:

- KYC
- loan conflict
- farm validity
- credit status
- recommendation
- policy rules
  Step 7: Submit Application
  Application moves to submitted status
  Step 8: Back-office Review
  Admins assess and decide
  Step 9: Fulfillment
  Supplier prepares and sends materials
  Step 10: Delivery / Pickup
  Farmer receives materials
  Step 11: Repayment
  Loan becomes active and repayments begin
  Step 12: Completion
  Loan is fully repaid and closed

22. Suggested Screens Summary for Designers
    Mobile

- Loan Home
- Resource Catalog
- Resource Detail
- Cart
- Checkout
- Eligibility Result
- Submission Success
- Loan Tracking
- Loan Detail
- Loan History
- Repayment Schedule
- Notifications
  Web Admin
- Dashboard Overview
- Applications List
- Application Detail
- Verification Queue
- Decision Modal
- Supplier Fulfillment
- Repayment Monitoring
- Reports
- Configuration/Policy Page

23. QA Test Scenarios
    Some important test cases:

- Farmer with pending loan cannot apply again
- Farmer with incomplete KYC cannot submit
- Cart should calculate totals correctly
- Eligibility API should return correct blockers
- Admin can approve application
- Admin can reject application with reason
- Status changes trigger SMS
- Timeline shows correct sequence
- Delivery proof upload works
- Repayment schedule is generated correctly
- Unauthorized user cannot view another farmer’s loan
- Invalid status transitions are blocked

26. Short Product Definition
    UBI App Farm Input Loan is a digital agricultural financing module that allows verified farmers to request farming resources such as seeds, fertilizers, and other farm inputs through an e-commerce-like flow, after which the system performs eligibility checks, sends the request to back office for approval, tracks fulfillment and delivery, and manages repayment without disbursing cash directly to the farmer.

27. Marketplace Section
    27.1 Overview
    The Marketplace is the product catalog section of the mobile app where all available farming materials are displayed. It is the same resource catalog used during loan application browsing, but it also serves a second purpose: once a loan is approved, the farmer can return to the Marketplace and directly acquire items by redeeming their approved loan credit.

    Admin uploads and manages farming materials via back-office endpoints. Farmers browse and shop against their approved loan balance without starting a new loan application.

    27.2 How Loan Redemption Works
    When a loan is approved, the back office sets an approved total value. This approved value becomes the farmer's credit line within the Marketplace. The farmer can:

- Browse the Marketplace catalog
- Select items and quantities
- Place a Marketplace Order charged against their approved loan credit
- Track the order through confirmation, dispatch, and delivery

    The system ensures:
- Total of all non-cancelled Marketplace Orders cannot exceed the approved loan value
- Stock is validated at order placement and deducted when admin confirms the order
- Each order is independently tracked with its own reference (MKT-{year}-{unique})
- The loan's repayment plan is not affected — it was committed at approval time

    27.3 Credit Ledger Model
    Available credit is computed dynamically:

    available = approvedTotalValue - SUM(totalAmount of non-cancelled MarketplaceOrders)

    This avoids stale balance fields and is always accurate. A farmer can split their credit across multiple Marketplace Orders over time.

    27.4 Marketplace Order Lifecycle

    Status transitions:

    pending → confirmed → packed → dispatched → delivered
    pending → cancelled (by farmer, before confirmation)
    confirmed → cancelled (by admin only; stock is re-credited on cancellation)

    Statuses explained:
- pending: Order placed by farmer, awaiting admin action
- confirmed: Admin verified stock and reserved it (stock is deducted at this step)
- packed: Items packaged and ready for dispatch
- dispatched: Items on the way to farmer
- delivered: Farmer received items
- cancelled: Order voided; stock re-credited if it was already confirmed

    27.5 Business Rules
- Only loans in Approved status can have Marketplace Orders placed against them
- Order total must not exceed remaining available credit
- Stock is validated at placement (advisory) and hard-deducted at admin confirmation
- Cancellation of a confirmed order re-credits stock to inventory
- Marketplace Orders do not change the parent loan's status (the loan lifecycle continues independently)
- Repayment obligations remain unchanged regardless of how the credit is spent

    27.6 Marketplace Admin Responsibilities
- Upload and manage farming materials (POST /admin/loan-resources)
- Manage categories (POST /admin/loan-resource-categories)
- Confirm, pack, dispatch, and deliver Marketplace Orders
- Cancel orders when necessary with a reason

28. Marketplace Order API Endpoints
    28.1 Farmer Endpoints — /v1/loan-applications/:applicationId/marketplace-orders

    GET .../credit-summary
    Returns the approved credit amount, total spent, and remaining available balance.

    POST /
    Place a new Marketplace Order. Body: { items: [{ resourceId, quantity }], deliveryMethod?, deliveryAddress?, deliveryContact?, pickupAddress? }
    Validates: loan is Approved, stock availability per item, order total within available credit.

    GET /
    List all Marketplace Orders for this application. Filter by status.

    GET /:orderId
    Get a single Marketplace Order with all items.

    POST /:orderId/cancel
    Cancel a pending order (farmer can only cancel pending orders).

    28.2 Admin Endpoints — /v1/admin/marketplace-orders

    GET /
    List all Marketplace Orders. Filter by status, applicationId, userId.

    GET /:orderId
    Full order detail including items, supplier, and linked application.

    POST /:orderId/confirm
    Confirm the order and deduct stock from inventory. Optionally assign a supplier.

    POST /:orderId/pack
    Mark order as packed.

    POST /:orderId/dispatch
    Mark order as dispatched.

    POST /:orderId/deliver
    Record delivery with receivedBy, deliveryProofUrl, deliveryNote.

    POST /:orderId/cancel
    Cancel order. If status was confirmed, stock is automatically re-credited.
