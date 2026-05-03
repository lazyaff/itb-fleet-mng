import prisma from "@/lib/prisma";
import { validateBasicAuth, validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    // Validate auth
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

    const rawData = await prisma.vehicle.findMany({
      orderBy: {
        plate_number: "asc",
      },
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        plate_number: true,
        name: true,
        current_mileage: true,
        live_tracks: {
          take: 1,
          orderBy: {
            created_at: "desc",
          },
          where: {
            deleted_at: null,
          },
          select: {
            speed: true,
            total_mileage: true,
            battery_voltage: true,
            created_at: true,
            lat: true,
            long: true,
            angle: true,
            gsm_signal_strength: true,
            movement: true,
          },
        },
      },
    });

    const data = rawData.map((item) => ({
      id: item.id,
      plate_number: item.plate_number,
      name: item.name,
      current_mileage: item.current_mileage,
      status: item.live_tracks[0]
        ? item.live_tracks[0]?.movement
          ? "Moving"
          : "Stopped"
        : "No GPS",
      speed: item.live_tracks[0]?.speed || null,
      total_mileage: item.live_tracks[0]?.total_mileage || null,
      battery_voltage: item.live_tracks[0]?.battery_voltage || null,
      created_at: item.live_tracks[0]?.created_at || null,
      lat: item.live_tracks[0]?.lat || null,
      long: item.live_tracks[0]?.long || null,
      angle: item.live_tracks[0]?.angle || null,
      gsm_signal_strength: item.live_tracks[0]?.gsm_signal_strength || null,
      movement: item.live_tracks[0]?.movement || null,
    }));

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data,
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
    // validate auth
    const isAuthorized = validateBasicAuth(request);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { imei, records } = await request.json();
    if (!imei) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Empty records data!",
        },
        { status: 400 },
      );
    }

    // check imei
    const device = await prisma.gps_tracker.findFirst({
      where: {
        imei: imei,
        deleted_at: null,
      },
      select: {
        id: true,
        vehicle: {
          select: {
            id: true,
            current_mileage: true,
            vehicle_parts: {
              select: {
                id: true,
              },
              where: {
                deleted_at: null,
                OR: [
                  {
                    general_vehicle_part: {
                      deleted_at: null,
                    },
                  },
                  {
                    general_vehicle_part: null,
                  },
                ],
              },
            },
            usage_reconciliations: {
              where: {
                deleted_at: null,
                source: "INITIAL",
              },
            },
            vehicle_usage_histories: {
              where: {
                deleted_at: null,
                start_date: {
                  lte: new Date(),
                },
                end_date: {
                  gte: new Date(),
                },
              },
              take: 1,
              orderBy: {
                created_at: "desc",
              },
            },
          },
        },
      },
    });
    if (!device) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Device not found!",
        },
        { status: 404 },
      );
    }

    const rawData = Array.from(
      new Map(records.map((item) => [item.timestamp, item])).values(),
    ).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    const validateNumber = (value: any, param: string) => {
      if (typeof value !== "number" || isNaN(value)) {
        throw new Error(`Invalid ${param} value : ${value}`);
      }
      return value;
    };

    const data: {
      id: string;
      vehicle_id: string | null;
      gps_tracker_id: string;
      speed: number;
      battery_voltage: number;
      lat: number;
      long: number;
      angle: number;
      ignition: boolean;
      movement: boolean;
      gsm_signal_strength: number;
      total_mileage: number;
      created_at: Date;
      updated_at: Date;
    }[] = [];

    try {
      for (const item of rawData) {
        const ioMap = Object.fromEntries(
          item.ioElements.map((i: any) => [i.id, i.value]),
        );
        const speed = item.gps?.speed;
        const lat = item.gps?.latitude;
        const long = item.gps?.longitude;
        const angle = item.gps?.angle;
        const battery = ioMap[67];
        const gsm = ioMap[21];
        const mileage = ioMap[16];
        const ignitionRaw = ioMap[239];
        const movementRaw = ioMap[240];

        // validate number
        validateNumber(speed, "speed");
        validateNumber(lat, "lat");
        validateNumber(long, "long");
        validateNumber(angle, "angle");
        validateNumber(battery, "battery_voltage");
        validateNumber(gsm, "gsm_signal_strength");
        validateNumber(mileage, "total_mileage");

        // validate boolean (dari 0/1)
        if (ignitionRaw !== 0 && ignitionRaw !== 1) {
          throw new Error(`Invalid ignition value : ${ignitionRaw}`);
        }

        if (movementRaw !== 0 && movementRaw !== 1) {
          throw new Error(`Invalid movement value : ${movementRaw}`);
        }

        const ignition = ignitionRaw === 1;
        const movement = movementRaw === 1;

        const createdAt = new Date(item.timestamp);
        if (isNaN(createdAt.getTime())) {
          throw new Error(`Invalid timestamp value : ${item.timestamp}`);
        }

        data.push({
          id: uuidv4(),
          vehicle_id: device.vehicle?.id || null,
          gps_tracker_id: device.id,
          speed,
          battery_voltage: battery,
          lat,
          long,
          angle,
          ignition,
          movement,
          gsm_signal_strength: gsm,
          total_mileage: mileage,
          created_at: createdAt,
          updated_at: createdAt,
        });
      }
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: err.message,
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const lastData = await tx.live_track_history.findFirst({
        where: {
          gps_tracker_id: device.id,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      const lastMileage = lastData?.total_mileage ?? null;
      const result = await tx.live_track_history.createMany({
        data,
        skipDuplicates: true,
      });

      if (result.count === 0) {
        return;
      }

      const newest = await tx.live_track_history.findFirst({
        where: { gps_tracker_id: device.id },
        orderBy: { created_at: "desc" },
      });

      if (!newest) return;
      if (lastData && newest.created_at <= lastData.created_at) return;

      const currentMileage = newest?.total_mileage ?? 0;

      let isReset = false;
      let diff = 0;

      if (lastMileage !== null) {
        if (currentMileage >= lastMileage) {
          diff = currentMileage - lastMileage;
        } else {
          isReset = true;
        }
      } else {
        diff = currentMileage;
      }

      if (device.vehicle && device.vehicle.usage_reconciliations.length > 0) {
        const vehicleInput = isReset
          ? { current_mileage: currentMileage }
          : {
              current_mileage: {
                increment: diff,
              },
            };

        await tx.vehicle.update({
          where: {
            id: device.vehicle.id,
          },
          data: vehicleInput,
        });

        const partInput = isReset
          ? { current_distance: currentMileage }
          : {
              current_distance: {
                increment: diff,
              },
            };

        await tx.vehicle_part.updateMany({
          where: {
            id: {
              in: device.vehicle.vehicle_parts.map((item) => item.id),
            },
          },
          data: partInput,
        });

        const usage = await tx.usage_reconciliation.create({
          data: {
            vehicle_id: device.vehicle.id,
            source: "GPS",
            previous_mileage: device.vehicle.current_mileage,
            current_mileage: isReset
              ? currentMileage
              : device.vehicle.current_mileage + diff,
            difference: diff,
            vehicle_usage_history_id:
              device.vehicle.vehicle_usage_histories.length > 0
                ? device.vehicle.vehicle_usage_histories[0].id
                : null,
          },
        });

        if (device.vehicle.vehicle_usage_histories.length > 0) {
          const inserted = await tx.live_track_history.findMany({
            where: {
              id: {
                in: data.map((item) => item.id),
              },
              ...(lastData && {
                created_at: {
                  gt: lastData.created_at,
                },
              }),
            },
            select: {
              id: true,
            },
          });

          await tx.live_track_history.updateMany({
            where: {
              id: {
                in: inserted.map((item) => item.id),
              },
            },
            data: {
              usage_reconciliation_id: usage.id,
            },
          });
        }
      }
    });

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
