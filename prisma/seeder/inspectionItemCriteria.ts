import { PrismaClient } from "@prisma/client";

export async function inspectionItemCriteriaSeeder(prisma: PrismaClient) {
  const data = [
    // Exterior
    {
      id: "1f4e8c7a-7b1a-4b90-9b3f-0b8f8b3e0a11",
      inspection_item_id: "8c1e2f4a-6b73-4d9a-8f2c-1a7e5d3b9c60",
      name: "Body condition",
    },
    {
      id: "0c9c48c2-7f7d-4f09-9a7e-7a76f4c21c01",
      inspection_item_id: "8c1e2f4a-6b73-4d9a-8f2c-1a7e5d3b9c60",
      name: "Windshield condition",
    },
    {
      id: "8b7df4a5-12a3-4c64-9d2c-cc20b0df8c88",
      inspection_item_id: "8c1e2f4a-6b73-4d9a-8f2c-1a7e5d3b9c60",
      name: "Mirrors condition",
    },

    // Lights
    {
      id: "e5b4a94a-2f77-4b60-9d27-3e64c4f7a2a1",
      inspection_item_id: "f3a9d2c7-5b18-4e6f-9c4a-2d7b1e8f3a90",
      name: "Headlights",
    },
    {
      id: "3a4e7d9c-6f1c-4f8d-b4bb-d1c1b1c0a9d2",
      inspection_item_id: "f3a9d2c7-5b18-4e6f-9c4a-2d7b1e8f3a90",
      name: "Brake lights",
    },
    {
      id: "7d8f3c1a-2b4e-4a9d-9b8f-4f2c6a0d3e90",
      inspection_item_id: "f3a9d2c7-5b18-4e6f-9c4a-2d7b1e8f3a90",
      name: "Turn signals",
    },

    // Tires & Wheels
    {
      id: "6e91c3e8-6a4f-4c91-bf32-2d0e6a7d9f71",
      inspection_item_id: "1d7c9a5e-4b62-4f3a-8e1d-6c2b9f7a3e40",
      name: "Tire pressure",
    },
    {
      id: "b8c8c8c2-13e7-4a0b-8a3a-91e64a9f7f45",
      inspection_item_id: "1d7c9a5e-4b62-4f3a-8e1d-6c2b9f7a3e40",
      name: "Tire condition",
    },
    {
      id: "3a89f3a7-b4b0-4c6b-9f78-3c8b3a1c7f11",
      inspection_item_id: "1d7c9a5e-4b62-4f3a-8e1d-6c2b9f7a3e40",
      name: "Wheel nuts",
    },

    // Braking System (sesuai gambar)
    {
      id: "a2e7a5e7-cc2a-44c5-bf8f-1a87a91d4a1f",
      inspection_item_id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      name: "Brake pedal response",
    },
    {
      id: "bdf6e59e-1bfa-4d47-9d8f-bdc13e4c4a7d",
      inspection_item_id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      name: "Rear brake condition",
    },
    {
      id: "e7c1e1b1-4b6e-4b7c-9c2a-4b6e1a7c2d0a",
      inspection_item_id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      name: "Brake fluid level",
    },
    {
      id: "c8c7d9c3-20a3-4f0d-bbb7-0a9b5f5f4e21",
      inspection_item_id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      name: "Front brake condition",
    },
    {
      id: "6a2b4c71-48b0-4b71-9e7e-5bfa0a1a2c44",
      inspection_item_id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      name: "Parking brake function",
    },

    // Engine & Mechanical (sesuai gambar)
    {
      id: "e2d7c1b2-3c47-4e47-8a3a-92b77e5d8a31",
      inspection_item_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Engine condition",
    },
    {
      id: "1bde7a0c-5d9a-4a6e-94f2-7c1d1c6a3b6e",
      inspection_item_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Engine noise",
    },
    {
      id: "5f1a2a44-8bcb-4c1b-bb3f-3d6e7a8b9c21",
      inspection_item_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Oil level",
    },
    {
      id: "9c3a2f11-63f8-4a87-b0a3-5c1f3a7e2e77",
      inspection_item_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Oil leaks",
    },
    {
      id: "3a8f8c10-2b4b-4a9a-b0f8-8e7a1d3b5c7e",
      inspection_item_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Coolant level",
    },
    {
      id: "d6c3a4f8-b2d1-4a3c-9a7e-6e7c4f9c2a4a",
      inspection_item_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Battery condition",
    },
    {
      id: "a7b4c3f2-0a12-4f6e-bc7e-8f7d4c9a0d3e",
      inspection_item_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Belts condition",
    },
    {
      id: "c1b8f0a1-2a43-4d7b-8c2a-7d4f9b1c8e6a",
      inspection_item_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Hoses condition",
    },
    {
      id: "0d2c9b7a-4b61-4f7b-9c7d-5a1d2c3e4f90",
      inspection_item_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      name: "Radiator condition",
    },

    // Controls
    {
      id: "3e1a7c8b-7b11-4c9f-a9d8-2a0b3c4d5e6f",
      inspection_item_id: "d9b4e1c7-3a62-4f8d-9e5a-1c7b2d6f8a20",
      name: "Steering response",
    },
    {
      id: "6b2a1c4e-9d7f-4a4c-b7a9-5d6f3e1c2b8d",
      inspection_item_id: "d9b4e1c7-3a62-4f8d-9e5a-1c7b2d6f8a20",
      name: "Horn function",
    },
    {
      id: "4c8e1b7f-2e3c-4d9c-9a8a-1c2b3d4e5f60",
      inspection_item_id: "d9b4e1c7-3a62-4f8d-9e5a-1c7b2d6f8a20",
      name: "Dashboard indicators",
    },
  ];

  console.log("Seeding inspection item criterias...");

  await prisma.inspection_item_criteria.createMany({
    data,
  });
}
