import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

type Role = "SADM" | "ADM" | "INSP";

const ROUTE_CONFIG = [
  { prefix: "/admin", roles: ["SADM", "ADM"] },
  { prefix: "/inspector", roles: ["INSP"] },
];

function getDefaultRoute(role?: Role) {
  if (role === "SADM" || role === "ADM") return "/admin/dashboard";
  if (role === "INSP") return "/inspector/home";
  return "/";
}

export default function withAuth(
  middleware: (req: NextRequest) => NextResponse | Promise<NextResponse>,
) {
  return async function wrappedMiddleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET,
    });

    const role = token?.role_id as Role | undefined;
    const matchedRoute = ROUTE_CONFIG.find((route) =>
      pathname.startsWith(route.prefix),
    );

    if (matchedRoute) {
      if (!token || !role) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      if (!matchedRoute.roles.includes(role)) {
        return NextResponse.redirect(new URL(getDefaultRoute(role), req.url));
      }
    }

    if (token && pathname === "/") {
      return NextResponse.redirect(new URL(getDefaultRoute(role), req.url));
    }

    return middleware(req);
  };
}
