import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
  const { username, password, role, nama_lengkap } = await request.json();
  const password_hash = await bcrypt.hash(password, 10);
  const { error } = await supabase.from("users").insert({
    username,
    password_hash,
    role,
    nama_lengkap,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: "User created" });
}
