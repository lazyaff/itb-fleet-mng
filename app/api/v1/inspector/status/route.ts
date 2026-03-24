import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    // validate auth
    const isAuthorized = await validateJWT(request, ["SADM"]);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Unauthorized!",
        },
        { status: 401 },
      );
    }

    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // check user
    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
        role_id: "INSP",
        deleted_at: null,
      },
    });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "User not found!",
        },
        { status: 401 },
      );
    }

    // update data
    await prisma.user.update({
      where: {
        id: user_id,
      },
      data: {
        active: !user.active,
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Something went wrong!",
      },
      { status: 500 },
    );
  }
}
