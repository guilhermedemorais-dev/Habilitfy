
import { db } from "../server/db";
import { users } from "@shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

async function createAdmin() {
    const email = "admin@habilitfy.com";
    const password = "admin123";

    console.log(`Checking for admin user: ${email}`);

    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        console.log("Admin user already exists.");
        if (existingUser.role !== "admin") {
            console.log("Updating role to admin...");
            await db.update(users).set({ role: "admin" }).where(eq(users.email, email));
        }
    } else {
        console.log("Creating new admin user...");
        const hashedPassword = await hashPassword(password);
        await db.insert(users).values({
            email,
            password: hashedPassword,
            role: "admin",
            firstName: "Super",
            lastName: "Admin",
            username: "admin"
        });
        console.log("Admin user created successfully.");
    }

    process.exit(0);
}

createAdmin().catch((err) => {
    console.error("Error creating admin:", err);
    process.exit(1);
});
