import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import {
    users, instructors, bookings, transactions, wallets, walletEntries,
    vehicles, availability, reviews, disputes, messages, paymentGateways,
    withdrawals, supportTickets, integrations, adminSettings,
    adminLogs, captureSessions
} from "../shared/schema";
import { hashPassword } from "../server/auth";
import { faker } from "@faker-js/faker";
import * as crypto from "crypto";

// Use a fixed seed for reproducibility (optional)
// faker.seed(123);

async function clearDatabase() {
    console.log("🗑️  Clearing database...");

    // Disable foreign key checks temporarily
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    const tables = [
        walletEntries, transactions, reviews, disputes, messages, bookings,
        vehicles, availability, supportTickets, withdrawals, wallets, instructors,
        adminLogs, captureSessions,
        integrations, adminSettings, paymentGateways, users
    ];

    for (const table of tables) {
        try {
            if (table) await db.delete(table);
        } catch (e: any) {
            console.warn(`Warning deleting table: ${e.message}`);
        }
    }

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    console.log("✅ Database cleared.");
}

async function seed() {
    await clearDatabase();
    console.log("🌱 Starting seed...");

    const passwordHash = await hashPassword("password123");

    // 1. Create Admins
    console.log("Creating Admins...");
    const admins = [];
    const adminRoles = ['master', 'manager', 'support'];

    for (const role of adminRoles) {
        const adminId = crypto.randomUUID();
        await db.insert(users).values({
            id: adminId,
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
        admins.push(adminId);
    }

    // 2. Create Instructors
    console.log("Creating Instructors...");
    const instructorIds = [];
    for (let i = 0; i < 10; i++) {
        const userId = crypto.randomUUID();
        const instructorId = crypto.randomUUID();

        await db.insert(users).values({
            id: userId,
            email: faker.internet.email(),
            password: passwordHash,
            role: 'instructor',
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            phone: faker.phone.number(),
            cpf: faker.string.numeric(11),
            isVerified: true,
            kycStatus: 'approved',
            createdAt: faker.date.past(),
        });

        await db.insert(instructors).values({
            id: instructorId,
            userId: userId,
            bio: faker.lorem.paragraph(),
            pricePerHour: faker.commerce.price({ min: 50, max: 150, dec: 2 }),
            vehicleModel: faker.vehicle.model(),
            vehicleYear: String(faker.date.past().getFullYear()),
            vehicleType: 'Carro',
            vehiclePlate: faker.vehicle.vrm(),
            status: 'approved',
            rating: faker.number.float({ min: 3, max: 5, multipleOf: 0.1 }).toString(),
            reviewsCount: faker.number.int({ min: 0, max: 50 }),
            lat: faker.location.latitude().toString(),
            lng: faker.location.longitude().toString(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            yearsExperience: faker.number.int({ min: 1, max: 20 }),
            specialties: ['Iniciantes', 'Medo de Dirigir', 'Baliza'],
            workingHours: '08:00 - 18:00',
            createdAt: new Date(),
        });

        // Create Vehicles for Instructor
        await db.insert(vehicles).values({
            id: crypto.randomUUID(),
            instructorId: instructorId,
            brand: faker.vehicle.manufacturer(),
            model: faker.vehicle.model(),
            year: faker.date.past().getFullYear(),
            plate: faker.vehicle.vrm(),
            category: 'B',
            status: 'approved',
            createdAt: new Date(),
        });

        // Create Availability
        for (let day = 0; day < 5; day++) {
            await db.insert(availability).values({
                id: crypto.randomUUID(),
                instructorId: instructorId,
                dayOfWeek: day,
                startTime: '08:00',
                endTime: '18:00',
            });
        }

        instructorIds.push(instructorId);
    }

    // 3. Create Students
    console.log("Creating Students...");
    const studentIds = [];
    for (let i = 0; i < 20; i++) {
        const userId = crypto.randomUUID();
        await db.insert(users).values({
            id: userId,
            email: faker.internet.email(),
            password: passwordHash,
            role: 'student',
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            phone: faker.phone.number(),
            cpf: faker.string.numeric(11),
            isVerified: true,
            kycStatus: 'approved',
            createdAt: faker.date.past(),
        });

        // Create Wallet for Student
        const walletId = crypto.randomUUID();
        await db.insert(wallets).values({
            id: walletId,
            userId: userId,
            balance: faker.commerce.price({ min: 0, max: 500, dec: 2 }),
            currency: 'BRL',
        });

        studentIds.push(userId);
    }

    // 4. Create Bookings & Transactions
    console.log("Creating Bookings & Transactions...");
    for (let i = 0; i < 30; i++) {
        const studentId = faker.helpers.arrayElement(studentIds);
        const instructorId = faker.helpers.arrayElement(instructorIds);
        const bookingId = crypto.randomUUID();
        const price = faker.commerce.price({ min: 50, max: 150, dec: 2 });

        const status = faker.helpers.arrayElement(['pending', 'confirmed', 'completed', 'cancelled']);

        await db.insert(bookings).values({
            id: bookingId,
            studentId,
            instructorId,
            date: faker.date.future(),
            duration: 50,
            price: price,
            totalPrice: price,
            status: status,
            paymentStatus: status === 'completed' || status === 'confirmed' ? 'paid' : 'pending',
            createdAt: faker.date.recent(),
        });

        if (status === 'completed' || status === 'confirmed') {
            const transactionId = crypto.randomUUID();
            await db.insert(transactions).values({
                id: transactionId,
                bookingId,
                type: 'booking',
                status: 'paid',
                amountGross: price,
                amountNet: (Number(price) * 0.9).toFixed(2), // 10% platform fee
                fromUserId: studentId,
                // Need to fetch instructor userId to link correctly, skipping for simplicity here or would need a map
                createdAt: new Date(),
            });
        }

        // Add a review for completed bookings
        if (status === 'completed') {
            await db.insert(reviews).values({
                id: crypto.randomUUID(),
                bookingId,
                studentId,
                instructorId,
                rating: faker.number.int({ min: 3, max: 5 }),
                comment: faker.lorem.sentence(),
                createdAt: new Date(),
            });
        }
    }

    // 5. Create Integrations & Settings
    console.log("Creating Integrations & Settings...");
    await db.insert(adminSettings).values({
        id: crypto.randomUUID(),
        platformFeePercent: "10.00",
        cancellationFeePercent: "5.00",
    });

    await db.insert(integrations).values({
        id: crypto.randomUUID(),
        name: 'OpenAI',
        slug: 'openai',
        category: 'ai',
        status: 'active',
        environment: 'production',
        fields: [{ key: 'apiKey', type: 'secret', value: 'sk-placeholder' }],
    });

    console.log("✅ Seed completed successfully!");
    process.exit(0);
}

seed().catch((err: any) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
