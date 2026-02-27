-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: habilitfy
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.2
-- SECURITY NOTICE:
-- This repository copy is sanitized and must not contain production data rows.
-- `INSERT INTO` statements were removed to avoid PII/secret exposure.

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_logs`
--

-- ========================================
-- Table: admin_logs
-- ========================================

DROP TABLE IF EXISTS `admin_logs`;

CREATE TABLE `admin_logs` (
  `id` VARCHAR(36) NOT NULL,
  `admin_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `target_id` VARCHAR(36),
  `changes` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_admin_id` ON `admin_logs`(`admin_id`);

-- Foreign Keys
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `fk_admin_logs_admin` FOREIGN KEY (`admin_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `admin_logs`
--

LOCK TABLES `admin_logs` WRITE;
/*!40000 ALTER TABLE `admin_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_settings`
--

-- ========================================
-- Table: admin_settings
-- ========================================

DROP TABLE IF EXISTS `admin_settings`;

CREATE TABLE `admin_settings` (
  `id` VARCHAR(36) NOT NULL,
  `key` VARCHAR(255),
  `value` TEXT,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_settings`
--

LOCK TABLES `admin_settings` WRITE;
/*!40000 ALTER TABLE `admin_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `availability`
--

-- ========================================
-- Table: availability
-- ========================================

DROP TABLE IF EXISTS `availability`;

CREATE TABLE `availability` (
  `id` VARCHAR(36) NOT NULL,
  `instructor_id` VARCHAR(36) NOT NULL,
  `day_of_week` INT NOT NULL COMMENT '0-6',
  `start_time` VARCHAR(10) NOT NULL,
  `end_time` VARCHAR(10) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_instructor_id` ON `availability`(`instructor_id`);

-- Foreign Keys
ALTER TABLE `availability`
  ADD CONSTRAINT `fk_availability_instructor` FOREIGN KEY (`instructor_id`) 
  REFERENCES `instructors`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `availability`
--

LOCK TABLES `availability` WRITE;
/*!40000 ALTER TABLE `availability` DISABLE KEYS */;
/*!40000 ALTER TABLE `availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--


-- ========================================
-- Table: capture_sessions
-- ========================================

DROP TABLE IF EXISTS `capture_sessions`;

CREATE TABLE `capture_sessions` (
  `id` VARCHAR(36) NOT NULL,
  `session_token` VARCHAR(64) NOT NULL,
  `image_data` TEXT,
  `status` ENUM('pending', 'completed', 'expired') NOT NULL DEFAULT 'pending',
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `instructor_id` VARCHAR(36) NOT NULL,
  `date` TIMESTAMP NOT NULL,
  `duration` INT DEFAULT 50,
  `price` DECIMAL(10, 2) NOT NULL,
  `rent_vehicle` TINYINT(1) DEFAULT 0,
  `vehicle_rental_price` DECIMAL(10, 2) DEFAULT 0.00,
  `total_price` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'confirmed', 'paid', 'completed', 'cancelled') DEFAULT 'pending',
  `meeting_address` TEXT,
  `student_notes` TEXT,
  `payment_status` VARCHAR(50) DEFAULT 'pending',
  `payment_id` VARCHAR(255),
  `payment_provider` VARCHAR(100),
  `payment_url` VARCHAR(500),
  `payment_methods` JSON,
  `payment_dev_mode` TINYINT(1),
  `paid_at` TIMESTAMP,
  `start_code` VARCHAR(10),
  `end_code` VARCHAR(10),
  `started_at` TIMESTAMP,
  `completed_at` TIMESTAMP,
  `cancelled_at` TIMESTAMP,
  `cancelled_by_role` ENUM('student', 'instructor', 'admin'),
  `cancelled_by_user_id` VARCHAR(36),
  `cancel_reason` TEXT,
  `cancelled_minutes` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_student_id` ON `bookings`(`student_id`);
CREATE INDEX `idx_instructor_id` ON `bookings`(`instructor_id`);
CREATE INDEX `idx_cancelled_by_user_id` ON `bookings`(`cancelled_by_user_id`);

-- Foreign Keys
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_student` FOREIGN KEY (`student_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_instructor` FOREIGN KEY (`instructor_id`) 
  REFERENCES `instructors`(`id`) ON DELETE CASCADE;

ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_cancelled_by` FOREIGN KEY (`cancelled_by_user_id`) 
  REFERENCES `users`(`id`) ON DELETE SET NULL;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disputes`
--

-- ========================================
-- Table: disputes
-- ========================================

DROP TABLE IF EXISTS `disputes`;

CREATE TABLE `disputes` (
  `id` VARCHAR(36) NOT NULL,
  `booking_id` VARCHAR(36) NOT NULL,
  `opened_by` VARCHAR(36) NOT NULL,
  `reason` TEXT,
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  `resolution` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_booking_id` ON `disputes`(`booking_id`);
CREATE INDEX `idx_opened_by` ON `disputes`(`opened_by`);

-- Foreign Keys
ALTER TABLE `disputes`
  ADD CONSTRAINT `fk_disputes_booking` FOREIGN KEY (`booking_id`) 
  REFERENCES `bookings`(`id`) ON DELETE CASCADE;

ALTER TABLE `disputes`
  ADD CONSTRAINT `fk_disputes_opener` FOREIGN KEY (`opened_by`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `disputes`
--

LOCK TABLES `disputes` WRITE;
/*!40000 ALTER TABLE `disputes` DISABLE KEYS */;
/*!40000 ALTER TABLE `disputes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instructors`
--

DROP TABLE IF EXISTS `instructors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instructors` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `bio` TEXT,
  `price_per_hour` DECIMAL(10, 2),
  `slot_duration_minutes` INT DEFAULT 50,
  `max_bookings_per_student` INT DEFAULT 0,
  `vehicle_model` VARCHAR(100),
  `vehicle_year` VARCHAR(10),
  `vehicle_type` ENUM('car', 'motorcycle', 'both'),
  `vehicle_plate` VARCHAR(20),
  `rating` DECIMAL(3, 2) DEFAULT 0.00,
  `reviews_count` INT DEFAULT 0,
  `lat` DECIMAL(10, 7),
  `lng` DECIMAL(10, 7),
  `neighborhood` VARCHAR(255),
  `city` VARCHAR(255),
  `state` VARCHAR(50),
  `credential_number` VARCHAR(50),
  `credential_image_url` VARCHAR(500),
  `document_number` VARCHAR(100),
  `document_image_url` VARCHAR(500),
  `vehicle_doc_image_url` VARCHAR(500),
  `selfie_image_url` VARCHAR(500),
  `cnh_front_image_url` VARCHAR(500),
  `cnh_back_image_url` VARCHAR(500),
  `vehicle_image_url` VARCHAR(500),
  `vehicle_plate_image_url` VARCHAR(500),
  `vehicle_authorization_image_url` VARCHAR(500),
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `service_areas` TEXT,
  `pix_key` VARCHAR(255),
  `years_experience` INT DEFAULT 0,
  `languages` JSON,
  `specialties` JSON,
  `working_hours` VARCHAR(100),
  `response_time` VARCHAR(50),
  `gallery_images` JSON,
  `lessons_completed` INT DEFAULT 0,
  `email` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_user_id` ON `instructors`(`user_id`);

-- Foreign Keys
ALTER TABLE `instructors`
  ADD CONSTRAINT `fk_instructors_user` FOREIGN KEY (`user_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instructors`
--

LOCK TABLES `instructors` WRITE;
/*!40000 ALTER TABLE `instructors` DISABLE KEYS */;
/*!40000 ALTER TABLE `instructors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integrations`
--

-- ========================================
-- Table: integrations
-- ========================================

DROP TABLE IF EXISTS `integrations`;

CREATE TABLE `integrations` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `environment` ENUM('development', 'production') NOT NULL DEFAULT 'production',
  `is_default` TINYINT(1) DEFAULT 0,
  `fields` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_integrations_slug_env` ON `integrations`(`slug`, `environment`);
CREATE INDEX `idx_integrations_category_env` ON `integrations`(`category`, `environment`);

--
-- Dumping data for table `integrations`
--

LOCK TABLES `integrations` WRITE;
/*!40000 ALTER TABLE `integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `integrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kyc_verifications`
--

-- ========================================
-- Table: kyc_verifications
-- ========================================

DROP TABLE IF EXISTS `kyc_verifications`;

CREATE TABLE `kyc_verifications` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `document_type` VARCHAR(50),
  `document_number` VARCHAR(100),
  `document_image_url` VARCHAR(500),
  `selfie_image_url` VARCHAR(500),
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `rejection_reason` TEXT,
  `verified_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_user_id` ON `kyc_verifications`(`user_id`);

-- Foreign Keys
ALTER TABLE `kyc_verifications`
  ADD CONSTRAINT `fk_kyc_verifications_user` FOREIGN KEY (`user_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `kyc_verifications`
--

LOCK TABLES `kyc_verifications` WRITE;
/*!40000 ALTER TABLE `kyc_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `kyc_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

-- ========================================
-- Table: messages
-- ========================================

DROP TABLE IF EXISTS `messages`;

CREATE TABLE `messages` (
  `id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `recipient_id` VARCHAR(36) NOT NULL,
  `booking_id` VARCHAR(36),
  `content` TEXT,
  `is_read` TINYINT(1) DEFAULT 0,
  `read_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_sender_id` ON `messages`(`sender_id`);
CREATE INDEX `idx_recipient_id` ON `messages`(`recipient_id`);
CREATE INDEX `idx_booking_id` ON `messages`(`booking_id`);

-- Foreign Keys
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_recipient` FOREIGN KEY (`recipient_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_booking` FOREIGN KEY (`booking_id`) 
  REFERENCES `bookings`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

-- ========================================
-- Table: notifications
-- ========================================

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `type` VARCHAR(100),
  `title` VARCHAR(255),
  `message` TEXT,
  `data` JSON,
  `is_read` TINYINT(1) DEFAULT 0,
  `read_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_user_id` ON `notifications`(`user_id`);

-- Foreign Keys
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_gateways`
--

-- ========================================
-- Table: payment_gateways
-- ========================================

DROP TABLE IF EXISTS `payment_gateways`;

CREATE TABLE `payment_gateways` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100),
  `provider` VARCHAR(100),
  `config` JSON,
  `is_active` TINYINT(1),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_gateways`
--

LOCK TABLES `payment_gateways` WRITE;
/*!40000 ALTER TABLE `payment_gateways` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_gateways` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` VARCHAR(36) NOT NULL,
  `booking_id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `instructor_id` VARCHAR(36) NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_booking_id` ON `reviews`(`booking_id`);
CREATE INDEX `idx_student_id` ON `reviews`(`student_id`);
CREATE INDEX `idx_instructor_id` ON `reviews`(`instructor_id`);

-- Foreign Keys
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_booking` FOREIGN KEY (`booking_id`) 
  REFERENCES `bookings`(`id`) ON DELETE CASCADE;

ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_student` FOREIGN KEY (`student_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_instructor` FOREIGN KEY (`instructor_id`) 
  REFERENCES `instructors`(`id`) ON DELETE CASCADE;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seed_metadata`
--

-- ========================================
-- Table: seed_metadata
-- ========================================

DROP TABLE IF EXISTS `seed_metadata`;

CREATE TABLE `seed_metadata` (
  `id` VARCHAR(36) NOT NULL,
  `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `version` VARCHAR(50),
  `duration_ms` INT,
  `rows_affected` INT,
  `status` VARCHAR(20),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `seed_metadata`
--

LOCK TABLES `seed_metadata` WRITE;
/*!40000 ALTER TABLE `seed_metadata` DISABLE KEYS */;
/*!40000 ALTER TABLE `seed_metadata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

-- ========================================
-- Table: sessions
-- ========================================

DROP TABLE IF EXISTS `sessions`;

CREATE TABLE `sessions` (
  `session_id` VARCHAR(128) NOT NULL,
  `expires` INT UNSIGNED,
  `data` MEDIUMTEXT,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tickets`
--

-- ========================================
-- Table: support_tickets
-- ========================================

DROP TABLE IF EXISTS `support_tickets`;

CREATE TABLE `support_tickets` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `subject` VARCHAR(255),
  `message` TEXT,
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'low',
  `assigned_to` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_user_id` ON `support_tickets`(`user_id`);
CREATE INDEX `idx_assigned_to` ON `support_tickets`(`assigned_to`);

-- Foreign Keys
ALTER TABLE `support_tickets`
  ADD CONSTRAINT `fk_support_tickets_user` FOREIGN KEY (`user_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `support_tickets`
  ADD CONSTRAINT `fk_support_tickets_assigned` FOREIGN KEY (`assigned_to`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `support_tickets`
--

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_access_logs`
--

-- ========================================
-- Table: user_access_logs
-- ========================================

DROP TABLE IF EXISTS `user_access_logs`;

CREATE TABLE `user_access_logs` (
  `id` VARCHAR(36) NOT NULL,
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `user_access_logs_user_created_idx` ON `user_access_logs`(`user_id`, `created_at`);

-- Foreign Keys
ALTER TABLE `user_access_logs`
  ADD CONSTRAINT `fk_user_access_logs_user` FOREIGN KEY (`user_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `user_access_logs`
--

LOCK TABLES `user_access_logs` WRITE;
/*!40000 ALTER TABLE `user_access_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_access_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` VARCHAR(36) NOT NULL,
  `booking_id` VARCHAR(36),
  `type` ENUM('booking', 'withdrawal', 'refund', 'commission', 'affiliate', 'coupon') NOT NULL,
  `status` ENUM('pending', 'paid', 'processing', 'refunded', 'cancelled', 'failed') DEFAULT 'pending',
  `amount_gross` DECIMAL(10, 2) NOT NULL,
  `amount_net` DECIMAL(10, 2) NOT NULL,
  `gateway` VARCHAR(100),
  `payment_id` VARCHAR(255),
  `from_user_id` VARCHAR(36),
  `to_user_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_booking_id` ON `transactions`(`booking_id`);
CREATE INDEX `idx_from_user_id` ON `transactions`(`from_user_id`);
CREATE INDEX `idx_to_user_id` ON `transactions`(`to_user_id`);

-- Foreign Keys
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_transactions_booking` FOREIGN KEY (`booking_id`) 
  REFERENCES `bookings`(`id`) ON DELETE SET NULL;

ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_transactions_from_user` FOREIGN KEY (`from_user_id`) 
  REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_transactions_to_user` FOREIGN KEY (`to_user_id`) 
  REFERENCES `users`(`id`) ON DELETE SET NULL;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255),
  `google_id` VARCHAR(255),
  `first_name` VARCHAR(255),
  `last_name` VARCHAR(255),
  `profile_image_url` VARCHAR(500),
  `role` ENUM('student', 'instructor', 'admin') DEFAULT 'student',
  `kyc_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  `phone` VARCHAR(50),
  `cpf` VARCHAR(20),
  `cnpj` VARCHAR(20),
  `admin_role` ENUM('master', 'manager', 'support'),
  `is_verified` TINYINT(1) DEFAULT 0,
  `verification_token` VARCHAR(255),
  `address_line` VARCHAR(500),
  `zip_code` VARCHAR(20),
  `neighborhood` VARCHAR(255),
  `city` VARCHAR(255),
  `state` VARCHAR(50),
  `lat` DECIMAL(10, 7),
  `lng` DECIMAL(10, 7),
  `is_blocked` TINYINT(1) NOT NULL DEFAULT 0,
  `blocked_at` TIMESTAMP,
  `blocked_reason` TEXT,
  `blocked_by_admin_id` VARCHAR(36),
  `admin_notes` TEXT,
  `admin_notes_updated_at` TIMESTAMP,
  `admin_notes_updated_by_admin_id` VARCHAR(36),
  `password` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` VARCHAR(36) NOT NULL,
  `instructor_id` VARCHAR(36) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `year` INT NOT NULL,
  `plate` VARCHAR(20) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `photo_front` TEXT,
  `photo_side` TEXT,
  `photo_back` TEXT,
  `photo_interior` TEXT,
  `document_crlv` TEXT,
  `document_lav` TEXT,
  `rejection_reason` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_instructor_id` ON `vehicles`(`instructor_id`);

-- Foreign Keys
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicles_instructor` FOREIGN KEY (`instructor_id`) 
  REFERENCES `instructors`(`id`) ON DELETE CASCADE;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallet_entries`
--

-- ========================================
-- Table: wallet_entries
-- ========================================

DROP TABLE IF EXISTS `wallet_entries`;

CREATE TABLE `wallet_entries` (
  `id` VARCHAR(36) NOT NULL,
  `wallet_id` VARCHAR(36) NOT NULL,
  `type` ENUM('credit', 'debit'),
  `amount` DECIMAL(10,2),
  `description` TEXT,
  `reference_id` VARCHAR(36),
  `reference_type` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_wallet_id` ON `wallet_entries`(`wallet_id`);

-- Foreign Keys
ALTER TABLE `wallet_entries`
  ADD CONSTRAINT `fk_wallet_entries_wallet` FOREIGN KEY (`wallet_id`) 
  REFERENCES `wallets`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `wallet_entries`
--

LOCK TABLES `wallet_entries` WRITE;
/*!40000 ALTER TABLE `wallet_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallet_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallets`
--

-- ========================================
-- Table: wallets
-- ========================================

DROP TABLE IF EXISTS `wallets`;

CREATE TABLE `wallets` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `balance` DECIMAL(10,2) DEFAULT 0.00,
  `currency` VARCHAR(3) DEFAULT 'BRL',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_user_id` ON `wallets`(`user_id`);

-- Foreign Keys
ALTER TABLE `wallets`
  ADD CONSTRAINT `fk_wallets_user` FOREIGN KEY (`user_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `wallets`
--

LOCK TABLES `wallets` WRITE;
/*!40000 ALTER TABLE `wallets` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhooks_events`
--

-- ========================================
-- Table: webhooks_events
-- ========================================

DROP TABLE IF EXISTS `webhooks_events`;

CREATE TABLE `webhooks_events` (
  `id` VARCHAR(36) NOT NULL,
  `event_id` VARCHAR(255) NOT NULL,
  `event_type` VARCHAR(100),
  `provider` VARCHAR(100),
  `payload` JSON,
  `status` ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
  `processed_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `webhooks_events_provider_event_idx` ON `webhooks_events`(`provider`, `event_id`);

--
-- Dumping data for table `webhooks_events`
--

LOCK TABLES `webhooks_events` WRITE;
/*!40000 ALTER TABLE `webhooks_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhooks_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdrawals`
--

-- ========================================
-- Table: withdrawals
-- ========================================

DROP TABLE IF EXISTS `withdrawals`;

CREATE TABLE `withdrawals` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(10,2),
  `pix_key` VARCHAR(255),
  `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `processed_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX `idx_user_id` ON `withdrawals`(`user_id`);

-- Foreign Keys
ALTER TABLE `withdrawals`
  ADD CONSTRAINT `fk_withdrawals_user` FOREIGN KEY (`user_id`) 
  REFERENCES `users`(`id`) ON DELETE CASCADE;

--
-- Dumping data for table `withdrawals`
--

LOCK TABLES `withdrawals` WRITE;
/*!40000 ALTER TABLE `withdrawals` DISABLE KEYS */;
/*!40000 ALTER TABLE `withdrawals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'habilitfy'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-11 19:11:03

-- Data rows intentionally omitted in this repository copy.
-- Keep this dump schema-only to avoid PII and secret leakage.
  
