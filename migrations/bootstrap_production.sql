-- =======================================================
-- SCRIPT DE BOOTSTRAP DE PRODUÇÃO (AGORA SIM, COMPLETO)
-- =======================================================
-- Este script assume que o banco pode estar vazio.
-- Ele cria a tabela de usuários se não existir, e depois ajusta.

-- 1. Criação da Tabela de Usuários (Base Essencial)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Colunas extras que vamos garantir logo abaixo
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `admin_role` ENUM('master', 'manager', 'support') DEFAULT NULL,
  `verification_token` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
);

-- 2. Garantia de Colunas Extras (Caso a tabela já existisse sem elas)
-- Se a tabela foi criada acima, isso aqui não faz nada (e não dá erro).
-- Se a tabela já existia (do deploy antigo), isso adiciona o que falta.
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_verified` BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `admin_role` ENUM('master', 'manager', 'support') DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `verification_token` VARCHAR(255) DEFAULT NULL;

-- 3. Tabela de Logs de Auditoria
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

-- 4. Tabela de Integrações (Cofre de APIs)
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

-- 5. Configuração OpenAI
INSERT IGNORE INTO `integrations` (`id`, `name`, `slug`, `category`, `status`, `environment`, `is_default`, `fields`)
VALUES (
  UUID(), 'OpenAI Production', 'openai', 'ai', 'inactive', 'production', 1, 
  '[{"key": "apiKey", "label": "API Key", "type": "secret", "required": true, "value": ""}, {"key": "organization", "label": "Organization ID", "type": "text", "required": false, "value": ""}]'
);

-- 6. Configuração AbacatePay (Manter como legado/inativo)
INSERT IGNORE INTO `integrations` (`id`, `name`, `slug`, `category`, `status`, `environment`, `is_default`, `fields`)
VALUES (
  UUID(), 'AbacatePay Production', 'abacatepay', 'payment', 'inactive', 'production', 0,
  '[{"key": "apiKey", "label": "API Key", "type": "secret", "required": true, "value": ""}, {"key": "baseUrl", "label": "Base URL", "type": "url", "required": false, "value": "https://api.abacatepay.com"}, {"key": "devMode", "label": "Modo Desenvolvimento", "type": "boolean", "required": false, "value": "false"}]'
);

-- 7. Configuração Stripe (Novo Padrão)
INSERT IGNORE INTO `integrations` (`id`, `name`, `slug`, `category`, `status`, `environment`, `is_default`, `fields`)
VALUES (
  UUID(), 'Stripe Payment', 'stripe', 'payment', 'active', 'production', 1,
  '[{"key": "apiKey", "label": "Secret Key (sk_...)", "type": "secret", "required": true, "value": ""}, {"key": "webhookSecret", "label": "Webhook Secret (whsec_...)", "type": "secret", "required": true, "value": ""}]'
);
