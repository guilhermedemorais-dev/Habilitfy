
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

async function testConnection() {
    console.log('🔍 Iniciando diagnóstico de conexão MySQL...');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ ERRO: DATABASE_URL não encontrada no arquivo .env');
        process.exit(1);
    }

    // Mascarar senha para log
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`📂 Usando DATABASE_URL: ${maskedUrl}`);

    // Teste 1: Conexão Direta com mysql2
    console.log('\n--- 1. Teste de Conexão Direta (mysql2) ---');
    let connection;
    try {
        connection = await mysql.createConnection(dbUrl);
        console.log('✅ Conexão bem-sucedida!');

        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log(`✅ Query de teste executada. Resultado: ${(rows as any)[0].result}`);

        await connection.end();
    } catch (error: any) {
        console.error('❌ FALHA na conexão direta:');
        console.error(`   Código: ${error.code}`);
        console.error(`   Mensagem: ${error.message}`);
        console.error(`   Host/Porta: ${error.address}:${error.port}`);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('⚠️  DICA: Verifique se o usuário e senha no .env estão corretos.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('⚠️  DICA: Verifique se o MySQL está rodando e se a porta 3306 está correta.');
        }
        process.exit(1);
    }

    // Teste 2: Inicialização do Drizzle ORM
    console.log('\n--- 2. Teste de Inicialização do Drizzle ORM ---');
    try {
        const poolConnection = mysql.createPool(dbUrl);
        const db = drizzle(poolConnection, { schema, mode: "default" });

        // Teste simples com Drizzle
        const result = await db.execute(sql`SELECT NOW() as server_time`);
        console.log('✅ Drizzle inicializado e query executada!');
        console.log('🕒 Horário do servidor:', (result[0] as any)[0].server_time);

        await poolConnection.end();
    } catch (error: any) {
        console.error('❌ FALHA na inicialização do Drizzle:');
        console.error(error);
        process.exit(1);
    }

    console.log('\n🎉 SUCESSO! Todas as conexões estão funcionando corretamente.');
}

testConnection();
