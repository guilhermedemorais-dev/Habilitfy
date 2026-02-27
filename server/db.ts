import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

console.log("DB: Attempting to create MySQL pool...");

let pool: mysql.Pool;

try {
  const readEnv = (...keys: string[]) => {
    for (const key of keys) {
      const value = process.env[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
    return undefined;
  };

  const dbHost = readEnv("DB_HOST", "MYSQL_HOST", "MYSQLHOST") || "localhost";
  const dbPort = Number(readEnv("DB_PORT", "MYSQL_PORT", "MYSQLPORT")) || 3306;
  const dbUser = readEnv("DB_USER", "MYSQL_USER", "MYSQLUSER");
  const dbPassword =
    readEnv("DB_PASSWORD", "MYSQL_PASSWORD", "MYSQLPASSWORD") ?? "";
  const dbName = readEnv("DB_NAME", "MYSQL_DATABASE", "MYSQLDATABASE");
  const databaseUrl = readEnv("DATABASE_URL", "MYSQL_URL", "JAWSDB_URL");

  // Prefer discrete DB_* vars (safer with special chars in password).
  const hasDiscreteConfig = Boolean(
    dbUser &&
      dbName,
  );
  const hasDatabaseUrl = Boolean(databaseUrl);

  if (!hasDiscreteConfig && !hasDatabaseUrl) {
    const message =
      "Database config missing. Set DATABASE_URL or DB_USER/DB_PASSWORD/DB_NAME (DB_HOST optional).";
    console.error(`FATAL: ${message}`);
    throw new Error(message);
  }

  const connectionConfig = {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  if (!hasDiscreteConfig) {
    console.log("DB: Using DATABASE_URL fallback for connection.");
    pool = mysql.createPool({
      uri: databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  } else {
    console.log(`DB: Connecting using discrete configuration (host=${dbHost}, port=${dbPort}).`);
    pool = mysql.createPool(connectionConfig);
  }
  console.log("DB: MySQL pool created successfully");
} catch (error) {
  console.error("DB: Failed to create MySQL pool:", error);
  throw error;
}

export { pool };
export const db = drizzle(pool, { schema, mode: "default" });
console.log("DB: Drizzle ORM initialized");
