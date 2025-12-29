import { eq, inArray } from "drizzle-orm";
import { db } from "../server/db";
import { instructors, users } from "../shared/schema";

type SeedLocation = {
  neighborhood: string;
  city: string;
  state: string;
  lat: string;
  lng: string;
};

type SeedUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: "student" | "instructor";
} & Partial<SeedLocation>;

type SeedInstructorProfile = {
  email: string;
  bio: string;
  pricePerHour: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleType: string;
  credentialNumber: string;
  status: "approved" | "pending";
} & SeedLocation;

const LOCATIONS: SeedLocation[] = [
  {
    neighborhood: "Centro",
    city: "Rio de Janeiro",
    state: "RJ",
    lat: "-22.9035",
    lng: "-43.2096",
  },
  {
    neighborhood: "Bela Vista",
    city: "Sao Paulo",
    state: "SP",
    lat: "-23.5614",
    lng: "-46.6559",
  },
  {
    neighborhood: "Savassi",
    city: "Belo Horizonte",
    state: "MG",
    lat: "-19.9390",
    lng: "-43.9336",
  },
  {
    neighborhood: "Centro",
    city: "Curitiba",
    state: "PR",
    lat: "-25.4284",
    lng: "-49.2733",
  },
  {
    neighborhood: "Moinhos",
    city: "Porto Alegre",
    state: "RS",
    lat: "-30.0286",
    lng: "-51.2159",
  },
];

const studentSeeds: SeedUser[] = [
  {
    firstName: "Ana",
    lastName: "Silva",
    email: "ana.silva@habilitfy.local",
    role: "student",
    ...LOCATIONS[0],
  },
  {
    firstName: "Beatriz",
    lastName: "Costa",
    email: "beatriz.costa@habilitfy.local",
    role: "student",
    ...LOCATIONS[1],
  },
  {
    firstName: "Carla",
    lastName: "Souza",
    email: "carla.souza@habilitfy.local",
    role: "student",
    ...LOCATIONS[2],
  },
  {
    firstName: "Daniela",
    lastName: "Almeida",
    email: "daniela.almeida@habilitfy.local",
    role: "student",
    ...LOCATIONS[3],
  },
  {
    firstName: "Eduarda",
    lastName: "Rocha",
    email: "eduarda.rocha@habilitfy.local",
    role: "student",
    ...LOCATIONS[4],
  },
  {
    firstName: "Fabiana",
    lastName: "Lima",
    email: "fabiana.lima@habilitfy.local",
    role: "student",
    ...LOCATIONS[0],
  },
  {
    firstName: "Gabriela",
    lastName: "Mendes",
    email: "gabriela.mendes@habilitfy.local",
    role: "student",
    ...LOCATIONS[1],
  },
  {
    firstName: "Helena",
    lastName: "Nunes",
    email: "helena.nunes@habilitfy.local",
    role: "student",
    ...LOCATIONS[2],
  },
  {
    firstName: "Isabela",
    lastName: "Martins",
    email: "isabela.martins@habilitfy.local",
    role: "student",
    ...LOCATIONS[3],
  },
  {
    firstName: "Juliana",
    lastName: "Ferreira",
    email: "juliana.ferreira@habilitfy.local",
    role: "student",
    ...LOCATIONS[4],
  },
  {
    firstName: "Karen",
    lastName: "Ribeiro",
    email: "karen.ribeiro@habilitfy.local",
    role: "student",
    ...LOCATIONS[0],
  },
  {
    firstName: "Larissa",
    lastName: "Barbosa",
    email: "larissa.barbosa@habilitfy.local",
    role: "student",
    ...LOCATIONS[1],
  },
  {
    firstName: "Mariana",
    lastName: "Cardoso",
    email: "mariana.cardoso@habilitfy.local",
    role: "student",
    ...LOCATIONS[2],
  },
  {
    firstName: "Natalia",
    lastName: "Vieira",
    email: "natalia.vieira@habilitfy.local",
    role: "student",
    ...LOCATIONS[3],
  },
  {
    firstName: "Patricia",
    lastName: "Gomes",
    email: "patricia.gomes@habilitfy.local",
    role: "student",
    ...LOCATIONS[4],
  },
  {
    firstName: "Renata",
    lastName: "Moreira",
    email: "renata.moreira@habilitfy.local",
    role: "student",
    ...LOCATIONS[0],
  },
  {
    firstName: "Sabrina",
    lastName: "Teixeira",
    email: "sabrina.teixeira@habilitfy.local",
    role: "student",
    ...LOCATIONS[1],
  },
  {
    firstName: "Tatiane",
    lastName: "Rodrigues",
    email: "tatiane.rodrigues@habilitfy.local",
    role: "student",
    ...LOCATIONS[2],
  },
  {
    firstName: "Vanessa",
    lastName: "Carvalho",
    email: "vanessa.carvalho@habilitfy.local",
    role: "student",
    ...LOCATIONS[3],
  },
  {
    firstName: "Yasmin",
    lastName: "Pinto",
    email: "yasmin.pinto@habilitfy.local",
    role: "student",
    ...LOCATIONS[4],
  },
];

