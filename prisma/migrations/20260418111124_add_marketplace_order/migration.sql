-- CreateEnum
CREATE TYPE "MARKETPLACE_ORDER_STATUS" AS ENUM ('pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled');

-- CreateTable
CREATE TABLE "marketplace_order" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderRef" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "MARKETPLACE_ORDER_STATUS" NOT NULL DEFAULT 'pending',
    "deliveryMethod" "FULFILLMENT_METHOD",
    "deliveryAddress" TEXT,
    "deliveryContact" TEXT,
    "pickupAddress" TEXT,
    "supplierId" UUID,
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "receivedBy" TEXT,
    "deliveryProofUrl" TEXT,
    "deliveryNote" TEXT,
    "adminNote" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_order_item" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_order_orderRef_key" ON "marketplace_order"("orderRef");

-- CreateIndex
CREATE INDEX "marketplace_order_applicationId_idx" ON "marketplace_order"("applicationId");

-- CreateIndex
CREATE INDEX "marketplace_order_userId_idx" ON "marketplace_order"("userId");

-- CreateIndex
CREATE INDEX "marketplace_order_item_orderId_idx" ON "marketplace_order_item"("orderId");

-- AddForeignKey
ALTER TABLE "marketplace_order" ADD CONSTRAINT "marketplace_order_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order" ADD CONSTRAINT "marketplace_order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_item" ADD CONSTRAINT "marketplace_order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "marketplace_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_item" ADD CONSTRAINT "marketplace_order_item_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "loan_resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
