import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { healthCount } from "@/utils/vehicle";
import { DateTime } from "luxon";
import { NextResponse, NextRequest } from "next/server";

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
    const id = url.searchParams.get("id") || "-";

    const rawData = await prisma.vehicle.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
      select: {
        id: true,
        plate_number: true,
        name: true,
        // image: true,
        status: true,
        current_mileage: true,
        vehicle_parts: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            name: "asc",
          },
        },
        live_tracks: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            created_at: "desc",
          },
          take: 1,
        },
      },
    });

    if (!rawData) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Vehicle not found",
        },
        { status: 404 },
      );
    }

    const alert: {
      title: string;
      health: number;
    }[] = [];

    const parts: {
      title: string;
      current_mileage: number;
      distance_limit: number;
      last_service: Date;
      time_limit: number;
      health: number;
    }[] = [];

    let health = 0;
    let time_limit: null | number = null;
    let distance_limit: null | number = null;

    for (const part of rawData.vehicle_parts) {
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

      const healthPoint: number = Number(
        Math.max(
          healthCount({
            current_mileage: part.current_distance,
            distance_limit: part.distance_limit,
            last_service: part.last_service,
            time_limit: part.time_limit,
          }),
          0,
        ).toFixed(0),
      );
      if (healthPoint < 25) {
        alert.push({
          title: part.name,
          health: healthPoint,
        });
      }

      parts.push({
        title: part.name,
        current_mileage: part.current_distance / 1000,
        distance_limit: part.distance_limit,
        last_service: part.last_service,
        time_limit: part.time_limit * 30,
        health: healthPoint,
      });

      health += healthPoint;
    }

    const vehicle = {
      id: rawData.id,
      plate_number: rawData.plate_number,
      name: rawData.name,
      status: rawData.status,
      last_update: rawData.live_tracks[0]?.created_at
        ? rawData.live_tracks[0]?.created_at
        : null,
      health: Math.floor(health / rawData.vehicle_parts.length),
      current_mileage: Math.floor(rawData.current_mileage / 1000),
      next_service: {
        time_limit: time_limit && time_limit > 0 ? time_limit : -1,
        distance_limit:
          distance_limit && distance_limit > 0
            ? Number(
                ((rawData.current_mileage + distance_limit) / 1000).toFixed(0),
              )
            : -1,
      },
    };

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        vehicle: vehicle,
        parts: parts,
        alert: alert,
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
