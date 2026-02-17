import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import * as dotenv from "dotenv";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

dotenv.config({ path: ".env.production" });

const scryptAsync = promisify(scrypt);

interface CountResult extends RowDataPacket {
    total: number;
}

function uniqueHosts(hosts: string[]) {
    return Array.from(new Set(hosts.filter(Boolean)));
}

async function connectWithFallback() {
    const hosts = uniqueHosts([
        process.env.DB_HOST || "",
        "127.0.0.1",
        "localhost",
    ]);

    let lastError: unknown = null;
    for (const host of hosts) {
        try {
            const connection = await mysql.createConnection({
                host,
                port: Number(process.env.DB_PORT) || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
            });

            await connection.query("SELECT 1");
            return { connection, host };
        } catch (error) {
            lastError = error;
            console.log(`   ❌ Falha conectando em ${host}: ${(error as Error).message}`);
        }
    }

    throw lastError;
}

async function resolveColumn(
    connection: mysql.Connection,
    table: string,
    candidates: string[],
) {
    for (const candidate of candidates) {
        const [rows] = await connection.query<RowDataPacket[]>(
            `SHOW COLUMNS FROM \`${table}\` LIKE ?`,
            [candidate],
        );
        if (rows.length > 0) return candidate;
    }
    return null;
}

function looksHashedPassword(password: string | null) {
    if (!password) return false;
    const [hash, salt] = password.split(".");
    return Boolean(hash && salt && hash.length === 128 && salt.length >= 16);
}

async function comparePassword(supplied: string, stored: string) {
    const [hash, salt] = stored.split(".");
    if (!hash || !salt) return false;

    try {
        const hashBuffer = Buffer.from(hash, "hex");
        const suppliedBuffer = (await scryptAsync(supplied, salt, 64)) as Buffer;
        if (hashBuffer.length !== suppliedBuffer.length) return false;
        return timingSafeEqual(hashBuffer, suppliedBuffer);
    } catch {
        return false;
    }
}

async function diagnose() {
    console.log("🔍 Auditoria de Produção (.env.production)");
    console.log("==========================================");
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User:     ${process.env.DB_USER}`);

    try {
        console.log("\n1) Conectividade");
        const { connection, host } = await connectWithFallback();
        console.log(`   ✅ Conectado com sucesso via host: ${host}`);

        const [identity] = await connection.query<RowDataPacket[]>(
            "SELECT DATABASE() AS db, CURRENT_USER() AS current_user",
        );
        console.log(
            `   Sessão atual: db=${identity[0]?.db || "?"}, user=${identity[0]?.current_user || "?"}`,
        );

        console.log("\n2) Estrutura crítica");
        const instructorStatusColumn = await resolveColumn(connection, "instructors", [
            "status",
            "instructor_status",
        ]);
        const userEmailColumn = await resolveColumn(connection, "users", ["email"]);
        const userPasswordColumn = await resolveColumn(connection, "users", ["password"]);
        console.log(`   instructors status column: ${instructorStatusColumn || "NÃO ENCONTRADA"}`);
        console.log(`   users email column: ${userEmailColumn || "NÃO ENCONTRADA"}`);
        console.log(`   users password column: ${userPasswordColumn || "NÃO ENCONTRADA"}`);

        console.log("\n3) Dados essenciais");
        const [usersCountRows] = await connection.query<CountResult[]>(
            "SELECT COUNT(*) AS total FROM users",
        );
        const [instructorsCountRows] = await connection.query<CountResult[]>(
            "SELECT COUNT(*) AS total FROM instructors",
        );
        console.log(`   Usuários totais: ${usersCountRows[0]?.total ?? 0}`);
        console.log(`   Instrutores totais: ${instructorsCountRows[0]?.total ?? 0}`);

        if (instructorStatusColumn) {
            const [approvedInstructorsRows] = await connection.query<CountResult[]>(
                `SELECT COUNT(*) AS total FROM instructors WHERE \`${instructorStatusColumn}\` = 'approved'`,
            );
            console.log(`   Instrutores aprovados: ${approvedInstructorsRows[0]?.total ?? 0}`);

            const [sampleInstructors] = await connection.query<RowDataPacket[]>(
                `SELECT id, user_id, \`${instructorStatusColumn}\` AS status, city, state, rating
                 FROM instructors
                 ORDER BY created_at DESC
                 LIMIT 5`,
            );
            console.log("   Amostra de instrutores:");
            console.table(sampleInstructors);
        }

        console.log("\n4) Saúde do login (admins)");
        const [admins] = await connection.query<RowDataPacket[]>(
            `SELECT id, email, role, is_verified, kyc_status, password
             FROM users
             WHERE role = 'admin'
             ORDER BY created_at DESC
             LIMIT 10`,
        );

        const auditPassword = process.env.AUDIT_LOGIN_PASSWORD;
        const adminSummary = [];
        for (const admin of admins) {
            const storedPassword = String(admin.password || "");
            let passwordMatch: boolean | null = null;
            if (auditPassword && looksHashedPassword(storedPassword)) {
                passwordMatch = await comparePassword(auditPassword, storedPassword);
            } else if (auditPassword && storedPassword) {
                passwordMatch = storedPassword === auditPassword;
            }

            adminSummary.push({
                id: admin.id,
                email: admin.email,
                role: admin.role,
                is_verified: admin.is_verified,
                kyc_status: admin.kyc_status,
                password_format: looksHashedPassword(storedPassword) ? "hash" : storedPassword ? "plain/unknown" : "missing",
                login_test: passwordMatch === null ? "skip" : passwordMatch ? "ok" : "fail",
            });
        }
        console.table(adminSummary);

        if (!auditPassword) {
            console.log("   ℹ️ Defina AUDIT_LOGIN_PASSWORD para validar hash de login dos admins.");
        }

        await connection.end();

        console.log("\n==========================================");
        console.log("🏁 Auditoria concluída.");
    } catch (error: any) {
        console.error("\n❌ Falha na auditoria:");
        console.error(error?.message || error);
    }
}

diagnose();
