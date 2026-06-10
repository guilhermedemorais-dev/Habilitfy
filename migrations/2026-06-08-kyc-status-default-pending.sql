-- Migration: Change users.kyc_status default from 'approved' to 'pending'
-- Date: 2026-06-08
-- Reason: New accounts must now require manual KYC approval before they can
--         book lessons (see server/routes.ts booking gate). Existing rows are
--         NOT modified — only the column DEFAULT changes, so users already
--         marked 'approved' stay approved.
-- Schema source: shared/schema.ts (kycStatus: kycStatusEnum.default("pending"))

ALTER TABLE `users`
  MODIFY COLUMN `kyc_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending';
