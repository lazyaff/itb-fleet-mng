import { PrismaClient } from "@prisma/client";

export async function vehicleSeeder(prisma: PrismaClient) {
  const data = [
    {
      id: "3e7f1a9c-5d24-4b8e-9a6f-2c1d7e8b4f90",
      user_id: "f3b8c6d2-7e41-4a9b-92fd-1c5e8a7d4b63",
      gps_tracker_id: "6d607991-f85a-474d-923c-d3f12c19544e",
      plate_number: "D 2127 RNN",
      name: "Unit 01 - Fuso Truck",
      image: null,
      internal_code: "FH-2024-001",
      status: "In Use",
      notes: "lorem ipsum satu",
      current_mileage: 10383,
      engine_hours: 5000,
    },
    {
      id: "b6c2d9f1-8a34-4e7b-9f2c-1a6d3e5b7c80",
      user_id: "f3b8c6d2-7e41-4a9b-92fd-1c5e8a7d4b63",
      gps_tracker_id: "4f7d0e11-82c1-4e5e-a3d7-7b9c10f42aa1",
      plate_number: "D 1612 PRW",
      name: "Unit 02 - Mitsubishi Van",
      image: null,
      internal_code: "FT-2023-006",
      status: "Under Maintenance",
      notes: "lorem ipsum dua",
      current_mileage: 12098,
      engine_hours: 8000,
    },
    {
      id: "7a1e4d3c-9b5f-4c2a-8e6d-0f3b7c1a9d24",
      user_id: "f3b8c6d2-7e41-4a9b-92fd-1c5e8a7d4b63",
      gps_tracker_id: "ab9f82c2-2f6b-46a8-99c1-42f38f1c4f91",
      plate_number: "D 2109 NNZ",
      name: "Unit 03 - Suzuki Lorry",
      image: null,
      internal_code: "FMIPA-2023-002",
      status: "Available",
      notes: null,
      current_mileage: 29012,
      engine_hours: 3000,
    },
    {
      id: "c9f4b1e7-2d6a-4a8c-b5e3-7d1f0a9c6b28",
      user_id: "f3b8c6d2-7e41-4a9b-92fd-1c5e8a7d4b63",
      gps_tracker_id: "d6c0a11e-3d28-4c89-9cb7-8b1d21a4ef82",
      plate_number: "D 7654 GQF",
      name: "Unit 04 - Optimum Pride",
      image: null,
      internal_code: "FH-2024-002",
      status: "Available",
      notes: "lorem ipsum empat",
      current_mileage: 19872,
      engine_hours: 5000,
    },
  ];

  console.log("Seeding vehicles...");

  await prisma.vehicle.createMany({
    data,
  });
}
