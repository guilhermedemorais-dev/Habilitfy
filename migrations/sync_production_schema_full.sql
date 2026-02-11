-- =========================================================================
-- SCRIPT DE SINCRONIZAÇÃO TOTAL DO BANCO DE DADOS (SAFE & IDEMPOTENT)
-- Executa a verificação e criação de TABELAS e COLUNAS ausentes.
-- =========================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sync_full_schema //

CREATE PROCEDURE sync_full_schema()
BEGIN
    -- =====================================================================
    -- TABELA: USERS (Campos faltantes para Login/Auth)
    -- =====================================================================
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'google_id') THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'kyc_status') THEN
        ALTER TABLE users ADD COLUMN kyc_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved';
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'admin_role') THEN
        ALTER TABLE users ADD COLUMN admin_role ENUM('master', 'manager', 'support') DEFAULT NULL;
    END IF;
    
    -- =====================================================================
    -- TABELA: INSTRUCTORS (Campos da Fase 2.5 - Perfil Completo)
    -- =====================================================================
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'instructors' AND COLUMN_NAME = 'pix_key') THEN
        ALTER TABLE instructors ADD COLUMN pix_key VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'instructors' AND COLUMN_NAME = 'years_experience') THEN
        ALTER TABLE instructors ADD COLUMN years_experience INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'instructors' AND COLUMN_NAME = 'languages') THEN
        ALTER TABLE instructors ADD COLUMN languages JSON;
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'instructors' AND COLUMN_NAME = 'specialties') THEN
        ALTER TABLE instructors ADD COLUMN specialties JSON;
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'instructors' AND COLUMN_NAME = 'working_hours') THEN
        ALTER TABLE instructors ADD COLUMN working_hours VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'instructors' AND COLUMN_NAME = 'response_time') THEN
        ALTER TABLE instructors ADD COLUMN response_time VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'instructors' AND COLUMN_NAME = 'gallery_images') THEN
        ALTER TABLE instructors ADD COLUMN gallery_images JSON;
    END IF;

    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'instructors' AND COLUMN_NAME = 'lessons_completed') THEN
        ALTER TABLE instructors ADD COLUMN lessons_completed INT DEFAULT 0;
    END IF;

    -- =====================================================================
    -- TABELAS NOVAS (Se não existirem, cria!)
    -- =====================================================================
    
    -- TABELA: ADMIN_SETTINGS
    IF NOT EXISTS (SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_settings') THEN
        CREATE TABLE `admin_settings` (
            `id` varchar(36) NOT NULL DEFAULT (UUID()),
            `platform_fee_percent` decimal(5,2) DEFAULT '0.00',
            `cancellation_fee_percent` decimal(5,2) DEFAULT '0.00',
            `cancellation_instructor_share_percent` decimal(5,2) DEFAULT '0.00',
            `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        );
    END IF;

    -- TABELA: INTEGRATIONS (Essencial para pagamentos)
    IF NOT EXISTS (SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'integrations') THEN
        CREATE TABLE `integrations` (
            `id` varchar(36) NOT NULL DEFAULT (UUID()),
            `name` varchar(255) NOT NULL,
            `slug` varchar(100) NOT NULL,
            `category` varchar(100) NOT NULL,
            `status` enum('active','inactive') NOT NULL DEFAULT 'active',
            `environment` enum('development','production') NOT NULL DEFAULT 'production',
            `is_default` tinyint(1) DEFAULT '0',
            `fields` json DEFAULT NULL,
            `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `integrations_slug_env_idx` (`slug`,`environment`),
            KEY `integrations_category_env_idx` (`category`,`environment`)
        );
    END IF;

    -- TABELA: PAYMENT_GATEWAYS
    IF NOT EXISTS (SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_gateways') THEN
        CREATE TABLE `payment_gateways` (
            `id` varchar(36) NOT NULL DEFAULT (UUID()),
            `provider` varchar(100) NOT NULL,
            `api_key` text,
            `status` varchar(50) DEFAULT 'active',
            `is_default` tinyint(1) DEFAULT '0',
            `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        );
    END IF;

    -- TABELA: ADMIN_LOGS
    IF NOT EXISTS (SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_logs') THEN
        CREATE TABLE `admin_logs` (
            `id` varchar(36) NOT NULL DEFAULT (UUID()),
            `admin_id` varchar(36) NOT NULL,
            `action` varchar(255) NOT NULL,
            `target_id` varchar(36) DEFAULT NULL,
            `changes` json DEFAULT NULL,
            `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        );
    END IF;

    -- TABELA: SUPPORT_TICKETS
    IF NOT EXISTS (SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets') THEN
        CREATE TABLE `support_tickets` (
            `id` varchar(36) NOT NULL DEFAULT (UUID()),
            `user_id` varchar(36) NOT NULL,
            `subject` varchar(255) NOT NULL,
            `message` text NOT NULL,
            `attachment_urls` json DEFAULT NULL,
            `type` varchar(50) NOT NULL,
            `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
            `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        );
    END IF;

END //

DELIMITER ;

-- Executa a sincronização completa
CALL sync_full_schema();

-- Limpa a procedure
DROP PROCEDURE IF EXISTS sync_full_schema;
