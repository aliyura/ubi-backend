-- Add CUSTOMER_SUPPORT role for users with read-only admin visibility
ALTER TYPE "USER_ROLE" ADD VALUE IF NOT EXISTS 'CUSTOMER_SUPPORT';
