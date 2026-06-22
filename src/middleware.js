import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Daftar halaman yang dilindungi (wajib login)
const protectedPaths = [
  "/dashboard",
  "/ongoing",
  "/database",
  "/list",
  "/checker",
];

export async function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Jika mengakses /login
  if (pathname.startsWith("/login")) {
    if (token) {
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET),
        );
        const role = payload.role;
        // Jika sudah login, arahkan ke halaman sesuai role
        if (role === "admin") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        } else {
          return NextResponse.redirect(new URL("/list", request.url));
        }
      } catch {
        // Token tidak valid → hapus cookie, biarkan di /login
        const response = NextResponse.next();
        response.cookies.delete("token");
        return response;
      }
    }
    // Belum login, izinkan akses /login
    return NextResponse.next();
  }

  // 2. Cek apakah halaman yang diminta termasuk yang dilindungi
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    // Bukan halaman yang dilindungi, izinkan (mis: /api, /_next, dll)
    return NextResponse.next();
  }

  // 3. Halaman dilindungi → WAJIB ADA TOKEN
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Verifikasi token
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
    );
    const role = payload.role;

    // Admin bisa akses semua halaman dilindungi
    if (role === "admin") {
      return NextResponse.next();
    }

    // User hanya boleh akses /list dan /checker
    if (role === "user") {
      if (pathname.startsWith("/list") || pathname.startsWith("/checker")) {
        return NextResponse.next();
      }
      // User mencoba akses halaman admin → redirect ke /list
      return NextResponse.redirect(new URL("/list", request.url));
    }

    // Role tidak dikenali
    return NextResponse.redirect(new URL("/login", request.url));
  } catch {
    // Token tidak valid → hapus cookie, redirect ke /login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }
}

// Middleware berjalan untuk SEMUA request kecuali API routes & static files
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
