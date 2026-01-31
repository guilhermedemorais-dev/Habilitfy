
import { db } from "../server/db";
import { storage } from "../server/storage";
import { users, instructors, bookings, wallets, transactions, adminSettings, availability } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Starting Financial Logic Test...");

    // 1. Setup Admin Settings (Platform Fee = 10%)
    console.log("Setting Platform Fee to 10%...");
    console.log("Deleting old settings...");
    await db.delete(adminSettings);
    console.log("Creating new settings...");
    await storage.updateAdminSettings({ platformFeePercent: "10.00" });

    // 2. Create Test Users
    console.log("Creating users...");
    const uniqueId = Date.now().toString();
    const instructorUser = await storage.upsertUser({
        id: `instr_${uniqueId}`,
        email: `instr_${uniqueId}@test.com`,
        username: `instr_${uniqueId}`,
        password: "password",
        role: "instructor",
        firstName: "Test",
        lastName: "Instructor"
    });

    const studentUser = await storage.upsertUser({
        id: `student_${uniqueId}`,
        email: `student_${uniqueId}@test.com`,
        username: `student_${uniqueId}`,
        password: "password",
        role: "student",
        firstName: "Test",
        lastName: "Student"
    });

    // 3. Create Instructor Profile
    console.log("Creating instructor profile...");
    const instructor = await storage.createInstructor({
        userId: instructorUser.id,
        bio: "Test Bio",
        pricePerHour: "100.00",
        vehicleModel: "Test Car",
        vehicleYear: "2024",
        vehicleType: "car",
        vehiclePlate: "TEST-123",
        credentialNumber: "12345",
        documentNumber: "12345",
        status: "approved"
    });

    // 4. Create Availability & Booking
    console.log("Creating booking...");
    const booking = await storage.createBooking({
        studentId: studentUser.id,
        instructorId: instructor.id,
        date: new Date(),
        startTime: "10:00",
        endTime: "11:00",
        duration: 60,
        status: "pending",
        price: "100.00",
        totalPrice: "100.00",
        address: "Test Address",
        vehicleType: "car"
    });

    console.log(`Booking created: ${booking.id} with price 100.00`);

    // 5. Simulate Payment (Update Booking to PAID)
    console.log("Updating booking to paid...");
    await storage.updateBooking(booking.id, {
        status: "paid",
        paymentStatus: "paid",
        paymentProvider: "test_provider",
        paymentId: `pay_${uniqueId}`
    });

    // Reload booking to get fresh status
    console.log("Reloading booking...");
    const paidBooking = await storage.getBooking(booking.id);

    if (!paidBooking) throw new Error("Booking not found after update");

    // 6. Run upsertBookingTransaction (Limit Logic: likely called by route handler usually, but here calling manually to test unit logic)
    console.log("Triggering detailed transaction logic...");
    const transaction = await storage.upsertBookingTransaction(paidBooking);

    if (!transaction) throw new Error("Transaction not created");

    console.log(`Transaction created. Gross: ${transaction.amountGross}, Net: ${transaction.amountNet}`);

    // 7. Verify Wallet
    const wallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, instructorUser.id)
    });

    if (!wallet) throw new Error("Wallet not found for instructor");

    console.log(`Instructor Wallet Balance: ${wallet.balance}`);

    // Assertions
    const expectedNet = 90.00; // 100 - 10%
    const actualNet = Number(transaction.amountNet);
    const actualBalance = Number(wallet.balance);

    if (Math.abs(actualBalance - expectedNet) < 0.01) {
        console.log("✅ SUCCESS: Wallet balance matches expected net amount (90.00).");
    } else {
        console.error(`❌ FAILURE: Expected wallet balance 90.00, got ${actualBalance}`);
        process.exit(1);
    }

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
