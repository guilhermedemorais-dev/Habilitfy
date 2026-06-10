-- Migration: KYC Hardening — Phases 2-5
-- Date: 2026-05-27
-- PRD: docs.prd/kyc-hardening-juridico-operacional.md

-- ============================================================
-- Phase 2 — LGPD: Consent table
-- ============================================================

CREATE TABLE IF NOT EXISTS `kyc_consents` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `consent_version` VARCHAR(20) NOT NULL,
  `policy_version` VARCHAR(20) NOT NULL,
  `consent_text_hash` VARCHAR(64) NOT NULL,
  `accepted` BOOLEAN NOT NULL DEFAULT FALSE,
  `accepted_at` TIMESTAMP NULL,
  `ip_address` VARCHAR(50),
  `user_agent` TEXT,
  `device_fingerprint` VARCHAR(255),
  `source_screen` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_kyc_consents_user` (`user_id`),
  INDEX `idx_kyc_consents_version` (`consent_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Phase 3 — Auditoria: Audit events table (immutable)
-- ============================================================

CREATE TABLE IF NOT EXISTS `kyc_audit_events` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `admin_id` VARCHAR(36) DEFAULT NULL,
  `kyc_verification_id` VARCHAR(36) DEFAULT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `previous_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) DEFAULT NULL,
  `reason_code` VARCHAR(100) DEFAULT NULL,
  `reason_text` TEXT DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_kyc_audit_user` (`user_id`),
  INDEX `idx_kyc_audit_event_type` (`event_type`),
  INDEX `idx_kyc_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Phase 4 — Jurídico: Legal holds table
-- ============================================================

CREATE TABLE IF NOT EXISTS `kyc_legal_holds` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `reason` TEXT NOT NULL,
  `protocol` VARCHAR(100) DEFAULT NULL,
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `released_by` VARCHAR(36) DEFAULT NULL,
  `released_at` TIMESTAMP NULL,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX `idx_kyc_legal_holds_user` (`user_id`),
  INDEX `idx_kyc_legal_holds_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Phase 4 — Jurídico: Dossier exports table
-- ============================================================

CREATE TABLE IF NOT EXISTS `kyc_dossier_exports` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `exported_by` VARCHAR(36) NOT NULL,
  `reason` TEXT NOT NULL,
  `protocol` VARCHAR(100) DEFAULT NULL,
  `export_hash` VARCHAR(64) NOT NULL,
  `exported_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  INDEX `idx_kyc_dossier_user` (`user_id`),
  INDEX `idx_kyc_dossier_exported` (`exported_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Phase 4+5 — New columns on kyc_verifications
-- MySQL 8.4: ADD COLUMN IF NOT EXISTS not supported.
-- These ALTERs are safe: they will fail gracefully if columns exist.
-- Run each individually in production if needed.
-- ============================================================

-- Safe column additions (ignore errors if already exist)
SET @sql = (SELECT IF(
  EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kyc_verifications' AND COLUMN_NAME='consent_id'),
  'SELECT 1',
  'ALTER TABLE kyc_verifications ADD COLUMN consent_id VARCHAR(36) DEFAULT NULL'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kyc_verifications' AND COLUMN_NAME='file_hash_selfie'),
  'SELECT 1',
  'ALTER TABLE kyc_verifications ADD COLUMN file_hash_selfie VARCHAR(64) DEFAULT NULL'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kyc_verifications' AND COLUMN_NAME='file_hash_document_front'),
  'SELECT 1',
  'ALTER TABLE kyc_verifications ADD COLUMN file_hash_document_front VARCHAR(64) DEFAULT NULL'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kyc_verifications' AND COLUMN_NAME='file_hash_document_back'),
  'SELECT 1',
  'ALTER TABLE kyc_verifications ADD COLUMN file_hash_document_back VARCHAR(64) DEFAULT NULL'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kyc_verifications' AND COLUMN_NAME='reason_code'),
  'SELECT 1',
  'ALTER TABLE kyc_verifications ADD COLUMN reason_code VARCHAR(100) DEFAULT NULL'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kyc_verifications' AND COLUMN_NAME='risk_level'),
  'SELECT 1',
  "ALTER TABLE kyc_verifications ADD COLUMN risk_level VARCHAR(20) DEFAULT NULL COMMENT 'low | medium | high | critical'"
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kyc_verifications' AND COLUMN_NAME='legal_hold'),
  'SELECT 1',
  'ALTER TABLE kyc_verifications ADD COLUMN legal_hold BOOLEAN DEFAULT FALSE'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
