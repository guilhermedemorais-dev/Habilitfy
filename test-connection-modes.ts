import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

// Carregar .env.production
dotenv.config({ path: ".env.production" });

async function testConnection(host: string) {
    console.log(`\n🔌 Testando conexão via [${host}]...`);
    try {
        const connection = await mysql.createConnection({
            host: host,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        console.log(`   ✅ SUCESSO! Conectado via ${host}`);
        await connection.end();
        return true;
    } catch (error: any) {
        console.log(`   ❌ FALHA via ${host}: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log("🔍 Diagnóstico de Conexão MySQL");
    console.log("--------------------------------");
    console.log(`Usuário: ${process.env.DB_USER}`);
    console.log(`Banco:   ${process.env.DB_NAME}`);

    // Teste 1: localhost (Socket/Pipe)
    const localhostSuccess = await testConnection("localhost");

    // Teste 2: 127.0.0.1 (TCP/IP)
    const ipSuccess = await testConnection("127.0.0.1");

    console.log("\n--------------------------------");
    console.log("💡 Conclusão:");
    if (localhostSuccess && !ipSuccess) {
        console.log("   O banco aceita apenas 'localhost'. O arquivo .env.production deve usar 'localhost'.");
    } else if (!localhostSuccess && ipSuccess) {
        console.log("   O banco aceita apenas '127.0.0.1'. O arquivo .env.production deve usar '127.0.0.1'.");
    } else if (localhostSuccess && ipSuccess) {
        console.log("   Ambos funcionam! 'localhost' é preferível.");
    } else {
        console.log("   ⚠️ Nenhuma conexão funcionou. Verifique usuário e senha.");
    }
}

runTests();
