-- Align databases bootstrapped from older migrations/mysql-schema.sql with
-- the Drizzle runtime schema in shared/schema.ts.
-- This migration only renames legacy enum columns when the legacy column exists
-- and the target Drizzle column does not exist.

SET @has_capture_session_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'capture_sessions'
    AND COLUMN_NAME = 'capture_session_status'
);
SET @has_capture_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'capture_sessions'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(
  @has_capture_session_status > 0 AND @has_capture_status = 0,
  'ALTER TABLE `capture_sessions` CHANGE COLUMN `capture_session_status` `status` ENUM(''pending'',''completed'',''expired'') NOT NULL DEFAULT ''pending''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_instructor_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'instructors'
    AND COLUMN_NAME = 'instructor_status'
);
SET @has_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'instructors'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(
  @has_instructor_status > 0 AND @has_status = 0,
  'ALTER TABLE `instructors` CHANGE COLUMN `instructor_status` `status` ENUM(''pending'',''approved'',''rejected'') NOT NULL DEFAULT ''pending''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_booking_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'booking_status'
);
SET @has_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(
  @has_booking_status > 0 AND @has_status = 0,
  'ALTER TABLE `bookings` CHANGE COLUMN `booking_status` `status` ENUM(''pending'',''confirmed'',''paid'',''completed'',''cancelled'') NOT NULL DEFAULT ''pending''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_dispute_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'disputes'
    AND COLUMN_NAME = 'dispute_status'
);
SET @has_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'disputes'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(
  @has_dispute_status > 0 AND @has_status = 0,
  'ALTER TABLE `disputes` CHANGE COLUMN `dispute_status` `status` ENUM(''open'',''in_review'',''resolved'') NOT NULL DEFAULT ''open''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_dispute_resolution := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'disputes'
    AND COLUMN_NAME = 'dispute_resolution'
);
SET @has_resolution := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'disputes'
    AND COLUMN_NAME = 'resolution'
);
SET @sql := IF(
  @has_dispute_resolution > 0 AND @has_resolution = 0,
  'ALTER TABLE `disputes` CHANGE COLUMN `dispute_resolution` `resolution` ENUM(''refund_student'',''release_instructor'',''split'') NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_transaction_type := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'transaction_type'
);
SET @has_type := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'type'
);
SET @sql := IF(
  @has_transaction_type > 0 AND @has_type = 0,
  'ALTER TABLE `transactions` CHANGE COLUMN `transaction_type` `type` ENUM(''booking'',''withdrawal'',''refund'',''commission'',''affiliate'',''coupon'') NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_transaction_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'transaction_status'
);
SET @has_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(
  @has_transaction_status > 0 AND @has_status = 0,
  'ALTER TABLE `transactions` CHANGE COLUMN `transaction_status` `status` ENUM(''pending'',''paid'',''processing'',''refunded'',''cancelled'',''failed'') NOT NULL DEFAULT ''pending''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_wallet_entry_type := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wallet_entries'
    AND COLUMN_NAME = 'wallet_entry_type'
);
SET @has_type := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wallet_entries'
    AND COLUMN_NAME = 'type'
);
SET @sql := IF(
  @has_wallet_entry_type > 0 AND @has_type = 0,
  'ALTER TABLE `wallet_entries` CHANGE COLUMN `wallet_entry_type` `type` ENUM(''credit'',''debit'',''refund'',''withdrawal'',''adjustment'') NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_vehicle_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'vehicles'
    AND COLUMN_NAME = 'vehicle_status'
);
SET @has_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'vehicles'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(
  @has_vehicle_status > 0 AND @has_status = 0,
  'ALTER TABLE `vehicles` CHANGE COLUMN `vehicle_status` `status` ENUM(''pending'',''approved'',''rejected'') NOT NULL DEFAULT ''pending''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_ticket_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'support_tickets'
    AND COLUMN_NAME = 'ticket_status'
);
SET @has_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'support_tickets'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(
  @has_ticket_status > 0 AND @has_status = 0,
  'ALTER TABLE `support_tickets` CHANGE COLUMN `ticket_status` `status` ENUM(''open'',''in_progress'',''resolved'',''closed'') NOT NULL DEFAULT ''open''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_integration_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'integrations'
    AND COLUMN_NAME = 'integration_status'
);
SET @has_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'integrations'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(
  @has_integration_status > 0 AND @has_status = 0,
  'ALTER TABLE `integrations` CHANGE COLUMN `integration_status` `status` ENUM(''active'',''inactive'') NOT NULL DEFAULT ''active''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_integration_environment := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'integrations'
    AND COLUMN_NAME = 'integration_environment'
);
SET @has_environment := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'integrations'
    AND COLUMN_NAME = 'environment'
);
SET @sql := IF(
  @has_integration_environment > 0 AND @has_environment = 0,
  'ALTER TABLE `integrations` CHANGE COLUMN `integration_environment` `environment` ENUM(''development'',''production'') NOT NULL DEFAULT ''production''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
