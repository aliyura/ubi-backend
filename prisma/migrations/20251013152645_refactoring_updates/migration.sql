-- CreateEnum
CREATE TYPE "ACCOUNT_TYPE" AS ENUM ('PERSONAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "GENDER" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "COUNTRY" AS ENUM ('NG', 'GH', 'ZA', 'US');

-- CreateEnum
CREATE TYPE "CURRENCY" AS ENUM ('NGN', 'USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "TRANSACTION_CATEGORY" AS ENUM ('BILL_PAYMENT', 'TRANSFER', 'DEPOSIT');

-- CreateEnum
CREATE TYPE "TRANSACTION_TYPE" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "TRANSACTION_STATUS" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "TIER_LEVEL" AS ENUM ('notSet', 'one', 'two', 'three');

-- CreateEnum
CREATE TYPE "USER_ACCOUNT_STATUS" AS ENUM ('active', 'restricted', 'frozen');

-- CreateEnum
CREATE TYPE "NETWORK" AS ENUM ('mtn', 'airtel', 'etisalat', 'glo');

-- CreateEnum
CREATE TYPE "USER_ROLE" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BILL_TYPE" AS ENUM ('data', 'airtime', 'internationalAirtime', 'cable', 'electricity', 'internet', 'transport', 'schoolfee', 'giftcard');

-- CreateEnum
CREATE TYPE "SCAM_TICKET_STATUS" AS ENUM ('opened', 'closed');

-- CreateEnum
CREATE TYPE "BENEFICIARY_TYPE" AS ENUM ('TRANSFER', 'BILL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "gender" "GENDER",
    "country" "COUNTRY",
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "CURRENCY" NOT NULL DEFAULT 'NGN',
    "businessName" TEXT,
    "isBusiness" BOOLEAN DEFAULT false,
    "companyRegistrationNumber" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "isPasscodeSet" BOOLEAN NOT NULL DEFAULT false,
    "passcode" TEXT,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isBvnVerified" BOOLEAN NOT NULL DEFAULT false,
    "bvn" TEXT,
    "isNinVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAddressVerified" BOOLEAN NOT NULL DEFAULT false,
    "nin" TEXT,
    "address" TEXT,
    "state" TEXT,
    "city" TEXT,
    "selfieBase64Image" TEXT,
    "accountType" "ACCOUNT_TYPE" NOT NULL DEFAULT 'PERSONAL',
    "walletPin" TEXT,
    "isWalletPinSet" BOOLEAN NOT NULL DEFAULT false,
    "profileImageFilename" TEXT,
    "profileImageUrl" TEXT,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "scamTicketCount" INTEGER NOT NULL DEFAULT 0,
    "dateOfBirth" TEXT,
    "enabledTwoFa" BOOLEAN NOT NULL DEFAULT true,
    "status" "USER_ACCOUNT_STATUS" NOT NULL DEFAULT 'active',
    "role" "USER_ROLE" NOT NULL DEFAULT 'USER',
    "dailyCummulativeTransactionLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cummulativeBalanceLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tierLevel" "TIER_LEVEL" NOT NULL DEFAULT 'notSet',
    "isBusinessRegistered" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" "CURRENCY" NOT NULL DEFAULT 'NGN',
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT,
    "bankName" TEXT,
    "bankCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountRef" TEXT,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "BENEFICIARY_TYPE" NOT NULL,
    "bankName" TEXT,
    "bankCode" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "network" "NETWORK",
    "billType" "BILL_TYPE",
    "billerNumber" TEXT,
    "operatorId" INTEGER,
    "billerCode" TEXT,
    "itemCode" TEXT,
    "currency" "CURRENCY" DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "transactionRef" TEXT,
    "type" "TRANSACTION_TYPE" NOT NULL,
    "category" "TRANSACTION_CATEGORY" NOT NULL DEFAULT 'TRANSFER',
    "currency" TEXT NOT NULL,
    "status" "TRANSACTION_STATUS" NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "previousBalance" DOUBLE PRECISION NOT NULL,
    "currentBalance" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "billDetails" JSONB,
    "transferDetails" JSONB,
    "depositDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymentEvent" (
    "id" UUID NOT NULL,
    "refId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currency" TEXT,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "settlementAmount" DOUBLE PRECISION,
    "fee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airtimePlan" (
    "id" UUID NOT NULL,
    "planName" TEXT,
    "network" "NETWORK",
    "countryISOCode" TEXT,
    "operatorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airtimePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataPlan" (
    "id" UUID NOT NULL,
    "network" "NETWORK",
    "planName" TEXT,
    "countryISOCode" TEXT,
    "operatorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dataPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cablePlan" (
    "id" UUID NOT NULL,
    "planName" TEXT,
    "countryISOCode" TEXT,
    "billerCode" TEXT,
    "description" TEXT,
    "shortName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cablePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electricityPlan" (
    "id" UUID NOT NULL,
    "planName" TEXT,
    "countryISOCode" TEXT,
    "billerCode" TEXT,
    "description" TEXT,
    "shortName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "electricityPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internetservicePlan" (
    "id" UUID NOT NULL,
    "planName" TEXT,
    "countryISOCode" TEXT,
    "billerCode" TEXT,
    "description" TEXT,
    "shortName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internetservicePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportPlan" (
    "id" UUID NOT NULL,
    "planName" TEXT,
    "countryISOCode" TEXT,
    "billerCode" TEXT,
    "description" TEXT,
    "shortName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transportPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schoolfeePlan" (
    "id" UUID NOT NULL,
    "planName" TEXT,
    "countryISOCode" TEXT,
    "billerCode" TEXT,
    "description" TEXT,
    "shortName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schoolfeePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scamTicket" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ref_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "screenshotImageUrl" TEXT NOT NULL,
    "status" "SCAM_TICKET_STATUS" NOT NULL DEFAULT 'opened',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scamTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_userId_key" ON "wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_accountNumber_key" ON "wallet"("accountNumber");

-- CreateIndex
CREATE INDEX "wallet_accountNumber_idx" ON "wallet"("accountNumber");

-- CreateIndex
CREATE INDEX "scamTicket_ref_number_idx" ON "scamTicket"("ref_number");

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary" ADD CONSTRAINT "beneficiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scamTicket" ADD CONSTRAINT "scamTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
