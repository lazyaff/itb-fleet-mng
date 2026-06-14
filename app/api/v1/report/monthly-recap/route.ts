import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { DateTime } from "luxon";
import { NextResponse, NextRequest } from "next/server";

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

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required query params: from, to",
        },
        { status: 400 },
      );
    }

    const dateRange = {
      gte: DateTime.fromISO(from).startOf("day").toJSDate(),
      lte: DateTime.fromISO(to).endOf("day").toJSDate(),
    };

    const [usage, services, legacyInspections, dynamicInspections, fuelLogs] =
      await Promise.all([
        prisma.usage_reconciliation.groupBy({
          by: ["vehicle_id"],
          where: {
            deleted_at: null,
            source: { not: "INITIAL" },
            created_at: dateRange,
          },
          _sum: { difference: true },
        }),
        prisma.service_history.groupBy({
          by: ["vehicle_id"],
          where: { deleted_at: null, date: dateRange },
          _count: true,
        }),
        prisma.inspection_report.groupBy({
          by: ["vehicle_id"],
          where: { deleted_at: null, date: dateRange },
          _count: true,
        }),
        prisma.inspection_dynamic_report.groupBy({
          by: ["vehicle_id"],
          where: { deleted_at: null, date: dateRange },
          _count: true,
        }),
        prisma.fuel_log.groupBy({
          by: ["vehicle_id"],
          where: { deleted_at: null, date: dateRange },
          _sum: { liters: true, cost: true },
          _count: true,
        }),
      ]);

    const recap: Record<
      string,
      {
        vehicle_id: string;
        total_km: number;
        service_count: number;
        inspection_count: number;
        fuel_count: number;
        fuel_liters: number;
        fuel_cost: number;
      }
    > = {};

    const getEntry = (vehicleId: string) => {
      if (!recap[vehicleId]) {
        recap[vehicleId] = {
          vehicle_id: vehicleId,
          total_km: 0,
          service_count: 0,
          inspection_count: 0,
          fuel_count: 0,
          fuel_liters: 0,
          fuel_cost: 0,
        };
      }
      return recap[vehicleId];
    };

    for (const item of usage) {
      // current_mileage / usage_reconciliation.difference are stored in
      // "km * 1000" units (see vehicle list update form), so divide back
      // down to km here.
      getEntry(item.vehicle_id).total_km += (item._sum.difference ?? 0) / 1000;
    }

    for (const item of services) {
      getEntry(item.vehicle_id).service_count += item._count;
    }

    for (const item of legacyInspections) {
      getEntry(item.vehicle_id).inspection_count += item._count;
    }

    for (const item of dynamicInspections) {
      getEntry(item.vehicle_id).inspection_count += item._count;
    }

    for (const item of fuelLogs) {
      const entry = getEntry(item.vehicle_id);
      entry.fuel_count += item._count;
      entry.fuel_liters += Number(item._sum.liters ?? 0);
      entry.fuel_cost += item._sum.cost ?? 0;
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        from,
        to,
        recap: Object.values(recap),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
