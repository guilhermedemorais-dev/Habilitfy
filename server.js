// server.js - Entry point para Hostinger Deployments (ESM)
process.env.NODE_ENV = 'production';
import('./dist/index.cjs');
