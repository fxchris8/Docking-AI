import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  try {
    const cookieStore = await cookies(); // ← await wajib
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ id: null, role: null });
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
    );

    return NextResponse.json({
      id: payload.id,
      role: payload.role,
      nama: payload.nama || null,
    });
  } catch (error) {
    return NextResponse.json({ id: null, role: null }, { status: 401 });
  }
}
