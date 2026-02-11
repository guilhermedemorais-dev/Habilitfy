import { db } from "../server/db";
import { users } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

async function main() {
    const email = "guilhermemp.business@gmail.com";
    const password = process.env.ADMIN_PASSWORD || "Habilitfy@2024";

    console.log(`Seeding admin user: ${email}`);

    const hashedPassword = await hashPassword(password);

    const [existing] = await db.select().from(users).where(eq(users.email, email));

    if (existing) {
        console.log("User exists, updating role and password...");
        await db.update(users).set({
            role: 'admin',
            adminRole: 'master',
            password: hashedPassword,
            isVerified: true
        }).where(eq(users.email, email));
    } else {
        console.log("User does not exist, creating...");
        await db.insert(users).values({
            email,
            password: hashedPassword,
            role: 'admin',
            adminRole: 'master',
            firstName: "Guilherme",
            lastName: "Morais",
            isVerified: true,
            kycStatus: "approved"
        });
    }

    console.log("Admin seeded successfully.");
    console.log("Email:", email);
    console.log("Password:", password);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
