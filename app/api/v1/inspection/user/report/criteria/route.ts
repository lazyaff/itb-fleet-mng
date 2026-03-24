import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Validate auth
    const isAuthorized = await validateJWT(request, ["INSP"]);
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

    const [rawData, rawVehicle] = await Promise.all([
      prisma.inspection_section.findMany({
        where: {
          deleted_at: null,
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          title: true,
          order: true,
          icon: true,
          questions: {
            where: {
              deleted_at: null,
            },
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              title: true,
              order: true,
              options: {
                where: {
                  deleted_at: null,
                },
                orderBy: {
                  order: "asc",
                },
                select: {
                  id: true,
                  label: true,
                  description: true,
                },
              },
            },
          },
        },
      }),
      prisma.vehicle.findMany({
        where: {
          deleted_at: null,
          user_id: isAuthorized.data.id,
        },
        select: {
          id: true,
          plate_number: true,
          name: true,
        },
        orderBy: [
          {
            name: "asc",
          },
          {
            plate_number: "asc",
          },
        ],
      }),
    ]);

    const data = rawData.map((section) => ({
      id: section.id,
      title: section.title,
      order: section.order,
      icon: process.env.PUBLIC_STORAGE_PATH! + section.icon,
      questions: section.questions.map((question) => ({
        id: question.id,
        title: question.title,
        order: question.order,
        options: question.options.map((option) => ({
          id: option.id,
          label: option.label,
          description: option.description,
        })),
      })),
    }));

    const VehicleData = rawVehicle.map((item) => {
      return {
        id: item.id,
        plate_number: item.plate_number,
        name: item.name,
      };
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully",
      data: {
        vehicle: VehicleData,
        criteria: data,
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
