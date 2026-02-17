import mysql from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import * as dotenv from "dotenv";
import { randomUUID, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

dotenv.config({ path: ".env.production" });

const scryptAsync = promisify(scrypt);

const ADMIN_EMAIL = (process.env.PROD_ADMIN_EMAIL || "admin@habilitfy.com.br").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.PROD_ADMIN_PASSWORD || "admin123";
const FAKE_INSTRUCTORS_TARGET = Number(process.env.PROD_FAKE_INSTRUCTORS || 12);
const FAKE_INSTRUCTORS_PASSWORD = process.env.PROD_FAKE_PASSWORD || "password123";
const ACCESS_EMAIL = (process.env.PROD_ACCESS_EMAIL || "").trim().toLowerCase();
const ACCESS_PASSWORD = process.env.PROD_ACCESS_PASSWORD || "";
const ACCESS_ROLE = (process.env.PROD_ACCESS_ROLE || "student").trim().toLowerCase();

function uniqueHosts(hosts: string[]) {
    return Array.from(new Set(hosts.filter(Boolean)));
}

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
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

function randomPlate() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    return `${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}${nums[Math.floor(Math.random() * 10)]}${letters[Math.floor(Math.random() * 26)]}${nums[Math.floor(Math.random() * 10)]}${nums[Math.floor(Math.random() * 10)]}`;
}

function randomInRange(min: number, max: number) {
    return min + Math.random() * (max - min);
}

async function ensureAdmin(connection: mysql.Connection) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    const [existingRows] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE lower(email) = ? LIMIT 1",
        [ADMIN_EMAIL],
    );

    if (existingRows.length > 0) {
        await connection.query(
            `UPDATE users
             SET password = ?,
                 role = 'admin',
                 admin_role = 'master',
                 is_verified = 1,
                 kyc_status = 'approved',
                 updated_at = NOW()
             WHERE lower(email) = ?`,
            [passwordHash, ADMIN_EMAIL],
        );
        console.log(`   ✅ Admin atualizado: ${ADMIN_EMAIL}`);
        return;
    }

    await connection.query(
        `INSERT INTO users (
            id, email, password, first_name, last_name,
            role, admin_role, kyc_status, is_verified,
            created_at, updated_at
         ) VALUES (
            ?, ?, ?, 'Admin', 'Master',
            'admin', 'master', 'approved', 1,
            NOW(), NOW()
         )`,
        [randomUUID(), ADMIN_EMAIL, passwordHash],
    );

    console.log(`   ✅ Admin criado: ${ADMIN_EMAIL}`);
}

async function ensureAccessUser(connection: mysql.Connection) {
    if (!ACCESS_EMAIL || !ACCESS_PASSWORD) {
        console.log("   ℹ️ PROD_ACCESS_EMAIL/PROD_ACCESS_PASSWORD não definidos, pulando provisionamento de acesso.");
        return;
    }

    const role = ACCESS_ROLE === "admin" || ACCESS_ROLE === "instructor" ? ACCESS_ROLE : "student";
    const passwordHash = await hashPassword(ACCESS_PASSWORD);

    const [existingRows] = await connection.query<RowDataPacket[]>(
        "SELECT id, role FROM users WHERE lower(email) = ? LIMIT 1",
        [ACCESS_EMAIL],
    );

    if (existingRows.length > 0) {
        const currentRole = String(existingRows[0].role || role);
        await connection.query(
            `UPDATE users
             SET password = ?,
                 role = ?,
                 is_verified = 1,
                 kyc_status = 'approved',
                 updated_at = NOW()
             WHERE lower(email) = ?`,
            [passwordHash, currentRole, ACCESS_EMAIL],
        );
        console.log(`   ✅ Acesso atualizado para ${ACCESS_EMAIL} (role atual preservada: ${currentRole})`);
        return;
    }

    const [firstName, ...rest] = ACCESS_EMAIL.split("@")[0].split(".");
    await connection.query(
        `INSERT INTO users (
            id, email, password, first_name, last_name,
            role, kyc_status, is_verified, created_at, updated_at
         ) VALUES (
            ?, ?, ?, ?, ?,
            ?, 'approved', 1, NOW(), NOW()
         )`,
        [
            randomUUID(),
            ACCESS_EMAIL,
            passwordHash,
            firstName ? firstName[0].toUpperCase() + firstName.slice(1) : "Usuario",
            rest.length ? rest.join(" ") : "HabilitFy",
            role,
        ],
    );

    console.log(`   ✅ Usuário de acesso criado: ${ACCESS_EMAIL} (role=${role})`);
}

