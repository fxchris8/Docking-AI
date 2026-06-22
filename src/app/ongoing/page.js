import SideBar from "@/components/ui/sidebar";
import Link from "next/link";
import {
  getAllPerbaikan,
  getMasterDataForForm,
} from "@/services/perbaikan.service";
import { formatRupiah, formatDate } from "@/utils/formatters";
import AddMaintenanceDrawer from "@/components/ui/AddMaintenanceDrawer";

export default async function OngoingDocking({ searchParams }) {
  const sp = await searchParams;
  const searchTerm = sp?.search?.toLowerCase() || "";
  const selectedYear = sp?.year || "";
  const selectedMonth = sp?.month || "";
  const sortCol = sp?.sort || "id";
  const sortDir = sp?.dir || "desc";

  const rawDatas = await getAllPerbaikan();
  const safeRawDatas = Array.isArray(rawDatas) ? rawDatas : [];
  // Hanya tampilkan perbaikan dengan status_perbaikan === "ongoing"
  const rawData = safeRawDatas.filter(
    (item) => item.status_perbaikan === "ongoing",
  );
  const masterData = await getMasterDataForForm();

  const availableYears = [
    ...new Set(
      rawData
        .filter((item) => item.waktu_masuk)
        .map((item) => new Date(item.waktu_masuk).getFullYear()),
    ),
  ].sort((a, b) => b - a);

  let dockingData = rawData.map((item) => ({
    rawId: item.id_perbaikan,
    id: `DC-${item.id_perbaikan}`,
    name: item.daftar_superintendent || "Belum Ditugaskan",
    ship: item.nama_kapal || "N/A",
    tempat: item.nama_tempat || "-",
    type: item.nama_cat || "General Docking",
    status: item.nama_status || "-",
    status_detail: item.status_detail || "",
    date: item.waktu_masuk,
    target_hari: Number(item.budget_time) || 0,
    estimasi_biaya: Number(item.budget_cost) || 0,
    tgl_penawaran: item.tanggal_penawaran,
    tgl_kontrak: item.tanggal_kontrak,
    tgl_rekalbea: item.tanggal_rekalbea,
    tgl_confirm: item.tanggal_confirm,
    keterangan: item.keterangan || "",
    status_pembayaran: item.status_pembayaran || "belum lunas",
  }));

  if (selectedYear) {
    dockingData = dockingData.filter(
      (d) =>
        d.date && new Date(d.date).getFullYear().toString() === selectedYear,
    );
  }
  if (selectedMonth) {
    dockingData = dockingData.filter(
      (d) =>
        d.date &&
        (new Date(d.date).getMonth() + 1).toString() === selectedMonth,
    );
  }
  if (searchTerm) {
    dockingData = dockingData.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm),
      ),
    );
  }

  // Sorting
  dockingData.sort((a, b) => {
    if (sortCol === "id") {
      return sortDir === "asc" ? a.rawId - b.rawId : b.rawId - a.rawId;
    }
    let valA = a[sortCol] || "";
    let valB = b[sortCol] || "";
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalOngoing = dockingData.length;
  const totalEstimasi = dockingData.reduce(
    (acc, curr) => acc + curr.estimasi_biaya,
    0,
  );
  const rataTargetHari =
    totalOngoing > 0
      ? Math.round(
          dockingData.reduce((acc, curr) => acc + curr.target_hari, 0) /
            totalOngoing,
        )
      : 0;

  const getSortLink = (col) => {
    const newDir = sortCol === col && sortDir === "asc" ? "desc" : "asc";
    const params = new URLSearchParams({ sort: col, dir: newDir });
    if (searchTerm) params.set("search", searchTerm);
    if (selectedYear) params.set("year", selectedYear);
    if (selectedMonth) params.set("month", selectedMonth);
    return `/ongoing?${params.toString()}`;
  };

  const renderSortIcon = (col) => {
    const active = sortCol === col;
    return (
      <span
        className={`transition-transform duration-200 ml-1 flex items-center ${
          active && sortDir === "desc" ? "rotate-180" : ""
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill={active ? "#2e004f" : "#cbd5e1"}
          viewBox="0 0 256 256"
        >
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,117.66-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L120,148.69V88a8,8,0,0,1,16,0v60.69l18.34-18.35a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      </span>
    );
  };

  return (
    <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
      <SideBar />
      <div className="main flex-1 p-6 md:p-10 flex flex-col gap-6 text-gray-800 h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-[#1a113c]">
              Ongoing Docking
            </h1>
            <p className="text-sm text-gray-500">
              Pantau, kelola, dan update status perbaikan armada kapal yang
              sedang berjalan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AddMaintenanceDrawer masterData={masterData} />
            <Link
              href={`/ongoing/print?${new URLSearchParams(sp).toString()}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm text-[#2e004f] hover:bg-gray-50 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M200,32H163.74a47.92,47.92,0,0,0-71.48,0H56A16,16,0,0,0,40,48V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm-72,0a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm72,184H56V48H80V64a8,8,0,0,0,8,8h80a8,8,0,0,0,8-8V48h24Z" />
              </svg>
              Cetak
            </Link>
          </div>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M240,192h-8V98.67a16,16,0,0,0-7.12-13.31l-88-58.67a16,16,0,0,0-17.76,0l-88,58.67A16,16,0,0,0,24,98.67V192H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,98.67l88-58.67,88,58.67V192H40Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Kapal Sedang Docking
              </p>
              <h3 className="text-2xl font-bold text-[#1a113c]">
                {totalOngoing}{" "}
                <span className="text-sm text-gray-500 font-medium">Unit</span>
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Rata-rata Target Waktu
              </p>
              <h3 className="text-2xl font-bold text-[#1a113c]">
                {rataTargetHari}{" "}
                <span className="text-sm text-gray-500 font-medium">Hari</span>
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2e004f]/10 rounded-xl flex items-center justify-center text-[#2e004f]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,166a38,38,0,1,0-38-38A38,38,0,0,0,128,166Zm0-64a26,26,0,1,1-26,26A26,26,0,0,1,128,102ZM240,58H16a6,6,0,0,0-6,6V192a6,6,0,0,0,6,6H240a6,6,0,0,0,6-6V64A6,6,0,0,0,240,58ZM22,108.82A54.73,54.73,0,0,0,60.82,70H195.18A54.73,54.73,0,0,0,234,108.82v38.36A54.73,54.73,0,0,0,195.18,186H60.82A54.73,54.73,0,0,0,22,147.18Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Estimasi Budget
              </p>
              <h3 className="text-xl font-bold text-[#1a113c]">
                {formatRupiah(totalEstimasi)}
              </h3>
            </div>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <form
              method="GET"
              action="/ongoing"
              className="flex flex-wrap items-center gap-3"
            >
              {sortCol && <input type="hidden" name="sort" value={sortCol} />}
              {sortDir && <input type="hidden" name="dir" value={sortDir} />}
              <div className="relative flex-1 min-w-[200px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                </svg>
                <input
                  type="text"
                  name="search"
                  defaultValue={searchTerm}
                  placeholder="Cari..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2e004f]/20 focus:border-[#2e004f] transition-all"
                />
              </div>
              <select
                name="month"
                defaultValue={selectedMonth}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
              >
                <option value="">Semua Bulan</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                  </option>
                ))}
              </select>
              <select
                name="year"
                defaultValue={selectedYear}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
              >
                <option value="">Semua Tahun</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2e004f] text-white rounded-lg text-sm font-semibold hover:bg-[#1a0035] transition-all"
              >
                Cari
              </button>
            </form>
          </div>

          {/* Tabel */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <Link
                      href={getSortLink("id")}
                      className="flex items-center"
                    >
                      ID Nota {renderSortIcon("id")}
                    </Link>
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <Link
                      href={getSortLink("ship")}
                      className="flex items-center"
                    >
                      Kapal {renderSortIcon("ship")}
                    </Link>
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <Link
                      href={getSortLink("tempat")}
                      className="flex items-center"
                    >
                      Lokasi {renderSortIcon("tempat")}
                    </Link>
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status Perbaikan
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status Pembayaran
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <Link
                      href={getSortLink("date")}
                      className="flex items-center"
                    >
                      Tgl Masuk {renderSortIcon("date")}
                    </Link>
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tgl Penawaran
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tgl Kontrak
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tgl Rekalbea
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tgl Confirm
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <Link
                      href={getSortLink("target_hari")}
                      className="flex items-center"
                    >
                      Target {renderSortIcon("target_hari")}
                    </Link>
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <Link
                      href={getSortLink("estimasi_biaya")}
                      className="flex items-center"
                    >
                      Estimasi {renderSortIcon("estimasi_biaya")}
                    </Link>
                  </th>
                  <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {dockingData.length > 0 ? (
                  dockingData.map((data, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                    >
                      <td className="py-3 px-3 text-sm font-bold text-gray-600 group-hover:text-[#2e004f]">
                        {data.id}
                      </td>
                      <td className="py-3 px-3 text-sm font-semibold text-[#1a113c]">
                        {data.ship}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700">
                        {data.tempat}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700">
                        {data.status}
                        {data.status_detail && (
                          <span className="text-[10px] text-gray-500 ml-1">
                            ({data.status_detail})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            data.status_pembayaran === "lunas"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {data.status_pembayaran === "lunas"
                            ? "Lunas"
                            : "Belum Lunas"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {formatDate(data.date)}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {formatDate(data.tgl_penawaran)}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {formatDate(data.tgl_kontrak)}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {formatDate(data.tgl_rekalbea)}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {formatDate(data.tgl_confirm)}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700">
                        {data.target_hari} Hari
                      </td>
                      <td className="py-3 px-3 text-sm font-bold text-[#2e004f]">
                        {formatRupiah(data.estimasi_biaya)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/ongoing/${data.rawId}/edit`}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                            title="Update Progress"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              fill="currentColor"
                              viewBox="0 0 256 256"
                            >
                              <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/ongoing/${data.rawId}`}
                            className="p-2 text-gray-400 hover:text-[#2e004f] hover:bg-[#2e004f]/10 rounded-lg transition-all"
                            title="Lihat Detail"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              fill="currentColor"
                              viewBox="0 0 256 256"
                            >
                              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,109.66-48,48a8,8,0,0,1-11.32-11.32L156.69,128,114.34,85.66a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,173.66,133.66Z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={14}
                      className="py-10 text-center text-gray-500"
                    >
                      Tidak ada perbaikan yang sedang berjalan saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center p-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Menampilkan {dockingData.length} perbaikan aktif
            </span>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                disabled
              >
                Sebelumnya
              </button>
              <button className="px-3 py-1.5 bg-[#2e004f] text-white rounded-md text-sm font-medium">
                1
              </button>
              <button
                className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                disabled
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
