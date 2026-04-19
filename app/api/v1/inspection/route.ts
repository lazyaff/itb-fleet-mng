import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { formatedDate } from "@/utils/date";
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
    const page = url.searchParams.get("page") || "1";
    const sort: any = url.searchParams.get("sort") || "date_desc";
    const search = url.searchParams.get("search") || "";
    const date = url.searchParams.get("date") || "";
    const vehicle_ids = url.searchParams.get("vehicle_ids") || "";
    const limit = url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : 0;
    const offset = (parseInt(page) - 1) * limit;

    const vehicleIdArray = vehicle_ids
      ? vehicle_ids.split(",").map((id) => id.trim())
      : [];

    const sortMap: Record<string, any> = {
      date_desc: [{ date: "desc" }, { created_at: "desc" }],
      date_asc: [{ date: "asc" }, { created_at: "asc" }],
      vehicle_asc: [
        { vehicle: { name: "asc" } },
        { vehicle: { plate_number: "asc" } },
        { date: "desc" },
      ],
      vehicle_desc: [
        { vehicle: { name: "desc" } },
        { vehicle: { plate_number: "desc" } },
        { date: "desc" },
      ],
    };

    const where: any = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        {
          vehicle: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          vehicle: {
            plate_number: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      where.date = {
        gte: start,
        lte: end,
      };
    }

    if (vehicleIdArray.length > 0) {
      where.vehicle_id = {
        in: vehicleIdArray,
      };
    }

    const [rawData, totalRecords] = await Promise.all([
      prisma.inspection_report.findMany({
        where,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        select: {
          id: true,
          date: true,
          created_at: true,
          user: {
            select: {
              name: true,
            },
          },
          conclusion: true,
          vehicle: {
            select: {
              id: true,
              plate_number: true,
              name: true,
            },
          },
        },
        orderBy: sortMap[sort] || sortMap.date_desc,
      }),

      prisma.inspection_report.count({
        where,
      }),
    ]);

    const data = rawData.map((item, index) => {
      return {
        no: offset + index + 1,
        id: item.id,
        date: formatedDate(item.date, "dd/MM/yyyy"),
        vehicle: {
          plate_number: item.vehicle.plate_number,
          name: item.vehicle.name,
        },
        inspector: item.user.name,
        conclusion: item.conclusion,
      };
    });

    const totalPages = limit ? Math.ceil(totalRecords / limit) : 1;

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        page: parseInt(page),
        totalPages,
        totalRecords,
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
