-- CreateTable
CREATE TABLE "BankAccountCache" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT,
    "bankName" TEXT,
    "bankCode" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankAccountCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccountCache_accountNumber_key" ON "BankAccountCache"("accountNumber");
