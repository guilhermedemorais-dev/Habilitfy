/**
 * HabilitFy - Reset & Seed Comprehensive Script
 * 
 * USO: npx tsx script/reset_and_seed_comprehensive.ts
 * 
 * ATENÇÃO: Este script APAGA e recria o banco de dados inteiro.
 * Dados fakes são gerados APENAS para instrutores (prova social).
 */

import { faker } from '@faker-js/faker/locale/pt_BR';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { scrypt } from 'crypto';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const scryptAsync = promisify(scrypt);

// ─────────────────────────────────────────────
// CONFIGURAÇÃO (parseia DATABASE_URL)
// ─────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/habilitfy';
const dbUrl = new URL(DATABASE_URL);
const DB_HOST = dbUrl.hostname;
const DB_PORT = parseInt(dbUrl.port || '3306');
const DB_USER = decodeURIComponent(dbUrl.username);
const DB_PASSWORD = decodeURIComponent(dbUrl.password);
const DB_NAME = dbUrl.pathname.replace('/', '');

const INSTRUCTOR_COUNT = 30;
const REVIEWS_PER_INSTRUCTOR_MIN = 3;
const REVIEWS_PER_INSTRUCTOR_MAX = 8;
const DEFAULT_PASSWORD = 'Habilitfy@2025';

// Bairros do RJ com coordenadas aproximadas
const RJ_NEIGHBORHOODS = [
    { name: 'Copacabana', lat: -22.9711, lng: -43.1823 },
    { name: 'Tijuca', lat: -22.9325, lng: -43.2436 },
    { name: 'Barra da Tijuca', lat: -23.0004, lng: -43.3650 },
    { name: 'Botafogo', lat: -22.9519, lng: -43.1811 },
    { name: 'Ipanema', lat: -22.9838, lng: -43.2096 },
    { name: 'Leblon', lat: -22.9838, lng: -43.2228 },
    { name: 'Méier', lat: -22.9027, lng: -43.2830 },
    { name: 'Madureira', lat: -22.8740, lng: -43.3390 },
    { name: 'Campo Grande', lat: -22.9035, lng: -43.5596 },
    { name: 'Jacarepaguá', lat: -22.9503, lng: -43.3575 },
    { name: 'Vila Isabel', lat: -22.9247, lng: -43.2490 },
    { name: 'Penha', lat: -22.8453, lng: -43.2789 },
    { name: 'São Cristóvão', lat: -22.8979, lng: -43.2222 },
    { name: 'Flamengo', lat: -22.9323, lng: -43.1768 },
    { name: 'Recreio', lat: -23.0126, lng: -43.4651 },
    { name: 'Bangu', lat: -22.8757, lng: -43.4604 },
    { name: 'Santa Cruz', lat: -22.9157, lng: -43.6755 },
    { name: 'Ilha do Governador', lat: -22.8086, lng: -43.2116 },
    { name: 'Centro', lat: -22.9068, lng: -43.1729 },
    { name: 'Lapa', lat: -22.9135, lng: -43.1810 },
    { name: 'Niterói - Centro', lat: -22.8834, lng: -43.1034 },
    { name: 'Niterói - Icaraí', lat: -22.8989, lng: -43.1067 },
    { name: 'Engenho Novo', lat: -22.9063, lng: -43.2647 },
    { name: 'Cascadura', lat: -22.8800, lng: -43.3289 },
    { name: 'Realengo', lat: -22.8739, lng: -43.4138 },
    { name: 'Olaria', lat: -22.8476, lng: -43.2606 },
    { name: 'Ramos', lat: -22.8481, lng: -43.2526 },
    { name: 'Piedade', lat: -22.8912, lng: -43.3126 },
    { name: 'Guadalupe', lat: -22.8559, lng: -43.3657 },
    { name: 'Pavuna', lat: -22.8192, lng: -43.3619 },
];

