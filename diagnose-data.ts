import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

// Carregar .env.production
dotenv.config({ path: ".env.production" });

interface CountResult extends mysql.RowDataPacket {
    count: number;
}

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
        const [usersResult] = await connection.execute<CountResult[]>("SELECT COUNT(*) as count FROM users");
        const usersCount = usersResult[0].count;
        console.log(`\n👥 Total de Usuários: ${usersCount}`);

        if (usersCount > 0) {
            const [users] = await connection.execute("SELECT id, email, role, kyc_status, is_verified FROM users LIMIT 5");
            console.log("   Exemplos de usuários:");
            // @ts-ignore
            console.table(users);
        }

        // 2. Check Instructors
        const [instructorsResult] = await connection.execute<CountResult[]>("SELECT COUNT(*) as count FROM instructors");
        const instructorsCount = instructorsResult[0].count;
        console.log(`\n🎓 Total de Instrutores: ${instructorsCount}`);

        if (instructorsCount > 0) {
            const [instructors] = await connection.execute("SELECT id, user_id, status, city, rating FROM instructors LIMIT 5");
            console.log("   Exemplos de instrutores:");
            // @ts-ignore
            console.table(instructors);
        } else {
            console.log("   ⚠️ NENHUM INSTRUTOR ENCONTRADO. É necessário rodar os seeds.");
        }

        // 3. Check specific filtering conditions
        console.log("\n🕵️ Análise de Filtros Comuns:");
        const [activeInstructorsResult] = await connection.execute<CountResult[]>(
            "SELECT COUNT(*) as count FROM instructors WHERE status = 'approved'"
        );
        console.log(`   - Instrutores com status 'approved': ${activeInstructorsResult[0].count}`);

        const [verifiedUsersResult] = await connection.execute<CountResult[]>(
            "SELECT COUNT(*) as count FROM users WHERE is_verified = 1"
        );
        console.log(`   - Usuários verificados: ${verifiedUsersResult[0].count}`);

        await connection.end();

        console.log("\n==================================================");
        console.log("🏁 Diagnóstico concluído.");

    } catch (error: any) {
        console.error("\n❌ FALHA NA CONEXÃO OU CONSULTA:");
        console.error(error.message);
    }
}

diagnose();
