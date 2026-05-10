-- CreateIndex
CREATE INDEX "transaction_walletId_idx" ON "transaction"("walletId");

-- CreateIndex
CREATE INDEX "transaction_walletId_createdAt_idx" ON "transaction"("walletId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_state_idx" ON "users"("state");

-- CreateIndex
CREATE INDEX "users_city_idx" ON "users"("city");

-- CreateIndex
CREATE INDEX "users_country_idx" ON "users"("country");

-- CreateIndex
CREATE INDEX "users_gender_idx" ON "users"("gender");

-- CreateIndex
CREATE INDEX "users_role_state_idx" ON "users"("role", "state");

-- CreateIndex
CREATE INDEX "users_role_country_idx" ON "users"("role", "country");

-- CreateIndex
CREATE INDEX "users_fullname_idx" ON "users"("fullname");

-- CreateIndex
CREATE INDEX "wallet_userId_idx" ON "wallet"("userId");

-- AddForeignKey
ALTER TABLE "farm" ADD CONSTRAINT "farm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
