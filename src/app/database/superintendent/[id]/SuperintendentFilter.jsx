"use client";
import { useRouter } from "next/navigation";

export default function SuperintendentFilter({
  availableYears,
  kapalOptions,
  tempatOptions,
  selectedYear,
  selectedKapal,
  selectedTempat,
  id,
}) {
  const router = useRouter();

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams();
    if (key === "year") {
      if (value) params.set("year", value);
      if (selectedKapal) params.set("kapal", selectedKapal);
      if (selectedTempat) params.set("tempat", selectedTempat);
    } else if (key === "kapal") {
      if (selectedYear) params.set("year", selectedYear);
      if (value) params.set("kapal", value);
      if (selectedTempat) params.set("tempat", selectedTempat);
    } else if (key === "tempat") {
      if (selectedYear) params.set("year", selectedYear);
      if (selectedKapal) params.set("kapal", selectedKapal);
      if (value) params.set("tempat", value);
    }
    router.push(`/database/superintendent/${id}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      {/* Tahun */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Tahun:</span>
        <select
          value={selectedYear}
          onChange={(e) => handleFilterChange("year", e.target.value)}
          className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none"
        >
          <option value="">Semua Tahun</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Kapal */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Kapal:</span>
        <select
          value={selectedKapal}
          onChange={(e) => handleFilterChange("kapal", e.target.value)}
          className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none"
        >
          <option value="">Semua Kapal</option>
          {kapalOptions.map((kapal) => (
            <option key={kapal} value={kapal}>{kapal}</option>
          ))}
        </select>
      </div>

      {/* Lokasi */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Lokasi:</span>
        <select
          value={selectedTempat}
          onChange={(e) => handleFilterChange("tempat", e.target.value)}
          className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none"
        >
          <option value="">Semua Lokasi</option>
          {tempatOptions.map((tempat) => (
            <option key={tempat} value={tempat}>{tempat}</option>
          ))}
        </select>
      </div>
    </div>
  );
}