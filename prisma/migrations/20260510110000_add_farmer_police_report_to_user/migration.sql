-- Add farmer registration police report metadata
ALTER TABLE "users"
ADD COLUMN "policeReportFilename" TEXT,
ADD COLUMN "policeReportUrl" TEXT;
