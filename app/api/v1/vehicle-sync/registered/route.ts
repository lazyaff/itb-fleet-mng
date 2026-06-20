import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { formatedDate } from "@/utils/date";
import { NextResponse, NextRequest } from "next/server";

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

    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "1";
    const limit = url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : 0;
    const offset = (parseInt(page) - 1) * limit;

    const [rawData, totalRecords, synced, not_synced] = await Promise.all([
      prisma.vehicle.findMany({
        where: {
          deleted_at: null,
        },
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        select: {
          id: true,
          plate_number: true,
          name: true,
          sync_status: true,
          visibility: true,
        },
        orderBy: [
          {
            name: "asc",
          },
        ],
      }),
      prisma.vehicle.count({
        where: {
          deleted_at: null,
        },
      }),
      prisma.vehicle.count({
        where: {
          deleted_at: null,
          sync_status: "synced",
        },
      }),
      prisma.vehicle.count({
        where: {
          deleted_at: null,
          sync_status: {
            not: "synced",
          },
        },
      }),
    ]);

    const data = rawData.map((item: any, index: number) => {
      return {
        no: offset + index + 1,
        id: item.id,
        plate_number: item.plate_number,
        name: item.name,
        sync_status: item.sync_status,
        visibility: item.visibility,
      };
    });

    const totalPages = limit ? Math.ceil(totalRecords / limit) : 1;

    const synced_history = await prisma.vehicle_sync_history.findMany({
      where: {
        deleted_at: null,
        approval_request: {
          status: "approved",
          deleted_at: null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        page: parseInt(page),
        totalPages,
        totalRecords,
        totalSynced: synced,
        totalNotSynced: not_synced,
        version: {
          current: synced_history.length,
          published: synced_history.length
            ? formatedDate(synced_history[0].created_at, "dd LLLL yyyy")
            : null,
        },
        records: data,
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
