import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { healthCount } from "@/utils/vehicle";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
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

    const pending_request = await prisma.approval_request.findMany({
      where: {
        status: "pending",
        deleted_at: null,
      },
      select: {
        requested_by_id: true,
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        my_request: pending_request.map(
          (req) => req.requested_by_id === isAuthorized.user?.id,
        ).length,
        all_request:
          isAuthorized.user?.role_id === "UOPS" ? 0 : pending_request.length,
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
