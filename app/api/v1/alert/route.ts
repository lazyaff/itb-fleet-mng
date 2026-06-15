import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { healthCount } from "@/utils/vehicle";
import { NextResponse, NextRequest } from "next/server";

// Active critical alerts for the header bell. Same definition as the Dashboard
// "Critical Alerts" panel (overdue part with an active alert on a vehicle that
// has a reconciliation record), but returns the full list rather than a top-5.
// Visible to SADM / ADM / UOPS — not to inspectors.
export async function GET(request: NextRequest) {
  try {
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
        plate_number: true,
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
        usage_reconciliations: {
          where: {
            deleted_at: null,
            source: "INITIAL",
          },
        },
      },
    });

    const alerts: {
      title: string;
      plate_number: string;
      health: number;
      date: Date | null;
    }[] = [];

    for (const item of rawData) {
      if (item.usage_reconciliations.length === 0) continue;

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
        if (healthPoint < 25 && activeAlert) {
          alerts.push({
            title: part.name,
            plate_number: item.plate_number,
            health: healthPoint,
            date: activeAlert.triggered_at,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        total: alerts.length,
        data: alerts.sort(
          (a, b) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
        ),
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
