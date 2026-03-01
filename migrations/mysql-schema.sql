-- HabilitFy MySQL Database Schema
-- Synced with shared/schema.ts (Drizzle ORM source of truth)
-- CRITICAL: Column names for shared enums use the ENUM name, not 'status'/'type'
-- Example: mysqlEnum('instructor_status', ...) → column is `instructor_status`, NOT `status`
-- Last sync: 2026-02-11

-- Sessions table (express-mysql-session compatible)
-- CRITICAL: expires must be INT (epoch), NOT TIMESTAMP
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `expires` INT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT,
  INDEX `IDX_session_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Capture Sessions table (face capture flow)
CREATE TABLE IF NOT EXISTS `capture_sessions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `session_token` VARCHAR(64) NOT NULL UNIQUE,
  `image_data` TEXT,
  `capture_session_status` ENUM('pending', 'completed', 'expired') NOT NULL DEFAULT 'pending',
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `email` VARCHAR(255) UNIQUE,
  `google_id` VARCHAR(255) UNIQUE,
  `first_name` VARCHAR(255),
  `last_name` VARCHAR(255),
  `profile_image_url` VARCHAR(500),
  `role` ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
  `admin_role` ENUM('master', 'manager', 'support') DEFAULT NULL,
  `kyc_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  `phone` VARCHAR(50),
  `cpf` VARCHAR(20),
  `cnpj` VARCHAR(20),
  `address_line` VARCHAR(500),
  `zip_code` VARCHAR(20),
  `neighborhood` VARCHAR(255),
  `city` VARCHAR(255),
  `state` VARCHAR(50),
  `lat` DECIMAL(10, 7),
  `lng` DECIMAL(10, 7),
  `is_blocked` TINYINT(1) NOT NULL DEFAULT 0,
  `blocked_at` TIMESTAMP NULL,
  `blocked_reason` TEXT,
  `blocked_by_admin_id` VARCHAR(36),
  `admin_notes` TEXT,
  `admin_notes_updated_at` TIMESTAMP NULL,
  `admin_notes_updated_by_admin_id` VARCHAR(36),
  `password` TEXT,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `verification_token` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin Logs table (aligned with Drizzle schema)
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `admin_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `target_id` VARCHAR(36),
  `changes` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Instructors table (SYNCED with Drizzle - all columns present)
