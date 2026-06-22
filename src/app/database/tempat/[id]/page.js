import SideBar from "@/components/ui/sidebar";
import Link from "next/link";
import { getAllPerbaikan } from "@/services/perbaikan.service";
import { createClient } from "@/utils/supabase/server";
import { formatRupiah, formatDate } from "@/utils/formatters";
import TempatFilter from "./TempatFilter";
import EditTempatModal from "./EditTempatModal";

export default async function TempatDetailPage({ params, searchParams }) {
  const p = await params;
  const id = p.id;
  const sp = await searchParams;
  const selectedYear = sp?.year || "";
  const selectedKapal = sp?.kapal || "";
  const selectedStatus = sp?.status || "";

  const supabase = await createClient();

  const { data: tempat } = await supabase
    .from("tempat_perbaikan")
    .select("*")
    .eq("id_tempat", id)
    .single();

  if (!tempat) {
    return (
      <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Data lokasi tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const allPerbaikan = await getAllPerbaikan();
  const perbaikanTempat = allPerbaikan.filter(
    (item) => item.id_tempat === Number(id),
  );

  // Opsi filter
  const kapalOptions = [
    ...new Set(perbaikanTempat.map((item) => item.nama_kapal).filter(Boolean)),
  ];
  const statusOptions = [
    ...new Set(perbaikanTempat.map((item) => item.nama_status).filter(Boolean)),
  ];
  const availableYears = [
    ...new Set(
      perbaikanTempat
        .map((item) =>
          item.waktu_masuk ? new Date(item.waktu_masuk).getFullYear() : null,
        )
        .filter(Boolean),
    ),
  ].sort((a, b) => b - a);

  let filteredData = perbaikanTempat;
  if (selectedYear) {
    filteredData = filteredData.filter(
      (item) =>
        item.waktu_masuk &&
        new Date(item.waktu_masuk).getFullYear().toString() === selectedYear,
    );
  }
  if (selectedKapal) {
    filteredData = filteredData.filter(
      (item) => item.nama_kapal === selectedKapal,
    );
  }
  if (selectedStatus) {
    filteredData = filteredData.filter(
      (item) => item.nama_status === selectedStatus,
    );
  }

  // Statistik
  const jumlahDocking = filteredData.length;
  let totalBiaya = 0;
  let rataWaktu = 0;
  let rataBiaya = 0;

  if (jumlahDocking === 1) {
    rataWaktu =
      Number(filteredData[0].realisasi_waktu_hari) ||
      Number(filteredData[0].budget_time) ||
      0;
    totalBiaya = Number(filteredData[0].total_pembayaran) || 0;
    rataBiaya = totalBiaya;
  } else if (jumlahDocking > 1) {
    let sumHari = 0,
      countHari = 0,
      sumBiaya = 0,
      countBiaya = 0;

    filteredData.forEach((d) => {
      const biaya = Number(d.total_pembayaran) || 0;
      const hari = Number(d.realisasi_waktu_hari) || Number(d.budget_time) || 0;
      totalBiaya += biaya;

      if (hari > 0) {
        sumHari += hari;
        countHari++;
      }
      if (biaya > 0) {
        sumBiaya += biaya;
        countBiaya++;
      }
    });

    rataWaktu = countHari > 0 ? Math.round(sumHari / countHari) : 0;
    rataBiaya = countBiaya > 0 ? Math.round(sumBiaya / countBiaya) : 0;
  }

  return (
    <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
      <SideBar />
      <div className="main flex-1 p-6 md:p-10 flex flex-col gap-6 text-gray-800 h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/database"
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#2e004f] transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a113c]">
                {tempat.nama_tempat}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                ID Lokasi: {tempat.id_tempat}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <EditTempatModal tempat={tempat} />
            <Link
              href={`/database/tempat/${id}/print?year=${selectedYear}&kapal=${selectedKapal}&status=${selectedStatus}`}
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

        {/* Ringkasan Tempat */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-500 uppercase">
            Nama Galangan
          </p>
          <p className="text-xl font-bold text-[#1a113c]">
            {tempat.nama_tempat}
          </p>
        </div>

        {/* Tautan Company Profile (BARU) */}
        {tempat.url_company_profile && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">
              Company Profile
            </p>
            <a
              href={tempat.url_company_profile}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-100 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M200,64V168a8,8,0,0,1-16,0V83.31L72.68,194.34a8,8,0,0,1-11.31-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
              </svg>
              Buka Profil Perusahaan
            </a>
          </div>
        )}

        {/* Filter */}
        <TempatFilter
          availableYears={availableYears}
          kapalOptions={kapalOptions}
          statusOptions={statusOptions}
          selectedYear={selectedYear}
          selectedKapal={selectedKapal}
          selectedStatus={selectedStatus}
          id={id}
        />

        {/* Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M240,192h-8V98.67a16,16,0,0,0-7.12-13.31l-88-58.67a16,16,0,0,0-17.76,0l-88,58.67A16,16,0,0,0,24,98.67V192H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,98.67l88-58.67,88,58.67V192H40Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">
                Jumlah Docking
              </p>
              <p className="text-lg font-bold text-[#1a113c]">
                {jumlahDocking}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,166a38,38,0,1,0-38-38A38,38,0,0,0,128,166Zm0-64a26,26,0,1,1-26,26A26,26,0,0,1,128,102ZM240,58H16a6,6,0,0,0-6,6V192a6,6,0,0,0,6,6H240a6,6,0,0,0,6-6V64A6,6,0,0,0,240,58ZM22,108.82A54.73,54.73,0,0,0,60.82,70H195.18A54.73,54.73,0,0,0,234,108.82v38.36A54.73,54.73,0,0,0,195.18,186H60.82A54.73,54.73,0,0,0,22,147.18Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">
                Total Biaya
              </p>
              <p className="text-lg font-bold text-[#1a113c]">
                {formatRupiah(totalBiaya)}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">
                Rata-rata Waktu
              </p>
              <p className="text-lg font-bold text-[#1a113c]">
                {rataWaktu} Hari
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2e004f]/10 rounded-lg flex items-center justify-center text-[#2e004f]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,166a38,38,0,1,0-38-38A38,38,0,0,0,128,166Zm0-64a26,26,0,1,1-26,26A26,26,0,0,1,128,102ZM240,58H16a6,6,0,0,0-6,6V192a6,6,0,0,0,6,6H240a6,6,0,0,0,6-6V64A6,6,0,0,0,240,58ZM22,108.82A54.73,54.73,0,0,0,60.82,70H195.18A54.73,54.73,0,0,0,234,108.82v38.36A54.73,54.73,0,0,0,195.18,186H60.82A54.73,54.73,0,0,0,22,147.18Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">
                Rata-rata Biaya
              </p>
              <p className="text-lg font-bold text-[#1a113c]">
                {formatRupiah(rataBiaya)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Docking */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4">
            Riwayat Docking
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    ID Nota
                  </th>
                  <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Kapal
                  </th>
                  <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tgl Masuk
                  </th>
                  <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tgl Keluar
                  </th>
                  <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Total Bayar
                  </th>
                  <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr
                    key={item.id_perbaikan}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 text-sm font-bold text-gray-600">
                      DC-{item.id_perbaikan}
                    </td>
                    <td className="py-3 text-sm text-gray-700">
                      {item.nama_kapal || "-"}
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {formatDate(item.waktu_masuk)}
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {formatDate(item.waktu_keluar)}
                    </td>
                    <td className="py-3 text-sm text-gray-700">
                      {item.nama_status || "-"}
                    </td>
                    <td className="py-3 text-sm font-bold text-[#2e004f] text-right">
                      {formatRupiah(item.total_pembayaran)}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/list/${item.id_perbaikan}`}
                        className="inline-block p-2 text-gray-400 hover:text-[#2e004f] hover:bg-[#2e004f]/10 rounded-lg"
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
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Tidak ada riwayat docking yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
