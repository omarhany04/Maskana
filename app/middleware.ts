import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/leads", "/properties", "/users", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isProtectedPage = protectedRoutes.some((route) => pathname.startsWith(route));
  const isProtectedApi = pathname.startsWith("/api");

  if (!token && (isProtectedPage || isProtectedApi)) {
    if (isProtectedApi) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  if (token) {
    response.headers.set("x-user-id", token.sub ?? "");
    response.headers.set("x-company-id", String(token.companyId ?? ""));
    response.headers.set("x-user-role", String(token.role ?? ""));
    response.headers.set("x-user-name", String(token.name ?? ""));
    response.headers.set("x-user-email", String(token.email ?? ""));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

