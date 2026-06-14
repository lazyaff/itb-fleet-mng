import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { formatedDate } from "@/utils/date";
import { NextResponse, NextRequest } from "next/server";

const compareDate = (a: any, b: any, sort: "asc" | "desc") => {
  const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
  const createdDiff =
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  const diff = dateDiff !== 0 ? dateDiff : createdDiff;
  return sort === "asc" ? diff : -diff;
};

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
    const sort: "asc" | "desc" =
      url.searchParams.get("sort") === "asc" ? "asc" : "desc";
    const limit = url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : 0;
    const offset = (parseInt(page) - 1) * limit;

    const where = {
      deleted_at: null,
      user_id: isAuthorized.data.id,
    };

    const select = {
      id: true,
      date: true,
      created_at: true,
      vehicle: {
        select: {
          plate_number: true,
          name: true,
        },
      },
    };

    const orderBy = [{ date: sort }, { created_at: sort }];

    const takeForMerge = limit ? offset + limit : undefined;

    const [staticRecords, dynamicRecords, staticCount, dynamicCount] =
      await Promise.all([
        prisma.inspection_report.findMany({
          where,
          ...(takeForMerge ? { take: takeForMerge } : {}),
          select,
          orderBy,
        }),
        prisma.inspection_dynamic_report.findMany({
          where,
          ...(takeForMerge ? { take: takeForMerge } : {}),
          select,
          orderBy,
        }),
        prisma.inspection_report.count({ where }),
        prisma.inspection_dynamic_report.count({ where }),
      ]);

    const merged = [...staticRecords, ...dynamicRecords].sort((a, b) =>
      compareDate(a, b, sort),
    );

    const totalRecords = staticCount + dynamicCount;
    const paged = limit ? merged.slice(offset, offset + limit) : merged;

    const data = paged.map((item: any) => {
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
