import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { formatedDate } from "@/utils/date";
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
            imei: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            vehicle: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            vehicle: {
              plate_number: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    };

    const [rawData, totalRecords] = await Promise.all([
      prisma.gps_tracker.findMany({
        where: conditions,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        select: {
          id: true,
          imei: true,
          created_at: true,
          live_tracks: {
            select: {
              created_at: true,
            },
            take: 1,
            orderBy: {
              created_at: "desc",
            },
          },
          vehicle: {
            select: {
              id: true,
              plate_number: true,
              name: true,
            },
          },
        },
        orderBy: [
          {
            created_at: "desc",
          },
        ],
      }),
      prisma.gps_tracker.count({
        where: conditions,
      }),
    ]);

    const data = rawData.map((item) => {
      return {
        id: item.id,
        created_at: formatedDate(item.created_at, "dd/MM/yyyy"),
        imei: item.imei,
        last_update: item.live_tracks[0]?.created_at
          ? formatedDate(item.live_tracks[0]?.created_at, "dd/MM/yyyy HH:mm:ss")
          : null,
        vehicle: {
          id: item.vehicle?.id || null,
          name: item.vehicle?.name || null,
          plate_number: item.vehicle?.plate_number || null,
        },
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

    const { imei, vehicle_id } = await request.json();
    if (!imei) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // check vehicle data
    if (vehicle_id) {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicle_id,
          deleted_at: null,
        },
      });
      if (!vehicle) {
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

    // check if imei already exist
    const isExist = await prisma.gps_tracker.findFirst({
      where: {
        imei: imei,
        deleted_at: null,
      },
    });
    if (isExist) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "IMEI already exist!",
        },
        { status: 400 },
      );
    }

    // create data
    const data = await prisma.gps_tracker.create({
      data: {
        imei,
      },
    });

    // update vehicle
    if (vehicle_id) {
      await prisma.vehicle.update({
        where: {
          id: vehicle_id,
        },
        data: {
          gps_tracker_id: data.id,
        },
      });
    }

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

    const { id, imei, vehicle_id } = await request.json();
    if (!id || !imei) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // check data exist
    const data = await prisma.gps_tracker.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: {
        id: true,
        vehicle: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    // check vehicle data
    if (vehicle_id) {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicle_id,
          deleted_at: null,
        },
      });
      if (!vehicle) {
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

    // check if imei already exist
    const isExist = await prisma.gps_tracker.findFirst({
      where: {
        imei: imei,
        id: {
          not: id,
        },
        deleted_at: null,
      },
    });
    if (isExist) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "IMEI already exist!",
        },
        { status: 400 },
      );
    }

    // update data
    await prisma.gps_tracker.update({
      where: {
        id,
      },
      data: {
        imei,
      },
    });

    // update vehicle data
    if (vehicle_id) {
      if (data.vehicle && data.vehicle.id !== vehicle_id) {
        await prisma.vehicle.update({
          where: {
            id: data.vehicle.id,
          },
          data: {
            gps_tracker_id: null,
          },
        });
      }

      await prisma.vehicle.update({
        where: {
          id: vehicle_id,
        },
        data: {
          gps_tracker_id: id,
        },
      });
    } else {
      if (data.vehicle) {
        await prisma.vehicle.update({
          where: {
            id: data.vehicle.id,
          },
          data: {
            gps_tracker_id: null,
          },
        });
      }
    }

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
    const isExist = await prisma.gps_tracker.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
      select: {
        id: true,
        vehicle: {
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
    await prisma.gps_tracker.update({
      where: {
        id: id,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    if (isExist.vehicle) {
      await prisma.vehicle.update({
        where: {
          id: isExist.vehicle.id,
        },
        data: {
          gps_tracker_id: null,
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
