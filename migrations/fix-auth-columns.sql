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

-- 7. Ensure integrations table exists and has initial data
CREATE TABLE IF NOT EXISTS `integrations` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `environment` ENUM('development', 'production') NOT NULL DEFAULT 'production',
  `is_default` BOOLEAN DEFAULT FALSE,
  `fields` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `integrations_slug_env_idx` (`slug`, `environment`),
  INDEX `integrations_category_env_idx` (`category`, `environment`)
);

-- Insert OpenAI (Inactive by default on Production)
INSERT IGNORE INTO `integrations` (`id`, `name`, `slug`, `category`, `status`, `environment`, `is_default`, `fields`)
VALUES (
  UUID(), 'OpenAI Production', 'openai', 'ai', 'inactive', 'production', 1, 
  '[{"key": "apiKey", "label": "API Key", "type": "secret", "required": true, "value": ""}, {"key": "organization", "label": "Organization ID", "type": "text", "required": false, "value": ""}]'
);

-- Insert AbacatePay (Inactive by default on Production)
INSERT IGNORE INTO `integrations` (`id`, `name`, `slug`, `category`, `status`, `environment`, `is_default`, `fields`)
VALUES (
  UUID(), 'AbacatePay Production', 'abacatepay', 'payment', 'inactive', 'production', 1,
  '[{"key": "apiKey", "label": "API Key", "type": "secret", "required": true, "value": ""}, {"key": "baseUrl", "label": "Base URL", "type": "url", "required": false, "value": "https://api.abacatepay.com"}, {"key": "devMode", "label": "Modo Desenvolvimento", "type": "boolean", "required": false, "value": "false"}]'
);
