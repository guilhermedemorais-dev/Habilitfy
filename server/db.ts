import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL must be set. Did you forget to provision a database?");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("DB: Attempting to create MySQL pool...");
console.log("DB: Database configuration detected.");

let pool: mysql.Pool;

try {
  // Prioritize individual env vars to avoid URL parsing issues with special chars in password
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

  // Fallback to URI if individual vars are missing (though we expect them in prod)
  if (!connectionConfig.host || !connectionConfig.user || !connectionConfig.password) {
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
