// server.cjs - Entry point para Hostinger Deployments
// Com logging detalhado para diagnóstico

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'startup.log');
const crashFile = path.join(logsDir, 'crash.log');

// Function to write startup logs
function logStartup(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(logMessage.trim());
}

// Catch any uncaught errors during startup
process.on('uncaughtException', (err) => {
    const errorMessage = `UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`;
    fs.appendFileSync(crashFile, `[${new Date().toISOString()}] ${errorMessage}\n`);
    console.error(errorMessage);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    const errorMessage = `UNHANDLED REJECTION: ${reason}`;
    fs.appendFileSync(crashFile, `[${new Date().toISOString()}] ${errorMessage}\n`);
    console.error(errorMessage);
});

try {
    logStartup('=== STARTING SERVER ===');
    logStartup(`CWD: ${process.cwd()}`);
    logStartup(`__dirname: ${__dirname}`);
    logStartup(`Node version: ${process.version}`);
    logStartup(`Platform: ${process.platform}`);
    logStartup(`User: ${process.env.USER || 'unknown'}`);

    // Log PORT from environment (Hostinger sets this)
    logStartup(`PORT from env: ${process.env.PORT || 'not set'}`);

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

    // Load dotenv ONLY if environment vars are not already set
    logStartup('Checking environment variables...');

    if (!process.env.DATABASE_URL) {
        logStartup('DATABASE_URL not set, loading dotenv...');
        try {
            const dotenv = require('dotenv');
            const envPath = path.join(__dirname, '.env.production');
            if (fs.existsSync(envPath)) {
                dotenv.config({ path: envPath });
                logStartup(`.env.production loaded from ${envPath}`);
            } else {
                logStartup(`.env.production not found at ${envPath}`);
            }
        } catch (e) {
            logStartup(`dotenv error: ${e.message}`);
        }
    } else {
        logStartup('DATABASE_URL already set from system environment');
    }

    // Log environment status (without exposing secrets)
    logStartup(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    logStartup(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'NOT SET'}`);
    logStartup(`DB_HOST: ${process.env.DB_HOST || 'not set'}`);
    logStartup(`PORT: ${process.env.PORT || 'not set (will use 3000)'}`);
    logStartup(`SESSION_SECRET: ${process.env.SESSION_SECRET ? 'SET' : 'NOT SET'}`);

    // Validate required env vars
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required but not set!');
    }
    if (!process.env.SESSION_SECRET) {
        logStartup('WARNING: SESSION_SECRET not set, using fallback');
        process.env.SESSION_SECRET = 'fallback-secret-change-me';
    }

    // Set NODE_ENV
    process.env.NODE_ENV = 'production';
    logStartup('NODE_ENV set to production');

    // Start the server
    logStartup('Loading dist/index.cjs...');
    require('./dist/index.cjs');
    logStartup('dist/index.cjs loaded successfully');

} catch (err) {
    const errorMessage = `STARTUP ERROR: ${err.message}\n${err.stack}`;
    fs.appendFileSync(crashFile, `[${new Date().toISOString()}] ${errorMessage}\n`);
    logStartup(`FATAL: ${errorMessage}`);
    process.exit(1);
}
