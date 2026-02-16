/**
 * server.cjs - Entry Point com "Modo de Emergência"
 * 
 * Se a aplicação principal falhar (falta de build, erro de código),
 * este script sobe um servidor temporário mostrando o erro no navegador.
 * 
 * ISSO ELIMINA O ERRO 503 E MOSTRA O DIAGNÓSTICO NA TELA.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuração
const PORT = process.env.PORT || 3000; // Hostinger pode injetar um pipe (string) ou porta (número)
const DIST_PATH = path.resolve(__dirname, 'dist', 'index.cjs');

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
try {
    const dotenv = require('dotenv');
    const envPath = path.resolve(__dirname, '.env.production');
    if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
    else dotenv.config();
} catch (e) {
    console.error("Erro no dotenv:", e);
}

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
