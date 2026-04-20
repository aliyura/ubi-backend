-- CreateEnum
CREATE TYPE "LOAN_APPLICATION_STATUS" AS ENUM ('Draft', 'Submitted', 'EligibilityReview', 'PendingFieldVerification', 'UnderReview', 'MoreInfoRequired', 'Approved', 'Rejected', 'FulfillmentInProgress', 'ReadyForPickup', 'OutForDelivery', 'Delivered', 'Active', 'PartiallyRepaid', 'Completed', 'Overdue', 'Cancelled');

-- CreateEnum
CREATE TYPE "ELIGIBILITY_CHECK_RESULT" AS ENUM ('pass', 'fail', 'conditional');

-- CreateEnum
CREATE TYPE "AGENT_RECOMMENDATION_TYPE" AS ENUM ('recommended', 'not_recommended', 'conditional');

-- CreateEnum
CREATE TYPE "LOAN_DECISION_TYPE" AS ENUM ('approved', 'rejected', 'more_info_required', 'hold', 'send_for_verification');

-- CreateEnum
CREATE TYPE "FULFILLMENT_STATUS" AS ENUM ('pending', 'stock_confirmed', 'packed', 'dispatched', 'delivered');

-- CreateEnum
CREATE TYPE "REPAYMENT_STATUS" AS ENUM ('pending', 'partial', 'completed', 'overdue');

-- CreateEnum
CREATE TYPE "FARM_OWNERSHIP_TYPE" AS ENUM ('owned', 'leased', 'family_land', 'cooperative_land');

-- CreateEnum
CREATE TYPE "FULFILLMENT_METHOD" AS ENUM ('pickup', 'delivery');

-- CreateTable
CREATE TABLE "loan_resource_category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_resource_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_resource" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "stockQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "supplier" TEXT,
    "suitableCrops" TEXT,
    "isEligibleForLoan" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "ward" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sizeValue" DOUBLE PRECISION NOT NULL,
    "sizeUnit" TEXT NOT NULL,
    "ownershipType" "FARM_OWNERSHIP_TYPE" NOT NULL,
    "mainCropType" TEXT NOT NULL,
    "secondaryCropType" TEXT,
    "farmingSeason" TEXT,
    "expectedPlantingDate" TIMESTAMP(3),
    "expectedHarvestDate" TIMESTAMP(3),
    "hasIrrigation" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_photo" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "stockCapacity" TEXT,
    "deliveryCoverage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_application" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "applicationRef" TEXT NOT NULL,
    "status" "LOAN_APPLICATION_STATUS" NOT NULL DEFAULT 'Draft',
    "purpose" TEXT,
    "season" TEXT,
    "expectedPlantingDate" TIMESTAMP(3),
    "expectedHarvestDate" TIMESTAMP(3),
    "fulfillmentMethod" "FULFILLMENT_METHOD",
    "deliveryAddress" TEXT,
    "deliveryContact" TEXT,
    "agentId" UUID,
    "totalEstimatedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "farmerNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_application_item" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "approvedQuantity" DOUBLE PRECISION,
    "approvedAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_application_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_check" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "checkName" TEXT NOT NULL,
    "result" "ELIGIBILITY_CHECK_RESULT" NOT NULL,
    "score" DOUBLE PRECISION,
    "note" TEXT,
    "source" TEXT,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedBy" TEXT,

    CONSTRAINT "eligibility_check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_recommendation" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "agentName" TEXT,
    "farmerKnown" BOOLEAN NOT NULL DEFAULT false,
    "farmVisited" BOOLEAN NOT NULL DEFAULT false,
    "visitDate" TIMESTAMP(3),
    "farmExists" BOOLEAN,
    "cropConfirmed" BOOLEAN,
    "estimatedFarmSize" DOUBLE PRECISION,
    "recommendation" "AGENT_RECOMMENDATION_TYPE" NOT NULL,
    "note" TEXT,
    "photosUploaded" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_verification" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "farmExists" BOOLEAN,
    "visitedAt" TIMESTAMP(3),
    "cropConfirmed" BOOLEAN,
    "estimatedFarmSize" DOUBLE PRECISION,
    "recommendation" "AGENT_RECOMMENDATION_TYPE",
    "note" TEXT,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_decision" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "decidedBy" UUID NOT NULL,
    "decision" "LOAN_DECISION_TYPE" NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "approvedTotalValue" DOUBLE PRECISION,
    "repaymentTerms" JSONB,
    "supplierId" UUID,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_status_history" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "fromStatus" "LOAN_APPLICATION_STATUS",
    "toStatus" "LOAN_APPLICATION_STATUS" NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_audit_log" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" TEXT,
    "performedByRole" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "supplierId" UUID,
    "fulfillmentRef" TEXT,
    "stockConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "deliveryMethod" "FULFILLMENT_METHOD",
    "pickupAddress" TEXT,
    "deliveryAddress" TEXT,
    "deliveryOfficer" TEXT,
    "deliveryPhone" TEXT,
    "receivedBy" TEXT,
    "deliveryProofUrl" TEXT,
    "deliveryNote" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "status" "FULFILLMENT_STATUS" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_item" (
    "id" UUID NOT NULL,
    "fulfillmentId" UUID NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "stockAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fulfillment_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayment_plan" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "principalEquivalent" DOUBLE PRECISION NOT NULL,
    "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRepaymentAmount" DOUBLE PRECISION NOT NULL,
    "repaymentFrequency" TEXT NOT NULL,
    "numberOfInstallments" INTEGER NOT NULL,
    "installmentAmount" DOUBLE PRECISION NOT NULL,
    "firstDueDate" TIMESTAMP(3) NOT NULL,
    "lastDueDate" TIMESTAMP(3),
    "amountRepaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstandingBalance" DOUBLE PRECISION NOT NULL,
    "status" "REPAYMENT_STATUS" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repayment_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayment" (
    "id" UUID NOT NULL,
    "repaymentPlanId" UUID NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "note" TEXT,
    "status" "REPAYMENT_STATUS" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_policy" (
    "id" UUID NOT NULL,
    "maxLoanAmount" DOUBLE PRECISION NOT NULL DEFAULT 500000,
    "maxItemQuantity" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "requireAgentReco" BOOLEAN NOT NULL DEFAULT false,
    "allowResubmission" BOOLEAN NOT NULL DEFAULT true,
    "repaymentFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "defaultInstallments" INTEGER NOT NULL DEFAULT 6,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loan_resource_category_name_key" ON "loan_resource_category"("name");

