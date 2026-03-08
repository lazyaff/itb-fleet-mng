import { getToken } from "next-auth/jwt";
import { signOut } from "next-auth/react";
import {
  NextFetchEvent,
  NextMiddleware,
  NextRequest,
  NextResponse,
} from "next/server";

interface Token {
  role_id: string;
  role: string;
}

export default function withAuth(
  middleware: NextMiddleware,
  requireAuth: string[] = []
) {
  return async (req: NextRequest, next: NextFetchEvent) => {
    const pathname = req.nextUrl.pathname;
    const token = (await getToken({
      req,
      secret: process.env.JWT_SECRET,
    })) as Token | null;

    // if user access to the protected page
    if (requireAuth.some((page) => pathname.startsWith(page))) {
      if (!token) {
        if (pathname.startsWith("/admin/dashboard")) {
          const url = new URL("/admin", req.url);
          return NextResponse.redirect(url);
        } else {
          const url = new URL("/", req.url);
          return NextResponse.redirect(url);
        }
      }

      // Get user role from token
      const userRole = token.role_id?.toLowerCase();

      // Check if user has access to the requested path based on their role (!superadmin & !admin)
      if (
        userRole &&
        userRole !== "sadm" &&
        userRole !== "adm" &&
        !pathname.startsWith(`/${userRole}`)
      ) {
        // Redirect to role-specific home page if user tries to access unauthorized route
        const url = new URL(`/${userRole}`, req.url);
        return NextResponse.redirect(url);
      }

      // only sadm can create project
      // if (
      //   userRole &&
      //   userRole !== "sadm" &&
      //   pathname === "/admin/dashboard/projects/create"
      // ) {
      //   const url = new URL(`/admin/dashboard/projects`, req.url);
      //   return NextResponse.redirect(url);
      // }
    }

    // if logged in user access to the login page
    if ((token && pathname === "/") || (token && pathname === "/admin")) {
      const userRole = token.role_id?.toLowerCase();
      if (userRole === "sadm" || userRole === "adm") {
        const url = new URL(`/admin/dashboard`, req.url);
        return NextResponse.redirect(url);
      } else {
        const url = new URL(`/${userRole}`, req.url);
        return NextResponse.redirect(url);
      }
    }

    return middleware(req, next);
  };
}
