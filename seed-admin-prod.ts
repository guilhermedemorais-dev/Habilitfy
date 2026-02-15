import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Carregar .env.production
dotenv.config({ path: ".env.production" });

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function seedAdmin() {
    console.log("🔑 Configurando Usuário Admin em Produção...");

    const email = "admin@habilitfy.com";
    const password = "admin123";

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log("✅ Conectado ao banco de dados.");

        // Verificar se usuário existe
        const [rows] = await connection.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        const hashedPassword = await hashPassword(password);

        // @ts-ignore
        if (rows.length > 0) {
            console.log(`🔄 Usuário ${email} já existe. Atualizando senha e permissões...`);
            await connection.execute(
                "UPDATE users SET password = ?, role = 'admin', is_verified = 1, kyc_status = 'approved' WHERE email = ?",
                [hashedPassword, email]
            );
            console.log("   ✅ Senha redefinida para 'admin123' e permissões de admin concedidas.");
        } else {
            console.log(`✨ Criando novo usuário admin: ${email}...`);
            await connection.execute(
                `INSERT INTO users (
          id, email, password, role, is_verified, kyc_status, 
          first_name, last_name, username, created_at, updated_at
        ) VALUES (
          UUID(), ?, ?, 'admin', 1, 'approved', 
          'Super', 'Admin', 'admin', NOW(), NOW()
        )`,
                [email, hashedPassword]
            );
            console.log("   ✅ Usuário criado com sucesso.");
        }

        await connection.end();

        console.log("\n🔐 Credenciais de Acesso:");
        console.log(`   Email: ${email}`);
        console.log(`   Senha: ${password}`);
        console.log("\n⚠️ Execute este script apenas quando precisar resetar o admin.");

    } catch (error: any) {
        console.error("❌ Erro ao configurar admin:", error.message);
    }
}

seedAdmin();
