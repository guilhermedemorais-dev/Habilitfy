
import { hashPassword } from "../server/auth";

async function generate() {
    const adminPass = await hashPassword("Habilitfy@2024");
    const supportPass = await hashPassword("Suporte@2024");
    const instructorPass = await hashPassword("Instrutor@2024");

    console.log(`
-- =======================================================
-- SCRIPT DE SEED DE USUÁRIOS NATIVOS (PRODUÇÃO)
-- =======================================================

-- 1. Admin Master
INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`password\`, \`role\`, \`name\`, \`admin_role\`, \`is_verified\`, \`kyc_status\`)
VALUES 
(UUID(), 'guilhermemp.business@gmail.com', '${adminPass}', 'admin', 'Guilherme Morais', 'master', 1, 'approved');

-- 2. Suporte HabilitFy
INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`password\`, \`role\`, \`name\`, \`admin_role\`, \`is_verified\`, \`kyc_status\`)
VALUES 
(UUID(), 'suporte@habilitfy.com.br', '${supportPass}', 'admin', 'Suporte HabilitFy', 'support', 1, 'approved');

-- 3. Instrutor de Teste (Opcional)
INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`password\`, \`role\`, \`name\`, \`is_verified\`, \`kyc_status\`)
VALUES 
(UUID(), 'instrutor.teste@habilitfy.com.br', '${instructorPass}', 'instructor', 'Instrutor Teste', 1, 'approved');
`);
    process.exit(0);
}

generate();
