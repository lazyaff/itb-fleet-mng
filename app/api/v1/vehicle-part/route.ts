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
    const page = url.searchParams.get("page") || "1";
    const search = url.searchParams.get("search") || "";
    const limit = url.searchParams.get("size")
      ? Number(url.searchParams.get("size"))
      : 0;
    const offset = (parseInt(page) - 1) * limit;

    const conditions: any = {
      deleted_at: null,
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };

    const [rawData, totalRecords] = await Promise.all([
      prisma.general_vehicle_part.findMany({
        where: conditions,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        select: {
          id: true,
          name: true,
          distance_limit: true,
          time_limit: true,
          active: true,
        },
        orderBy: [
          {
            name: "asc",
          },
        ],
      }),
      prisma.general_vehicle_part.count({
        where: conditions,
      }),
    ]);

    const data = rawData.map((item) => {
      return {
        id: item.id,
        name: item.name,
        distance_limit: item.distance_limit,
        time_limit: item.time_limit,
        active: item.active,
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

    const { user_id, name, distance_limit, time_limit } = await request.json();
    if (!user_id || !name || !distance_limit || !time_limit) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // check user data
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
          status: 400,
          message: "Admin not found!",
        },
        { status: 400 },
      );
    }

    // create data
    await prisma.$transaction(async (tx) => {
      const distance = Number(distance_limit);
      const time = Number(time_limit);

      const data = await tx.general_vehicle_part.create({
        data: {
          name,
          distance_limit: distance,
          time_limit: time,
          active: true,
        },
      });

      const vehicles = await tx.vehicle.findMany({
        where: {
          deleted_at: null,
        },
      });

      const vehicle_part_data = vehicles.map((item) => {
        return {
          vehicle_id: item.id,
          general_vehicle_part_id: data.id,
          name: name,
          last_service: new Date(),
          current_distance: 0,
          distance_limit: distance,
          time_limit: time,
        };
      });

      await tx.vehicle_part.createMany({
        data: vehicle_part_data,
      });
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

    const { id, user_id, name, distance_limit, time_limit } =
      await request.json();

    if (!id || !user_id || !name || !distance_limit || !time_limit) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // check exist
    const part = await prisma.general_vehicle_part.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!part) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    // check user data
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
          status: 400,
          message: "Admin not found!",
        },
        { status: 400 },
      );
    }

    const distance = Number(distance_limit);
    const time = Number(time_limit);

    await prisma.$transaction(async (tx) => {
      await tx.general_vehicle_part.update({
        where: { id },
        data: {
          name,
          user_id,
          distance_limit: distance,
          time_limit: time,
        },
      });

      await tx.vehicle_part.updateMany({
        where: {
          general_vehicle_part_id: id,
        },
        data: {
          name,
          distance_limit: distance,
          time_limit: time,
        },
      });
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

    const part = await prisma.general_vehicle_part.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!part) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.general_vehicle_part.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          active: false,
        },
      });

      await tx.vehicle_part.updateMany({
        where: {
          general_vehicle_part_id: id,
        },
        data: {
          deleted_at: new Date(),
        },
      });
    });

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