const instructorUserSeeds: SeedUser[] = [
  {
    firstName: "Carlos",
    lastName: "Santos",
    email: "carlos.santos@habilitfy.local",
    role: "instructor",
    ...LOCATIONS[0],
  },
  {
    firstName: "Diego",
    lastName: "Pereira",
    email: "diego.pereira@habilitfy.local",
    role: "instructor",
    ...LOCATIONS[1],
  },
  {
    firstName: "Felipe",
    lastName: "Carvalho",
    email: "felipe.carvalho@habilitfy.local",
    role: "instructor",
    ...LOCATIONS[2],
  },
  {
    firstName: "Gustavo",
    lastName: "Ribeiro",
    email: "gustavo.ribeiro@habilitfy.local",
    role: "instructor",
    ...LOCATIONS[3],
  },
  {
    firstName: "Henrique",
    lastName: "Oliveira",
    email: "henrique.oliveira@habilitfy.local",
    role: "instructor",
    ...LOCATIONS[4],
  },
];

const instructorProfiles: SeedInstructorProfile[] = [
  {
    email: "carlos.santos@habilitfy.local",
    bio: "Instrutor com foco em aulas praticas e preparacao para prova.",
    pricePerHour: "85.00",
    vehicleModel: "Onix",
    vehicleYear: "2019",
    vehicleType: "carro",
    credentialNumber: "RJ-12890",
    status: "approved",
    ...LOCATIONS[0],
  },
  {
    email: "diego.pereira@habilitfy.local",
    bio: "Especialista em alunos iniciantes e controle de ansiedade.",
    pricePerHour: "90.00",
    vehicleModel: "HB20",
    vehicleYear: "2020",
    vehicleType: "carro",
    credentialNumber: "RJ-33211",
    status: "approved",
    ...LOCATIONS[1],
  },
  {
    email: "felipe.carvalho@habilitfy.local",
    bio: "Aulas objetivas para quem precisa de rapidez e seguranca.",
    pricePerHour: "95.00",
    vehicleModel: "Civic",
    vehicleYear: "2018",
    vehicleType: "carro",
    credentialNumber: "RJ-45102",
    status: "pending",
    ...LOCATIONS[2],
  },
  {
    email: "gustavo.ribeiro@habilitfy.local",
    bio: "Instrutor calmo, ideal para treinos de baliza e estacionamento.",
    pricePerHour: "80.00",
    vehicleModel: "Ka",
    vehicleYear: "2017",
    vehicleType: "carro",
    credentialNumber: "RJ-77841",
    status: "pending",
    ...LOCATIONS[3],
  },
  {
    email: "henrique.oliveira@habilitfy.local",
    bio: "Experiencia em aulas noturnas e simulados completos.",
    pricePerHour: "110.00",
    vehicleModel: "Corolla",
    vehicleYear: "2021",
    vehicleType: "carro",
    credentialNumber: "RJ-90452",
    status: "approved",
    ...LOCATIONS[4],
  },
];

async function seed() {
  const allUsers = [...studentSeeds, ...instructorUserSeeds];
  const emails = allUsers.map((user) => user.email);

  const existingUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, emails));

  const existingEmailSet = new Set(
    existingUsers.map((row) => row.email).filter(Boolean) as string[],
  );

  const newUsers = allUsers.filter((user) => !existingEmailSet.has(user.email));

  if (newUsers.length > 0) {
    await db.insert(users).values(
      newUsers.map((user) => ({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        neighborhood: user.neighborhood,
        city: user.city,
        state: user.state,
        lat: user.lat,
        lng: user.lng,
      })),
    );
  }

  for (const user of allUsers) {
    await db
      .update(users)
      .set({
        neighborhood: user.neighborhood ?? null,
        city: user.city ?? null,
        state: user.state ?? null,
        lat: user.lat ?? null,
        lng: user.lng ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.email, user.email));
  }

  const seededUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, emails));

  const userIdByEmail = new Map(
    seededUsers
      .map((row) => [row.email, row.id] as const)
      .filter(([email]) => Boolean(email)),
  );

  const instructorUserIds = instructorProfiles
    .map((profile) => userIdByEmail.get(profile.email))
    .filter(Boolean) as string[];

  const existingInstructors = await db
    .select({ userId: instructors.userId })
    .from(instructors)
    .where(inArray(instructors.userId, instructorUserIds));

  const existingInstructorSet = new Set(
    existingInstructors.map((row) => row.userId),
  );

  const newInstructorProfiles = instructorProfiles
    .filter((profile) => {
      const userId = userIdByEmail.get(profile.email);
      return userId && !existingInstructorSet.has(userId);
    })
    .map((profile) => ({
      userId: userIdByEmail.get(profile.email) as string,
      bio: profile.bio,
      pricePerHour: profile.pricePerHour,
      vehicleModel: profile.vehicleModel,
      vehicleYear: profile.vehicleYear,
      vehicleType: profile.vehicleType,
      credentialNumber: profile.credentialNumber,
      status: profile.status,
      neighborhood: profile.neighborhood,
      city: profile.city,
      state: profile.state,
      lat: profile.lat,
      lng: profile.lng,
    }));

  if (newInstructorProfiles.length > 0) {
    await db.insert(instructors).values(newInstructorProfiles);
  }

  for (const profile of instructorProfiles) {
    const userId = userIdByEmail.get(profile.email);
    if (!userId) continue;
    await db
      .update(instructors)
      .set({
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state,
        lat: profile.lat,
        lng: profile.lng,
        updatedAt: new Date(),
      })
      .where(eq(instructors.userId, userId));
  }

  console.log("Seed concluido.");
  console.log(
    `Usuarios novos: ${newUsers.length} | Instrutores novos: ${newInstructorProfiles.length}`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
