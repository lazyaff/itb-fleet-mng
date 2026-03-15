import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export async function userSeeder(prisma: PrismaClient) {
  const data = [
    {
      id: "d4a8f3c2-6e1b-4c7a-9d5f-2b8e0f1a7c63",
      role_id: "SADM",
      email: "dummy.dkst@itb.ac.id",
      name: "Super Admin",
      password: bcrypt.hashSync("superadmin", 10),
    },
    {
      id: "4c8e1b7f-2e3c-4d9c-9a8a-1c2b3d4e5fha",
      role_id: "ADM",
      email: "27584936@mahasiswa.itb.ac.id",
      name: "Admin 1",
      password: bcrypt.hashSync("admin", 10),
    },
  ];

  console.log("Seeding users...");

  await prisma.user.createMany({
    data,
  });
}
