"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Main() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setLoading(false); // user sudah login, lanjutkan render konten
      }
    };
    checkUser();
  }, [router, supabase]);

  if (loading) return <div>Memeriksa sesi...</div>;

  return (
    <div>{/* Konten halaman utama untuk pengguna yang sudah login */}</div>
  );
}
