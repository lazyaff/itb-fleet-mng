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

    const rawData = await prisma.inspection_report.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
      include: {
        vehicle: true,
        user: true,
        answers: true,
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

    const groupedSections = Object.values(
      rawData.answers.reduce((acc, item) => {
        const sectionKey = `${item.section_order}-${item.section_title}`;

        // group section
        if (!acc[sectionKey]) {
          acc[sectionKey] = {
            title: item.section_title,
            order: item.section_order,
            icon: item.section_icon,
            questions: {},
          };
        }

        const section = acc[sectionKey];

        const questionKey = `${item.question_order}-${item.question_title}`;

        // group question
        if (!section.questions[questionKey]) {
          section.questions[questionKey] = {
            title: item.question_title,
            order: item.question_order,
            answer: {
              label: item.option_label,
              description: item.option_desc,
              value: item.option_value,
            },
          };
        }

        return acc;
      }, {} as any),
    )
      .map((section: any) => ({
        title: section.title,
        icon: process.env.PUBLIC_STORAGE_PATH + section.icon,
        order: section.order,
        questions: Object.values(section.questions)
          .sort((a: any, b: any) => a.order - b.order)
          .map((q: any) => ({
            order: q.order,
            title: q.title,
            answer: q.answer,
          })),
      }))
      .sort((a: any, b: any) => a.order - b.order);

    const data = {
      id: rawData.id,
      inspector: rawData.user.name,
      date: formatedDate(rawData.date, "dd/MM/yyyy"),
      vehicle: {
        plate_number: rawData.vehicle.plate_number,
        name: rawData.vehicle.name,
      },
      conclusion: rawData.conclusion,
      notes: rawData.notes || null,
      sections: groupedSections,
    };

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
