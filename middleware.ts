// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import withAuth from "./middlewares/withAuth";

function mainMiddleware(req: NextRequest) {
  const res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api")) {
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Origin",
      req.headers.get("origin") || "*",
    );
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: res.headers });
    }
  }

  return res;
}

export default withAuth(mainMiddleware, ["/admin", "inspector"]);
export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/inspector/:path*", "/"],
};
