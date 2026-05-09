import { PrismaClient } from "@prisma/client";

export async function vehicleSeeder(prisma: PrismaClient) {
  const data = [
    {
      id: "3e7f1a9c-5d24-4b8e-9a6f-2c1d7e8b4f90",
      user_id: "d4a8f3c2-6e1b-4c7a-9d5f-2b8e0f1a7c63",
      plate_number: "D 2127 RNN",
      name: "Unit 01 - Fuso Truck",
      image: null,
      internal_code: "FH-2024-001",
      status: "In Use",
      notes: "lorem ipsum satu",
      current_mileage: 20000,
      engine_hours: 5000,
    },
    {
      id: "b6c2d9f1-8a34-4e7b-9f2c-1a6d3e5b7c80",
      user_id: "d4a8f3c2-6e1b-4c7a-9d5f-2b8e0f1a7c63",
      plate_number: "D 1612 PRW",
      name: "Unit 02 - Mitsubishi Van",
      image: null,
      internal_code: "FT-2023-006",
      status: "Under Maintenance",
      notes: "lorem ipsum dua",
      current_mileage: 25100,
      engine_hours: 8000,
    },
    {
      id: "7a1e4d3c-9b5f-4c2a-8e6d-0f3b7c1a9d24",
      user_id: "4c8e1b7f-2e3c-4d9c-9a8a-1c2b3d4e5fha",
      plate_number: "D 2109 NNZ",
      name: "Unit 03 - Suzuki Lorry",
      image: null,
      internal_code: "FMIPA-2023-002",
      status: "Available",
      notes: null,
      current_mileage: 15000,
      engine_hours: 3000,
    },
    {
      id: "c9f4b1e7-2d6a-4a8c-b5e3-7d1f0a9c6b28",
      user_id: "4c8e1b7f-2e3c-4d9c-9a8a-1c2b3d4e5fha",
      plate_number: "D 7654 GQF",
      name: "Unit 04 - Optimum Pride",
      image: null,
      internal_code: "FH-2024-002",
      status: "Available",
      notes: "lorem ipsum empat",
      current_mileage: 22500,
      engine_hours: 5000,
    },
  ];

  console.log("Seeding vehicles...");

  await prisma.vehicle.createMany({
    data,
  });
}