// Veículos populares para autoescola
const VEHICLES = [
    { brand: 'Hyundai', model: 'HB20 1.0', category: 'car' },
    { brand: 'Chevrolet', model: 'Onix 1.0', category: 'car' },
    { brand: 'Volkswagen', model: 'Gol 1.0', category: 'car' },
    { brand: 'Fiat', model: 'Mobi 1.0', category: 'car' },
    { brand: 'Fiat', model: 'Argo 1.0', category: 'car' },
    { brand: 'Toyota', model: 'Yaris 1.5', category: 'car' },
    { brand: 'Renault', model: 'Kwid 1.0', category: 'car' },
    { brand: 'Chevrolet', model: 'Prisma 1.0', category: 'car' },
    { brand: 'Honda', model: 'CG 160 Start', category: 'motorcycle' },
    { brand: 'Yamaha', model: 'Fazer 150', category: 'motorcycle' },
    { brand: 'Honda', model: 'CG 160 Titan', category: 'motorcycle' },
    { brand: 'Yamaha', model: 'Factor 150', category: 'motorcycle' },
];

// Bios de instrutores (templates)
const INSTRUCTOR_BIOS = [
    'Instrutor(a) com vasta experiência em aulas práticas para habilitação. Paciente e dedicado(a) com alunos iniciantes.',
    'Profissional habilitado(a) há mais de {years} anos. Especialista em direção defensiva e aulas para primeira habilitação.',
    'Instrutor(a) certificado(a) com foco em segurança no trânsito. Aulas práticas dinâmicas e com metodologia comprovada.',
    'Mais de {years} anos formando condutores seguros. Aulas personalizadas de acordo com a necessidade de cada aluno.',
    'Instrutor(a) com formação completa e especialização em condução de veículos automáticos e manuais.',
    'Apaixonado(a) por ensinar. Aulas com paciência, passo a passo, ideal para quem tem medo de dirigir.',
    'Experiência em formação de condutores profissionais. Aulas em vias urbanas e estradas, com foco em segurança.',
    'Instrutor(a) credenciado(a) pelo DETRAN-RJ. Aulas práticas em todos os horários. Veículo próprio equipado.',
    'Especialista em aulas para pessoas ansiosas ou que tiveram experiências negativas com direção. Atendimento humanizado.',
    'Instrutor(a) com excelente aprovação no DETRAN. Método prático e eficiente, com acompanhamento personalizado.',
];

// Review comments
const REVIEW_COMMENTS = [
    'Excelente instrutor(a)! Muito paciente e didático(a). Recomendo demais!',
    'Aprendi muito rápido com esse(a) professor(a). Passei de primeira no exame!',
    'Profissional incrível! Me senti seguro(a) desde a primeira aula.',
    'Super atencioso(a) e pontual. Explica tudo com calma.',
    'Ótimo(a) instrutor(a), veículo em perfeito estado. Super recomendo!',
    'Consegui superar meu medo de dirigir graças a esse(a) profissional.',
    'Muito bom(a)! Horários flexíveis e aulas dinâmicas.',
    'Ensina de verdade, não fica só no básico. Direção defensiva é o forte.',
    'Melhor instrutor(a) que já tive! Nota 10 em tudo.',
    'Recomendo 100%! Passei na prova tranquilamente.',
    'Muito profissional, veiculo limpo e bem cuidado.',
    'Instrutor(a) nota mil! Paciente demais comigo.',
    'Aulas muito boas, aprendi bastante em pouco tempo.',
    'Me ajudou muito com estacionamento e baliza. Top!',
    'Profissional de confiança, pontual e comprometido(a).',
];

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

function uuid(): string {
    return crypto.randomUUID();
}

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
}

function generatePlate(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const l = () => letters[Math.floor(Math.random() * letters.length)];
    const n = () => Math.floor(Math.random() * 10);
    // Mercosul format: ABC1D23
    return `${l()}${l()}${l()}${n()}${l()}${n()}${n()}`;
}

