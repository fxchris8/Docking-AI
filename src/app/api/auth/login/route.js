import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Kredensial salah" }, { status: 401 });
    }

    // const match = await bcrypt.compare(password, user.password_hash);
    // if (!match)
    //   return NextResponse.json({ error: "Kredensial salah" }, { status: 401 });

    // Cek password langsung dengan teks biasa
if (password !== user.password_hash) {
  return NextResponse.json({ error: "Kredensial salah" }, { status: 401 });
}

    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      nama: user.nama,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
    const cookie = `token=${token}; Path=/; Max-Age=${60 * 60 * 24}; HttpOnly; SameSite=Strict${secureFlag}`;

    return NextResponse.json(
      { id: user.id, role: user.role, nama: user.nama },
      { headers: { "Set-Cookie": cookie } },
    );
  } catch (err) {
    console.error("[api/auth/login]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
