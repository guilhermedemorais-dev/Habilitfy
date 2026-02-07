
import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("Please provide an email address");
        process.exit(1);
    }

    try {
        const [user] = await db.select().from(users).where(eq(users.email, email));

        if (!user) {
            console.error("User not found");
            process.exit(1);
        }

        console.log("TOKEN:", user.verificationToken);
        console.log("IS_VERIFIED:", user.isVerified);
    } catch (error) {
        console.error("Error fetching token:", error);
    } finally {
        process.exit(0);
    }
}

main();
