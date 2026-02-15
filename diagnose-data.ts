import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

// Carregar .env.production
dotenv.config({ path: ".env.production" });

async function diagnose() {
    console.log("🔍 Diagnóstico de Dados do Banco de Dados (Produção)");
    console.log("==================================================");
    console.log("Host:", process.env.DB_HOST);
    console.log("Database:", process.env.DB_NAME);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log("\n✅ Conexão estabelecida com sucesso!");

        // 1. Check Users
        const [usersCount] = await connection.execute("SELECT COUNT(*) as count FROM users");
        // @ts-ignore
        console.log(`\n👥 Total de Usuários: ${usersCount[0].count}`);

        if (usersCount[0].count > 0) {
            const [users] = await connection.execute("SELECT id, email, role, kyc_status, is_verified FROM users LIMIT 5");
            console.log("   Exemplos de usuários:");
            // @ts-ignore
            console.table(users);
        }

        // 2. Check Instructors
        const [instructorsCount] = await connection.execute("SELECT COUNT(*) as count FROM instructors");
        // @ts-ignore
        console.log(`\n🎓 Total de Instrutores: ${instructorsCount[0].count}`);

        if (instructorsCount[0].count > 0) {
            const [instructors] = await connection.execute("SELECT id, user_id, status, city, rating FROM instructors LIMIT 5");
            console.log("   Exemplos de instrutores:");
            // @ts-ignore
            console.table(instructors);
        } else {
            console.log("   ⚠️ NENHUM INSTRUTOR ENCONTRADO. É necessário rodar os seeds.");
        }

        // 3. Check specific filtering conditions
        console.log("\n🕵️ Análise de Filtros Comuns:");
        // @ts-ignore
        const [activeInstructors] = await connection.execute(
            "SELECT COUNT(*) as count FROM instructors WHERE status = 'approved'"
        );
        // @ts-ignore
        console.log(`   - Instrutores com status 'approved': ${activeInstructors[0].count}`);

        // @ts-ignore
        const [verifiedUsers] = await connection.execute(
            "SELECT COUNT(*) as count FROM users WHERE is_verified = 1"
        );
        // @ts-ignore
        console.log(`   - Usuários verificados: ${verifiedUsers[0].count}`);

        await connection.end();

        console.log("\n==================================================");
        console.log("🏁 Diagnóstico concluído.");

    } catch (error: any) {
        console.error("\n❌ FALHA NA CONEXÃO OU CONSULTA:");
        console.error(error.message);
    }
}

diagnose();