CREATE TABLE IF NOT EXISTS `instructors` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `bio` TEXT,
  `price_per_hour` DECIMAL(10, 2) NOT NULL,
  `slot_duration_minutes` INT NOT NULL DEFAULT 50,
  `max_bookings_per_student` INT NOT NULL DEFAULT 0,
  `vehicle_model` VARCHAR(255) NOT NULL,
  `vehicle_year` VARCHAR(10),
  `vehicle_type` VARCHAR(100) NOT NULL,
  `vehicle_plate` VARCHAR(20),
  `rating` DECIMAL(3, 2) DEFAULT 0,
  `reviews_count` INT DEFAULT 0,
  `lat` DECIMAL(10, 7),
  `lng` DECIMAL(10, 7),
  `neighborhood` VARCHAR(255),
  `city` VARCHAR(255),
  `state` VARCHAR(50),
  `credential_number` VARCHAR(100),
  `credential_image_url` VARCHAR(500),
  `document_number` VARCHAR(100),
  `document_image_url` VARCHAR(500),
  `selfie_image_url` VARCHAR(500),
  `cnh_front_image_url` VARCHAR(500),
  `cnh_back_image_url` VARCHAR(500),
  `vehicle_image_url` VARCHAR(500),
  `vehicle_doc_image_url` VARCHAR(500),
  `vehicle_plate_image_url` VARCHAR(500),
  `vehicle_authorization_image_url` VARCHAR(500),
  `instructor_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `service_areas` TEXT,
  `pix_key` VARCHAR(255),
  `years_experience` INT DEFAULT 0,
  `languages` JSON,
  `specialties` JSON,
  `working_hours` VARCHAR(100),
  `response_time` VARCHAR(50),
  `gallery_images` JSON,
  `lessons_completed` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings table
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `student_id` VARCHAR(36) NOT NULL,
  `instructor_id` VARCHAR(36) NOT NULL,
  `date` TIMESTAMP NOT NULL,
  `duration` INT NOT NULL DEFAULT 50,
  `price` DECIMAL(10, 2) NOT NULL,
  `rent_vehicle` BOOLEAN DEFAULT FALSE,
  `vehicle_rental_price` DECIMAL(10, 2) DEFAULT 0,
  `total_price` DECIMAL(10, 2) NOT NULL,
  `booking_status` ENUM('pending', 'confirmed', 'paid', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `meeting_address` TEXT,
  `student_notes` TEXT,
  `payment_status` VARCHAR(50) DEFAULT 'pending',
  `payment_id` VARCHAR(255),
  `payment_provider` VARCHAR(100),
  `payment_url` VARCHAR(500),
  `payment_methods` JSON,
  `payment_dev_mode` BOOLEAN,
  `paid_at` TIMESTAMP NULL,
  `start_code` VARCHAR(10),
  `end_code` VARCHAR(10),
  `started_at` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  `cancelled_at` TIMESTAMP NULL,
  `cancelled_by_role` ENUM('student', 'instructor', 'admin'),
  `cancelled_by_user_id` VARCHAR(36),
  `cancel_reason` TEXT,
  `cancelled_minutes` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`),
  FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reviews table
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `booking_id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `instructor_id` VARCHAR(36) NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`),
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Availability table
CREATE TABLE IF NOT EXISTS `availability` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `instructor_id` VARCHAR(36) NOT NULL,
  `day_of_week` INT NOT NULL,
  `start_time` VARCHAR(10) NOT NULL,
  `end_time` VARCHAR(10) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Messages table
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `sender_id` VARCHAR(36) NOT NULL,
  `receiver_id` VARCHAR(36) NOT NULL,
  `booking_id` VARCHAR(36),
  `content` TEXT NOT NULL,
  `read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Disputes table
CREATE TABLE IF NOT EXISTS `disputes` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `booking_id` VARCHAR(36) NOT NULL,
  `opened_by_user_id` VARCHAR(36) NOT NULL,
  `opened_by_role` ENUM('student', 'instructor', 'admin') NOT NULL,
  `reason` TEXT NOT NULL,
  `dispute_status` ENUM('open', 'in_review', 'resolved') NOT NULL DEFAULT 'open',
  `dispute_resolution` ENUM('refund_student', 'release_instructor', 'split'),
  `resolved_by_user_id` VARCHAR(36),
  `resolved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`),
  FOREIGN KEY (`opened_by_user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin Settings table
