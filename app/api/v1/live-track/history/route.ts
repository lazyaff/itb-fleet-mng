import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";
import { DateTime } from "luxon";

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

    const url = new URL(request.url);
    const id = url.searchParams.get("id") || null;
    const date = url.searchParams.get("date") || null;

    if (!id || !date) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // validate vehicle
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        deleted_at: null,
        id: id,
      },
      select: {
        plate_number: true,
        name: true,
        image: true,
      },
    });
    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Vehicle not found!",
        },
        { status: 404 },
      );
    }

    const base = DateTime.fromISO(date, { zone: "utc" });
    const start = base
      .minus({ days: 1 })
      .set({ hour: 17, minute: 0, second: 0, millisecond: 0 });
    const end = base.set({
      hour: 16,
      minute: 59,
      second: 59,
      millisecond: 999,
    });

    const rawData = await prisma.live_track_history.findMany({
      orderBy: {
        created_at: "asc",
      },
      where: {
        vehicle_id: id,
        deleted_at: null,
        created_at: {
          gte: start.toJSDate(),
          lte: end.toJSDate(),
        },
      },
      select: {
        id: true,
        speed: true,
        total_mileage: true,
        created_at: true,
        lat: true,
        long: true,
        angle: true,
        movement: true,
        usage_reconciliation: {
          select: {
            vehicle_usage_history: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // let totalMovementMs = 0;
    const data = rawData.map((item, index) => {
      // if (index > 0) {
      //   const prev = rawData[index - 1];
      //   const diff =
      //     new Date(item.created_at).getTime() -
      //     new Date(prev.created_at).getTime();

      //   if (prev.movement) {
      //     totalMovementMs += diff;
      //   }
      // }

      return {
        id: item.id,
        speed: item.speed,
        total_mileage: item.total_mileage,
        created_at: item.created_at,
        lat: item.lat,
        long: item.long,
        angle: item.angle,
        movement: item.movement,
        renter: item.usage_reconciliation?.vehicle_usage_history?.name || "-",
        // duration: totalMovementMs / 1000,
      };
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        vehicle: {
          plate_number: vehicle.plate_number,
          name: vehicle.name,
          image: vehicle.image
            ? process.env.PUBLIC_STORAGE_PATH! + vehicle.image
            : "/image/placeholder.webp",
          total_mileage:
            data.length >= 2
              ? Math.max(
                  data[data.length - 1].total_mileage - data[0].total_mileage,
                  0,
                )
              : 0,
          average_speed:
            data.length > 0
              ? data.reduce((acc, item) => acc + (item.speed || 0), 0) /
                data.length
              : 0,
        },
        history: data,
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
