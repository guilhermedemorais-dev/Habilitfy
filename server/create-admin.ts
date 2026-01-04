
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
    const email = "guilhermemp.business@gmail.com";
    const password = "admin"; // senha temporária

    console.log(`Creating admin user: ${email}`);

    // Check if exists
    const existing = await storage.getUserByUsername(email);
    if (existing) {
        console.log("User already exists. Updating password...");
        const hashed = await hashPassword(password);
        await db.update(users).set({ password: hashed, role: 'admin' }).where(eq(users.id, existing.id));
        console.log("Admin updated successfully.");
        process.exit(0);
    }

    const hashed = await hashPassword(password);

    await storage.upsertUser({
        email,
        firstName: "Guilherme",
        lastName: "Admin",
        password: hashed,
        role: "admin",
    } as any);

    console.log("Admin user created successfully!");
    process.exit(0);
}

createAdmin().catch(console.error);
