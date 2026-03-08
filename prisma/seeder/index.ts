import { PrismaClient } from "@prisma/client";
import { roleSeeder } from "./role.js";
import { projectSeeder } from "./project.js";
import { userSeeder } from "./user.js";

const prisma = new PrismaClient();

const main = async () => {
  try {
    console.log("Seeding...");
    await roleSeeder(prisma);
    // await projectSeeder(prisma);
    await userSeeder(prisma);
    console.log("Seeding completed");
  } catch (e) {
    console.error("Seeding failed", e);
  }
};

main();
