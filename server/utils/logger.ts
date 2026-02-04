import fs from "fs";
import path from "path";

export class Logger {
    private isProduction = process.env.NODE_ENV === "production";
    private logFile: string;

    constructor() {
        const logsDir = path.join(process.cwd(), "logs");
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        this.logFile = path.join(logsDir, "application.log");
    }

    private formatMessage(level: string, message: string, meta?: any) {
        const timestamp = new Date().toISOString();
        const sanitizedMeta = this.sanitize(meta);

        // File log format (always plain text)
        const metaString = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : "";
        const fileLogEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}\n`;

        // Write to file (fire and forget to avoid blocking, or sync for safety)
        try {
            fs.appendFileSync(this.logFile, fileLogEntry);
        } catch (e) {
            console.error("Failed to write to log file", e);
        }

        if (this.isProduction) {
            return JSON.stringify({
                timestamp,
                level,
                message,
                ...sanitizedMeta
            });
        }

        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
    }

    private sanitize(obj: any): any {
        if (!obj) return obj;
        if (typeof obj !== "object") return obj;

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitize(item));
        }

        const sanitized: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (["password", "token", "secret", "apiKey", "creditCard"].some(s => key.toLowerCase().includes(s))) {
                    sanitized[key] = "***REDACTED***";
                } else {
                    sanitized[key] = this.sanitize(obj[key]);
                }
            }
        }
        return sanitized;
    }

    info(message: string, meta?: any) {
        console.log(this.formatMessage("info", message, meta));
    }

    warn(message: string, meta?: any) {
        console.warn(this.formatMessage("warn", message, meta));
    }

    error(message: string, meta?: any) {
        console.error(this.formatMessage("error", message, meta));
    }

    debug(message: string, meta?: any) {
        if (!this.isProduction) {
            console.debug(this.formatMessage("debug", message, meta));
        }
    }
}

export const logger = new Logger();
