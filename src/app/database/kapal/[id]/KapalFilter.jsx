"use client";
import { useRouter } from "next/navigation";

export default function KapalFilter({
  availableYears,
  lokasiOptions,
  statusOptions,
  selectedYear,
  selectedTempat,
  selectedStatus,
  id,
}) {
  const router = useRouter();

  const handleChange = (key, value) => {
    const params = new URLSearchParams();
    if (key === "year") {
      if (value) params.set("year", value);
      if (selectedTempat) params.set("tempat", selectedTempat);
      if (selectedStatus) params.set("status", selectedStatus);
    } else if (key === "tempat") {
      if (selectedYear) params.set("year", selectedYear);
      if (value) params.set("tempat", value);
      if (selectedStatus) params.set("status", selectedStatus);
    } else if (key === "status") {
      if (selectedYear) params.set("year", selectedYear);
      if (selectedTempat) params.set("tempat", selectedTempat);
      if (value) params.set("status", value);
    }
    router.push(`/database/kapal/${id}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Tahun:</span>
        <select
          value={selectedYear}
          onChange={(e) => handleChange("year", e.target.value)}
          className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none"
        >
          <option value="">Semua Tahun</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Lokasi:</span>
        <select
          value={selectedTempat}
          onChange={(e) => handleChange("tempat", e.target.value)}
          className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none"
        >
          <option value="">Semua Lokasi</option>
          {lokasiOptions.map((lokasi) => (
            <option key={lokasi} value={lokasi}>{lokasi}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
        <select
          value={selectedStatus}
          onChange={(e) => handleChange("status", e.target.value)}
          className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none"
        >
          <option value="">Semua Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </div>
  );
}