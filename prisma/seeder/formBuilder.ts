import { PrismaClient } from "@prisma/client";
import { FormField } from "@/src/formBuilder";

export async function formBuilderSeeder(prisma: PrismaClient) {
  const fields: FormField[] = [
    {
      id: "a1b2c3d4-1111-4a5b-8c6d-7e8f9a0b1c2d",
      type: "PG",
      name: "Tire Condition",
      choices: ["Good", "Poor", "Fair", "Cannot be Assessed"],
    },
    {
      id: "a1b2c3d4-2222-4a5b-8c6d-7e8f9a0b1c2d",
      type: "PG",
      name: "Brake Condition",
      choices: ["Good", "Needs Attention", "Poor", "Cannot be Assessed"],
    },
    {
      id: "a1b2c3d4-3333-4a5b-8c6d-7e8f9a0b1c2d",
      type: "TEXT",
      name: "Additional Notes",
    },
  ];

  console.log("Seeding inspection form version...");

  await prisma.inspection_form_version.create({
    data: {
      version: 1,
      fields: fields as object[],
      is_active: true,
      published_at: new Date("2026-06-07T00:00:00Z"),
    },
  });
}
