import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";
import { hashSync } from "bcrypt";

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

    const { user_id, password, confirm_password } = await request.json();

    if (!user_id || !password || !confirm_password) {
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

    // Verify password
    const isPasswordValid = password === confirm_password;
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Passwords do not match!",
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
        password: hashSync(password, 10),
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
