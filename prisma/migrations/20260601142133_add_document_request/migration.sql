-- CreateEnum
CREATE TYPE "DOCUMENT_REQUEST_STATUS" AS ENUM ('pending', 'uploaded', 'approved', 'rejected');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NOTIFICATION_TYPE" ADD VALUE 'DOCUMENT_REQUESTED';
ALTER TYPE "NOTIFICATION_TYPE" ADD VALUE 'DOCUMENT_UPLOADED';
ALTER TYPE "NOTIFICATION_TYPE" ADD VALUE 'DOCUMENT_APPROVED';
ALTER TYPE "NOTIFICATION_TYPE" ADD VALUE 'DOCUMENT_REJECTED';
ALTER TYPE "NOTIFICATION_TYPE" ADD VALUE 'NEW_DOCUMENT_UPLOADED';

-- CreateTable
CREATE TABLE "document_request" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "documentName" TEXT NOT NULL,
    "description" TEXT,
    "status" "DOCUMENT_REQUEST_STATUS" NOT NULL DEFAULT 'pending',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "reviewNote" TEXT,
    "loanApplicationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_request_userId_idx" ON "document_request"("userId");

-- CreateIndex
CREATE INDEX "document_request_requestedById_idx" ON "document_request"("requestedById");

-- CreateIndex
CREATE INDEX "document_request_status_idx" ON "document_request"("status");

-- CreateIndex
CREATE INDEX "document_request_userId_status_idx" ON "document_request"("userId", "status");

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_loanApplicationId_fkey" FOREIGN KEY ("loanApplicationId") REFERENCES "loan_application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
