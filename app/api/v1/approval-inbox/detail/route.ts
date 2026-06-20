import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { formatedDate } from "@/utils/date";
import { groupFieldsIntoSections } from "@/src/formBuilder";
import { NextResponse, NextRequest } from "next/server";
import { buildPublicUrl } from "@/utils/image";

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
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Id is required",
        },
        { status: 400 },
      );
    }

    const rawData = await prisma.approval_request.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
      include: {
        service_history: {
          include: {
            vehicle: true,
            vehicle_parts: {
              include: {
                vehicle_part: true,
              },
            },
          },
        },
        vehicle_sync_history: true,
        requested_by: true,
      },
    });

    if (!rawData) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        id: rawData.id,
        type: rawData.type,
        requester: rawData.requested_by.email,
        request_date: formatedDate(rawData.requested_at, "dd/MM/yyyy"),
        status: rawData.status,
        rejection_reason: rawData.rejection_reason,
        service_history: !rawData.service_history
          ? null
          : {
              image: buildPublicUrl(rawData.service_history.image),
              vehicle_name: rawData.service_history.vehicle.name,
              plate_number: rawData.service_history.vehicle.plate_number,
              service_date: formatedDate(
                rawData.service_history.date,
                "dd/MM/yyyy",
              ),
              mileage: rawData.service_history.current_mileage,
              cost: rawData.service_history.cost,
              notes: rawData.service_history.notes,
              parts: rawData.service_history.vehicle_parts.map((part) => ({
                id: part.vehicle_part.id,
                name: part.vehicle_part.name,
              })),
            },
        vehicle_sync: !rawData.vehicle_sync_history
          ? null
          : rawData.vehicle_sync_history.data,
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
