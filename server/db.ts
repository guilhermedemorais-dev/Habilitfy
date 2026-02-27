import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

console.log("DB: Attempting to create MySQL pool...");
console.log("DB: Database configuration detected.");

let pool: mysql.Pool;

try {
  // Prefer discrete DB_* vars (safer with special chars in password).
  const hasDiscreteConfig = Boolean(
    process.env.DB_USER &&
      process.env.DB_PASSWORD &&
      process.env.DB_NAME,
  );
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  if (!hasDiscreteConfig && !hasDatabaseUrl) {
    const message =
      "Database config missing. Set DATABASE_URL or DB_USER/DB_PASSWORD/DB_NAME (DB_HOST optional).";
    console.error(`FATAL: ${message}`);
    throw new Error(message);
  }

  const connectionConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  if (!hasDiscreteConfig) {
    console.log("DB: Using DATABASE_URL fallback for connection.");
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  } else {
    console.log("DB: Connecting using DB_HOST/DB_USER configuration...");
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
