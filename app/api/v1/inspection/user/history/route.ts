import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { formatedDate } from "@/utils/date";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Validate auth
    const isAuthorized = await validateJWT(request, ["INSP"]);
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
    const sort: any = url.searchParams.get("sort") || "desc";
    const limit = url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : 0;
    const offset = (parseInt(page) - 1) * limit;

    const [rawData, totalRecords] = await Promise.all([
      prisma.inspection_report.findMany({
        where: {
          deleted_at: null,
          user_id: isAuthorized.data.id,
        },
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        select: {
          id: true,
          date: true,
          created_at: true,
          vehicle: {
            select: {
              plate_number: true,
              name: true,
            },
          },
        },
        orderBy: [
          {
            date: sort,
          },
          {
            created_at: sort,
          },
        ],
      }),
      prisma.inspection_report.count({
        where: {
          deleted_at: null,
          user_id: isAuthorized.data.id,
        },
      }),
    ]);

    const data = rawData.map((item) => {
      return {
        id: item.id,
        date: formatedDate(item.date, "dd/MM/yy"),
        time: formatedDate(item.created_at, "HH:mm"),
        vehicle: {
          plate_number: item.vehicle.plate_number,
          name: item.vehicle.name,
        },
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
