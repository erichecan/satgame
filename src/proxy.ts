import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const isValid = token ? await verifyToken(token).then(() => true).catch(() => false) : false;

  if (isValid) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: true, message: "未授权访问" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
