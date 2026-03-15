import { PrismaClient } from "@prisma/client";

export async function inspectionItemSeeder(prisma: PrismaClient) {
  const data = [
    {
      id: "8c1e2f4a-6b73-4d9a-8f2c-1a7e5d3b9c60",
      name: "Exterior",
    },
    {
      id: "f3a9d2c7-5b18-4e6f-9c4a-2d7b1e8f3a90",
      name: "Lights",
    },
    {
      id: "1d7c9a5e-4b62-4f3a-8e1d-6c2b9f7a3e40",
      name: "Tires and Wheels",
    },
    {
      id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      name: "Braking System",
    },
    {
      id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Engine and Mechanical",
    },
    {
      id: "d9b4e1c7-3a62-4f8d-9e5a-1c7b2d6f8a20",
      name: "Controls",
    },
  ];

  console.log("Seeding inspection items...");

  await prisma.inspection_item.createMany({
    data,
  });
}
