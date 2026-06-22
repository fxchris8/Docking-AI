"use client";
import { useRouter } from "next/navigation";

export default function TempatFilter({
  availableYears,
  kapalOptions,
  statusOptions,
  selectedYear,
  selectedKapal,
  selectedStatus,
  id,
}) {
  const router = useRouter();

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams();
    if (key === "year") {
      if (value) params.set("year", value);
      if (selectedKapal) params.set("kapal", selectedKapal);
      if (selectedStatus) params.set("status", selectedStatus);
    } else if (key === "kapal") {
      if (selectedYear) params.set("year", selectedYear);
      if (value) params.set("kapal", value);
      if (selectedStatus) params.set("status", selectedStatus);
    } else if (key === "status") {
      if (selectedYear) params.set("year", selectedYear);
      if (selectedKapal) params.set("kapal", selectedKapal);
      if (value) params.set("status", value);
    }
    router.push(`/database/tempat/${id}?${params.toString()}`);
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

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
        <select
          value={selectedStatus}
          onChange={(e) => handleFilterChange("status", e.target.value)}
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