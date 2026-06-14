import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { deleteFile, saveFile } from "@/utils/image";
import { v4 as uuidv4 } from "uuid";
import { NextResponse, NextRequest } from "next/server";

const PAYMENT_METHODS = ["CARD", "CASH"];

export async function GET(request: NextRequest) {
  try {
    // Validate auth
    const isAuthorized = await validateJWT(request, ["SADM", "ADM", "UOPS"]);
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
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const where = {
      vehicle_id: id,
      deleted_at: null,
      ...(from && to
        ? {
            date: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {}),
    };

    const [rawData, totalRecords, summary] = await Promise.all([
      prisma.fuel_log.findMany({
        where,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
        orderBy: [{ date: "desc" }, { created_at: "desc" }],
        select: {
          id: true,
          date: true,
          liters: true,
          cost: true,
          payment_method: true,
          receipt: true,
          notes: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.fuel_log.count({ where }),
      prisma.fuel_log.aggregate({
        where,
        _sum: {
          liters: true,
          cost: true,
        },
        _count: true,
      }),
    ]);

    const data = rawData.map((item: any) => ({
      id: item.id,
      date: item.date.toISOString().split("T")[0],
      liters: Number(item.liters),
      cost: item.cost,
      payment_method: item.payment_method,
      receipt:
        process.env.NEXTAUTH_URL! +
        process.env.PUBLIC_STORAGE_PATH +
        item.receipt,
      notes: item.notes,
      user: item.user,
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
        summary: {
          total_liters: Number(summary._sum.liters || 0),
          total_cost: summary._sum.cost || 0,
          total_entries: summary._count,
        },
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
    const isAuthorized = await validateJWT(request, ["SADM", "ADM", "UOPS"]);
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
    const date = form.get("date") as string;
    const liters = form.get("liters") as string;
    const cost = form.get("cost") as string;
    const payment_method = form.get("payment_method") as string;
    const receipt = form.get("receipt") as File;
    const notes = form.get("notes") as string;

    if (
      !vehicle_id ||
      !date ||
      !liters ||
      !cost ||
      !payment_method ||
      !receipt
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

    if (!PAYMENT_METHODS.includes(payment_method)) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid payment method!",
        },
        { status: 400 },
      );
    }

    // check receipt
    if (receipt.size === 0) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Receipt Photo is required!",
        },
        { status: 400 },
      );
    }

    // check mimetype
    if (
      receipt.type !== "image/png" &&
      receipt.type !== "image/jpeg" &&
      receipt.type !== "image/jpg" &&
      receipt.type !== "image/webp"
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
    if (receipt.size > 10 * 1024 * 1024) {
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

    const id = uuidv4();
    const filepath = await saveFile(receipt, "fuel-log", id);

    await prisma.fuel_log.create({
      data: {
        id,
        vehicle_id,
        user_id: isAuthorized.data.id,
        date: new Date(date),
        liters: Number(liters),
        cost: Number(cost),
        payment_method,
        receipt: filepath,
        notes: notes || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
      },
      { status: 201 },
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

    const form = await request.formData();
    const id = form.get("id") as string;
    const date = form.get("date") as string;
    const liters = form.get("liters") as string;
    const cost = form.get("cost") as string;
    const payment_method = form.get("payment_method") as string;
    const receipt = form.get("receipt") as File;
    const notes = form.get("notes") as string;

    if (!id || !date || !liters || !cost || !payment_method) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    if (!PAYMENT_METHODS.includes(payment_method)) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid payment method!",
        },
        { status: 400 },
      );
    }

    const data = await prisma.fuel_log.findFirst({
      where: {
        id,
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

    // check receipt
    let filePath = data.receipt;
    if (receipt && receipt.size > 0) {
      // check mimetype
      if (
        receipt.type !== "image/png" &&
        receipt.type !== "image/jpeg" &&
        receipt.type !== "image/jpg" &&
        receipt.type !== "image/webp"
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
      if (receipt.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            message: "Image size must be less than 10MB!",
          },
          { status: 400 },
        );
      }

      filePath = await saveFile(receipt, "fuel-log", data.id);
      await deleteFile(data.receipt);
    }

    await prisma.fuel_log.update({
      where: {
        id,
      },
      data: {
        date: new Date(date),
        liters: Number(liters),
        cost: Number(cost),
        payment_method,
        receipt: filePath,
        notes: notes || null,
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
