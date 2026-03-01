-- Align legacy withdrawals tables with the runtime Drizzle schema.
-- Safe target contract:
--   id, user_id, amount, status, destination_type, destination_key,
--   requested_at, processed_at, processed_by_user_id, notes, created_at, updated_at

SET @has_withdrawal_status := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'withdrawals'
    AND COLUMN_NAME = 'withdrawal_status'
);

SET @rename_status_sql := IF(
  @has_withdrawal_status > 0,
  'ALTER TABLE `withdrawals` CHANGE COLUMN `withdrawal_status` `status` ENUM(''pending'',''approved'',''rejected'',''processed'') NOT NULL DEFAULT ''pending''',
  'SELECT 1'
);
PREPARE stmt FROM @rename_status_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_pix_key := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'withdrawals'
    AND COLUMN_NAME = 'pix_key'
);

SET @rename_key_sql := IF(
  @has_pix_key > 0,
  'ALTER TABLE `withdrawals` CHANGE COLUMN `pix_key` `destination_key` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @rename_key_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `withdrawals`
  MODIFY COLUMN `amount` DECIMAL(10, 2) NOT NULL,
  MODIFY COLUMN `status` ENUM('pending', 'processing', 'completed', 'failed', 'approved', 'rejected', 'processed') NOT NULL DEFAULT 'pending';

SET @has_destination_type := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'withdrawals'
    AND COLUMN_NAME = 'destination_type'
);

SET @add_destination_type_sql := IF(
  @has_destination_type = 0,
  'ALTER TABLE `withdrawals` ADD COLUMN `destination_type` VARCHAR(50) DEFAULT ''pix'' AFTER `status`',
  'SELECT 1'
);
PREPARE stmt FROM @add_destination_type_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_requested_at := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'withdrawals'
    AND COLUMN_NAME = 'requested_at'
);

SET @add_requested_at_sql := IF(
  @has_requested_at = 0,
  'ALTER TABLE `withdrawals` ADD COLUMN `requested_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER `destination_key`',
  'SELECT 1'
);
PREPARE stmt FROM @add_requested_at_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_processed_by_user_id := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'withdrawals'
    AND COLUMN_NAME = 'processed_by_user_id'
);

SET @add_processed_by_user_id_sql := IF(
  @has_processed_by_user_id = 0,
  'ALTER TABLE `withdrawals` ADD COLUMN `processed_by_user_id` VARCHAR(36) NULL AFTER `processed_at`',
  'SELECT 1'
);
PREPARE stmt FROM @add_processed_by_user_id_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_notes := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'withdrawals'
    AND COLUMN_NAME = 'notes'
);

SET @add_notes_sql := IF(
  @has_notes = 0,
  'ALTER TABLE `withdrawals` ADD COLUMN `notes` TEXT NULL AFTER `processed_by_user_id`',
  'SELECT 1'
);
PREPARE stmt FROM @add_notes_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `withdrawals`
SET `status` = CASE `status`
  WHEN 'processing' THEN 'approved'
  WHEN 'completed' THEN 'processed'
  WHEN 'failed' THEN 'rejected'
  ELSE `status`
END;

UPDATE `withdrawals`
SET `destination_type` = 'pix'
WHERE `destination_type` IS NULL OR TRIM(`destination_type`) = '';

UPDATE `withdrawals`
SET `requested_at` = `created_at`
WHERE `requested_at` IS NULL;

ALTER TABLE `withdrawals`
  MODIFY COLUMN `status` ENUM('pending', 'approved', 'rejected', 'processed') NOT NULL DEFAULT 'pending';

SET @has_processed_by_fk := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'withdrawals'
    AND COLUMN_NAME = 'processed_by_user_id'
    AND REFERENCED_TABLE_NAME = 'users'
);

SET @add_processed_by_fk_sql := IF(
  @has_processed_by_fk = 0,
  'ALTER TABLE `withdrawals` ADD CONSTRAINT `fk_withdrawals_processed_by_user` FOREIGN KEY (`processed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @add_processed_by_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
