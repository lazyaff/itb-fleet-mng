import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";

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

    // fetch vehicle master data
    const res = await fetch(process.env.ITB_API_URL! + "/api/v2/kendaraans", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "api_komuto",
        Authorization: `Bearer ${process.env.ITB_API_TOKEN!}`,
      },
    });
    const result = await res.json();
    if (!res.ok) {
      console.log(result);
      return NextResponse.json(
        {
          success: false,
          status: 500,
          message: "Failed to fetch vehicle master data",
        },
        { status: 500 },
      );
    }

    const currentData = await prisma.vehicle.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        plate_number: true,
        name: true,
        brand: true,
        category: true,
        plate_color: true,
        type: true,
        assigned_unit: true,
        usage_type: true,
      },
    });

    const currentPlates = new Set(currentData.map((item) => item.plate_number));

    const masterData = result.data.map((item: any) => {
      const exists = currentPlates.has(item.nomor_polisi);
      return {
        plate_number: item.nomor_polisi,
        name: item.tipe ?? null,
        brand: item.merk ?? null,
        category: item.kelompok ?? null,
        plate_color: item.plat_kendaraan ?? null,
        type: item.jenis ?? null,
        assigned_unit: item.unit_pengguna ?? null,
        usage_type: item.penggunaan ?? null,
        status: exists ? "synced" : "new",
        selected: !exists,
      };
    });

    const conflictData = currentData
      .filter(
        (data) =>
          !masterData.find(
            (item: any) => item.plate_number === data.plate_number,
          ),
      )
      .map((item) => ({
        ...item,
        status: "conflict",
        selected: false,
      }));

    const data = [...masterData, ...conflictData];

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
    // validate auth
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

    const { synced_data } = await request.json();
    if (!synced_data || synced_data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    const newData = synced_data.filter(
      (item: any) => item.status === "new",
    ).length;
    const conflictData = synced_data.filter(
      (item: any) => item.status === "conflict",
    ).length;

    await prisma.$transaction(async (tx) => {
      const approval = await tx.approval_request.create({
        data: {
          type: "vehicle_sync",
          status: "pending",
          description_id: `Batch Sinkron - ${newData} Baru, ${conflictData} Konflik`,
          description_en: `Sync Batch - ${newData} New, ${conflictData} Conflict`,
          requested_by_id: isAuthorized.user?.id!,
          requested_at: new Date(),
        },
      });

      await tx.vehicle_sync_history.create({
        data: {
          approval_request_id: approval.id,
          data: synced_data,
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
