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

  // 🔥 Urutkan dari ID terbesar ke terkecil untuk tabel
  dockingData.sort((a, b) => b.rawId - a.rawId);

  // Data ongoing (belum mulai operasi)
  const ongoingData = dockingData.filter(
    (item) => !filteredRawData.find((d) => d.id_perbaikan === item.rawId)?.waktu_mulai_operasi
  );

  // Statistik
  const totalKapal = ongoingData.length;
  const totalBiaya = dockingData.reduce((acc, curr) => acc + curr.biaya, 0);

  const validHariData = ongoingData.filter((d) => d.realisasi_hari > 0);
  const rataHari =
    validHariData.length > 0
      ? Math.round(
        validHariData.reduce((acc, curr) => acc + curr.realisasi_hari, 0) /
        validHariData.length,
      )
      : 0;

  const biayaOngoing = ongoingData.map((d) => d.biaya).filter((b) => b > 0);
  const rataBiaya =
    biayaOngoing.length > 0
      ? Math.round(biayaOngoing.reduce((a, b) => a + b, 0) / biayaOngoing.length)
      : 0;

  // Data grafik
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
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
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

      <div className="main flex-1 p-6 md:p-10 flex flex-col gap-6 text-gray-800 h-screen overflow-y-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-[#1a113c]">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Metrik operasional docking kapal dan nilai kontrak real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DashboardFilter availableYears={availableYears} />
            <Link
              href={`/dashboard/print?year=${selectedYear}&month=${selectedMonth}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm text-[#2e004f] hover:bg-gray-50 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M200,32H163.74a47.92,47.92,0,0,0-71.48,0H56A16,16,0,0,0,40,48V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm-72,0a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm72,184H56V48H80V64a8,8,0,0,0,8,8h80a8,8,0,0,0,8-8V48h24Z" /></svg>
              Cetak
            </Link>
          </div>
        </div>

        {/* STATISTIK & GRAFIK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grafik Total Biaya */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden h-[340px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-bl-full -z-0 opacity-50 pointer-events-none" />
            <div className="z-10">
              <h2 className="uppercase font-bold text-xs tracking-wider text-gray-500 mb-2">
                Total Biaya Docking
              </h2>
              <span className="text-4xl font-bold text-[#1a113c]">
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
                    className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ${data.total > 0
                        ? "bg-[#2e004f] group-hover:bg-[#430074]"
                        : "bg-[#e5e3ec]"
                      }`}
                    style={{
                      height:
                        data.total > 0
                          ? `${(data.total / maxVal) * 100}%`
                          : "5%",
                    }}
                  />
                  <span
                    className={`text-[11px] font-bold mt-2 ${data.total > 0 ? "text-[#2e004f]" : "text-gray-400"
                      }`}
                  >
                    {data.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kartu Statistik */}
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M240,192h-8V98.67a16,16,0,0,0-7.12-13.31l-88-58.67a16,16,0,0,0-17.76,0l-88,58.67A16,16,0,0,0,24,98.67V192H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,98.67l88-58.67,88,58.67V192H40Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Kapal Didocking
                </p>
                <h3 className="text-2xl font-bold text-[#1a113c]">
                  {totalKapal} <span className="text-sm text-gray-500 font-medium">Unit</span>
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Rata-rata Waktu
                </p>
                <h3 className="text-2xl font-bold text-[#1a113c]">
                  {rataHari} <span className="text-sm text-gray-500 font-medium">Hari</span>
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-[#2e004f]/10 rounded-xl flex items-center justify-center text-[#2e004f]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M128,166a38,38,0,1,0-38-38A38,38,0,0,0,128,166Zm0-64a26,26,0,1,1-26,26A26,26,0,0,1,128,102ZM240,58H16a6,6,0,0,0-6,6V192a6,6,0,0,0,6,6H240a6,6,0,0,0,6-6V64A6,6,0,0,0,240,58ZM22,108.82A54.73,54.73,0,0,0,60.82,70H195.18A54.73,54.73,0,0,0,234,108.82v38.36A54.73,54.73,0,0,0,195.18,186H60.82A54.73,54.73,0,0,0,22,147.18Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Rata-rata Biaya
                </p>
                <h3 className="text-xl font-bold text-[#1a113c]">
                  {formatRupiah(rataBiaya)}
                </h3>
              </div>
            </div>
          </div>

          {/* TABEL NOTA TERBARU */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1a113c]">
                Nota Docking Terbaru
              </h2>
              <Link
                href="/list"
                className="px-4 py-2 bg-[#2e004f] text-white rounded-lg text-sm font-semibold hover:bg-[#1a0035] transition-all"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ID Nota</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Penanggung Jawab</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Kapal</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Lokasi Docking</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipe Docking</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tgl Masuk</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tgl Keluar</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Bayar</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {dockingData.length > 0 ? (
                    dockingData.slice(0, 5).map((data, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 text-sm font-bold text-gray-600">{data.id}</td>
                        <td className="py-3 text-sm font-semibold text-[#1a113c]">{data.name}</td>
                        <td className="py-3 text-sm font-medium text-gray-700">{data.ship}</td>
                        <td className="py-3 text-sm text-gray-700">{data.tempat}</td>
                        <td className="py-3 text-sm text-gray-600">{data.type}</td>
                        <td className="py-3 text-sm text-gray-500">{formatDate(data.date)}</td>
                        <td className="py-3 text-sm text-gray-500">{formatDate(data.dateout)}</td>
                        <td className="py-3 text-sm font-bold text-[#2e004f] text-right">{formatRupiah(data.biaya)}</td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/list/${data.rawId}`}
                            className="inline-block p-2 text-gray-400 hover:text-[#2e004f] hover:bg-[#2e004f]/10 rounded-lg transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,109.66-48,48a8,8,0,0,1-11.32-11.32L156.69,128,114.34,85.66a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,173.66,133.66Z" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
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