import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const version = await prisma.inspection_form_version.findUnique({
      where: { id },
    });

    if (!version) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Form version not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        id: version.id,
        version: version.version,
        fields: version.fields,
        published_at: version.published_at,
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
