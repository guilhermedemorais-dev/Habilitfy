
import { db } from "../server/db";
import { users, instructors } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Activating all instructors and users...");

    // Activate Users (role = instructor)
    await db.update(users)
        .set({
            kycStatus: "approved",
            isVerified: true
        } as any)
        .where(eq(users.role, "instructor" as any));

    console.log("Users activated.");

    // Activate Instructors
    await db.update(instructors)
        .set({
            status: "approved"
        } as any);

    console.log("Instructors activated.");

    process.exit(0);
}

main().catch((err) => {
    console.error("Error activating:", err);
    process.exit(1);
});
