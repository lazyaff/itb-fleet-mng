import { PrismaClient } from "@prisma/client";

export async function roleSeeder(prisma: PrismaClient) {
  const data = [
    {
      id: "SADM",
      name: "Super Admin",
    },
    {
      id: "ADM",
      name: "Admin",
    },
  ];

  console.log("Seeding roles...");

  await prisma.role.createMany({
    data,
  });
}
