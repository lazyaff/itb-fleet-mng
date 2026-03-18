import prisma from "@/lib/prisma";
import { validateBasicAuth } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    // validate auth
    const isAuthorized = validateBasicAuth(request);
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

    const res = await request.json();
    const { email, password } = res;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // Fetch user by email
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Email or password not valid!",
        },
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Email or password not valid!",
        },
        { status: 401 },
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "komuto",
      { expiresIn: "30d" },
    );

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Token generated successfully!",
      data: {
        token: token,
      },
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
