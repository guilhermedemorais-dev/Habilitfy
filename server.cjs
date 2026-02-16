/**
 * server.cjs - Entry Point Robusto com Logs em Arquivo
 * Modificado para diagnosticar erro 503 sem acesso ao console.
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Arquivo de log na raiz do projeto
const LOG_FILE = path.join(__dirname, 'debug_boot.log');

function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(LOG_FILE, line);
        // Também joga no console para caso o painel tenha logs
        console.log(line.trim());
    } catch (e) {
        // Se falhar o log, não tem muito o que fazer
    }
}

// Limpa log antigo no restart para não confundir
try { fs.writeFileSync(LOG_FILE, "=== INICIANDO BOOT ===\n"); } catch (e) { }

log(`Process ID: ${process.pid}`);
log(`Node Version: ${process.version}`);
log(`Current Directory: ${process.cwd()}`);

// Carregar variáveis de ambiente
try {
    const dotenv = require('dotenv');
    const envProductionPath = path.resolve(__dirname, '.env.production');

    if (fs.existsSync(envProductionPath)) {
        log(`Carregando .env.production de: ${envProductionPath}`);
        const result = dotenv.config({ path: envProductionPath });
        if (result.error) throw result.error;
        log("Variáveis carregadas com sucesso.");
    } else {
        log("AVISO: .env.production não encontrado. Tentando .env padrão...");
        dotenv.config();
    }
} catch (e) {
    log(`ERRO CRÍTICO ao carregar dotenv: ${e.message}`);
}

// Configurar Ambiente
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
log(`NODE_ENV definido para: ${process.env.NODE_ENV}`);
log(`PORT definido para: ${process.env.PORT || 'INDEFINIDO (usará padrão)'}`);

// Resolver caminho do build
const distPath = path.resolve(__dirname, 'dist', 'index.cjs');
log(`Caminho esperado do build: ${distPath}`);

if (!fs.existsSync(distPath)) {
    log("ERRO FATAL: Arquivo dist/index.cjs NÃO ENCONTRADO.");
    log("O build falhou ou não foi executado corretamente.");
    log("Abortando inicialização.");
    process.exit(1);
}

// Tentar carregar a aplicação
log("Tentando fazer require(dist/index.cjs)...");

try {
    require(distPath);
    log("require() executado. A aplicação deve estar subindo.");
} catch (err) {
    log("ERRO FATAL ao carregar a aplicação:");
    log(err.stack || err.message);
    process.exit(1);
}

// Captura erros não tratados globais
process.on('uncaughtException', (err) => {
    log(`UNCAUGHT EXCEPTION: ${err.message}`);
    log(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`UNHANDLED REJECTION: ${reason}`);
});
