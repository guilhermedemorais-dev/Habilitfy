import { eq, inArray } from "drizzle-orm";
import { db } from "../server/db";
import { instructors, users } from "../shared/schema";
import { hashPassword } from "../server/replitAuth";

type SeedUser = {
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "instructor" | "admin";
  password: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  lat?: string;
  lng?: string;
};

const SEED_USERS: SeedUser[] = [
  {
    email: "admin@habilitfy.local",
    firstName: "Admin",
    lastName: "HabilitFy",
    role: "admin",
    password: "Admin123!",
  },
  {
    email: "aluno@habilitfy.local",
    firstName: "Aluno",
    lastName: "Teste",
    role: "student",
    password: "Aluno123!",
    neighborhood: "Centro",
    city: "Rio de Janeiro",
    state: "RJ",
    lat: "-22.9035",
    lng: "-43.2096",
  },
  {
    email: "instrutor@habilitfy.local",
    firstName: "Instrutor",
    lastName: "Teste",
    role: "instructor",
    password: "Instrutor123!",
    neighborhood: "Copacabana",
    city: "Rio de Janeiro",
    state: "RJ",
    lat: "-22.9719",
    lng: "-43.1823",
  },
];

async function seed() {
  const emails = SEED_USERS.map((user) => user.email);
  const existingUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, emails));

  const existingByEmail = new Map(
    existingUsers.map((row) => [row.email, row.id] as const),
  );

  for (const user of SEED_USERS) {
    const hashedPassword = await hashPassword(user.password);
    const existingId = existingByEmail.get(user.email);

    if (existingId) {
      await db
        .update(users)
        .set({
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          password: hashedPassword,
          neighborhood: user.neighborhood ?? null,
          city: user.city ?? null,
          state: user.state ?? null,
          lat: user.lat ?? null,
          lng: user.lng ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingId));
    } else {
      await db.insert(users).values({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        password: hashedPassword,
        neighborhood: user.neighborhood ?? null,
        city: user.city ?? null,
        state: user.state ?? null,
        lat: user.lat ?? null,
        lng: user.lng ?? null,
      });
    }
  }

  const [instructorRow] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "instrutor@habilitfy.local"));

  if (instructorRow) {
    const existingProfile = await db
      .select({ id: instructors.id })
      .from(instructors)
      .where(eq(instructors.userId, instructorRow.id));

    const profileData = {
      userId: instructorRow.id,
      bio: "Instrutor aprovado para testes.",
      pricePerHour: "90.00",
      vehicleModel: "Onix",
      vehicleYear: "2020",
      vehicleType: "carro",
      credentialNumber: "RJ-TESTE-01",
      status: "approved" as const,
      neighborhood: "Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
      lat: "-22.9719",
      lng: "-43.1823",
      updatedAt: new Date(),
    };

    if (existingProfile.length > 0) {
      await db
        .update(instructors)
        .set(profileData)
        .where(eq(instructors.userId, instructorRow.id));
    } else {
      await db.insert(instructors).values(profileData);
    }
  }

  console.log("Seed auth concluido. Credenciais:");
  for (const user of SEED_USERS) {
    console.log(`${user.role}: ${user.email} / ${user.password}`);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
