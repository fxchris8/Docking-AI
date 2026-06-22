import { createClient } from "@supabase/supabase-js";
import CheckerClient from "./checkerClient"; // Sesuaikan path import-nya

// Inisialisasi Supabase (Sesuaikan dengan file config kamu)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function Page() {
  // 1. Ambil data tempat (contoh)
  const { data: dataTempat } = await supabase
    .from("tempat_perbaikan")
    .select("*");

  // 2. 🔥 AMBIL DATA KAPAL DARI TABEL BARU kapal_docking
  const { data: dataKapal } = await supabase
    .from("kapal_docking")
    .select("*")
    .order("ship_name_class_reg", { ascending: true });

  return (
    <main>
      {/* 3. Lempar datanya ke CheckerClient */}
      <CheckerClient
        dataTempat={dataTempat || []}
        dataKapal={dataKapal || []}
      />
    </main>
  );
}
