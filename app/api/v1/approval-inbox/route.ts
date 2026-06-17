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
        include: {
          requested_by: true,
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
        requested_by: item.requested_by.email,
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

export async function PUT(request: NextRequest) {
  try {
    // validate auth
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

    const { id, status, rejection_reason } = await request.json();
    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    if (status === "rejected" && !rejection_reason) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    const data = await prisma.approval_request.findFirst({
      where: {
        id,
        deleted_at: null,
        status: "pending",
      },
      include: {
        service_history: {
          include: {
            vehicle_parts: true,
          },
        },
      },
    });
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    // create transaction
    await prisma.$transaction(async (tx) => {
      await tx.approval_request.update({
        where: {
          id,
        },
        data: {
          status,
          ...(status === "rejected" && { rejection_reason }),
        },
      });

      if (status === "approved" && data.service_history) {
        const part_ids = data.service_history.vehicle_parts.map(
          (item: any) => item.id,
        );

        await tx.vehicle_part.updateMany({
          where: {
            id: {
              in: part_ids,
            },
          },
          data: {
            last_service: new Date(data.service_history.date),
            current_distance: 0,
          },
        });

        await tx.vehicle_alert.updateMany({
          where: {
            vehicle_part_id: {
              in: part_ids,
            },
            active: true,
          },
          data: {
            active: false,
            resolved_at: new Date(data.service_history.date),
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data created successfully!",
    });
  } catch (error) {
    console.log(error);
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
