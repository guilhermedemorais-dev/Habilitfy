import { db } from "../server/db";
import { users, instructors, vehicles } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

const RIO_CENTER = { lat: -22.9068, lng: -43.1729 };

// Helper to generate random location near Rio
function getRandomLocation() {
    const latOffset = (Math.random() - 0.5) * 0.1; // +/- ~5km
    const lngOffset = (Math.random() - 0.5) * 0.1;
    return {
        lat: (RIO_CENTER.lat + latOffset).toFixed(7),
        lng: (RIO_CENTER.lng + lngOffset).toFixed(7)
    };
}

const INSTRUCTORS_DATA = [
    { firstName: "Carlos", lastName: "Silva", bio: "Instrutor paciente com 10 anos de experiência.", gender: "men", vehicle: "Honda Civic" },
    { firstName: "Fernanda", lastName: "Oliveira", bio: "Especialista em baliza e direção defensiva.", gender: "women", vehicle: "Toyota Corolla" },
    { firstName: "Roberto", lastName: "Almeida", bio: "Aulas dinâmicas para recém-habilitados.", gender: "men", vehicle: "VW Gol" },
    { firstName: "Juliana", lastName: "Costa", bio: "Foco em perder o medo de dirigir.", gender: "women", vehicle: "Fiat Argo" },
    { firstName: "Marcelo", lastName: "Souza", bio: "Instrutor credenciado pelo DETRAN há 15 anos.", gender: "men", vehicle: "Chevrolet Onix" },
    { firstName: "Patricia", lastName: "Lima", bio: "Calma e atenciosa, ideal para iniciantes.", gender: "women", vehicle: "Hyundai HB20" },
    { firstName: "Ricardo", lastName: "Pereira", bio: "Técnicas avançadas de direção e mecânica básica.", gender: "men", vehicle: "Jeep Renegade" },
    { firstName: "Beatriz", lastName: "Santos", bio: "Aulas personalizadas para sua necessidade.", gender: "women", vehicle: "Nissan Kicks" },
    { firstName: "Lucas", lastName: "Ferreira", bio: "Instrutor jovem e moderno, metodologia atualizada.", gender: "men", vehicle: "VW Polo" },
    { firstName: "Amanda", lastName: "Rodrigues", bio: "Especialista em trânsito intenso e rodovias.", gender: "women", vehicle: "Fiat Pulse" },
];

async function main() {
    console.log("Seeding fake instructors...");
    const hashedPassword = await hashPassword("123456");

    for (const [index, data] of INSTRUCTORS_DATA.entries()) {
        const email = `instrutor.fake.${index + 1}@habilitfy.com`;

        // Check if exists
        const [existing] = await db.select().from(users).where(eq(users.email, email));
        if (existing) {
            console.log(`Skipping ${email}, already exists.`);
            continue;
        }

        const userId = crypto.randomUUID();
        const loc = getRandomLocation();
        const photoId = index + 10; // offset for randomuser images

        // 1. Create User
        await db.insert(users).values({
            id: userId,
            email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'instructor',
            kycStatus: 'approved',
            isVerified: true,
            profileImageUrl: `https://randomuser.me/api/portraits/${data.gender}/${photoId}.jpg`,
            lat: loc.lat,
            lng: loc.lng,
            city: "Rio de Janeiro",
            state: "RJ",
            neighborhood: "Copacabana", // Placeholder
            phone: `2199999${1000 + index}`
        });

        // 2. Create Instructor Profile
        const instructorId = crypto.randomUUID();
        await db.insert(instructors).values({
            id: instructorId,
            userId: userId,
            bio: data.bio,
            pricePerHour: (50 + Math.random() * 50).toFixed(2), // 50 to 100
            vehicleModel: data.vehicle,
            vehicleYear: "2022",
            vehicleType: "manual",
            vehiclePlate: `ABC-${1000 + index}`,
            status: "approved",
            rating: (4.5 + Math.random() * 0.5).toFixed(1), // 4.5 to 5.0
            reviewsCount: Math.floor(Math.random() * 50),
            lat: loc.lat,
            lng: loc.lng,
            neighborhood: "Copacabana",
            city: "Rio de Janeiro",
            state: "RJ",
            // images
            vehicleImageUrl: `https://placehold.co/600x400?text=${data.vehicle.replace(" ", "+")}`
        });

        // 3. Create Vehicle
        await db.insert(vehicles).values({
            instructorId: instructorId,
            brand: data.vehicle.split(" ")[0],
            model: data.vehicle.split(" ").slice(1).join(" "),
            year: 2022,
            plate: `ABC-${1000 + index}`,
            category: "B",
            status: "approved",
            photoFront: `https://placehold.co/600x400?text=${data.vehicle.replace(" ", "+")}`
        });

        console.log(`Created instructor: ${data.firstName} ${data.lastName}`);
    }

    console.log("Done seeding fake instructors.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
