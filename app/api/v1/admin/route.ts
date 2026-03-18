import prisma from "@/lib/prisma";
import { validateJWT } from "@/utils/auth";
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

    const rawData = await prisma.user.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: [
        {
          role_id: "desc",
        },
        {
          name: "asc",
        },
      ],
    });

    const data = rawData.map((item) => {
      return {
        id: item.id,
        name: item.name,
      };
    });

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

// export async function POST(request: NextRequest) {
//   try {
//     // validate auth
//     const isAuthorized = await validateBearerAuth(request);
//     if (!isAuthorized.success) {
//       return NextResponse.json(
//         {
//           success: false,
//           status: 401,
//           message: "Unauthorized",
//         },
//         { status: 401 },
//       );
//     }

//     const res = await request.json();
//     const { name, description } = res;
//     if (!name || !description) {
//       return NextResponse.json(
//         {
//           success: false,
//           status: 400,
//           message: "Missing required fields!",
//         },
//         { status: 400 },
//       );
//     }

//     // create data
//     const trash = await prisma.trash_type.create({
//       data: {
//         name: name,
//         description: description,
//       },
//     });

//     // create trash quota data
//     const building = await prisma.building.findMany({
//       where: {
//         deleted_at: null,
//       },
//     });
//     const trash_quota = building.map((item) => ({
//       building_id: item.id,
//       trash_type_id: trash.id,
//       quota: 0,
//     }));
//     await prisma.trash_quota.createMany({
//       data: trash_quota,
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         status: 201,
//         message: "Data created successfully!",
//       },
//       {
//         status: 201,
//       },
//     );
//   } catch (error) {
//     console.log(error);
//     return NextResponse.json(
//       {
//         success: false,
//         status: 500,
//         message: "Internal server error",
//       },
//       { status: 500 },
//     );
//   }
// }

// export async function PUT(request: NextRequest) {
//   try {
//     // validate auth
//     const isAuthorized = await validateBearerAuth(request);
//     if (!isAuthorized.success) {
//       return NextResponse.json(
//         {
//           success: false,
//           status: 401,
//           message: "Unauthorized",
//         },
//         { status: 401 },
//       );
//     }

//     const res = await request.json();
//     const { id, name, description } = res;
//     if (!id || !name || !description) {
//       return NextResponse.json(
//         {
//           success: false,
//           status: 400,
//           message: "Missing required fields!",
//         },
//         { status: 400 },
//       );
//     }

//     // check if data exist
//     const isExist = await prisma.trash_type.findFirst({
//       where: {
//         id: id,
//         deleted_at: null,
//       },
//     });
//     if (!isExist) {
//       return NextResponse.json(
//         {
//           success: false,
//           status: 404,
//           message: "Data not found!",
//         },
//         { status: 404 },
//       );
//     }

//     // update data
//     await prisma.trash_type.update({
//       data: {
//         name: name,
//         description: description,
//       },
//       where: {
//         id: id,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       status: 200,
//       message: "Data updated successfully!",
//     });
//   } catch (error) {
//     console.log(error);
//     return NextResponse.json(
//       {
//         success: false,
//         status: 500,
//         message: "Internal server error",
//       },
//       { status: 500 },
//     );
//   }
// }

// export async function DELETE(request: NextRequest) {
//   try {
//     // validate auth
//     const isAuthorized = await validateBearerAuth(request);
//     if (!isAuthorized.success) {
//       return NextResponse.json(
//         {
//           success: false,
//           status: 401,
//           message: "Unauthorized",
//         },
//         { status: 401 },
//       );
//     }

//     const res = await request.json();
//     const { id } = res;
//     if (!id) {
//       return NextResponse.json(
//         {
//           success: false,
//           status: 400,
//           message: "Missing required fields!",
//         },
//         { status: 400 },
//       );
//     }

//     // check if data exist
//     const isExist = await prisma.trash_type.findFirst({
//       where: {
//         id: id,
//         deleted_at: null,
//       },
//     });
//     if (!isExist) {
//       return NextResponse.json(
//         {
//           success: false,
//           status: 404,
//           message: "Data not found!",
//         },
//         { status: 404 },
//       );
//     }

//     // update data
//     await prisma.trash_type.update({
//       where: {
//         id: id,
//       },
//       data: {
//         deleted_at: new Date(),
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       status: 200,
//       message: "Data deleted successfully!",
//     });
//   } catch (error) {
//     console.log(error);
//     return NextResponse.json(
//       {
//         success: false,
//         status: 500,
//         message: "Internal server error",
//       },
//       { status: 500 },
//     );
//   }
// }
