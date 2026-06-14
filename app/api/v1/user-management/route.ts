import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { user_management_roles } from "@/src/dropdown";
import { NextResponse, NextRequest } from "next/server";

const MANAGED_ROLES = user_management_roles.map((role) => role.id);
const EMAIL_REGEX = /^[^\s@]+@([\w-]+\.)*itb\.ac\.id$/i;

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "1";
    const search = url.searchParams.get("search") || "";
    const limit = url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : 0;
    const offset = (parseInt(page) - 1) * limit;

    const conditions: any = {
      role_id: { in: MANAGED_ROLES },
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };

    const [rawData, totalRecords] = await Promise.all([
      prisma.user.findMany({
        where: conditions,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        select: {
          id: true,
          email: true,
          name: true,
          role_id: true,
          active: true,
          created_at: true,
          last_login: true,
        },
        orderBy: [
          {
            created_at: "desc",
          },
        ],
      }),
      prisma.user.count({
        where: conditions,
      }),
    ]);

    const data = rawData.map((item: any, index: number) => ({
      no: index + offset + 1,
      id: item.id,
      email: item.email,
      name: item.name,
      role_id: item.role_id,
      active: item.active,
      created_at: item.created_at,
      last_login: item.last_login,
    }));

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

export async function POST(request: NextRequest) {
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

    const { email, name, role_id } = await request.json();
    if (!email || !name || !role_id) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    if (!MANAGED_ROLES.includes(role_id)) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid role!",
        },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Email must be a valid @itb.ac.id address!",
        },
        { status: 400 },
      );
    }

    // check if email already exists (any role, including inactive/superadmin)
    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      if (existing.active || existing.role_id === "SADM") {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            message: "Email already exists!",
          },
          { status: 400 },
        );
      }

      // reactivate previously revoked account
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          role_id,
          active: true,
        },
      });

      return NextResponse.json({
        success: true,
        status: 200,
        message: "Account reactivated successfully!",
      });
    }

    await prisma.user.create({
      data: {
        email,
        name,
        role_id,
        active: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
      },
      {
        status: 201,
      },
    );
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

    const { id, name, role_id } = await request.json();
    if (!id || !name || !role_id) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    if (!MANAGED_ROLES.includes(role_id)) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid role!",
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

    await prisma.user.update({
      where: { id },
      data: {
        name,
        role_id,
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
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
