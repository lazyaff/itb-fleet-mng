import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    // validate auth
    const isAuthorized = await validateJWT(request, ["SADM"]);
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

    // check
    const data = await prisma.general_vehicle_part.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Data not found!",
        },
        { status: 401 },
      );
    }

    // update data
    await prisma.$transaction(async (tx) => {
      const newActive = !data.active;
      await prisma.$transaction(async (tx) => {
        await tx.general_vehicle_part.update({
          where: { id },
          data: {
            active: newActive,
          },
        });

        await tx.vehicle_part.updateMany({
          where: {
            general_vehicle_part_id: id,
          },
          data: {
            deleted_at: newActive ? null : new Date(),
          },
        });
      });
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
        message: "Something went wrong!",
      },
      { status: 500 },
    );
  }
}
