import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Validate auth
    const isAuthorized = await validateJWT(request, ["SADM", "ADM", "INSP"]);
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

    const activeVersion = await prisma.inspection_form_version.findFirst({
      where: {
        is_active: true,
      },
      orderBy: {
        version: "desc",
      },
    });

    if (!activeVersion) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "No active form version found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        id: activeVersion.id,
        version: activeVersion.version,
        fields: activeVersion.fields,
        published_at: activeVersion.published_at,
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
