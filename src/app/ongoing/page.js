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
  const sortCol = sp?.sort || "date";
  const sortDir = sp?.dir || "asc";

  const rawDatas = await getAllPerbaikan();
  const rawData = rawDatas.filter((item) => !item.waktu_mulai_operasi);
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
    date: item.waktu_masuk,
    target_hari: Number(item.budget_time) || 0,
    estimasi_biaya: Number(item.budget_cost) || 0,
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

  dockingData.sort((a, b) => {
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

  const getSortIcon = (col) => {
    const isActive = sortCol === col;
    return (
      <span
        className={`transition-transform duration-200 ml-1 flex items-center ${isActive && sortDir === "desc" ? "rotate-180" : ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill={isActive ? "#2e004f" : "#cbd5e1"}
          viewBox="0 0 256 256"
        >
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,117.66-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L120,148.69V88a8,8,0,0,1,16,0v60.69l18.34-18.35a8,8,0,0,1,11.32,11.32Z"></path>
        </svg>
      </span>
    );
  };

  return (
    <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
      <SideBar />

      <div className="main flex-1 p-10 flex flex-col gap-8 text-gray-800 h-screen overflow-y-auto">
        <div className="header flex w-full justify-between items-center">
          <div className="header-left gap-1 flex flex-col">
            <h1 className="title text-[32px] font-bold text-[#1a113c]">
              Ongoing Docking
            </h1>
            <p className="subtitle text-[15px] font-medium text-gray-500">
              Pantau, kelola, dan update status perbaikan armada kapal yang
              sedang berjalan.
            </p>
          </div>
          <div className="header-right gap-3 flex items-center">
            <AddMaintenanceDrawer masterData={masterData} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M240,192h-8V98.67a16,16,0,0,0-7.12-13.31l-88-58.67a16,16,0,0,0-17.76,0l-88,58.67A16,16,0,0,0,24,98.67V192H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,98.67l88-58.67,88,58.67V192H40ZM208,224a8,8,0,0,1-8,8H56a8,8,0,0,1,0-16H200A8,8,0,0,1,208,224Z"></path>
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

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"></path>
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

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2e004f]/10 rounded-xl flex items-center justify-center text-[#2e004f]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,166a38,38,0,1,0-38-38A38,38,0,0,0,128,166Zm0-64a26,26,0,1,1-26,26A26,26,0,0,1,128,102ZM240,58H16a6,6,0,0,0-6,6V192a6,6,0,0,0,6,6H240a6,6,0,0,0,6-6V64A6,6,0,0,0,240,58ZM22,108.82A54.73,54.73,0,0,0,60.82,70H195.18A54.73,54.73,0,0,0,234,108.82v38.36A54.73,54.73,0,0,0,195.18,186H60.82A54.73,54.73,0,0,0,22,147.18ZM234,96.29A42.8,42.8,0,0,1,207.71,70H234ZM48.29,70A42.8,42.8,0,0,1,22,96.29V70ZM22,159.71A42.8,42.8,0,0,1,48.29,186H22ZM207.71,186A42.8,42.8,0,0,1,234,159.71V186Z"></path>
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1">
          <div className="p-6 border-b border-gray-100">
            <form
              method="GET"
              action="/ongoing"
              className="flex items-center gap-3 w-full max-w-4xl"
            >
              {sortCol && <input type="hidden" name="sort" value={sortCol} />}
              {sortDir && <input type="hidden" name="dir" value={sortDir} />}

              <div className="relative flex-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
                <input
                  type="text"
                  name="search"
                  defaultValue={searchTerm}
                  placeholder="Cari ke semua kolom..."
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

          <div className="w-full overflow-x-auto p-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 cursor-pointer transition-colors">
                    <Link
                      href={getSortLink("id")}
                      className="flex items-center w-full"
                    >
                      ID Nota {getSortIcon("id")}
                    </Link>
                  </th>
                  <th className="pb-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 cursor-pointer transition-colors">
                    <Link
                      href={getSortLink("name")}
                      className="flex items-center w-full"
                    >
                      Penanggung Jawab {getSortIcon("name")}
                    </Link>
                  </th>
                  <th className="pb-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 cursor-pointer transition-colors">
                    <Link
                      href={getSortLink("ship")}
                      className="flex items-center w-full"
                    >
                      Kapal {getSortIcon("ship")}
                    </Link>
                  </th>
                  <th className="pb-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 cursor-pointer transition-colors">
                    <Link
                      href={getSortLink("tempat")}
                      className="flex items-center w-full"
                    >
                      Lokasi Docking {getSortIcon("tempat")}
                    </Link>
                  </th>
                  <th className="pb-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 cursor-pointer transition-colors">
                    <Link
                      href={getSortLink("type")}
                      className="flex items-center w-full"
                    >
                      Tipe Docking {getSortIcon("type")}
                    </Link>
                  </th>
                  <th className="pb-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 cursor-pointer transition-colors">
                    <Link
                      href={getSortLink("date")}
                      className="flex items-center w-full"
                    >
                      Tgl Masuk {getSortIcon("date")}
                    </Link>
                  </th>
                  <th className="pb-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 cursor-pointer transition-colors">
                    <Link
                      href={getSortLink("target_hari")}
                      className="flex items-center w-full"
                    >
                      Target Waktu {getSortIcon("target_hari")}
                    </Link>
                  </th>
                  <th className="pb-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 cursor-pointer transition-colors">
                    <Link
                      href={getSortLink("estimasi_biaya")}
                      className="flex items-center w-full"
                    >
                      Estimasi Biaya {getSortIcon("estimasi_biaya")}
                    </Link>
                  </th>
                  <th className="pb-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {dockingData.length > 0 ? (
                  dockingData.map((data, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-none group"
                    >
                      <td className="py-4 px-2 text-sm text-gray-600 font-bold group-hover:text-[#2e004f]">
                        {data.id}
                      </td>
                      <td className="py-4 px-2 text-[15px] text-[#1a113c] font-semibold">
                        {data.name}
                      </td>
                      <td className="py-4 px-2 text-[15px] text-gray-700 font-medium">
                        {data.ship}
                      </td>
                      <td className="py-4 px-2 text-[15px] text-gray-700 font-medium">
                        {data.tempat}
                      </td>
                      <td className="py-4 px-2 text-[14px] text-gray-600 font-medium">
                        {data.type}
                      </td>
                      <td className="py-4 px-2 text-[14px] text-gray-500">
                        {formatDate(data.date)}
                      </td>
                      <td className="py-4 px-2 text-[14px] text-gray-600 font-medium">
                        {data.target_hari} Hari
                      </td>
                      <td className="py-4 px-2 text-[15px] text-[#2e004f] font-bold">
                        {formatRupiah(data.estimasi_biaya)}
                      </td>
                      <td className="py-4 px-2 flex justify-end gap-2">
                        <Link
                          href={`/ongoing/${data.rawId}/edit`}
                          className="inline-block text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-all"
                          title="Update Progress"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                          >
                            <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                          </svg>
                        </Link>
                        <Link
                          href={`/ongoing/${data.rawId}`}
                          className="inline-block text-gray-400 hover:text-[#2e004f] p-2 rounded-lg hover:bg-[#2e004f]/10 transition-all"
                          title="Lihat Detail"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                          >
                            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,109.66-48,48a8,8,0,0,1-11.32-11.32L156.69,128,114.34,85.66a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,173.66,133.66Z"></path>
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-10 text-center text-gray-500">
                      Tidak ada perbaikan yang sedang berjalan saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center p-6 border-t border-gray-100 mt-auto">
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
