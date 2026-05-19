import { healthTimeCount } from "@/utils/vehicle";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  try {
    console.log("Checking time limits...");

    const vehicleParts = await prisma.vehicle_part.findMany({
      where: {
        deleted_at: null,
        OR: [
          {
            general_vehicle_part: {
              deleted_at: null,
              active: true,
            },
          },
          {
            general_vehicle_part: null,
          },
        ],
      },
      include: {
        alerts: {
          where: {
            active: true,
            deleted_at: null,
          },
          take: 1,
        },
      },
    });

    for (const part of vehicleParts) {
      const timeHealth = healthTimeCount({
        last_service: part.last_service,
        time_limit: part.time_limit,
      });

      const existingAlert = part.alerts[0];

      // create alert
      if (!existingAlert && timeHealth < 25) {
        await prisma.vehicle_alert.create({
          data: {
            vehicle_part_id: part.id,
            active: true,
            time_limit_reached: true,
            triggered_at: new Date(),
          },
        });

        continue;
      }

      // update existing alert
      if (existingAlert && timeHealth < 25) {
        await prisma.vehicle_alert.update({
          where: {
            id: existingAlert.id,
          },
          data: {
            time_limit_reached: true,
          },
        });
      }
    }

    console.log("Checking completed");
  } catch (e) {
    console.error("Checking failed", e);
  } finally {
    await prisma.$disconnect();
  }
};

main();
