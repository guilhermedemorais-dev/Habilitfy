// server.cjs - Entry point para Hostinger Deployments
// Carrega variáveis de ambiente e inicia o servidor

// Load dotenv first (for .env.production fallback)
try {
    require('dotenv').config({ path: '.env.production' });
} catch (e) {
    // dotenv may not be installed in production, that's OK if env vars are set
    console.log('dotenv not available, using system environment variables');
}

// Set NODE_ENV
process.env.NODE_ENV = 'production';

// Start the server
require('./dist/index.cjs');
