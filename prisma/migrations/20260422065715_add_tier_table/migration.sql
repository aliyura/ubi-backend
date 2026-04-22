-- CreateTable
CREATE TABLE "tier" (
    "id" UUID NOT NULL,
    "level" "TIER_LEVEL" NOT NULL,
    "name" TEXT NOT NULL,
    "kycLevel" INTEGER NOT NULL,
    "dailyLimit" DOUBLE PRECISION NOT NULL,
    "perTransactionLimit" DOUBLE PRECISION NOT NULL,
    "walletLimit" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tier_level_key" ON "tier"("level");
