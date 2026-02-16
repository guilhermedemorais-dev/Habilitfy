/**
 * server.cjs - Entry Point com Log Automático para stderr.log
 * Recriando o arquivo de log que o usuário precisa.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');

// O ARQUIVO QUE VOCÊ QUERIA ESTÁ DE VOLTA AQUI 👇
const LOG_FILE = path.join(__dirname, 'stderr.log');

// Função para garantir que tudo vá para o arquivo
const logFile = fs.createWriteStream(LOG_FILE, { flags: 'a' });
const logStdout = process.stdout;
const logStderr = process.stderr;

// Redireciona console.log e console.error para o arquivo
console.log = function () {
    logFile.write(util.format.apply(null, arguments) + '\n');
    logStdout.write(util.format.apply(null, arguments) + '\n');
};
console.error = function () {
    logFile.write(util.format.apply(null, arguments) + '\n');
    logStderr.write(util.format.apply(null, arguments) + '\n');
};

console.log(`[${new Date().toISOString()}] === INICIANDO SERVIDOR ===`);
console.log(`[BOOT] Redirecionando logs para ${LOG_FILE}`);

// Carregar variáveis de ambiente
try {
    const dotenv = require('dotenv');
    const envProductionPath = path.resolve(__dirname, '.env.production');

    if (fs.existsSync(envProductionPath)) {
        console.log(`[BOOT] Carregando .env.production`);
        dotenv.config({ path: envProductionPath });
    } else {
        console.log("[BOOT] .env.production não encontrado. Tentando .env padrão...");
        dotenv.config();
    }
} catch (e) {
    console.error(`[BOOT] ERRO ao carregar dotenv: ${e.message}`);
}

// Configurar Ambiente
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Resolver caminho do build
const distPath = path.resolve(__dirname, 'dist', 'index.cjs');

if (!fs.existsSync(distPath)) {
    console.error("___________________________________________________________");
    console.error("[ERRO FATAL] Arquivo dist/index.cjs NÃO ENCONTRADO.");
    console.error("O build falhou ou não existe.");
    console.error("___________________________________________________________");
    process.exit(1);
}

// Tentar carregar a aplicação
console.log("[BOOT] Iniciando aplicação...");

try {
    require(distPath);
} catch (err) {
    console.error("___________________________________________________________");
    console.error("[ERRO FATAL] A aplicação falhou ao iniciar:");
    console.error(err.stack || err);
    console.error("___________________________________________________________");
    process.exit(1);
}

// Captura erros que escaparam
process.on('uncaughtException', (err) => {
    console.error(`[UNCAUGHT EXCEPTION] ${err.message}`);
    console.error(err.stack);
    process.exit(1);
});
