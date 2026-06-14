import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { FormField, RECOMMENDATION_OPTIONS } from "@/src/formBuilder";
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

    const { form_version_id, vehicle_id, answers, conclusion } =
      await request.json();
    if (!form_version_id || !vehicle_id || !answers || !conclusion) {
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

    // validate conclusion
    const validConclusions = RECOMMENDATION_OPTIONS.map(
      (option) => option.value,
    );
    if (!validConclusions.includes(conclusion)) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Invalid conclusion!",
        },
        { status: 400 },
      );
    }

    // validate the submitted form version is still the active one
    const activeVersion = await prisma.inspection_form_version.findFirst({
      where: {
        is_active: true,
      },
      orderBy: {
        version: "desc",
      },
    });
    if (!activeVersion) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "No active form version found",
        },
        { status: 404 },
      );
    }
    if (activeVersion.id !== form_version_id) {
      return NextResponse.json(
        {
          success: false,
          status: 409,
          message: "Form has been updated, please reload and try again",
        },
        { status: 409 },
      );
    }

    // validate every field on the active version has an answer
    const fields = activeVersion.fields as unknown as FormField[];
    const answeredFieldIds = new Set(
      (answers as { field_id: string }[]).map((answer) => answer.field_id),
    );
    const missingField = fields.some(
      (field) => !answeredFieldIds.has(field.id),
    );
    if (missingField) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Fill all the following fields!",
        },
        { status: 400 },
      );
    }

    await prisma.inspection_dynamic_report.create({
      data: {
        user_id: isAuthorized.data.id,
        vehicle_id,
        form_version_id: activeVersion.id,
        answers,
        conclusion,
      },
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
