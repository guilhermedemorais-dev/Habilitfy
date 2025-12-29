import { eq, sql } from "drizzle-orm";
import { db } from "../server/db";
import { bookings, instructors, users } from "../shared/schema";

type SeedInstructor = {
  id: string;
  pricePerHour: string;
};

type SeedStudent = {
  id: string;
};

const MEETING_ADDRESSES = [
  "Rua das Flores, 120 - Centro",
  "Avenida Brasil, 980 - Centro",
  "Rua do Comercio, 45 - Centro",
  "Rua Rio Branco, 300 - Centro",
  "Avenida Atlantica, 210 - Jardim",
  "Rua da Paz, 77 - Jardim",
  "Rua Sao Pedro, 540 - Norte",
  "Avenida Central, 15 - Sul",
];

const STATUS_POOL = [
  "completed",
  "paid",
  "confirmed",
  "pending",
  "cancelled",
] as const;

const randomItem = <T>(items: T[]) => {
  return items[Math.floor(Math.random() * items.length)];
};

const randomDate = () => {
  const now = new Date();
  const dayOffset = Math.floor(Math.random() * 40) - 20;
  const hour = 8 + Math.floor(Math.random() * 10);
  const minute = Math.random() > 0.5 ? 30 : 0;
  const date = new Date(now);
  date.setDate(now.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const getPaymentStatus = (status: string) => {
  if (status === "paid" || status === "completed") return "paid";
  if (status === "cancelled") return "cancelled";
  return "pending";
};

async function seedBookings() {
  const [countRow] = await db
    .select({
      count: sql<number>`count(${bookings.id})`.mapWith(Number),
    })
    .from(bookings);

  const existingCount = countRow?.count ?? 0;
  const targetCount = 30;

  if (existingCount >= targetCount) {
    console.log(
      `Seed ignorado: ja existem ${existingCount} agendamentos (meta ${targetCount}).`,
    );
    return;
  }

  const [approvedInstructors, allInstructors, students] = await Promise.all([
    db
      .select({ id: instructors.id, pricePerHour: instructors.pricePerHour })
      .from(instructors)
      .where(eq(instructors.status, "approved" as any)),
    db
      .select({ id: instructors.id, pricePerHour: instructors.pricePerHour })
      .from(instructors),
    db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "student" as any)),
  ]);

  const instructorPool =
    approvedInstructors.length > 0 ? approvedInstructors : allInstructors;

  if (instructorPool.length === 0 || students.length === 0) {
    console.log("Seed cancelado: faltam instrutores ou alunos.");
    return;
  }

  const toCreate = targetCount - existingCount;
  const inserts = Array.from({ length: toCreate }).map(() => {
    const instructor = randomItem(instructorPool) as SeedInstructor;
    const student = randomItem(students) as SeedStudent;
    const basePrice = Number(instructor.pricePerHour || 0);
    const rentVehicle = Math.random() > 0.7;
    const rentalPrice = rentVehicle ? 50 : 0;
    const status = randomItem(STATUS_POOL);
    const total = Number.isFinite(basePrice)
      ? basePrice + rentalPrice
      : 80 + rentalPrice;

    return {
      studentId: student.id,
      instructorId: instructor.id,
      date: randomDate(),
      duration: 50,
      price: basePrice.toFixed(2),
      rentVehicle,
      vehicleRentalPrice: rentalPrice.toFixed(2),
      totalPrice: total.toFixed(2),
      status,
      meetingAddress: randomItem(MEETING_ADDRESSES),
      studentNotes: "Contato via WhatsApp",
      paymentStatus: getPaymentStatus(status),
      paymentProvider:
        status === "paid" || status === "completed" ? "abacatepay" : null,
      paymentDevMode: status === "paid" || status === "completed",
    };
  });

  await db.insert(bookings).values(inserts);

  console.log(`Seed concluido: ${toCreate} agendamentos criados.`);
}

seedBookings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
