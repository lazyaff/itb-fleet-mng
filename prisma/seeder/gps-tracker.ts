import { PrismaClient } from "@prisma/client";

export async function gpsTrackerSeeder(prisma: PrismaClient) {
  const data = [
    {
      id: "6d607991-f85a-474d-923c-d3f12c19544e",
      imei: "867458041245001",
    },
    {
      id: "4f7d0e11-82c1-4e5e-a3d7-7b9c10f42aa1",
      imei: "867458041245002",
    },
    {
      id: "ab9f82c2-2f6b-46a8-99c1-42f38f1c4f91",
      imei: "867458041245003",
    },
    {
      id: "d6c0a11e-3d28-4c89-9cb7-8b1d21a4ef82",
      imei: "867458041245004",
    },
  ];

  console.log("Seeding gps trackers...");

  await prisma.gps_tracker.createMany({
    data,
  });
}
