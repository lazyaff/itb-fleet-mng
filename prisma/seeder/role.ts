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
    {
      id: "LEAD",
      name: "Team Leader",
    },
    {
      id: "MD",
      name: "Merchandiser",
    },
    {
      id: "MTR",
      name: "Motorist",
    },
    {
      id: "SPG",
      name: "SPG",
    },
  ];

  await prisma.role.createMany({
    data,
  });
}