-- CreateIndex
CREATE INDEX "loan_resource_categoryId_idx" ON "loan_resource"("categoryId");

-- CreateIndex
CREATE INDEX "farm_userId_idx" ON "farm"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_userId_key" ON "cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_item_cartId_resourceId_key" ON "cart_item"("cartId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "loan_application_applicationRef_key" ON "loan_application"("applicationRef");

-- CreateIndex
CREATE INDEX "loan_application_userId_idx" ON "loan_application"("userId");

-- CreateIndex
CREATE INDEX "loan_application_status_idx" ON "loan_application"("status");

-- CreateIndex
CREATE INDEX "loan_application_applicationRef_idx" ON "loan_application"("applicationRef");

-- CreateIndex
CREATE INDEX "eligibility_check_applicationId_idx" ON "eligibility_check"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_recommendation_applicationId_key" ON "agent_recommendation"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "field_verification_applicationId_key" ON "field_verification"("applicationId");

-- CreateIndex
CREATE INDEX "loan_decision_applicationId_idx" ON "loan_decision"("applicationId");

-- CreateIndex
CREATE INDEX "loan_status_history_applicationId_idx" ON "loan_status_history"("applicationId");

-- CreateIndex
CREATE INDEX "loan_audit_log_applicationId_idx" ON "loan_audit_log"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "fulfillment_applicationId_key" ON "fulfillment"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "repayment_plan_applicationId_key" ON "repayment_plan"("applicationId");

-- CreateIndex
CREATE INDEX "repayment_repaymentPlanId_idx" ON "repayment"("repaymentPlanId");

-- CreateIndex
CREATE INDEX "repayment_dueDate_idx" ON "repayment"("dueDate");

-- AddForeignKey
ALTER TABLE "loan_resource" ADD CONSTRAINT "loan_resource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "loan_resource_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_photo" ADD CONSTRAINT "farm_photo_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "loan_resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_application" ADD CONSTRAINT "loan_application_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_application_item" ADD CONSTRAINT "loan_application_item_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_application_item" ADD CONSTRAINT "loan_application_item_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "loan_resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_check" ADD CONSTRAINT "eligibility_check_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_recommendation" ADD CONSTRAINT "agent_recommendation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_verification" ADD CONSTRAINT "field_verification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_decision" ADD CONSTRAINT "loan_decision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_status_history" ADD CONSTRAINT "loan_status_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_audit_log" ADD CONSTRAINT "loan_audit_log_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_plan" ADD CONSTRAINT "repayment_plan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment" ADD CONSTRAINT "repayment_repaymentPlanId_fkey" FOREIGN KEY ("repaymentPlanId") REFERENCES "repayment_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
