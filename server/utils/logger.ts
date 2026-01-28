export class Logger {
    private isProduction = process.env.NODE_ENV === "production";

    private formatMessage(level: string, message: string, meta?: any) {
        const timestamp = new Date().toISOString();
        const sanitizedMeta = this.sanitize(meta);

        if (this.isProduction) {
            return JSON.stringify({
                timestamp,
                level,
                message,
                ...sanitizedMeta
            });
        }

        const metaString = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : "";
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