async function seedFakeInstructors(
    connection: mysql.Connection,
    instructorStatusColumn: string,
) {
    const [approvedRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM instructors WHERE \`${instructorStatusColumn}\` = 'approved'`,
    );
    const currentApproved = Number(approvedRows[0]?.total || 0);
    const missing = Math.max(0, FAKE_INSTRUCTORS_TARGET - currentApproved);

    if (missing === 0) {
        console.log(`   ✅ Já existem ${currentApproved} instrutores aprovados (meta ${FAKE_INSTRUCTORS_TARGET}).`);
        return;
    }

    const fakePasswordHash = await hashPassword(FAKE_INSTRUCTORS_PASSWORD);
    const firstNames = ["Ana", "Carlos", "Marina", "Rafael", "Paula", "Lucas", "Bruna", "Diego"];
    const lastNames = ["Silva", "Souza", "Oliveira", "Costa", "Pereira", "Almeida", "Santos", "Melo"];
    const vehicles = [
        { model: "Chevrolet Onix", type: "car" },
        { model: "Hyundai HB20", type: "car" },
        { model: "Fiat Argo", type: "car" },
        { model: "Renault Kwid", type: "car" },
        { model: "Honda CG 160", type: "motorcycle" },
        { model: "Yamaha Factor 150", type: "motorcycle" },
    ];

    let created = 0;
    for (let i = 0; i < missing; i++) {
        const userId = randomUUID();
        const instructorId = randomUUID();
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const vehicle = vehicles[i % vehicles.length];
        const email = `instrutor.fake.${Date.now()}.${i}@habilitfy.local`;
        const lat = randomInRange(-23.03, -22.80).toFixed(7);
        const lng = randomInRange(-43.72, -43.05).toFixed(7);

        await connection.query(
            `INSERT INTO users (
                id, email, password, first_name, last_name,
                role, kyc_status, is_verified, created_at, updated_at
             ) VALUES (
                ?, ?, ?, ?, ?,
                'instructor', 'approved', 1, NOW(), NOW()
             )`,
            [userId, email, fakePasswordHash, firstName, lastName],
        );

        await connection.query(
            `INSERT INTO instructors (
                id, user_id, bio, price_per_hour, slot_duration_minutes, max_bookings_per_student,
                vehicle_model, vehicle_year, vehicle_type, vehicle_plate,
                rating, reviews_count, neighborhood, city, state, lat, lng,
                \`${instructorStatusColumn}\`, created_at, updated_at
             ) VALUES (
                ?, ?, ?, ?, 50, 0,
                ?, '2023', ?, ?,
                4.80, 0, 'Centro', 'Rio de Janeiro', 'RJ', ?, ?,
                'approved', NOW(), NOW()
             )`,
            [
                instructorId,
                userId,
                "Instrutor fake para catálogo inicial na home.",
                (85 + i * 2).toFixed(2),
                vehicle.model,
                vehicle.type,
                randomPlate(),
                lat,
                lng,
            ],
        );

        created++;
    }

    console.log(`   ✅ ${created} instrutores fake aprovados criados.`);
    console.log(`   ℹ️ Senha padrão dos fakes: ${FAKE_INSTRUCTORS_PASSWORD}`);
}

async function fixData() {
    console.log("🔧 Correção de Produção (.env.production)");
    console.log("=========================================");

    try {
        console.log("\n1) Conectividade");
        const { connection, host } = await connectWithFallback();
        console.log(`   ✅ Conectado via host: ${host}`);

        const instructorStatusColumn = await resolveColumn(connection, "instructors", [
            "status",
            "instructor_status",
        ]);

        if (!instructorStatusColumn) {
            throw new Error("Não foi possível localizar a coluna de status da tabela instructors.");
        }

        console.log("\n2) Ajustando autenticação admin");
        await ensureAdmin(connection);

        console.log("\n2.1) Ajustando usuário de acesso (opcional)");
        await ensureAccessUser(connection);

        console.log("\n3) Ajustando status base");
        const [usersResult] = await connection.query<ResultSetHeader>(
            "UPDATE users SET is_verified = 1, kyc_status = 'approved' WHERE is_verified = 0 OR kyc_status != 'approved'",
        );
        console.log(`   ✅ Usuários ajustados: ${usersResult.affectedRows}`);

        const [instructorsResult] = await connection.query<ResultSetHeader>(
            `UPDATE instructors
             SET \`${instructorStatusColumn}\` = 'approved'
             WHERE \`${instructorStatusColumn}\` != 'approved'`,
        );
        console.log(`   ✅ Instrutores aprovados ajustados: ${instructorsResult.affectedRows}`);

        console.log("\n4) Garantindo catálogo fake para home");
        await seedFakeInstructors(connection, instructorStatusColumn);

        await connection.end();

        console.log("\n=========================================");
        console.log("🎉 Correção concluída.");
        console.log(`🔐 Login admin: ${ADMIN_EMAIL}`);
        console.log(`🔐 Senha admin: ${ADMIN_PASSWORD}`);
        if (ACCESS_EMAIL && ACCESS_PASSWORD) {
            console.log(`🔐 Login de acesso: ${ACCESS_EMAIL}`);
            console.log(`🔐 Senha de acesso: ${ACCESS_PASSWORD}`);
        }
    } catch (error: any) {
        console.error("\n❌ Erro ao corrigir produção:");
        console.error(error?.message || error);
    }
}

fixData();
