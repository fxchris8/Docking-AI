"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Update auth state (server set HttpOnly cookie)
      login({
        id: data.id,
        role: data.role,
        nama: data.nama,
      });

      // Redirect berdasarkan role
      if (data.role === "admin") router.push("/dashboard");
      else router.push("/list");
    } catch (err) {
      setError("Gagal menghubungi server.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#130b24] font-sans">
      {/* Panel kiri - dekorasi */}
      <div className="hidden lg:flex w-1/2 bg-[#1a113c] relative items-center justify-center overflow-hidden">
        <div className="absolute -inset-4 bg-[#2e004f] blur-3xl opacity-20 rounded-full" />
        <div className="relative z-10 text-center px-8">
          <Image
            src="/Logo.png"
            width={200}
            height={200}
            alt="Logo SPIL"
            loading="eager"
            className="mx-auto mb-8 drop-shadow-2xl"
          />
          <h1 className="text-4xl font-bold text-white mb-4">
            Log Book Docking
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            PT Salam Pasific Indonesia Lines
            <br />
            Sistem Monitoring Perbaikan Kapal
          </p>
        </div>
        <div className="absolute bottom-10 left-10 right-10 text-center text-white/20 text-sm">
          © {new Date().getFullYear()} SPIL. All rights reserved.
        </div>
      </div>

      {/* Panel kanan - form login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-10">
            <Image
              src="/Logo.png"
              width={120}
              height={120}
              alt="Logo SPIL"
              className="drop-shadow-lg"
            />
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Masuk</h2>
            <p className="text-gray-400 text-sm mb-8">
              Silakan login untuk mengakses sistem
            </p>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  className="p-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-[#6f16ae] focus:ring-2 focus:ring-[#6f16ae]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="p-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-[#6f16ae] focus:ring-2 focus:ring-[#6f16ae]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#6f16ae] hover:bg-[#5a118c] text-white font-bold rounded-xl shadow-lg shadow-[#2e004f]/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
