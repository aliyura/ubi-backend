-- Refactor ACCOUNT_TYPE enum from PERSONAL/BUSINESS to USER/ADMIN/FARMER
-- and extend USER_ROLE with FARMER.

-- 1) Add FARMER role for existing USER_ROLE enum
ALTER TYPE "USER_ROLE" ADD VALUE IF NOT EXISTS 'FARMER';

-- 2) Create new account type enum with required values
CREATE TYPE "ACCOUNT_TYPE_NEW" AS ENUM ('USER', 'ADMIN', 'FARMER');

-- 3) Remove default temporarily to allow type switch
ALTER TABLE "users" ALTER COLUMN "accountType" DROP DEFAULT;

-- 4) Migrate existing values safely
ALTER TABLE "users"
  ALTER COLUMN "accountType" TYPE "ACCOUNT_TYPE_NEW"
  USING (
    CASE
      WHEN "accountType"::text = 'PERSONAL' THEN 'USER'::"ACCOUNT_TYPE_NEW"
      WHEN "accountType"::text = 'BUSINESS' THEN 'FARMER'::"ACCOUNT_TYPE_NEW"
      ELSE 'USER'::"ACCOUNT_TYPE_NEW"
    END
  );

-- 5) Replace old enum with new enum
DROP TYPE "ACCOUNT_TYPE";
ALTER TYPE "ACCOUNT_TYPE_NEW" RENAME TO "ACCOUNT_TYPE";

-- 6) Restore default
ALTER TABLE "users" ALTER COLUMN "accountType" SET DEFAULT 'USER';
