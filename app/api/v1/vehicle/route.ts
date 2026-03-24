import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { deleteFile, saveFile } from "@/utils/image";
import { healthCount } from "@/utils/vehicle";
import { DateTime } from "luxon";
import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const errorResponse = (message: string) =>
  NextResponse.json(
    {
      success: false,
      status: 400,
      message,
    },
    { status: 400 },
  );

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

    const rawData = await prisma.vehicle.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        plate_number: true,
        internal_code: true,
        name: true,
        vehicle_type: {
          select: {
            name: true,
          },
        },
        image: true,
        status: true,
        current_mileage: true,
        vehicle_parts: {
          where: {
            deleted_at: null,
          },
        },
      },
      orderBy: [
        {
          name: "asc",
        },
        {
          plate_number: "asc",
        },
      ],
    });

    const data = rawData.map((item) => {
      let health = 0;
      let time_limit: null | number = null;
      let distance_limit: null | number = null;

      for (const part of item.vehicle_parts) {
        const distance_remaining =
          part.distance_limit * 1000 - part.current_distance;
        distance_limit = distance_limit
          ? Math.min(distance_limit, distance_remaining)
          : distance_remaining;

        const lastService = DateTime.fromJSDate(part.last_service);
        const now = DateTime.now();
        const diffDays = part.time_limit - now.diff(lastService, "days").days;
        time_limit = Math.floor(
          time_limit ? Math.min(time_limit, diffDays) : diffDays,
        );

        // console.log(
        //   part.name,
        //   healthCount({
        //     current_mileage: part.current_distance,
        //     distance_limit: part.distance_limit,
        //     last_service: part.last_service,
        //     time_limit: part.time_limit,
        //   }),
        // );

        health += Math.max(
          healthCount({
            current_mileage: part.current_distance,
            distance_limit: part.distance_limit,
            last_service: part.last_service,
            time_limit: part.time_limit,
          }),
          0,
        );
      }

      // console.log();

      return {
        id: item.id,
        plate_number: item.plate_number,
        internal_code: item.internal_code,
        name: item.name,
        type: item.vehicle_type.name,
        image:
          process.env.NEXTAUTH_URL! +
          process.env.PUBLIC_STORAGE_PATH +
          item.image,
        status: item.status,
        health: Math.floor(health / item.vehicle_parts.length),
        current_mileage: Math.floor(item.current_mileage / 1000),
        next_service: {
          time_limit: time_limit && time_limit > 0 ? time_limit : -1,
          distance_limit:
            distance_limit && distance_limit > 0
              ? Number(
                  ((item.current_mileage + distance_limit) / 1000).toFixed(0),
                )
              : -1,
        },
      };
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data,
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
    // Validate auth
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

    const form = await request.formData();
    const image = form.get("image") as File;
    const user_id = form.get("user_id") as string;
    const plate_number = form.get("plate_number") as string;
    const name = form.get("name") as string;
    const vehicle_type_id = form.get("vehicle_type_id") as string;
    const internal_code = form.get("internal_code") as string;
    const status = form.get("status") as string;
    const current_milage = form.get("current_milage") as string;
    const engine_hours = form.get("engine_hours") as string;
    const notes = form.get("notes") as string;

    if (
      !image ||
      !user_id ||
      !plate_number ||
      !name ||
      !vehicle_type_id ||
      !status ||
      !current_milage ||
      !engine_hours
    ) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // jalankan paralel
    const [admin, vehicle_type, exist_plate_number, exist_internal_code] =
      await Promise.all([
        prisma.user.findFirst({
          where: { id: user_id, deleted_at: null },
        }),
        prisma.vehicle_type.findFirst({
          where: { id: vehicle_type_id, deleted_at: null },
        }),
        prisma.vehicle.findFirst({
          where: { plate_number, deleted_at: null },
        }),
        internal_code
          ? prisma.vehicle.findFirst({
              where: { internal_code, deleted_at: null },
            })
          : Promise.resolve(null),
      ]);

    if (!admin) return errorResponse("Admin not found!");
    if (!vehicle_type) return errorResponse("Vehicle type not found!");
    if (exist_plate_number) return errorResponse("Plate number already used!");
    if (exist_internal_code)
      return errorResponse("Internal code already used!");

    // validate image myme type
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimeTypes.includes(image.type)) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid image format",
        },
        { status: 400 },
      );
    }

    // validate file size
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Image size must be less than 5MB",
        },
        { status: 400 },
      );
    }

    // get part data
    const parts = await prisma.general_vehicle_part.findMany({
      where: {
        active: true,
        deleted_at: null,
      },
    });

    const partData = parts.map((part) => ({
      general_vehicle_part_id: part.id,
      name: part.name,
      last_service: new Date(),
      current_distance: 0,
      distance_limit: part.distance_limit,
      time_limit: part.time_limit,
      notes: null,
    }));

    // save file
    const id = uuidv4();
    const filepath = await saveFile(image, "vehicle", id);

    // save data
    await prisma.vehicle.create({
      data: {
        id: id,
        user_id: user_id,
        image: filepath,
        plate_number: plate_number,
        name: name,
        type_id: vehicle_type_id,
        internal_code: internal_code,
        status: status,
        current_mileage: Number(current_milage) * 1000,
        engine_hours: Number(engine_hours),
        notes: notes,
        vehicle_parts: {
          create: partData,
        },
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

    const form = await request.formData();
    const id = form.get("id") as string;
    const image = form.get("image") as File;
    const user_id = form.get("user_id") as string;
    const plate_number = form.get("plate_number") as string;
    const name = form.get("name") as string;
    const vehicle_type_id = form.get("vehicle_type_id") as string;
    const internal_code = form.get("internal_code") as string;
    const status = form.get("status") as string;
    const current_milage = form.get("current_milage") as string;
    const engine_hours = form.get("engine_hours") as string;
    const notes = form.get("notes") as string;

    if (
      !id ||
      !user_id ||
      !plate_number ||
      !name ||
      !vehicle_type_id ||
      !status ||
      !current_milage ||
      !engine_hours
    ) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // jalankan paralel
    const [
      vehicle,
      admin,
      vehicle_type,
      exist_plate_number,
      exist_internal_code,
    ] = await Promise.all([
      prisma.vehicle.findFirst({
        where: { id, deleted_at: null },
      }),
      prisma.user.findFirst({
        where: { id: user_id, deleted_at: null },
      }),
      prisma.vehicle_type.findFirst({
        where: { id: vehicle_type_id, deleted_at: null },
      }),
      prisma.vehicle.findFirst({
        where: {
          id: {
            not: id,
          },
          plate_number,
          deleted_at: null,
        },
      }),
      internal_code
        ? prisma.vehicle.findFirst({
            where: {
              id: {
                not: id,
              },
              internal_code,
              deleted_at: null,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!vehicle) return errorResponse("Vehicle not found!");
    if (!admin) return errorResponse("Admin not found!");
    if (!vehicle_type) return errorResponse("Vehicle type not found!");
    if (exist_plate_number) return errorResponse("Plate number already used!");
    if (exist_internal_code)
      return errorResponse("Internal code already used!");

    let filePath = vehicle.image;
    if (image && image.size > 0) {
      // validate image myme type
      const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validMimeTypes.includes(image.type)) {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            message: "Invalid image format",
          },
          { status: 400 },
        );
      }

      // validate file size
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            message: "Image size must be less than 5MB",
          },
          { status: 400 },
        );
      }

      await deleteFile(filePath);
      filePath = await saveFile(image, "vehicle", id);
    }

    // update data
    await prisma.vehicle.update({
      where: { id },
      data: {
        user_id: user_id,
        image: filePath,
        plate_number: plate_number,
        name: name,
        type_id: vehicle_type_id,
        internal_code: internal_code,
        status: status,
        current_mileage: Number(current_milage) * 1000,
        engine_hours: Number(engine_hours),
        notes: notes,
      },
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
    const isExist = await prisma.vehicle.findFirst({
      where: {
        id: id,
        deleted_at: null,
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
    await prisma.vehicle.update({
      where: {
        id: id,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    // delete image
    await deleteFile(isExist.image);

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
