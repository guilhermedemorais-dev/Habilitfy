-- Migration: Add CNPJ field to users table and CNH fields to instructors
-- Execute this in phpMyAdmin or MySQL CLI

-- Add CNPJ column to users table (for instructors)
ALTER TABLE `users` 
ADD COLUMN `cnpj` VARCHAR(20) NULL AFTER `cpf`;

-- Add CNH image URLs to instructors table
ALTER TABLE `instructors` 
ADD COLUMN `cnh_front_image_url` VARCHAR(500) NULL AFTER `selfie_image_url`,
ADD COLUMN `cnh_back_image_url` VARCHAR(500) NULL AFTER `cnh_front_image_url`;

-- Create index on CNPJ for faster lookups
CREATE INDEX `idx_users_cnpj` ON `users` (`cnpj`);
