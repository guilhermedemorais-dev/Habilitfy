-- Add critical read-path indexes for the pre-deploy DB hardening pass.
-- Each index is guarded by INFORMATION_SCHEMA.STATISTICS so this script can be
-- rerun safely on MySQL/MariaDB databases that already contain some indexes.

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'users_role_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `users` ADD INDEX `users_role_created_idx` (`role`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'users_kyc_status_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `users` ADD INDEX `users_kyc_status_idx` (`kyc_status`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'instructors'
    AND INDEX_NAME = 'instructors_user_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `instructors` ADD INDEX `instructors_user_idx` (`user_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'instructors'
    AND INDEX_NAME = 'instructors_status_city_state_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `instructors` ADD INDEX `instructors_status_city_state_idx` (`status`, `city`, `state`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND INDEX_NAME = 'bookings_student_date_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `bookings` ADD INDEX `bookings_student_date_idx` (`student_id`, `date`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND INDEX_NAME = 'bookings_instructor_date_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `bookings` ADD INDEX `bookings_instructor_date_idx` (`instructor_id`, `date`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND INDEX_NAME = 'bookings_instructor_date_status_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `bookings` ADD INDEX `bookings_instructor_date_status_idx` (`instructor_id`, `date`, `status`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND INDEX_NAME = 'bookings_status_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `bookings` ADD INDEX `bookings_status_created_idx` (`status`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND INDEX_NAME = 'bookings_payment_id_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `bookings` ADD INDEX `bookings_payment_id_idx` (`payment_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_booking_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `transactions` ADD INDEX `transactions_booking_idx` (`booking_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_status_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `transactions` ADD INDEX `transactions_status_created_idx` (`status`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_to_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `transactions` ADD INDEX `transactions_to_created_idx` (`to_user_id`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_from_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `transactions` ADD INDEX `transactions_from_created_idx` (`from_user_id`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_payment_id_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `transactions` ADD INDEX `transactions_payment_id_idx` (`payment_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wallet_entries'
    AND INDEX_NAME = 'wallet_entries_wallet_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `wallet_entries` ADD INDEX `wallet_entries_wallet_created_idx` (`wallet_id`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wallet_entries'
    AND INDEX_NAME = 'wallet_entries_user_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `wallet_entries` ADD INDEX `wallet_entries_user_created_idx` (`user_id`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wallet_entries'
    AND INDEX_NAME = 'wallet_entries_transaction_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `wallet_entries` ADD INDEX `wallet_entries_transaction_idx` (`transaction_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'withdrawals'
    AND INDEX_NAME = 'withdrawals_status_requested_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `withdrawals` ADD INDEX `withdrawals_status_requested_idx` (`status`, `requested_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'withdrawals'
    AND INDEX_NAME = 'withdrawals_user_requested_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `withdrawals` ADD INDEX `withdrawals_user_requested_idx` (`user_id`, `requested_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'messages'
    AND INDEX_NAME = 'messages_sender_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `messages` ADD INDEX `messages_sender_created_idx` (`sender_id`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'messages'
    AND INDEX_NAME = 'messages_receiver_read_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `messages` ADD INDEX `messages_receiver_read_created_idx` (`receiver_id`, `read`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'messages'
    AND INDEX_NAME = 'messages_booking_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `messages` ADD INDEX `messages_booking_created_idx` (`booking_id`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reviews'
    AND INDEX_NAME = 'reviews_booking_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `reviews` ADD INDEX `reviews_booking_idx` (`booking_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reviews'
    AND INDEX_NAME = 'reviews_instructor_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `reviews` ADD INDEX `reviews_instructor_created_idx` (`instructor_id`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reviews'
    AND INDEX_NAME = 'reviews_student_created_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `reviews` ADD INDEX `reviews_student_created_idx` (`student_id`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'availability'
    AND INDEX_NAME = 'availability_instructor_day_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `availability` ADD INDEX `availability_instructor_day_idx` (`instructor_id`, `day_of_week`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