CREATE TABLE IF NOT EXISTS `admin_settings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `platform_fee_percent` DECIMAL(5, 2) DEFAULT 0,
  `cancellation_fee_percent` DECIMAL(5, 2) DEFAULT 0,
  `cancellation_instructor_share_percent` DECIMAL(5, 2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transactions table
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `booking_id` VARCHAR(36),
  `transaction_type` ENUM('booking', 'withdrawal', 'refund', 'commission', 'affiliate', 'coupon') NOT NULL,
  `transaction_status` ENUM('pending', 'paid', 'processing', 'refunded', 'cancelled', 'failed') NOT NULL DEFAULT 'pending',
  `amount_gross` DECIMAL(10, 2) NOT NULL,
  `amount_net` DECIMAL(10, 2) NOT NULL,
  `gateway` VARCHAR(100),
  `payment_id` VARCHAR(255),
  `from_user_id` VARCHAR(36),
  `to_user_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`),
  FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wallets table
CREATE TABLE IF NOT EXISTS `wallets` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `balance` DECIMAL(10, 2) DEFAULT 0,
  `currency` VARCHAR(10) DEFAULT 'BRL',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wallet Entries table
CREATE TABLE IF NOT EXISTS `wallet_entries` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `wallet_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `wallet_entry_type` ENUM('credit', 'debit', 'refund', 'withdrawal', 'adjustment') NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `description` TEXT,
  `booking_id` VARCHAR(36),
  `transaction_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`),
  FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Withdrawals table
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'processed') NOT NULL DEFAULT 'pending',
  `destination_type` VARCHAR(50) DEFAULT 'pix',
  `destination_key` VARCHAR(255),
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL,
  `processed_by_user_id` VARCHAR(36),
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`processed_by_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payment Gateways table
CREATE TABLE IF NOT EXISTS `payment_gateways` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `provider` VARCHAR(100) NOT NULL,
  `api_key` TEXT,
  `status` VARCHAR(50) DEFAULT 'active',
  `is_default` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vehicles table
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `instructor_id` VARCHAR(36) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `year` INT NOT NULL,
  `plate` VARCHAR(20) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `vehicle_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `photo_front` TEXT,
  `photo_side` TEXT,
  `photo_back` TEXT,
  `photo_interior` TEXT,
  `document_crlv` TEXT,
  `document_lav` TEXT,
  `rejection_reason` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Support Tickets table
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `attachment_urls` JSON,
  `type` VARCHAR(50) NOT NULL,
  `ticket_status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Access Logs table
CREATE TABLE IF NOT EXISTS `user_access_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `session_id` VARCHAR(128),
  `ip_address` VARCHAR(80),
  `user_agent` TEXT,
  `device_type` VARCHAR(40),
  `browser` VARCHAR(80),
  `os` VARCHAR(80),
  `request_path` VARCHAR(255),
  `request_method` VARCHAR(10),
  `status_code` INT,
  `request_duration_ms` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `user_access_logs_user_created_idx` (`user_id`, `created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Integrations table
CREATE TABLE IF NOT EXISTS `integrations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `integration_status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `integration_environment` ENUM('development', 'production') NOT NULL DEFAULT 'production',
  `is_default` BOOLEAN DEFAULT FALSE,
  `fields` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `integrations_slug_env_idx` (`slug`, `integration_environment`),
  INDEX `integrations_category_env_idx` (`category`, `integration_environment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `type` VARCHAR(100),
  `title` VARCHAR(255),
  `message` TEXT,
  `data` JSON,
  `is_read` BOOLEAN DEFAULT FALSE,
  `read_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `notifications_user_idx` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Metadata table
CREATE TABLE IF NOT EXISTS `seed_metadata` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `version` VARCHAR(50),
  `duration_ms` INT,
  `rows_affected` INT,
  `status` VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Webhook Events table
CREATE TABLE IF NOT EXISTS `webhooks_events` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `event_id` VARCHAR(255) NOT NULL,
  `event_type` VARCHAR(100),
  `provider` VARCHAR(100) NOT NULL,
  `payload` JSON,
  `status` ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
  `processed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `webhooks_events_provider_event_idx` (`provider`, `event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- KYC Verifications table
CREATE TABLE IF NOT EXISTS `kyc_verifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `selfie_url` VARCHAR(500),
  `document_front_url` VARCHAR(500),
  `document_back_url` VARCHAR(500),
  `extracted_name` VARCHAR(255),
  `extracted_cpf` VARCHAR(20),
  `extracted_birth_date` TIMESTAMP NULL,
  `extracted_document_number` VARCHAR(100),
  `face_match_score` DECIMAL(5, 4),
  `face_match_passed` BOOLEAN DEFAULT FALSE,
  `liveness_score` DECIMAL(5, 4),
  `liveness_passed` BOOLEAN DEFAULT FALSE,
  `document_valid` BOOLEAN DEFAULT FALSE,
  `document_validation_details` JSON,
  `status` ENUM('pending', 'processing', 'approved', 'rejected', 'requires_review') NOT NULL DEFAULT 'pending',
  `rejection_reason` TEXT,
  `review_notes` TEXT,
  `reviewed_by_user_id` VARCHAR(36),
  `reviewed_at` TIMESTAMP NULL,
  `ip_address` VARCHAR(50),
  `user_agent` TEXT,
  `device_fingerprint` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin settings
INSERT INTO `admin_settings` (`id`, `platform_fee_percent`, `cancellation_fee_percent`, `cancellation_instructor_share_percent`)
VALUES (UUID(), 10.00, 20.00, 50.00);
