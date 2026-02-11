DELIMITER //

DROP PROCEDURE IF EXISTS upgrade_users_table //

CREATE PROCEDURE upgrade_users_table()
BEGIN
    -- 1. Adicionar google_id se não existir
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'google_id'
    ) THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE DEFAULT NULL;
    END IF;

    -- 2. Adicionar is_verified se não existir
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'is_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 0;
    END IF;

    -- 3. Adicionar kyc_status se não existir
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'kyc_status'
    ) THEN
        ALTER TABLE users ADD COLUMN kyc_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved';
    END IF;

    -- 4. Adicionar admin_role se não existir
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'admin_role'
    ) THEN
        ALTER TABLE users ADD COLUMN admin_role ENUM('master', 'manager', 'support') DEFAULT NULL;
    END IF;

END //

DELIMITER ;

-- Executar a procedure
CALL upgrade_users_table();

-- Limpar a procedure depois do uso
DROP PROCEDURE IF EXISTS upgrade_users_table;
