import { PrismaClient } from "@prisma/client";
import { roleSeeder } from "./role.js";
import { userSeeder } from "./user.js";
import { vehicleTypeSeeder } from "./vehicleType.js";
import { vehicleSeeder } from "./vehicle.js";
import { vehiclePartSeeder } from "./vehiclePart.js";
import { inspectionItemSeeder } from "./inspectionItem.js";
import { inspectionItemCriteriaSeeder } from "./inspectionItemCriteria.js";

const prisma = new PrismaClient();

const main = async () => {
  try {
    console.log("Seeding...");
    await roleSeeder(prisma);
    await userSeeder(prisma);
    await vehicleTypeSeeder(prisma);
    await vehicleSeeder(prisma);
    await vehiclePartSeeder(prisma);
    await inspectionItemSeeder(prisma);
    await inspectionItemCriteriaSeeder(prisma);
    console.log("Seeding completed");
  } catch (e) {
    console.error("Seeding failed", e);
  }
};

main();
