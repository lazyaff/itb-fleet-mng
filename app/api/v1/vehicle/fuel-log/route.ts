import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
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
    const id = url.searchParams.get("id") || "-";
    const page = url.searchParams.get("page") || "1";
    const size = url.searchParams.get("size");
    const limit = size ? Number(size) : 0;
    const offset = (parseInt(page) - 1) * limit;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const where = {
      vehicle_id: id,
      deleted_at: null,
      ...(from && to
        ? {
            date: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {}),
    };

    const [rawData, totalRecords, summary] = await Promise.all([
      prisma.fuel_log.findMany({
        where,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        orderBy: [{ date: "desc" }, { created_at: "desc" }],
        select: {
          id: true,
          date: true,
          liters: true,
          cost: true,
          payment_method: true,
          receipt: true,
          notes: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.fuel_log.count({ where }),
      prisma.fuel_log.aggregate({
        where,
        _sum: {
          liters: true,
          cost: true,
        },
        _count: true,
      }),
    ]);

    const data = rawData.map((item: any) => ({
      id: item.id,
      date: item.date.toISOString().split("T")[0],
      liters: Number(item.liters),
      cost: item.cost,
      payment_method: item.payment_method,
      receipt:
        process.env.NEXTAUTH_URL! +
        process.env.PUBLIC_STORAGE_PATH +
        item.receipt,
      notes: item.notes,
      user: item.user,
    }));

    const totalPage = limit ? Math.ceil(totalRecords / limit) : 1;

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        page: parseInt(page),
        totalPage,
        totalRecords,
        records: data,
        summary: {
          total_liters: Number(summary._sum.liters || 0),
          total_cost: summary._sum.cost || 0,
          total_entries: summary._count,
        },
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
