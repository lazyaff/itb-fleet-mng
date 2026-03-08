import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export function validateBasicAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");

  // check header auth
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  // split header and credentials
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii",
  );
  const [username, password] = credentials.split(":");

  // validate credentials
  const validUsername = process.env.NEXT_PUBLIC_AUTH_USERNAME;
  const validPassword = process.env.NEXT_PUBLIC_AUTH_PASSWORD;
  return username === validUsername && password === validPassword;
}

export async function validateJWT(req: NextRequest, allowedRoles: string[]) {
  try {
    const token = req.headers.get("Authorization")?.split?.(" ")[1];

    // Check header auth
    if (!token) {
      return { success: false, message: "Token not provided" };
    }

    // Validate token
    const decoded = await new Promise<any>((resolve, reject) => {
      jwt.verify(
        token,
        process.env.JWT_SECRET || "",
        (err: any, decoded: any) => {
          if (err) {
            return reject(err);
          }
          resolve(decoded);
        },
      );
    });

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        role_id: { in: allowedRoles },
        deleted_at: null,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return { success: true, data: decoded, user };
  } catch (error) {
    return { success: false, data: null };
  }
}
