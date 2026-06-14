import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
import { FormField, validateFormFields } from "@/src/formBuilder";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
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

    const { fields } = await request.json();
    if (!Array.isArray(fields)) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Missing required fields!",
        },
        { status: 400 },
      );
    }

    const errors = validateFormFields(fields as FormField[]);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Field required",
          data: { errors },
        },
        { status: 400 },
      );
    }

    const newVersion = await prisma.$transaction(async (tx) => {
      const current = await tx.inspection_form_version.findFirst({
        where: {
          is_active: true,
        },
        orderBy: {
          version: "desc",
        },
      });

      if (current) {
        await tx.inspection_form_version.update({
          where: { id: current.id },
          data: { is_active: false },
        });
      }

      return tx.inspection_form_version.create({
        data: {
          version: (current?.version || 0) + 1,
          fields: fields as object[],
          is_active: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Form published successfully",
        data: {
          id: newVersion.id,
          version: newVersion.version,
          fields: newVersion.fields,
          published_at: newVersion.published_at,
        },
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
