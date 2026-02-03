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
console.log("DB: DATABASE_URL format check:", process.env.DATABASE_URL?.substring(0, 30) + "...");

let pool: mysql.Pool;

try {
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log("DB: MySQL pool created successfully");
} catch (error) {
  console.error("DB: Failed to create MySQL pool:", error);
  throw error;
}

export { pool };
export const db = drizzle(pool, { schema, mode: "default" });
console.log("DB: Drizzle ORM initialized");
