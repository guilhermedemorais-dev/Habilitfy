/**
 * server.cjs - Entry Point com "Modo de Emergência"
 * 
 * Se a aplicação principal falhar (falta de build, erro de código),
 * este script sobe um servidor temporário mostrando o erro no navegador.
 * 
 * ISSO ELIMINA O ERRO 503 E MOSTRA O DIAGNÓSTICO NA TELA.
 */

'use strict';

const path = require('path');
const fs = require('fs');

// [DEBUG EXTREMO] Cria um arquivo assim que o script é tocado
try { fs.writeFileSync(path.join(__dirname, 'BOOT_MARKER.txt'), `Boot attempt at ${new Date().toISOString()}\n`); } catch (e) { }

const util = require('util');
const http = require('http');

// Configuração
const PORT = process.env.PORT || 3000; // Hostinger pode injetar um pipe (string) ou porta (número)
const DIST_PATH = path.resolve(__dirname, 'dist', 'index.cjs');

function envExists(key) {
    return typeof process.env[key] === 'string' && process.env[key].trim().length > 0;
}

function loadEnvFiles() {
    try {
        const dotenv = require('dotenv');
        const candidates = [
            path.resolve(__dirname, '.env.production'),
            path.resolve(__dirname, '.env'),
            path.resolve(process.cwd(), '.env.production'),
            path.resolve(process.cwd(), '.env'),
            path.resolve(__dirname, '..', '.env.production'),
            path.resolve(__dirname, '..', '.env'),
            process.env.HOME ? path.resolve(process.env.HOME, '.env.production') : null,
            process.env.HOME ? path.resolve(process.env.HOME, '.env') : null,
        ].filter(Boolean);

        const loaded = [];
        for (const candidate of candidates) {
            if (!fs.existsSync(candidate)) continue;
            dotenv.config({ path: candidate, override: false });
            loaded.push(candidate);
        }

        if (loaded.length > 0) {
            console.log('[BOOT] dotenv loaded from:', loaded.join(', '));
        } else {
            dotenv.config({ override: false });
            console.log('[BOOT] dotenv fallback to default resolution');
        }
    } catch (e) {
        console.error("Erro no dotenv:", e);
    }
}

// Função para iniciar servidor de erro (Fallback)
function startFallbackServer(errorTitle, errorDetail) {
    console.error(`[FALLBACK] Iniciando servidor de diagnóstico devido a: ${errorTitle}`);

    // Tenta ler .env para diagnóstico
    let envStatus = "Não verificado";
    try {
        if (fs.existsSync(path.resolve(__dirname, '.env.production'))) {
            envStatus = ".env.production encontrado";
        } else {
            envStatus = ".env.production NÃO encontrado (usando variáveis do sistema)";
        }
    } catch (e) { envStatus = `Erro ao ler .env: ${e.message}`; }

    const html = `
    <html>
    <head>
        <title>HabilitFy - Modo de Diagnóstico</title>
        <style>
            body { font-family: monospace; background: #1a1a1a; color: #ff5555; padding: 20px; }
            .box { border: 1px solid #444; padding: 20px; background: #222; border-radius: 5px; margin-bottom: 20px; }
            h1 { color: #ff5555; }
            h2 { color: #fff; border-bottom: 1px solid #444; padding-bottom: 10px; }
            pre { background: #000; padding: 15px; overflow-x: auto; color: #ddd; }
            .success { color: #55ff55; }
        </style>
    </head>
    <body>
        <h1>⚠️ A aplicação falhou ao iniciar</h1>
        <div class="box">
            <h2>Motivo do Erro</h2>
            <h3>${errorTitle}</h3>
            <pre>${errorDetail}</pre>
        </div>

        <div class="box">
            <h2>Diagnóstico do Ambiente</h2>
            <ul>
                <li><strong>Node Version:</strong> ${process.version}</li>
                <li><strong>Platform:</strong> ${process.platform}</li>
                <li><strong>CWD:</strong> ${process.cwd()}</li>
                <li><strong>PORT:</strong> ${PORT}</li>
                <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV}</li>
                <li><strong>Arquivo Build:</strong> ${DIST_PATH}</li>
                <li><strong>Status do Build:</strong> ${fs.existsSync(DIST_PATH) ? '<span class="success">ENCONTRADO</span>' : '❌ NÃO ENCONTRADO (Você precisa rodar npm run build)'}</li>
                <li><strong>Env File:</strong> ${envStatus}</li>
                <li><strong>DB vars presentes:</strong> ${envExists('DATABASE_URL') || (envExists('DB_USER') && envExists('DB_NAME')) ? '<span class="success">SIM</span>' : 'NÃO'}</li>
            </ul>
        </div>
    </body>
    </html>
    `;

    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); // Status 200 para garantir que o Hostinger não substitua a página pelo erro 503 padrão
        res.end(html);
    });

    const listenArgs = isNaN(Number(PORT)) ? [{ path: PORT }] : [PORT];
    server.listen(...listenArgs, () => {
        console.log(`[FALLBACK] Servidor de diagnóstico ouvindo em ${PORT}`);
    });
}

// 1. Tentar carregar variáveis de ambiente
loadEnvFiles();

// 2. Validação Prévia
if (!fs.existsSync(DIST_PATH)) {
    startFallbackServer(
        "Build não encontrado",
        `O arquivo ${DIST_PATH} não existe.\n\nExecute "npm run build" no servidor ou localmente e suba a pasta dist.`
    );
} else {
    // 3. Tentativa de Inicialização Real
    try {
        console.log("[BOOT] Carregando aplicação...");
        require(DIST_PATH);
    } catch (err) {
        startFallbackServer(
            "Erro Fatal na Inicialização da Aplicação",
            err.stack || err.message
        );
    }
}

// 4. Captura de Erros Globais (caso quebre depois de iniciar)
process.on('uncaughtException', (err) => {
    // Se a app já tomou a porta, não conseguimos subir o fallback na mesma porta facilmente
    // Mas se o erro foi no boot, o fallback assume.
    console.error('Uncaught Exception:', err);
    // Se o servidor http não estiver ouvindo, tentamos subir o fallback
    // (Lógica simplificada: apenas loga e tenta manter vivo ou morre e deixa o process manager reiniciar)
});
