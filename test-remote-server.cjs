const http = require('http');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'remote-debug.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logMessage);
    console.log(message);
}

log("=== INICIANDO TESTE REMOTO ===");
log(`Node Version: ${process.version}`);
log(`Current Directory: ${process.cwd()}`);
log(`ENV PORT: ${process.env.PORT}`);
log(`ENV NODE_ENV: ${process.env.NODE_ENV}`);

// Tenta carregar o .env.production
try {
    const envPath = path.resolve(__dirname, '.env.production');
    if (fs.existsSync(envPath)) {
        log("Arquivo .env.production encontrado.");
        const dotenv = require('dotenv');
        dotenv.config({ path: envPath });
        log("Variáveis de ambiente carregadas do .env.production");
    } else {
        log("AVISO: .env.production NÃO encontrado.");
    }
} catch (e) {
    log(`Erro ao carregar dotenv: ${e.message}`);
}

// Teste de Conexão com Banco
async function testDb() {
    log("Testando conexão com banco de dados...");
    const mysql = require('mysql2/promise');

    // Fallback manual se process.env.DATABASE_URL não estiver definido
    // Substitua aqui se necessário para teste hardcoded
    const dbConfig = process.env.DATABASE_URL || {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        log("Conexão MySQL: SUCESSO!");
        const [rows] = await connection.execute('SELECT 1 as val');
        log(`Query Teste: ${JSON.stringify(rows)}`);
        await connection.end();
    } catch (err) {
        log(`ERRO MySQL: ${err.message}`);
        log(`Detalhes: ${JSON.stringify(err)}`);
    }
}

// Teste de Servidor HTTP
function startServer() {
    const port = process.env.PORT || 4000;
    log(`Tentando subir servidor na porta ${port}...`);

    const server = http.createServer((req, res) => {
        log(`Recebida requisição: ${req.method} ${req.url}`);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Servidor de Teste Remoto Funcionando!');
    });

    server.on('error', (e) => {
        log(`ERRO Servidor HTTP: ${e.code} - ${e.message}`);
    });

    server.listen(port, () => {
        log(`Servidor ouvindo na porta ${port}`);
        log(`Acesse http://seu-dominio:${port} para testar.`);
    });
}

(async () => {
    await testDb();
    startServer();
})();
