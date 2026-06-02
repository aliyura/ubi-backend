-- CreateEnum
CREATE TYPE "INVENTORY_ACTION" AS ENUM ('added_stock', 'distributed');

-- CreateEnum
CREATE TYPE "INVENTORY_ACTION_STATUS" AS ENUM ('approved', 'completed');

-- CreateTable
CREATE TABLE "inventory_action_log" (
    "id" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "action" "INVENTORY_ACTION" NOT NULL,
    "amountMoved" DOUBLE PRECISION NOT NULL,
    "warehouse" TEXT,
    "status" "INVENTORY_ACTION_STATUS" NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_action_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_action_log_resourceId_idx" ON "inventory_action_log"("resourceId");

-- CreateIndex
CREATE INDEX "inventory_action_log_resourceId_createdAt_idx" ON "inventory_action_log"("resourceId", "createdAt");

-- AddForeignKey
ALTER TABLE "inventory_action_log" ADD CONSTRAINT "inventory_action_log_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "loan_resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
