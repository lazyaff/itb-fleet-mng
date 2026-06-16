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
    const search = url.searchParams.get("search") || "";
    const type = url.searchParams.get("type") || "";
    const status = url.searchParams.get("status") || "";
    const limit = url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : 0;
    const offset = (parseInt(page) - 1) * limit;

    const conditions: any = {
      requested_by_id: isAuthorized.user?.id,
      deleted_at: null,
      ...(search && {
        OR: [
          {
            description_id: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            description_en: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
      ...(type && { type: type }),
      ...(status && { status: status }),
    };

    const [rawData, totalRecords] = await Promise.all([
      prisma.approval_request.findMany({
        where: conditions,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.approval_request.count({
        where: conditions,
      }),
    ]);

    const data = rawData.map((item: any, index: number) => {
      return {
        no: offset + index + 1,
        id: item.id,
        type: item.type,
        description_id: item.description_id,
        description_en: item.description_en,
        status: item.status,
        requested_at: formatedDate(item.requested_at, "dd/MM/yyyy"),
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
