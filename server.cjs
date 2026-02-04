// server.js - Entry point para Hostinger Deployments
// Define NODE_ENV e carrega o bundle compilado
process.env.NODE_ENV = 'production';
require('./dist/index.cjs');
