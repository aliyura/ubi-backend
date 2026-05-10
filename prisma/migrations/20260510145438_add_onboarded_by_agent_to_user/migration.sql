-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardedByAgentId" UUID;

-- CreateIndex
CREATE INDEX "users_onboardedByAgentId_idx" ON "users"("onboardedByAgentId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_onboardedByAgentId_fkey" FOREIGN KEY ("onboardedByAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
