"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardFilter({ availableYears }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedYear = searchParams.get("year") || "";
  const selectedMonth = searchParams.get("month") || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        name="year"
        value={selectedYear}
        onChange={handleChange}
        className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2e004f]/20 focus:border-[#2e004f] cursor-pointer"
      >
        <option value="">Semua Tahun</option>
        {availableYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        name="month"
        value={selectedMonth}
        onChange={handleChange}
        className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2e004f]/20 focus:border-[#2e004f] cursor-pointer"
      >
        <option value="">Semua Bulan</option>
        <option value="1">Januari</option>
        <option value="2">Februari</option>
        <option value="3">Maret</option>
        <option value="4">April</option>
        <option value="5">Mei</option>
        <option value="6">Juni</option>
        <option value="7">Juli</option>
        <option value="8">Agustus</option>
        <option value="9">September</option>
        <option value="10">Oktober</option>
        <option value="11">November</option>
        <option value="12">Desember</option>
      </select>
    </div>
  );
}
