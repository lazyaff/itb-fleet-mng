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
        status: true,
        vehicle_parts: {
          where: { deleted_at: null },
          select: {
            name: true,
            current_distance: true,
            distance_limit: true,
            last_service: true,
            time_limit: true,
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

    let totalVehicle = 0;
    for (const item of rawData) {
      totalVehicle++;
      let health = 0;

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

        if (healthPoint < 25) {
          alert.push({
            title: part.name,
            plate_number: item.plate_number,
          });
        }

        health += healthPoint;
      }

      const avgHealth =
        item.vehicle_parts.length > 0
          ? health / item.vehicle_parts.length
          : 100;

      if (avgHealth > 50) {
        vehicleHealth.healthy += 1;
      } else if (avgHealth >= 25) {
        vehicleHealth.near_service += 1;
      } else {
        vehicleHealth.overdue += 1;
      }

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
