import { PrismaClient } from "@prisma/client";

export async function projectSeeder(prisma: PrismaClient) {
  const data = [
    {
      id: "3f4c9f66-21eb-4e0c-8aef-0a760948c98a",
      name: "Cooltopia",
      client_name: "Cooltopia",
      start_date: "2023-06-01T00:00:00.000Z",
      end_date: "2023-06-30T00:00:00.000Z",
      description: "lorem ipsum dolor sit amet",
    },
    {
      id: "7b3df89c-772f-4ff6-8e6e-5bd2631a35ce",
      name: "Mall of Asia",
      client_name: "CTI",
      start_date: "2023-07-01T00:00:00.000Z",
      end_date: "2023-07-30T00:00:00.000Z",
      description: "lorem ipsum dolor sit amet",
    },
  ];

  await prisma.project.createMany({
    data,
  });
}
