import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Gunakan cara bawaan Next.js yang lebih aman dan rapi
  const cookieStore = await cookies();
  cookieStore.delete("token"); 

  return NextResponse.json({ ok: true });
}