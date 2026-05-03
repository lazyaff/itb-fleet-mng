import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
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
    const date = url.searchParams.get("date") || "";

    const selectedDate = DateTime.fromISO(date || "", { zone: "Asia/Jakarta" });
    const baseDate = selectedDate.isValid
      ? selectedDate
      : DateTime.now().setZone("Asia/Jakarta");
    const start = baseDate.startOf("day").toUTC().toJSDate();
    const end = baseDate.endOf("day").toUTC().toJSDate();

    const rawData = await prisma.vehicle.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
      select: {
        usage_reconciliations: {
          where: {
            deleted_at: null,
            created_at: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            created_at: "desc",
          },
          include: {
            user: true,
            vehicle_usage_history: true,
          },
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

    const groupedMap: Record<string, any> = {};
    const result: any[] = [];

    for (const usage of rawData.usage_reconciliations) {
      if (usage.source === "GPS") {
        const key = usage.vehicle_usage_history?.id || "-";

        if (!groupedMap[key]) {
          groupedMap[key] = {
            id: key,
            name: usage.vehicle_usage_history?.name || "-",
            source: usage.source,
            total_difference: 0,
          };
        }

        groupedMap[key].total_difference += usage.difference;
      } else {
        result.push({
          id: usage.id,
          name: usage.user?.name,
          source: usage.source,
          total_difference: usage.difference,
        });
      }
    }

    const usage_reconciliations = [...Object.values(groupedMap), ...result];

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: usage_reconciliations,
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
