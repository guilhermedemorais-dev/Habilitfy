import { db } from "../server/db";
import { users } from "@shared/schema";
import { hashPassword } from "../server/auth";
import * as crypto from "crypto";

async function seed() {
    console.log("🌱 Seeding Auth Users...");

    const passwordHash = await hashPassword("password123");

    const roles = ['master', 'manager', 'support'];

    for (const role of roles) {
        const existing = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.email, `admin_${role}@habilitfy.com`)
        });

        if (!existing) {
            await db.insert(users).values({
                id: crypto.randomUUID(),
                email: `admin_${role}@habilitfy.com`,
                password: passwordHash,
                role: 'admin',
                adminRole: role as any,
                firstName: `Admin`,
                lastName: role.charAt(0).toUpperCase() + role.slice(1),
                isVerified: true,
                kycStatus: 'approved',
                createdAt: new Date(),
            });
            console.log(`Created admin: admin_${role}@habilitfy.com`);
        } else {
            console.log(`Admin exists: admin_${role}@habilitfy.com`);
        }
    }

    console.log("✅ Auth seed completed.");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Auth seed failed:", err);
    process.exit(1);
});
