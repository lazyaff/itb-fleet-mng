import prisma from "@/lib/prisma";
import { inspectionConclusion } from "@/src/dropdown";
import { validateJWT } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
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

    const { date, vehicle_id, answer_ids, conclusion, notes } =
      await request.json();
    if (!date || !vehicle_id || !answer_ids || !conclusion) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    // validate vehicle id
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id: vehicle_id,
        user_id: isAuthorized.data.id,
        deleted_at: null,
      },
    });
    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid vehicle id!",
        },
        { status: 400 },
      );
    }

    // validate answer length
    const questions = await prisma.inspection_question.count({
      where: {
        deleted_at: null,
      },
    });
    if (answer_ids.length !== questions) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Fill all the following questions!",
        },
        { status: 400 },
      );
    }

    // validate conclusion
    const validConclusions = inspectionConclusion
      .map((c) => c.label)
      .includes(conclusion);
    if (!validConclusions) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid conclusion!",
        },
        { status: 400 },
      );
    }

    // validate answers
    const answers = await prisma.inspection_option.findMany({
      where: {
        id: {
          in: answer_ids,
        },
        deleted_at: null,
      },
      select: {
        id: true,
        label: true,
        description: true,
        value: true,
        question: {
          select: {
            id: true,
            title: true,
            order: true,
            section: {
              select: {
                id: true,
                title: true,
                order: true,
                icon: true,
              },
            },
          },
        },
      },
    });
    if (answers.length !== answer_ids.length) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid answers!",
        },
        { status: 400 },
      );
    }

    // create report data
    await prisma.$transaction(async (tx) => {
      const report = await tx.inspection_report.create({
        data: {
          date: new Date(date),
          vehicle_id,
          user_id: isAuthorized.data.id,
          conclusion,
          notes: notes || null,
        },
      });

      const answerData = answers.map((option) => ({
        report_id: report.id,
        question_id: option.question.id,
        option_id: option.id,
        section_title: option.question.section.title,
        section_order: option.question.section.order,
        section_icon: option.question.section.icon || "",
        question_title: option.question.title,
        question_order: option.question.order,
        option_label: option.label,
        option_desc: option.description,
        option_value: option.value,
      }));

      await tx.inspection_answer.createMany({
        data: answerData,
      });
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data submitted successfully",
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
