-- Fix Auth Columns - Required for login to work
-- Run this on the PRODUCTION database before deploying

-- 1. Add is_verified column (causes "Unknown column 'is_verified'" error)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_verified` BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add admin_role column (required for admin RBAC)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `admin_role` ENUM('master', 'manager', 'support') DEFAULT NULL;

-- 3. Add verification_token column
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `verification_token` VARCHAR(255) DEFAULT NULL;

-- 4. Ensure sessions table exists with correct schema
-- Drop if exists (express-mysql-session will recreate with correct types)
DROP TABLE IF EXISTS `sessions`;

-- 5. Create admin_logs table if not exists
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `admin_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `target_type` VARCHAR(100) DEFAULT NULL,
  `target_id` VARCHAR(36) DEFAULT NULL,
  `details` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_admin_logs_admin_id` (`admin_id`),
  INDEX `idx_admin_logs_created_at` (`created_at`)
);

-- 6. Update the master admin user
UPDATE `users` SET `admin_role` = 'master', `is_verified` = TRUE 
WHERE `email` = 'guilhermemp.business@gmail.com' AND `role` = 'admin';
