-- CreateTable
CREATE TABLE "agent_activity_log" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "applicationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_activity_log_agentId_idx" ON "agent_activity_log"("agentId");

-- CreateIndex
CREATE INDEX "agent_activity_log_agentId_createdAt_idx" ON "agent_activity_log"("agentId", "createdAt");

-- AddForeignKey
ALTER TABLE "agent_activity_log" ADD CONSTRAINT "agent_activity_log_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_activity_log" ADD CONSTRAINT "agent_activity_log_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
