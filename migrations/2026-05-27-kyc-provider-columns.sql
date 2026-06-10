-- Migration: Add provider tracking columns to kyc_verifications
-- Date: 2026-05-27
-- PRD: KYC Hardening Fase 1 — P0 Segurança
-- Purpose: Track AI provider status for fail-safe auditing

ALTER TABLE `kyc_verifications`
  ADD COLUMN `provider_status` VARCHAR(50) DEFAULT NULL COMMENT 'success | unavailable | error | timeout | parse_error',
  ADD COLUMN `provider_error` TEXT DEFAULT NULL COMMENT 'Internal technical error details for auditing';
