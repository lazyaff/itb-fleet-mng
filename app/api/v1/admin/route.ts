import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
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
    const search = url.searchParams.get("search") || "";
    const limit = url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : 0;
    const offset = (parseInt(page) - 1) * limit;

    const conditions: any = {
      deleted_at: null,
      role_id: {
        in: ["SADM", "ADM"],
      },
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };

    const [rawData, totalRecords] = await Promise.all([
      prisma.user.findMany({
        where: conditions,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        select: {
          id: true,
          name: true,
        },
        orderBy: [
          {
            name: "asc",
          },
        ],
      }),
      prisma.user.count({
        where: conditions,
      }),
    ]);

    const data = rawData.map((item) => {
      return {
        id: item.id,
        name: item.name,
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
