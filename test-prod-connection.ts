import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

// Carregar .env.production
dotenv.config({ path: ".env.production" });

async function test() {
    console.log("🔍 Testando credenciais do .env.production");
    console.log("Database:", process.env.DB_NAME);
    console.log("User:", process.env.DB_USER);
    console.log("Host:", process.env.DB_HOST);

    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // @ts-ignore
        const [rows] = await pool.query("SELECT COUNT(*) as total FROM users");
        // @ts-ignore
        console.log("✅ Conectado! Total de usuários:", rows[0].total);

        await pool.end();
    } catch (error: any) {
        console.error("❌ Erro:", error.message);
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error("🔴 Banco de dados não existe! Verifique o nome.");
        }
    }
}

test();
