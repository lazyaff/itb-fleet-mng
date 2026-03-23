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
    const search = url.searchParams.get("search") || "";

    const rawData = await prisma.vehicle.findMany({
      where: {
        deleted_at: null,
        user_id: null,
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              plate_number: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }),
      },
      select: {
        id: true,
        plate_number: true,
        name: true,
      },
      orderBy: [
        {
          plate_number: "asc",
        },
      ],
    });

    const data = rawData.map((item) => {
      return {
        id: item.id,
        plate_number: item.plate_number,
        name: item.name,
      };
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data,
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
