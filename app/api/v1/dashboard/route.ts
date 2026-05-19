import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { healthCount } from "@/utils/vehicle";
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

    const rawData = await prisma.vehicle.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        plate_number: true,
        name: true,
        status: true,
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
          select: {
            id: true,
            name: true,
            current_distance: true,
            distance_limit: true,
            last_service: true,
            time_limit: true,
            alerts: {
              where: {
                active: true,
                deleted_at: null,
              },
              select: {
                triggered_at: true,
              },
              take: 1,
              orderBy: {
                triggered_at: "asc",
              },
            },
          },
        },
        live_tracks: {
          take: 1,
          orderBy: {
            created_at: "desc",
          },
          where: {
            deleted_at: null,
          },
          select: {
            lat: true,
            long: true,
            angle: true,
            movement: true,
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
      title: string;
      plate_number: string;
      health: number;
      date: Date | null;
    }[] = [];

    const vehicleHealth = {
      healthy: 0,
      near_service: 0,
      overdue: 0,
    };

    const status = {
      in_use: 0,
      available: 0,
      under_maintenance: 0,
    };

    const live_track: {
      plate_number: string;
      name: string;
      lat: number;
      long: number;
      angle: number;
      movement: boolean;
    }[] = [];

    let totalVehicle = 0;
    for (const item of rawData) {
      totalVehicle++;
      let health = 0;

      if (item.live_tracks.length > 0) {
        live_track.push({
          plate_number: item.plate_number,
          name: item.name,
          lat: item.live_tracks[0].lat,
          long: item.live_tracks[0].long,
          angle: item.live_tracks[0].angle,
          movement: item.live_tracks[0].movement,
        });
      }

      // part health
      for (const part of item.vehicle_parts) {
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
            title: part.name,
            plate_number: item.plate_number,
            health: healthPoint,
            date: activeAlert.triggered_at,
          });
        }

        health += healthPoint;
      }

      // avg vehicle health
      const avgHealth =
        item.vehicle_parts.length > 0
          ? health / item.vehicle_parts.length
          : 100;

      if (item.usage_reconciliations.length > 0) {
        if (avgHealth > 50) {
          vehicleHealth.healthy += 1;
        } else if (avgHealth >= 25) {
          vehicleHealth.near_service += 1;
        } else {
          vehicleHealth.overdue += 1;
        }
      }

      // status counter
      switch (item.status) {
        case "Available":
          status.available += 1;
          break;
        case "In Use":
          status.in_use += 1;
          break;
        case "Under Maintenance":
          status.under_maintenance += 1;
          break;
      }
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        vehicle: {
          total: totalVehicle,
          health: vehicleHealth,
          status: status,
        },
        live_track: live_track,
        alert: {
          total: alert.length,
          data: alert
            .sort((a, b) => a.health - b.health)
            .slice(0, 5)
            .sort(
              (a, b) =>
                new Date(b.date || 0).getTime() -
                new Date(a.date || 0).getTime(),
            ),
        },
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
