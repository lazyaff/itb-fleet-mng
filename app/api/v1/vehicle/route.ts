import prisma from "@/lib/prisma";
import { notifyInspectorsOfOverdueParts } from "@/utils/alert";
import { validateJWT } from "@/utils/auth";
import { healthCount, healthDistanceCount } from "@/utils/vehicle";
import { DateTime } from "luxon";
import { NextResponse, NextRequest } from "next/server";

const errorResponse = (message: string) =>
  NextResponse.json(
    {
      success: false,
      status: 400,
      message,
    },
    { status: 400 },
  );

export async function GET(request: NextRequest) {
  try {
    // Validate auth
    const isAuthorized = await validateJWT(request, ["SADM", "ADM", "UOPS"]);
    if (!isAuthorized.success) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const rawData = await prisma.vehicle.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        plate_number: true,
        name: true,
        image: true,
        status: true,
        current_mileage: true,
        vehicle_parts: {
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
              orderBy: {
                triggered_at: "asc",
              },
              take: 1,
            },
          },
        },
        usage_reconciliations: {
          where: {
            deleted_at: null,
            source: "INITIAL",
          },
        },
      },
      orderBy: [
        {
          name: "asc",
        },
        {
          plate_number: "asc",
        },
      ],
    });

    const alert: {
      vehicle_id: string;
      title: string;
      plate_number: string;
      date: Date | null;
    }[] = [];

    const vehicle = rawData.map((item: any) => {
      let health = 0;
      let time_limit: null | number = null;
      let distance_limit: null | number = null;

      for (const part of item.vehicle_parts) {
        const distance_remaining =
          part.distance_limit * 1000 - part.current_distance;
        distance_limit = distance_limit
          ? Math.min(distance_limit, distance_remaining)
          : distance_remaining;

        const lastService = DateTime.fromJSDate(part.last_service);
        const now = DateTime.now();
        const diffDays =
          part.time_limit * 30 - now.diff(lastService, "days").days;
        time_limit = Math.floor(
          time_limit ? Math.min(time_limit, diffDays) : diffDays,
        );

        const healthPoint = Math.max(
          healthCount({
            current_mileage: part.current_distance,
            distance_limit: part.distance_limit,
            last_service: part.last_service,
            time_limit: part.time_limit,
          }),
          0,
        );

        const activeAlert = part.alerts[0];
        if (
          healthPoint < 25 &&
          item.usage_reconciliations.length > 0 &&
          activeAlert
        ) {
          alert.push({
            vehicle_id: item.id,
            title: part.name,
            plate_number: item.plate_number,
            date: activeAlert.triggered_at,
          });
        }

        health += healthPoint;
      }

      return {
        id: item.id,
        plate_number: item.plate_number,
        name: item.name,
        image: item.image
          ? process.env.PUBLIC_STORAGE_PATH! + item.image
          : "/image/placeholder.webp",
        status: item.status,
        health: Math.floor(health / item.vehicle_parts.length),
        current_mileage: item.current_mileage,
        next_service: {
          time_limit: time_limit && time_limit > 0 ? time_limit : -1,
          distance_limit:
            distance_limit && distance_limit > 0
              ? Number(
                  ((item.current_mileage + distance_limit) / 1000).toFixed(0),
                )
              : -1,
        },
        updated: item.usage_reconciliations.length > 0,
      };
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        alert: alert.sort(
          (a, b) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
        ),
        vehicle: vehicle,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate auth
    const isAuthorized = await validateJWT(request, ["SADM", "ADM", "UOPS"]);
    if (!isAuthorized.success) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { id, name, current_mileage, last_service } = await request.json();

    if (
      !id ||
      !name ||
      current_mileage === null ||
      current_mileage === "" ||
      !last_service
    ) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // check if data exist
    const exist_plate_number = await prisma.vehicle.findFirst({
      where: { id, deleted_at: null },
      include: {
        usage_reconciliations: {
          where: {
            deleted_at: null,
            source: "INITIAL",
          },
        },
      },
    });
    if (!exist_plate_number) return errorResponse("Data does not exist!");

    // check if already initiated
    if (exist_plate_number.usage_reconciliations.length > 0) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Data already initiated!",
        },
        { status: 400 },
      );
    }

    // get part data
    const parts = await prisma.general_vehicle_part.findMany({
      where: {
        active: true,
        deleted_at: null,
      },
    });

    const partData = parts.map((part: any) => ({
      vehicle_id: id,
      general_vehicle_part_id: part.id,
      name: part.name,
      last_service: new Date(last_service),
      current_distance: Number(current_mileage),
      distance_limit: part.distance_limit,
      time_limit: part.time_limit,
      notes: null,
    }));

    // save data
    await prisma.vehicle.update({
      where: {
        id: id,
      },
      data: {
        name: name,
        status: "Available",
        current_mileage: Number(current_mileage),
      },
    });

    await prisma.vehicle_part.createMany({
      data: partData,
    });

    await prisma.usage_reconciliation.createMany({
      data: {
        vehicle_id: id,
        source: "INITIAL",
        previous_mileage: 0,
        current_mileage: Number(current_mileage),
        difference: Number(current_mileage),
        user_id: isAuthorized?.user?.id || null,
      },
    });

    const newVehiclePart = await prisma.vehicle_part.findMany({
      where: {
        vehicle_id: id,
      },
      include: {
        alerts: {
          where: {
            active: true,
            deleted_at: null,
          },
        },
      },
    });

    const overduePartIds: string[] = [];

    for (const part of newVehiclePart) {
      const health = healthDistanceCount({
        current_mileage: part.current_distance,
        distance_limit: part.distance_limit,
      });

      const existingAlert = part.alerts[0];

      if (health < 25 && !existingAlert) {
        await prisma.vehicle_alert.create({
          data: {
            vehicle_part_id: part.id,
            active: true,
            distance_limit_reached: true,
            triggered_at: new Date(),
          },
        });

        overduePartIds.push(part.id);

        continue;
      }

      if (health < 25 && existingAlert) {
        await prisma.vehicle_alert.update({
          where: {
            id: existingAlert.id,
          },
          data: {
            distance_limit_reached: true,
          },
        });

        continue;
      }
    }

    await notifyInspectorsOfOverdueParts(overduePartIds);

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // validate auth
    const isAuthorized = await validateJWT(request, ["SADM", "ADM"]);
    if (!isAuthorized.success) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { id, name, current_mileage } = await request.json();

    if (!id || !name || current_mileage === null || current_mileage === "") {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // jalankan paralel
    const [vehicle] = await Promise.all([
      prisma.vehicle.findFirst({
        where: { id, deleted_at: null },
      }),
    ]);

    if (!vehicle) return errorResponse("Vehicle not found!");

    // update data
    await prisma.vehicle.update({
      where: { id },
      data: {
        name: name,
        current_mileage: Number(current_mileage),
      },
    });

    const diff = Number(current_mileage) - vehicle.current_mileage;
    if (vehicle.current_mileage !== Number(current_mileage)) {
      await prisma.usage_reconciliation.create({
        data: {
          vehicle_id: id,
          source: "MANUAL",
          previous_mileage: vehicle.current_mileage,
          current_mileage: Number(current_mileage),
          difference: diff,
          user_id: isAuthorized?.user?.id || null,
        },
      });

      const parts = await prisma.vehicle_part.findMany({
        where: {
          vehicle_id: id,
          deleted_at: null,
          OR: [
            {
              general_vehicle_part: {
                active: true,
                deleted_at: null,
              },
            },
            {
              general_vehicle_part: null,
            },
          ],
        },
      });

      const partsData = parts.map((part) => ({
        id: part.id,
        current_distance:
          part.current_distance + diff < 0 ? 0 : part.current_distance + diff,
      }));

      await Promise.all(
        partsData.map((part) =>
          prisma.vehicle_part.update({
            where: {
              id: part.id,
            },
            data: {
              current_distance: part.current_distance,
            },
          }),
        ),
      );

      const updatedVehiclePart = await prisma.vehicle_part.findMany({
        where: {
          id: {
            in: partsData.map((part) => part.id),
          },
        },
        include: {
          alerts: {
            where: {
              active: true,
              deleted_at: null,
            },
          },
        },
      });

      const overduePartIds: string[] = [];

      for (const part of updatedVehiclePart) {
        const health = healthDistanceCount({
          current_mileage: part.current_distance,
          distance_limit: part.distance_limit,
        });

        const existingAlert = part.alerts[0];

        const shouldAlert = health < 25;

        if (shouldAlert && !existingAlert) {
          await prisma.vehicle_alert.create({
            data: {
              vehicle_part_id: part.id,
              active: true,
              distance_limit_reached: true,
              triggered_at: new Date(),
            },
          });

          overduePartIds.push(part.id);

          continue;
        }

        if (!shouldAlert && existingAlert) {
          if (existingAlert.time_limit_reached) {
            await prisma.vehicle_alert.update({
              where: {
                id: existingAlert.id,
              },
              data: {
                distance_limit_reached: false,
              },
            });
          } else {
            await prisma.vehicle_alert.update({
              where: {
                id: existingAlert.id,
              },
              data: {
                active: false,
                deleted_at: new Date(),
              },
            });
          }

          continue;
        }

        if (shouldAlert && existingAlert) {
          // An active alert already exists for this part — refresh only, no
          // new event. (A previously cleared/soft-deleted alert isn't loaded
          // here, so re-going-overdue is handled by the create branch above.)
          await prisma.vehicle_alert.update({
            where: {
              id: existingAlert.id,
            },
            data: {
              active: true,
              deleted_at: null,
              distance_limit_reached: true,
            },
          });
        }
      }

      await notifyInspectorsOfOverdueParts(overduePartIds);
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // validate auth
    const isAuthorized = await validateJWT(request, ["SADM", "ADM"]);
    if (!isAuthorized.success) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // check if data exist
    const isExist = await prisma.vehicle.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });
    if (!isExist) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    // update data
    await prisma.vehicle.update({
      where: {
        id: id,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data deleted successfully!",
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
