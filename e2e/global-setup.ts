import { loadEnvFile } from "./env";

const ensureEnv = () => {
  const envFile = loadEnvFile();
  if (!process.env.DATABASE_URL && envFile.DATABASE_URL) {
    process.env.DATABASE_URL = envFile.DATABASE_URL;
  }
  if (!process.env.SESSION_SECRET && envFile.SESSION_SECRET) {
    process.env.SESSION_SECRET = envFile.SESSION_SECRET;
  }
};

export default async function globalSetup() {
  ensureEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada para os testes E2E.");
  }

  const { db, pool } = await import("../server/db");
  const { users, instructors } = await import("../shared/schema");
  const { eq } = await import("drizzle-orm");

  const studentId = "e2e-student";
  const instructorUserId = "e2e-instructor";

  // MySQL compatible: check then insert or update
  const [existingStudent] = await db.select().from(users).where(eq(users.id, studentId));
  if (existingStudent) {
    await db.update(users).set({
      email: "e2e-student@habilitfy.local",
      firstName: "E2E",
      lastName: "Student",
      role: "student",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      lat: "-22.9035",
      lng: "-43.2096",
      updatedAt: new Date(),
    }).where(eq(users.id, studentId));
  } else {
    await db.insert(users).values({
      id: studentId,
      email: "e2e-student@habilitfy.local",
      firstName: "E2E",
      lastName: "Student",
      role: "student",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      lat: "-22.9035",
      lng: "-43.2096",
    });
  }

  const [existingInstructorUser] = await db.select().from(users).where(eq(users.id, instructorUserId));
  if (existingInstructorUser) {
    await db.update(users).set({
      email: "e2e-instructor@habilitfy.local",
      firstName: "E2E",
      lastName: "Instrutor",
      role: "instructor",
      neighborhood: "Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
      lat: "-22.9721",
      lng: "-43.1872",
      updatedAt: new Date(),
    }).where(eq(users.id, instructorUserId));
  } else {
    await db.insert(users).values({
      id: instructorUserId,
      email: "e2e-instructor@habilitfy.local",
      firstName: "E2E",
      lastName: "Instrutor",
      role: "instructor",
      neighborhood: "Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
      lat: "-22.9721",
      lng: "-43.1872",
    });
  }

  const [existingInstructor] = await db
    .select({ id: instructors.id })
    .from(instructors)
    .where(eq(instructors.userId, instructorUserId));

  if (existingInstructor) {
    await db
      .update(instructors)
      .set({
        bio: "Instrutor E2E para testes automatizados.",
        pricePerHour: "99.00",
        vehicleModel: "Onix",
        vehicleYear: "2021",
        vehicleType: "carro",
        credentialNumber: "E2E-0001",
        status: "approved",
        neighborhood: "Copacabana",
        city: "Rio de Janeiro",
        state: "RJ",
        lat: "-22.9721",
        lng: "-43.1872",
        updatedAt: new Date(),
      })
      .where(eq(instructors.userId, instructorUserId));
  } else {
    await db.insert(instructors).values({
      userId: instructorUserId,
      bio: "Instrutor E2E para testes automatizados.",
      pricePerHour: "99.00",
      vehicleModel: "Onix",
      vehicleYear: "2021",
      vehicleType: "carro",
      credentialNumber: "E2E-0001",
      status: "approved",
      neighborhood: "Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
      lat: "-22.9721",
      lng: "-43.1872",
    });
  }

  await pool.end();
}
