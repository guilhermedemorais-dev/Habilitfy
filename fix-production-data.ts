import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

// Carregar .env.production
dotenv.config({ path: ".env.production" });

async function fixData() {
    console.log("🔧 Corrigindo Dados em Produção...");

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log("✅ Conectado ao banco de dados.");

        // 1. Aprovar todos os instrutores
        console.log("\n🔄 Atualizando status dos instrutores para 'approved'...");
        const [instructorsResult] = await connection.execute(
            "UPDATE instructors SET status = 'approved' WHERE status != 'approved'"
        );
        // @ts-ignore
        console.log(`   ✅ ${instructorsResult.changedRows} instrutores atualizados.`);

        // 2. Verificar todos os usuários
        console.log("\n🔄 Verificando todos os usuários (is_verified = true)...");
        const [usersResult] = await connection.execute(
            "UPDATE users SET is_verified = 1, kyc_status = 'approved' WHERE is_verified = 0 OR kyc_status != 'approved'"
        );
        // @ts-ignore
        console.log(`   ✅ ${usersResult.changedRows} usuários atualizados.`);

        await connection.end();
        console.log("\n🎉 Correção concluída! Tente acessar o site agora.");

    } catch (error: any) {
        console.error("❌ Erro ao corrigir dados:", error.message);
    }
}

fixData();