const usedCPFs = new Set<string>();
function generateUniqueCPF(): string {
    // Gera CPF com formato válido (sem lib extra, apenas números)
    let cpf: string;
    do {
        const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
        // Dígito verificador 1
        let sum = 0;
        for (let i = 0; i < 9; i++) sum += base[i] * (10 - i);
        let d1 = 11 - (sum % 11);
        if (d1 >= 10) d1 = 0;
        base.push(d1);
        // Dígito verificador 2
        sum = 0;
        for (let i = 0; i < 10; i++) sum += base[i] * (11 - i);
        let d2 = 11 - (sum % 11);
        if (d2 >= 10) d2 = 0;
        base.push(d2);
        cpf = base.join('');
    } while (usedCPFs.has(cpf));
    usedCPFs.add(cpf);
    return cpf;
}

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals = 2): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function confirm(question: string): Promise<boolean> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer === 'CONFIRMO DESTRUIÇÃO');
        });
    });
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log('  HabilitFy - Reset & Seed Comprehensive');
    console.log('═══════════════════════════════════════════════');
    console.log('');

    // ── SEGURANÇA ──
    if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force-production')) {
        console.error('🚨 ERRO: Impossível executar reset em produção!');
        console.error('   Use --force-production se você TEM CERTEZA do que está fazendo.');
        process.exit(1);
    }

    const skipConfirm = process.argv.includes('--no-confirm');
    if (!skipConfirm) {
        const confirmed = await confirm('⚠️  Digite "CONFIRMO DESTRUIÇÃO" para apagar e recriar o banco: ');
        if (!confirmed) {
            console.log('❌ Operação cancelada pelo usuário.');
            process.exit(0);
        }
    } else {
        console.log('⚠️  --no-confirm detectado, pulando confirmação...');
    }

    // ── CONEXÃO ──
    const rootConnection = await mysql.createConnection({
        host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD,
    });

    // ── BACKUP ──
    console.log('\n📦 [1/7] Tentando backup do banco atual...');
    try {
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const mysqldumpLib = await import('mysqldump').then(m => m.default);
        await mysqldumpLib({
            connection: { host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME },
            dumpToFile: path.join(backupDir, `habilitfy_backup_${Date.now()}.sql`),
        });
        console.log('   ✅ Backup salvo em ./backups/');
    } catch (err: any) {
        console.log(`   ⚠️  Backup falhou (banco pode não existir): ${err.message}`);
    }

    // ── DROP & CREATE ──
    console.log('\n💣 [2/7] Recriando banco de dados...');
    await rootConnection.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    await rootConnection.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await rootConnection.end();
    console.log(`   ✅ Banco "${DB_NAME}" recriado.`);

    // ── CONEXÃO COM BANCO NOVO ──
    const pool = mysql.createPool({
        host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
        waitForConnections: true, connectionLimit: 5,
    });

    // ── MIGRATE (executar mysql-schema.sql) ──
    console.log('\n🏗️  [3/7] Executando schema SQL...');

    // Desabilitar FK checks para criar tabelas em qualquer ordem
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    const schemaPath = path.join(process.cwd(), 'migrations', 'mysql-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    // Remover linhas de comentário, separar por ; e executar cada statement
    const cleanedSql = schemaSql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
    const statements = cleanedSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    for (const stmt of statements) {
        await pool.query(stmt);
    }

    // Criar tabelas novas não existentes no schema original
    // webhooks_events
    await pool.query(`
    CREATE TABLE IF NOT EXISTS \`webhooks_events\` (
      \`id\` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
      \`integration_slug\` VARCHAR(100) NOT NULL,
      \`event_type\` VARCHAR(255) NOT NULL,
      \`payload\` JSON,
      \`status\` ENUM('received', 'processed', 'failed') NOT NULL DEFAULT 'received',
      \`error_message\` TEXT,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_webhook_slug\` (\`integration_slug\`),
      INDEX \`idx_webhook_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

    // notifications
    await pool.query(`
    CREATE TABLE IF NOT EXISTS \`notifications\` (
      \`id\` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
      \`user_id\` VARCHAR(36) NOT NULL,
      \`type\` VARCHAR(100) NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`message\` TEXT NOT NULL,
      \`read\` BOOLEAN DEFAULT FALSE,
      \`data\` JSON,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`),
      INDEX \`idx_notification_user\` (\`user_id\`),
      INDEX \`idx_notification_read\` (\`read\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

    // admin_logs
    await pool.query(`
    CREATE TABLE IF NOT EXISTS \`admin_logs\` (
      \`id\` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
      \`admin_id\` VARCHAR(36) NOT NULL,
      \`action\` VARCHAR(255) NOT NULL,
      \`entity_type\` VARCHAR(100),
      \`entity_id\` VARCHAR(36),
      \`details\` JSON,
      \`ip_address\` VARCHAR(50),
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`admin_id\`) REFERENCES \`users\`(\`id\`),
      INDEX \`idx_admin_log_admin\` (\`admin_id\`),
      INDEX \`idx_admin_log_action\` (\`action\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

    // seed_metadata
    await pool.query(`
    CREATE TABLE IF NOT EXISTS \`seed_metadata\` (
      \`id\` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
      \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`version\` VARCHAR(50),
      \`total_instructors\` INT,
      \`total_reviews\` INT,
      \`status\` VARCHAR(20)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

    // Reabilitar FK checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('   ✅ Schema completo aplicado.');

    // ── SEEDING ──
    // Usamos uma conexão única para transação
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
        // ────────────────────────────────
        // LAYER 1: Integrações (inativas)
        // ────────────────────────────────
        console.log('\n🔌 [4/7] Seedando integrações...');
        const integrations = [
            {
                name: 'Stripe', slug: 'stripe', category: 'payment',
                fields: JSON.stringify([
                    { key: 'apiKey', label: 'Chave de API', type: 'password', required: true, value: null },
                    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: true, value: null },
                    { key: 'publishableKey', label: 'Chave Pública', type: 'text', required: true, value: null },
                ]),
            },
            {
                name: 'Google OAuth', slug: 'google-oauth', category: 'auth',
                fields: JSON.stringify([
                    { key: 'clientId', label: 'Client ID', type: 'text', required: true, value: null },
                    { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, value: null },
                ]),
            },
            {
                name: 'OpenAI', slug: 'openai', category: 'ai',
                fields: JSON.stringify([
                    { key: 'apiKey', label: 'Chave de API', type: 'password', required: true, value: null },
                    { key: 'model', label: 'Modelo', type: 'text', required: false, value: 'gpt-4o-mini' },
                ]),
            },
            {
                name: 'Asaas', slug: 'asaas', category: 'payment',
                fields: JSON.stringify([
                    { key: 'apiKey', label: 'Chave de API', type: 'password', required: true, value: null },
                    { key: 'webhookToken', label: 'Token Webhook', type: 'password', required: false, value: null },
                ]),
            },
            {
                name: 'AbacatePay', slug: 'abacatepay', category: 'payment',
                fields: JSON.stringify([
                    { key: 'apiKey', label: 'Chave de API', type: 'password', required: true, value: null },
                    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false, value: null },
                ]),
            },
            {
                name: 'Twilio', slug: 'twilio', category: 'communication',
                fields: JSON.stringify([
                    { key: 'accountSid', label: 'Account SID', type: 'text', required: true, value: null },
                    { key: 'authToken', label: 'Auth Token', type: 'password', required: true, value: null },
                    { key: 'phoneNumber', label: 'Número Twilio', type: 'text', required: true, value: null },
                ]),
            },
        ];

        for (const intg of integrations) {
            for (const env of ['development', 'production'] as const) {
                await conn.query(
                    `INSERT INTO integrations (id, name, slug, category, status, environment, is_default, fields)
           VALUES (?, ?, ?, ?, 'inactive', ?, FALSE, ?)`,
                    [uuid(), intg.name, intg.slug, intg.category, env, intg.fields]
                );
            }
        }
        console.log(`   ✅ ${integrations.length} integrações × 2 ambientes = ${integrations.length * 2} registros.`);

        // ────────────────────────────────
        // LAYER 1b: Admin Settings
        // ────────────────────────────────
        // Já inserido pelo mysql-schema.sql, mas garantir:
        const [existingSettings] = await conn.query('SELECT COUNT(*) as count FROM admin_settings') as any;
        if (existingSettings[0].count === 0) {
            await conn.query(
                `INSERT INTO admin_settings (id, platform_fee_percent, cancellation_fee_percent, cancellation_instructor_share_percent)
         VALUES (?, 20.00, 20.00, 50.00)`,
                [uuid()]
            );
        }
        console.log('   ✅ Admin settings configuradas (taxa plataforma: 20%).');

        // ────────────────────────────────
        // LAYER 2: Admins reais
        // ────────────────────────────────
        console.log('\n👤 [5/7] Seedando admins...');
        const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

        const adminMasterId = uuid();
        const adminSupportId = uuid();

        await conn.query(
            `INSERT INTO users (id, email, first_name, last_name, role, kyc_status, password)
       VALUES (?, ?, ?, ?, 'admin', 'approved', ?)`,
            [adminMasterId, 'admin@habilitfy.com.br', 'Admin', 'Master', hashedPassword]
        );

        await conn.query(
            `INSERT INTO users (id, email, first_name, last_name, role, kyc_status, password)
       VALUES (?, ?, ?, ?, 'admin', 'approved', ?)`,
            [adminSupportId, 'suporte@habilitfy.com.br', 'Suporte', 'HabilitFy', hashedPassword]
        );

        // Carteiras dos admins
        await conn.query(
            'INSERT INTO wallets (id, user_id, balance, currency) VALUES (?, ?, 0.00, ?)',
            [uuid(), adminMasterId, 'BRL']
        );
        await conn.query(
            'INSERT INTO wallets (id, user_id, balance, currency) VALUES (?, ?, 0.00, ?)',
            [uuid(), adminSupportId, 'BRL']
        );

        console.log('   ✅ Admin Master + Suporte criados.');
        console.log(`   📧 Login: admin@habilitfy.com.br / ${DEFAULT_PASSWORD}`);

        // ────────────────────────────────
        // LAYER 3: Instrutores Fakes (Prova Social)
        // ────────────────────────────────
        console.log('\n🎓 [6/7] Seedando instrutores fakes (prova social)...');
        const instructorUserIds: string[] = [];
        const instructorProfileIds: string[] = [];

        for (let i = 0; i < INSTRUCTOR_COUNT; i++) {
            const userId = uuid();
            const instructorId = uuid();
            const neighborhood = RJ_NEIGHBORHOODS[i % RJ_NEIGHBORHOODS.length];
            const isMale = Math.random() > 0.4; // 60% masc, 40% fem
            const firstName = isMale ? faker.person.firstName('male') : faker.person.firstName('female');
            const lastName = faker.person.lastName();
            const email = faker.internet.email({ firstName, lastName, provider: 'instrutorhf.com.br' }).toLowerCase();
            const cpf = generateUniqueCPF();
            const phone = faker.phone.number({ style: 'national' });

            // Variação na localização (≈ 500m de raio)
            const latOffset = (Math.random() - 0.5) * 0.009;
            const lngOffset = (Math.random() - 0.5) * 0.009;
            const lat = neighborhood.lat + latOffset;
            const lng = neighborhood.lng + lngOffset;

            // User
            await conn.query(
                `INSERT INTO users (id, email, first_name, last_name, role, kyc_status, phone, cpf,
         neighborhood, city, state, lat, lng, password, profile_image_url)
         VALUES (?, ?, ?, ?, 'instructor', 'approved', ?, ?, ?, 'Rio de Janeiro', 'RJ', ?, ?, ?, ?)`,
                [
                    userId, email, firstName, lastName, phone, cpf,
                    neighborhood.name, lat, lng, hashedPassword,
                    `https://randomuser.me/api/portraits/${isMale ? 'men' : 'women'}/${(i + 1) % 100}.jpg`
                ]
            );

            // Wallet (zerada)
            await conn.query(
                'INSERT INTO wallets (id, user_id, balance, currency) VALUES (?, ?, 0.00, ?)',
                [uuid(), userId, 'BRL']
            );

            // Bio com experiência
            const yearsExp = randomBetween(3, 15);
            let bio = pickRandom(INSTRUCTOR_BIOS).replace('{years}', yearsExp.toString());

            // Preço
            const pricePerHour = randomDecimal(70, 150);
            const rating = randomDecimal(4.2, 5.0);
            const reviewsCount = randomBetween(REVIEWS_PER_INSTRUCTOR_MIN, REVIEWS_PER_INSTRUCTOR_MAX);

            // Veículo principal
            const vehicle = pickRandom(VEHICLES);

            // Instructor profile
            await conn.query(
                `INSERT INTO instructors (id, user_id, bio, price_per_hour, slot_duration_minutes,
         vehicle_model, vehicle_year, vehicle_type, vehicle_plate,
         rating, reviews_count, lat, lng, neighborhood, city, state, status, pix_key)
         VALUES (?, ?, ?, ?, 50, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Rio de Janeiro', 'RJ', 'approved', ?)`,
                [
                    instructorId, userId, bio, pricePerHour,
                    `${vehicle.brand} ${vehicle.model}`, `${randomBetween(2019, 2024)}`,
                    vehicle.category, generatePlate(),
                    rating, reviewsCount, lat, lng, neighborhood.name,
                    email // pix_key = email for simplicity
                ]
            );

            // Vehicles table
            await conn.query(
                `INSERT INTO vehicles (id, instructor_id, brand, model, year, plate, category, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
                [uuid(), instructorId, vehicle.brand, vehicle.model, randomBetween(2019, 2024), generatePlate(), vehicle.category]
            );

            // Segundo veículo para ~40% dos instrutores
            if (Math.random() < 0.4) {
                const vehicle2 = pickRandom(VEHICLES.filter(v => v.category !== vehicle.category));
                if (vehicle2) {
                    await conn.query(
                        `INSERT INTO vehicles (id, instructor_id, brand, model, year, plate, category, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
                        [uuid(), instructorId, vehicle2.brand, vehicle2.model, randomBetween(2019, 2024), generatePlate(), vehicle2.category]
                    );
                }
            }

            // Availability (seg-sex, 08-18, BRT)
            for (let day = 1; day <= 5; day++) {
                await conn.query(
                    `INSERT INTO availability (id, instructor_id, day_of_week, start_time, end_time)
           VALUES (?, ?, ?, '08:00', '18:00')`,
                    [uuid(), instructorId, day]
                );
            }
            // Alguns com sábado
            if (Math.random() < 0.5) {
                await conn.query(
                    `INSERT INTO availability (id, instructor_id, day_of_week, start_time, end_time)
           VALUES (?, ?, 6, '08:00', '13:00')`,
                    [uuid(), instructorId]
                );
            }

            instructorUserIds.push(userId);
            instructorProfileIds.push(instructorId);

            if ((i + 1) % 10 === 0) {
                console.log(`   ... ${i + 1}/${INSTRUCTOR_COUNT} instrutores criados`);
            }
        }
        console.log(`   ✅ ${INSTRUCTOR_COUNT} instrutores fakes com perfis completos.`);

        // ────────────────────────────────
        // LAYER 4: Reviews Fakes (prova social)
        // ────────────────────────────────
        console.log('\n⭐ [7/7] Seedando reviews fakes...');

        // Criar alguns "alunos fantasma" para autorar reviews
        // (não aparecem no marketplace, são apenas autores de reviews)
        const ghostStudentIds: string[] = [];
        const ghostCount = 15;
        for (let i = 0; i < ghostCount; i++) {
            const ghostId = uuid();
            const isMale = Math.random() > 0.5;
            await conn.query(
                `INSERT INTO users (id, email, first_name, last_name, role, kyc_status, password)
         VALUES (?, ?, ?, ?, 'student', 'approved', ?)`,
                [
                    ghostId,
                    `aluno.ghost${i + 1}@habilitfy.internal`,
                    isMale ? faker.person.firstName('male') : faker.person.firstName('female'),
                    faker.person.lastName(),
                    hashedPassword
                ]
            );
            // Wallet for ghost
            await conn.query(
                'INSERT INTO wallets (id, user_id, balance, currency) VALUES (?, ?, 0.00, ?)',
                [uuid(), ghostId, 'BRL']
            );
            ghostStudentIds.push(ghostId);
        }

        let totalReviews = 0;
        for (let idx = 0; idx < instructorProfileIds.length; idx++) {
            const instrId = instructorProfileIds[idx];
            const instrUserId = instructorUserIds[idx];
            const numReviews = randomBetween(REVIEWS_PER_INSTRUCTOR_MIN, REVIEWS_PER_INSTRUCTOR_MAX);

            for (let r = 0; r < numReviews; r++) {
                const studentId = pickRandom(ghostStudentIds);
                const bookingId = uuid();
                const bookingDate = new Date();
                bookingDate.setDate(bookingDate.getDate() - randomBetween(7, 90));
                // Hora entre 08 e 17 (BRT)
                bookingDate.setHours(randomBetween(8, 17), 0, 0, 0);

                // Booking concluído (necessário para FK do review)
                await conn.query(
                    `INSERT INTO bookings (id, student_id, instructor_id, date, duration, price, total_price, status,
           payment_status, completed_at)
           VALUES (?, ?, ?, ?, 50, 100.00, 100.00, 'completed', 'paid', ?)`,
                    [bookingId, studentId, instrId, bookingDate, bookingDate]
                );

                // Review
                const rating = randomBetween(4, 5);
                await conn.query(
                    `INSERT INTO reviews (id, booking_id, student_id, instructor_id, rating, comment)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuid(), bookingId, studentId, instrId, rating, pickRandom(REVIEW_COMMENTS)]
                );
                totalReviews++;
            }
        }
        console.log(`   ✅ ${totalReviews} reviews fakes geradas para prova social.`);

        // ── SEED METADATA ──
        await conn.query(
            `INSERT INTO seed_metadata (id, version, total_instructors, total_reviews, status)
       VALUES (?, 'v3', ?, ?, 'success')`,
            [uuid(), INSTRUCTOR_COUNT, totalReviews]
        );

        // ── COMMIT ──
        await conn.commit();
        console.log('\n✅ ═══════════════════════════════════════════');
        console.log('✅  SEED COMPLETO COM SUCESSO!');
        console.log('✅ ═══════════════════════════════════════════');
        console.log('');
        console.log('📊 Resumo:');
        console.log(`   • Admins:      2 (admin@habilitfy.com.br / suporte@habilitfy.com.br)`);
        console.log(`   • Instrutores: ${INSTRUCTOR_COUNT} perfis com veículos e horários`);
        console.log(`   • Reviews:     ${totalReviews} avaliações (4-5★)`);
        console.log(`   • Integrações: ${integrations.length * 2} registros (inativas, prontas pra config)`);
        console.log(`   • Senha:       ${DEFAULT_PASSWORD}`);
        console.log('');

    } catch (error) {
        // ── ROLLBACK ──
        await conn.rollback();
        console.error('\n❌ ═══════════════════════════════════════════');
        console.error('❌  ERRO NO SEEDING! Rollback executado.');
        console.error('❌ ═══════════════════════════════════════════');
        console.error(error);
        process.exit(1);
    } finally {
        conn.release();
        await pool.end();
    }
}

main().catch(console.error);
