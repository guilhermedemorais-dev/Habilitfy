-- Migration: Fix kyc_verifications.status enum to match Drizzle schema
-- Date: 2026-05-27
-- Issue: Registration fails with "unknown column 'kyc_verification_status' in field list"
-- Root cause: Drizzle mysqlEnum name mismatch (fixed in kyc-schema.ts)
-- Secondary: Production DB has only 3 enum values, Drizzle schema expects 5

-- Update the enum to include 'processing' and 'requires_review' values
ALTER TABLE `kyc_verifications`
  MODIFY COLUMN `status` ENUM('pending', 'processing', 'approved', 'rejected', 'requires_review') NOT NULL DEFAULT 'pending';
