import SideBar from "@/components/ui/sidebar";
import Link from "next/link";
import { getAllPerbaikan } from "@/services/perbaikan.service";
import { formatRupiah, formatDate } from "@/utils/formatters";
import DashboardFilter from "@/components/ui/DashboardFilter";

export default async function Dashboard({ searchParams }) {
  const sp = await searchParams;
  const selectedYear = sp?.year || "";
  const selectedMonth = sp?.month || "";

  const rawData = await getAllPerbaikan();

  const availableYears = [
    ...new Set(
      rawData
        .filter((item) => item.waktu_masuk)
        .map((item) => new Date(item.waktu_masuk).getFullYear()),
    ),
  ].sort((a, b) => b - a);

  let filteredRawData = rawData;

  if (selectedYear) {
    filteredRawData = filteredRawData.filter(
      (item) =>
        item.waktu_masuk &&
        new Date(item.waktu_masuk).getFullYear().toString() === selectedYear,
    );
  }

  if (selectedMonth) {
    filteredRawData = filteredRawData.filter(
      (item) =>
        item.waktu_masuk &&
        (new Date(item.waktu_masuk).getMonth() + 1).toString() ===
          selectedMonth,
    );
  }

  const dockingData = filteredRawData.map((item) => ({
    id: `DC-${item.id_perbaikan}`,
    name: item.daftar_superintendent || "-",
    ship: item.nama_kapal || "N/A",
    tempat: item.nama_tempat || "N/A",
    type: item.nama_cat || "General Docking",
    date: item.waktu_masuk,
    dateout: item.waktu_turun,
    biaya: Number(item.total_pembayaran) || 0,
    realisasi_hari: Number(item.realisasi_waktu_hari) || 0,
    rawId: item.id_perbaikan,
  }));

  const totalKapal = dockingData.length;
  const totalBiaya = dockingData.reduce((acc, curr) => acc + curr.biaya, 0);

  const validHariData = dockingData.filter((d) => d.realisasi_hari > 0);
  const rataHari =
    validHariData.length > 0
      ? Math.round(
          validHariData.reduce((acc, curr) => acc + curr.realisasi_hari, 0) /
            validHariData.length,
        )
      : 0;

  let chartData = [];

  if (!selectedYear) {
    const chartYears = [...availableYears].sort((a, b) => a - b);
    chartData = chartYears.map((year) => {
      const totalYear = dockingData.reduce((acc, curr) => {
        if (!curr.date) return acc;
        if (new Date(curr.date).getFullYear() === year) {
          return acc + curr.biaya;
        }
        return acc;
      }, 0);
      return { label: year.toString(), total: totalYear };
    });
  } else {
    const allMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ags",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const chartMonths = selectedMonth
      ? [allMonths[Number(selectedMonth) - 1]]
      : allMonths;

    chartData = chartMonths.map((monthLabel, idx) => {
      const monthIndex = selectedMonth ? Number(selectedMonth) - 1 : idx;
      const totalMonth = dockingData.reduce((acc, curr) => {
        if (!curr.date) return acc;
        if (new Date(curr.date).getMonth() === monthIndex) {
          return acc + curr.biaya;
        }
        return acc;
      }, 0);
      return { label: monthLabel, total: totalMonth };
    });
  }

  const maxVal = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
      <SideBar />

      <div className="main flex-1 p-10 flex flex-col gap-8 text-gray-800 h-screen overflow-y-auto">
        <div className="header flex w-full justify-between items-center">
          <div className="header-left gap-1 flex flex-col">
            <h1 className="title text-[32px] font-bold text-[#1a113c]">
              Dashboard
            </h1>
            <p className="subtitle text-[15px] font-medium text-gray-500">
              Metrik operasional docking kapal dan nilai kontrak real-time.
            </p>
          </div>

          <div className="header-right gap-3 flex items-center">
            <DashboardFilter availableYears={availableYears} />

            <button className="px-4 py-2.5 bg-[#2e004f] rounded-lg text-sm font-semibold shadow-sm text-white hover:bg-[#1a0035] transition-all">
              Export Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between relative overflow-hidden h-[340px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-bl-full -z-0 opacity-50 pointer-events-none"></div>

            <div className="z-10">
              <h2 className="uppercase font-bold text-xs tracking-wider text-gray-500 mb-2">
                Total Biaya Docking
              </h2>
              <span className="text-[40px] font-bold text-[#1a113c]">
                {formatRupiah(totalBiaya)}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2 h-32 w-full z-10 mt-auto border-b border-gray-100 pb-2">
              {chartData.map((data, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center w-full h-full justify-end group cursor-pointer relative"
                >
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a113c] text-white text-[10px] py-1.5 px-3 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                    {formatRupiah(data.total)}
                  </div>
                  <div
                    className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ${
                      data.total > 0
                        ? "bg-[#2e004f] group-hover:bg-[#430074]"
                        : "bg-[#e5e3ec]"
                    }`}
                    style={{
                      height:
                        data.total > 0
                          ? `${(data.total / maxVal) * 100}%`
                          : "5%",
                    }}
                  ></div>
                  <span
                    className={`text-[11px] font-bold mt-2 ${
                      data.total > 0 ? "text-[#2e004f]" : "text-gray-400"
                    }`}
                  >
                    {data.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-row justify-between items-center h-full">
              <div>
                <h2 className="uppercase font-bold text-[11px] tracking-wider text-gray-800 mb-1">
                  Kapal Didocking
                </h2>
                <div className="flex font-bold items-baseline gap-1">
                  <span className="text-[34px] text-[#1a113c]">
                    {totalKapal}
                  </span>
                  <span className="text-xl text-gray-500 font-medium">
                    {" "}
                    Unit
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-[#2e004f]/10 rounded-xl flex items-center justify-center text-[#2e004f]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M226.76,69a8,8,0,0,0-12.84-2.88l-40.3,37.19-17.23-3.7-3.7-17.23,37.19-40.3A8,8,0,0,0,187,29.24,72,72,0,0,0,88,96,72.34,72.34,0,0,0,94,124.94L33.79,177c-.15.12-.29.26-.43.39a32,32,0,0,0,45.26,45.26c.13-.13.27-.28.39-.42L131.06,162A72,72,0,0,0,232,96,71.56,71.56,0,0,0,226.76,69Z"></path>
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-row justify-between items-center h-full">
              <div>
                <h2 className="uppercase font-bold text-[11px] tracking-wider text-gray-800 mb-1">
                  Rata-rata Waktu
                </h2>
                <div className="flex font-bold items-baseline gap-2">
                  <span className="text-[34px] text-[#1a113c]">{rataHari}</span>
                  <span className="text-base text-gray-600 font-medium">
                    Hari
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[22px] font-bold text-[#1a113c]">
                Nota Docking Terbaru
              </h2>
              <Link
                href={`/list`}
                className="bg-[#2e004f] px-3 py-2 rounded-md text-white font-bold text-sm tracking-wide hover:underline flex items-center gap-1"
              >
                <h1>Lihat Semua</h1>
              </Link>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      ID Nota
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Kapal
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Tempat Docking
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Tipe Docking
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Tgl Masuk
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Tgl Keluar
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      Total Bayar
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dockingData.length > 0 ? (
                    dockingData.slice(0, 5).map((data, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 text-sm font-bold text-gray-600">
                          {data.id}
                        </td>
                        <td className="py-4 text-[15px] font-semibold text-[#1a113c]">
                          {data.name}
                        </td>
                        <td className="py-4 text-[15px] font-medium text-[#1a113c]">
                          {data.tempat}
                        </td>
                        <td className="py-4 text-[15px] font-medium text-gray-700">
                          {data.ship}
                        </td>
                        <td className="py-4 text-[15px] font-medium text-gray-600">
                          {data.type}
                        </td>
                        <td className="py-4 text-[14px] text-gray-500">
                          {formatDate(data.date)}
                        </td>
                        <td className="py-4 text-[14px] text-gray-500">
                          {formatDate(data.dateout)}
                        </td>
                        <td className="py-4 text-[15px] font-bold text-[#2e004f] text-right">
                          {formatRupiah(data.biaya)}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Link
                            href={`/list/${data.rawId}`}
                            className="inline-block text-gray-400 group-hover:text-[#2e004f] p-2 rounded-lg group-hover:bg-[#2e004f]/10 transition-all"
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
                      <td
                        colSpan="7"
                        className="py-8 text-center text-gray-500 font-medium"
                      >
                        Belum ada data docking pada periode yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
