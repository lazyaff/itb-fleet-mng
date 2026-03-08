import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export async function userSeeder(prisma: PrismaClient) {
  const data = [
    {
      role_id: "SADM",
      project_id: null,
      name: "Twister Super Admin",
      work_place: "-",
      work_hour: "-",
      username: "twistersuperadmin",
      password: bcrypt.hashSync("superadmin", 10),
    },
    // {
    //   role_id: "ADM",
    //   project_id: null,
    //   name: "Twister Admin",
    //   work_place: "-",
    //   work_hour: "-",
    //   username: "twisteradmin",
    //   password: bcrypt.hashSync("admin", 10),
    // },
    // {
    //   role_id: "LEAD",
    //   project_id: "3f4c9f66-21eb-4e0c-8aef-0a760948c98a",
    //   name: "Fulan",
    //   work_place: "Grand Lucky SCBD",
    //   work_hour: "07.00 - 17.00",
    //   username: "twisterlead",
    //   password: bcrypt.hashSync("lead", 10),
    // },
    // {
    //   role_id: "MD",
    //   project_id: "3f4c9f66-21eb-4e0c-8aef-0a760948c98a",
    //   name: "Fulani",
    //   work_place: "Grand Lucky SCBD",
    //   work_hour: "07.00 - 17.00",
    //   username: "twistermd",
    //   password: bcrypt.hashSync("md", 10),
    // },
    // {
    //   role_id: "MTR",
    //   project_id: "3f4c9f66-21eb-4e0c-8aef-0a760948c98a",
    //   name: "Fulano",
    //   work_place: "Grand Lucky SCBD",
    //   work_hour: "07.00 - 17.00",
    //   username: "twistermtr",
    //   password: bcrypt.hashSync("mtr", 10),
    // },
    // {
    //   role_id: "SPG",
    //   project_id: "3f4c9f66-21eb-4e0c-8aef-0a760948c98a",
    //   name: "Fulana",
    //   work_place: "Grand Lucky SCBD",
    //   work_hour: "07.00 - 17.00",
    //   username: "twisterspg",
    //   password: bcrypt.hashSync("spg", 10),
    // },
  ];

  await prisma.user.createMany({
    data,
  });
}
