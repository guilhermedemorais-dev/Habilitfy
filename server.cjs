/**
 * server.cjs - Entry Point para Deploy Automático (Hostinger / hospedagem compartilhada)
 * 
 * Este arquivo age como um "wrapper" que:
 * 1. Define NODE_ENV=production se não estiver definido
 * 2. Resolve o caminho absoluto para dist/index.cjs
 * 3. Carrega dinamicamente o servidor real
 * 4. Trata erros de forma legível
 * 
 * IMPORTANTE: Este arquivo usa require() em vez de import() porque:
 * - Arquivos .cjs sempre são tratados como CommonJS, independente do "type": "module" no package.json
 * - O dist/index.cjs gerado pelo esbuild também é CommonJS
 * - Isso evita problemas de compatibilidade entre ESM e CJS
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Garantir que NODE_ENV está definido
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Resolver caminho absoluto para dist/index.cjs
// Isso garante que funciona independente do working directory
const distPath = path.resolve(__dirname, 'dist', 'index.cjs');

// Verificar se o arquivo existe antes de tentar carregar
if (!fs.existsSync(distPath)) {
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║  ERRO: Arquivo dist/index.cjs não encontrado!              ║');
    console.error('╠════════════════════════════════════════════════════════════╣');
    console.error('║  O build provavelmente não foi executado corretamente.     ║');
    console.error('║                                                            ║');
    console.error('║  Execute: npm run build                                    ║');
    console.error('║                                                            ║');
    console.error('║  Caminho esperado:                                         ║');
    console.error(`║  ${distPath.substring(0, 58).padEnd(58)} ║`);
    console.error('╚════════════════════════════════════════════════════════════╝');
    process.exit(1);
}

// Carregar o servidor real
console.log(`[server.cjs] NODE_ENV=${process.env.NODE_ENV}`);
console.log(`[server.cjs] Carregando: ${distPath}`);

try {
    require(distPath);
} catch (err) {
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║  ERRO: Falha ao carregar dist/index.cjs                    ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('Detalhes do erro:');
    console.error(err);
    process.exit(1);
}
