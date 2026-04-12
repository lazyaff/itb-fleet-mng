import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcrypt";

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
    const page = url.searchParams.get("page") || "1";
    const search = url.searchParams.get("search") || "";
    const limit = url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : 0;
    const offset = (parseInt(page) - 1) * limit;

    const conditions: any = {
      deleted_at: null,
      role_id: "INSP",
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
          {
            vehicles: {
              some: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            vehicles: {
              some: {
                plate_number: {
                  contains: search,
                  mode: "insensitive",
                },
              },
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
          admin_id: true,
          name: true,
          email: true,
          active: true,
          vehicles: {
            select: {
              id: true,
              name: true,
              plate_number: true,
            },
          },
        },
        orderBy: [
          {
            name: "asc",
          },
        ],
      }),
      prisma.user.count({
        where: conditions,
      }),
    ]);

    const data = rawData.map((item, index) => {
      return {
        no: index + offset + 1,
        id: item.id,
        admin_id: item.admin_id,
        name: item.name,
        email: item.email,
        active: item.active,
        vehicles: item.vehicles.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          plate_number: vehicle.plate_number,
        })),
      };
    });

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

    const {
      admin_id,
      name,
      email,
      password,
      vehicle_ids = [],
    } = await request.json();
    if (!admin_id || !name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // check admin data
    const admin = await prisma.user.findFirst({
      where: {
        id: admin_id,
        role_id: {
          in: ["SADM", "ADM"],
        },
        deleted_at: null,
      },
    });
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Admin not found!",
        },
        { status: 400 },
      );
    }

    // check vehicle data
    if (vehicle_ids.length > 0) {
      const vehicle = await prisma.vehicle.findMany({
        where: {
          id: {
            in: vehicle_ids,
          },
          deleted_at: null,
        },
      });
      if (vehicle.length !== vehicle_ids.length) {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            message: "Vehicle not found!",
          },
          { status: 400 },
        );
      }
    }

    // check if email already exist
    const isExist = await prisma.user.findFirst({
      where: {
        email: email,
        deleted_at: null,
      },
    });
    if (isExist) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Email already exist!",
        },
        { status: 400 },
      );
    }

    // create data
    await prisma.$transaction(async (tx) => {
      const data = await tx.user.create({
        data: {
          name,
          email,
          password: bcrypt.hashSync(password, 10),
          admin_id: admin_id,
          role_id: "INSP",
        },
      });

      if (vehicle_ids?.length > 0) {
        await tx.vehicle.updateMany({
          where: {
            id: { in: vehicle_ids },
          },
          data: {
            user_id: data.id,
          },
        });
      }
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
    console.log(error);
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

    const {
      id,
      admin_id,
      name,
      email,
      vehicle_ids = [],
    } = await request.json();
    if (!id || !admin_id || !name || !email) {
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
        id: id,
        role_id: "INSP",
        deleted_at: null,
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

    // check admin data
    const admin = await prisma.user.findFirst({
      where: {
        id: admin_id,
        role_id: {
          in: ["SADM", "ADM"],
        },
        deleted_at: null,
      },
    });
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Admin not found!",
        },
        { status: 400 },
      );
    }

    // check vehicle data
    if (vehicle_ids.length > 0) {
      const vehicle = await prisma.vehicle.findMany({
        where: {
          id: {
            in: vehicle_ids,
          },
          deleted_at: null,
        },
      });
      if (vehicle.length !== vehicle_ids.length) {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            message: "Vehicle not found!",
          },
          { status: 400 },
        );
      }
    }

    // check if email already exist
    const isExist = await prisma.user.findFirst({
      where: {
        id: {
          not: id,
        },
        email: email,
        deleted_at: null,
      },
    });
    if (isExist) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Email already exist!",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          name,
          email,
          admin_id,
        },
      });

      await tx.vehicle.updateMany({
        where: {
          user_id: id,
        },
        data: {
          user_id: null,
        },
      });

      if (vehicle_ids.length > 0) {
        await tx.vehicle.updateMany({
          where: {
            id: { in: vehicle_ids },
          },
          data: {
            user_id: id,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
    });
  } catch (error) {
    console.log(error);
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

export async function DELETE(request: NextRequest) {
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
    const isExist = await prisma.user.findFirst({
      where: {
        id: id,
        role_id: "INSP",
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        vehicles: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!isExist) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    // update data
    await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        email: isExist.email + " | DELETED",
        deleted_at: new Date(),
      },
    });

    if (isExist.vehicles.length > 0) {
      const vehicle_ids = isExist.vehicles.map((vehicle) => vehicle.id);
      await prisma.vehicle.updateMany({
        where: {
          id: {
            in: vehicle_ids,
          },
        },
        data: {
          user_id: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data deleted successfully!",
    });
  } catch (error) {
    console.log(error);
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
