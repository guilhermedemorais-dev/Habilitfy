// server.cjs - Entry point para Hostinger Deployments
// Com logging de erros para diagnóstico

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Function to write startup logs
function logStartup(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(path.join(logsDir, 'startup.log'), logMessage);
    console.log(logMessage.trim());
}

// Catch any uncaught errors during startup
process.on('uncaughtException', (err) => {
    const errorMessage = `UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`;
    fs.writeFileSync(path.join(logsDir, 'crash.log'), `[${new Date().toISOString()}] ${errorMessage}`);
    console.error(errorMessage);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    const errorMessage = `UNHANDLED REJECTION: ${reason}`;
    fs.writeFileSync(path.join(logsDir, 'crash.log'), `[${new Date().toISOString()}] ${errorMessage}`);
    console.error(errorMessage);
});

try {
    logStartup('=== STARTING SERVER ===');
    logStartup(`CWD: ${process.cwd()}`);
    logStartup(`__dirname: ${__dirname}`);
    logStartup(`Node version: ${process.version}`);

    // Check if dist/index.cjs exists
    const indexPath = path.join(__dirname, 'dist', 'index.cjs');
    if (!fs.existsSync(indexPath)) {
        throw new Error(`dist/index.cjs not found at ${indexPath}`);
    }
    logStartup(`dist/index.cjs found: ${indexPath}`);

    // Check if dist/public exists
    const publicPath = path.join(__dirname, 'dist', 'public');
    if (!fs.existsSync(publicPath)) {
        throw new Error(`dist/public not found at ${publicPath}`);
    }
    logStartup(`dist/public found: ${publicPath}`);

    // Load dotenv
    logStartup('Loading dotenv...');
    try {
        const dotenv = require('dotenv');
        const envPath = path.join(__dirname, '.env.production');
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
            logStartup(`.env.production loaded from ${envPath}`);
        } else {
            logStartup(`.env.production not found at ${envPath}, using system env vars`);
        }
    } catch (e) {
        logStartup(`dotenv not available: ${e.message}`);
    }

    // Log environment status (without exposing secrets)
    logStartup(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    logStartup(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
    logStartup(`DB_HOST: ${process.env.DB_HOST ? 'SET' : 'NOT SET'}`);
    logStartup(`PORT: ${process.env.PORT || 'not set (will use default)'}`);

    // Set NODE_ENV
    process.env.NODE_ENV = 'production';
    logStartup('NODE_ENV set to production');

    // Start the server
    logStartup('Loading dist/index.cjs...');
    require('./dist/index.cjs');
    logStartup('dist/index.cjs loaded successfully');

} catch (err) {
    const errorMessage = `STARTUP ERROR: ${err.message}\n${err.stack}`;
    fs.writeFileSync(path.join(logsDir, 'crash.log'), `[${new Date().toISOString()}] ${errorMessage}`);
    logStartup(`FATAL: ${errorMessage}`);
    process.exit(1);
}
