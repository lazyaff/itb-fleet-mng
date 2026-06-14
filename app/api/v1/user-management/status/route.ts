import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { user_management_roles } from "@/src/dropdown";
import { NextResponse, NextRequest } from "next/server";

const MANAGED_ROLES = user_management_roles.map((role) => role.id);

export async function PUT(request: NextRequest) {
  try {
    // validate auth
    const isAuthorized = await validateJWT(request, ["SADM"]);
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

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // check if data exist
    const isDataExist = await prisma.user.findFirst({
      where: {
        id,
        role_id: { in: MANAGED_ROLES },
      },
    });
    if (!isDataExist) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    // revoke access
    await prisma.user.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "User revoked successfully!",
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
