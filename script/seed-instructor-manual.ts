
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Seeding instructor...");

    const email = "instructor_valid_cnpj@example.com";

    // Check if exists
    const existing = await storage.getUserByEmail(email);
    if (existing) {
        console.log("User already exists:", existing.id);
        // Maybe update location if possible, but for now just skip
        // We can manually add lat/long to the user/instructor if needed?
        // The instructor table doesn't have lat/long? 
        // Wait, the map needs lat/long.
        // The previous analysis of MapPage.tsx showed:
        // .filter(i => i.lat && i.lng)
        // Instructor type in schema has lat/lng?
        // Let's check schema.ts if possible, but map uses `instructor.lat`.
        // storage.ts usually matches schema.
        process.exit(0);
    }

    const hashedPassword = await hashPassword("password123");
    const userId = `seed_${Date.now()}`;

    // Create User
    const user = await storage.upsertUser({
        id: userId,
        email: email,
        password: hashedPassword,
        role: "instructor",
        kycStatus: "approved",
        isVerified: true,
        firstName: "Instrutor",
        lastName: "Validado",
        cnpj: "54.504.422/0001-23", // VALID CNPJ
        phone: "11999999999",
        city: "Rio de Janeiro",
        state: "RJ",
        // Geo location is usually stored on the user or instructor?
        // MapPage.tsx maps `instructors` which are `InstructorWithUser`.
        // It checks `instructor.lat` and `instructor.lng`.
        // So the 'instructors' table must have lat/lng.
    } as any);

    console.log("User created:", user.id);

    // Create Instructor
    // We need to make sure we set lat/lng.
    // The createInstructor interface might not expose it if it's auto-calculated?
    // Or we need to update it manually using db.

    const instructor = await storage.createInstructor({
        userId: user.id,
        bio: "Instrutor criado via script com CNPJ válido.",
        pricePerHour: "60.00",
        vehicleModel: "HB20",
        vehicleYear: "2022",
        vehicleType: "Carro",
        vehiclePlate: "RIO-2026",
        status: "approved",
        credentialNumber: "123456789",
        documentNumber: "12345678900",
        // Dummy images
        selfieImageUrl: "https://placehold.co/100",
        documentImageUrl: "https://placehold.co/100",
        cnhFrontImageUrl: "https://placehold.co/100",
        cnhBackImageUrl: "https://placehold.co/100",
        credentialImageUrl: "https://placehold.co/100",
        vehicleAuthorizationImageUrl: "https://placehold.co/100",
        vehicleImageUrl: "https://placehold.co/100",
        vehicleDocImageUrl: "https://placehold.co/100",
        vehiclePlateImageUrl: "https://placehold.co/100",
    } as any);

    console.log("Instructor created:", instructor.id);

    // Manually update lat/lng using DB directly if storage doesn't support it
    // Assuming 'instructors' table has lat/lng columns as seen in MapPage
    const { instructors } = await import("../shared/schema");
    await db.update(instructors)
        .set({
            lat: "-22.9068",
            lng: "-43.1729",
            rating: "5.0"
        } as any)
        .where(sql`${instructors.id} = ${instructor.id}`);

    console.log("Instructor updated with location Rio de Janeiro.");

    process.exit(0);
}

main().catch((err) => {
    console.error("Error seeding:", err);
    process.exit(1);
});
