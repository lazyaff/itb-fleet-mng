import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { v4 as uuidv4 } from "uuid";
import { NextResponse, NextRequest } from "next/server";
import { deleteFile, saveFile } from "@/utils/image";

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
    const id = url.searchParams.get("id") || "-";
    const page = url.searchParams.get("page") || "1";
    const size = url.searchParams.get("size");
    const limit = size ? Number(size) : 0;
    const offset = (parseInt(page) - 1) * limit;

    const [rawData, totalRecords] = await Promise.all([
      prisma.service_history.findMany({
        where: {
          vehicle_id: id,
          deleted_at: null,
        },
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        orderBy: {
          created_at: "desc",
        },
        select: {
          id: true,
          vehicle: {
            select: {
              id: true,
              plate_number: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          image: true,
          date: true,
          current_mileage: true,
          type: true,
          cost: true,
          notes: true,
          vehicle_parts: {
            select: {
              vehicle_part: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.service_history.count({
        where: {
          vehicle_id: id,
          deleted_at: null,
        },
      }),
    ]);

    const data = rawData.map((item, index) => ({
      no: offset + index + 1,
      id: item.id,
      vehicle: item.vehicle,
      user: item.user,
      image:
        process.env.NEXTAUTH_URL! +
        process.env.PUBLIC_STORAGE_PATH +
        item.image,
      date: item.date.toISOString().split("T")[0],
      current_mileage: item.current_mileage,
      type: item.type,
      cost: item.cost,
      notes: item.notes,
      parts: item.vehicle_parts.map((part) => {
        return {
          id: part.vehicle_part.id,
          name: part.vehicle_part.name,
        };
      }),
    }));

    const totalPage = limit ? Math.ceil(totalRecords / limit) : 1;

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        page: parseInt(page),
        totalPage,
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

    const form = await request.formData();
    const vehicle_id = form.get("vehicle_id") as string;
    const image = form.get("image") as File;
    const current_distance = form.get("current_distance") as string;
    const date = form.get("date") as string;
    const type = form.get("type") as string;
    const user_id = form.get("user_id") as string;
    const cost = form.get("cost") as string;
    const notes = form.get("notes") as string;
    let part_ids = form.get("part_ids") as any;
    if (
      !vehicle_id ||
      !image ||
      !current_distance ||
      !date ||
      !type ||
      !user_id ||
      !cost
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

    // check image
    if (image.size === 0) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invoice Image is required!",
        },
        { status: 400 },
      );
    }

    // check mimetype
    if (
      image.type !== "image/png" &&
      image.type !== "image/jpeg" &&
      image.type !== "image/jpg" &&
      image.type !== "image/webp"
    ) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid image format!",
        },
        { status: 400 },
      );
    }

    // check maximum size
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Image size must be less than 10MB!",
        },
        { status: 400 },
      );
    }

    // check vehicle
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
          status: 400,
          message: "Admin not found!",
        },
        { status: 400 },
      );
    }

    part_ids = part_ids.split(",");
    if (part_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Part is required!",
        },
        { status: 400 },
      );
    }

    // check part
    const parts = await prisma.vehicle_part.findMany({
      where: {
        vehicle_id: vehicle_id,
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });
    const foundParts = parts.filter((part) => part_ids.includes(part.id));
    if (foundParts.length !== part_ids.length) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Part not found!",
        },
        { status: 400 },
      );
    }

    // create transaction
    await prisma.$transaction(async (tx) => {
      // save file
      const id = uuidv4();
      const filepath = await saveFile(image, "service-history", id);

      const service = await tx.service_history.create({
        data: {
          id: id,
          vehicle_id: vehicle_id,
          current_mileage: Number(current_distance),
          date: new Date(date),
          type: type,
          user_id: user_id,
          cost: Number(cost),
          notes: notes,
          image: filepath,
          is_all: foundParts.length === parts.length,
        },
      });

      const item = part_ids.map((part_id: string) => ({
        service_history_id: service.id,
        vehicle_part_id: part_id,
      }));

      await tx.vehicle_part_service_history.createMany({ data: item });

      await tx.vehicle_part.updateMany({
        where: {
          id: {
            in: part_ids,
          },
        },
        data: {
          last_service: new Date(date),
          current_distance: 0,
        },
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
    const current_distance = form.get("current_distance") as string;
    const type = form.get("type") as string;
    const user_id = form.get("user_id") as string;
    const cost = form.get("cost") as string;
    const notes = form.get("notes") as string;
    if (!id || !current_distance || !type || !user_id || !cost) {
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
          status: 400,
          message: "Admin not found!",
        },
        { status: 400 },
      );
    }

    // check data
    const data = await prisma.service_history.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Data not found!",
        },
        { status: 400 },
      );
    }

    // check image
    let filePath = data.image;
    if (image.size > 0) {
      // check mimetype
      if (
        image.type !== "image/png" &&
        image.type !== "image/jpeg" &&
        image.type !== "image/jpg" &&
        image.type !== "image/webp"
      ) {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            message: "Invalid image format!",
          },
          { status: 400 },
        );
      }

      // check maximum size
      if (image.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            message: "Image size must be less than 10MB!",
          },
          { status: 400 },
        );
      }

      filePath = await saveFile(image, "service-history", data.id);
      await deleteFile(data.image);
    }

    // update data
    await prisma.service_history.update({
      where: {
        id: id,
      },
      data: {
        current_mileage: Number(current_distance),
        type: type,
        user_id: user_id,
        cost: Number(cost),
        notes: notes,
        image: filePath,
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

    const service = await prisma.service_history.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    await prisma.service_history.update({
      where: {
        id: id,
      },
      data: {
        deleted_at: new Date(),
      },
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
