import { PrismaClient } from "@prisma/client";

export async function vehicleTypeSeeder(prisma: PrismaClient) {
  const data = [
    {
      id: "6f3b9c5d-8c77-4e0a-9c1c-0f7e0f0a9c42",
      name: "Heavy Duty",
    },
    {
      id: "1c8d4b6f-5c9a-4a8d-9f5a-7c2d3e8b6f21",
      name: "Delivery Van",
    },
    {
      id: "a7f2e1c9-3b4d-4d2f-8c6a-5e9b1f7d2a33",
      name: "Pickup Truck",
    },
  ];

  console.log("Seeding vehicle types...");

  await prisma.vehicle_type.createMany({
    data,
  });
}
