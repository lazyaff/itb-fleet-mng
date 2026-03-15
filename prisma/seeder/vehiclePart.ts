import { PrismaClient } from "@prisma/client";

export async function vehiclePartSeeder(prisma: PrismaClient) {
  const data = [
    {
      id: "3e9c2f6a-7b4d-4c8e-a1f2-5d9b6e3a0c71",
      name: "Tire",
      distance_limit: 30,
      time_limit: 120,
      active: true,
    },
    {
      id: "b7f4d2c9-1a6e-4b3f-9c8d-2e5a7f0c6b14",
      name: "Engine Oil",
      distance_limit: 20,
      time_limit: 60,
      active: true,
    },
    {
      id: "5c1a9e3d-8f7b-4d2a-b6c4-0e9f3a7d2b58",
      name: "Battery",
      distance_limit: 60,
      time_limit: 400,
      active: true,
    },
  ];

  console.log("Seeding general vehicle parts...");

  await prisma.general_vehicle_part.createMany({
    data,
  });

  console.log("Seeding vehicle parts...");

  const vehicle = await prisma.vehicle.findMany();
  for (const v of vehicle) {
    const vehiclePart = [];
    for (const p of data) {
      vehiclePart.push({
        vehicle_id: v.id,
        general_vehicle_part_id: p.id,
        name: p.name,
        last_service: new Date("2026-01-01"),
        current_distance:
          Math.floor(Math.random() * (60000 - 10000 + 1)) + 10000,
        distance_limit: p.distance_limit,
        time_limit: p.time_limit,
        notes: "lorem ipsum",
      });
    }
    await prisma.vehicle_part.createMany({ data: vehiclePart });
  }
}
