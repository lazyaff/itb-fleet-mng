import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

type Role = "SADM" | "ADM" | "UOPS" | "INSP";

const ROUTE_CONFIG = [
  // SADM only
  {
    prefixes: ["/admin/user-management"],
    roles: ["SADM"] as Role[],
  },

  // SADM + ADM
  {
    prefixes: [
      "/admin/vehicle-part",
      "/admin/gps-tracker",
      "/admin/approval-inbox",
      "/admin/form-builder",
    ],
    roles: ["SADM", "ADM"] as Role[],
  },

  // SADM + ADM + UOPS
  {
    prefixes: [
      "/admin/dashboard",
      "/admin/live-track",
      "/admin/vehicle",
      "/admin/inspection",
      "/admin/vehicle-sync",
      "/admin/reports/monthly-recap",
      "/admin/my-request",
    ],
    roles: ["SADM", "ADM", "UOPS"] as Role[],
  },

  // Inspector
  {
    prefixes: ["/inspector"],
    roles: ["INSP"] as Role[],
  },
];

function getDefaultRoute(role?: Role) {
  switch (role) {
    case "SADM":
    case "ADM":
    case "UOPS":
      return "/admin/dashboard";

    case "INSP":
      return "/inspector/home";

    default:
      return "/";
  }
}

export default function withAuth(
  middleware: (req: NextRequest) => NextResponse | Promise<NextResponse>,
) {
  return async function wrappedMiddleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });

    const role = token?.role_id as Role | undefined;

    // redirect login page jika sudah login
    if (token && pathname === "/") {
      return NextResponse.redirect(new URL(getDefaultRoute(role), req.url));
    }

    // proteksi semua halaman admin & inspector
    if (
      (pathname.startsWith("/admin") || pathname.startsWith("/inspector")) &&
      (!token || !role)
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // inspector tidak boleh masuk admin
    if (pathname.startsWith("/admin") && role === "INSP") {
      return NextResponse.redirect(new URL(getDefaultRoute(role), req.url));
    }

    // non-inspector tidak boleh masuk inspector
    if (pathname.startsWith("/inspector") && role !== "INSP") {
      return NextResponse.redirect(new URL(getDefaultRoute(role), req.url));
    }

    const matchedRoute = ROUTE_CONFIG.find((group) =>
      group.prefixes.some((prefix) => pathname.startsWith(prefix)),
    );

    if (matchedRoute && role && !matchedRoute.roles.includes(role)) {
      return NextResponse.redirect(new URL(getDefaultRoute(role), req.url));
    }

    return middleware(req);
  };
}
