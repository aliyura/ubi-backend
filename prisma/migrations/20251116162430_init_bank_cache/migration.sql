-- CreateTable
CREATE TABLE "BankNameCache" (
    "id" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankNameCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankNameCache_bankCode_key" ON "BankNameCache"("bankCode");

-- CreateIndex
CREATE INDEX "BankNameCache_bankCode_idx" ON "BankNameCache"("bankCode");

-- CreateIndex
CREATE INDEX "BankNameCache_bankName_idx" ON "BankNameCache"("bankName");
