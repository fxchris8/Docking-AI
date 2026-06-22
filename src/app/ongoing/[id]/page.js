import SideBar from "@/components/ui/sidebar";
import Link from "next/link";
import { getPerbaikanById } from "@/services/perbaikan.service";
import { formatRupiah, formatDate } from "@/utils/formatters";
import LampiranViewer from "@/components/ui/LampiranViewer";

/* ---------- helpers ---------- */
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const hasValue = (val) => val !== null && val !== undefined && Number(val) > 0;

export default async function DetailOngoingDocking({ params }) {
  const p = await params;
  const id = p.id;
  const detailData = await getPerbaikanById(id);

  if (!detailData) {
    return (
      <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
        <SideBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1a113c]">
            Data Tidak Ditemukan
          </h2>
          <p className="text-gray-500">
            Arsip nota docking tidak ditemukan di database.
          </p>
          <Link
            href="/ongoing"
            className="mt-4 px-6 py-2 bg-[#2e004f] text-white rounded-lg font-medium hover:bg-[#1a0035] transition-all"
          >
            Kembali ke Ongoing
          </Link>
        </div>
      </div>
    );
  }

  const penanggungJawab = detailData.superintendents?.length
    ? detailData.superintendents
        .map((s) => `${s.nama_superintendent} (${s.jabatan || "-"})`)
        .join(", ")
    : "Belum Ditugaskan";

  const isSMI = detailData.nama_tempat?.includes("SMI");
  const isDPL = detailData.nama_tempat?.includes("DPL");
  const isUmum = !isSMI && !isDPL;

  const lampiran = Array.isArray(detailData.lampiran_dokumen)
    ? detailData.lampiran_dokumen
    : [];

  // Data harga + tanggal + URL lampiran
  const hargaItems = [
    {
      label: "Harga Penawaran",
      value: detailData.harga_penawaran,
      tgl: detailData.tanggal_penawaran,
      url: detailData.url_harga_penawaran,
    },
    {
      label: "Harga Kontrak",
      value: detailData.harga_kontrak,
      tgl: detailData.tanggal_kontrak,
      url: detailData.url_harga_kontrak,
    },
    {
      label: "Harga Rekalbea",
      value: detailData.harga_rekalbea,
      tgl: detailData.tanggal_rekalbea,
      url: detailData.url_harga_rekalbea,
    },
    {
      label: "Harga Confirm",
      value: detailData.harga_confirm,
      tgl: detailData.tanggal_confirm,
      url: detailData.url_harga_confirm,
      isFinal: true,
    },
  ];

  const adaPembayaran =
    isSMI || isDPL
      ? !!detailData.tanggal_bayar_1
      : [1, 2, 3, 4].some((num) =>
          hasValue(detailData[`nominal_bayar_${num}`]),
        );

  const totalTerbayar = [1, 2, 3, 4].reduce(
    (sum, num) => sum + (Number(detailData[`nominal_bayar_${num}`]) || 0),
    0,
  );

  const timelineSteps = [
    { label: "Off Operasi", date: detailData.waktu_off_operasi, detail: null },
    {
      label: "Masuk Dok",
      date: detailData.waktu_masuk,
      detail: detailData.waktu_masuk_detail,
    },
    { label: "Naik / Turun", date: null, detail: null, custom: true },
    {
      label: "Keluar Dok",
      date: detailData.waktu_keluar,
      detail: detailData.waktu_keluar_detail,
    },
    {
      label: "Mulai Operasi",
      date: detailData.waktu_mulai_operasi,
      detail: detailData.waktu_mulai_detail,
      isFinal: true,
    },
  ];

  // Tambahan: nilai default untuk status_perbaikan & status_pembayaran (fallback)
  const statusPerbaikan = detailData.status_perbaikan || "ongoing";
  const statusPembayaran = detailData.status_pembayaran || "belum lunas";

  return (
    <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
      <SideBar />
      <div className="main flex-1 p-6 md:p-10 flex flex-col gap-6 text-gray-800 h-screen overflow-y-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/ongoing"
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#2e004f] transition-all"
              title="Kembali ke Ongoing"
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
                Rincian Nota #DC-{detailData.id_perbaikan}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Arsip lengkap detail operasional docking dan pembayaran.
              </p>
            </div>
          </div>
          <div className="flex gap-3 ml-0 sm:ml-auto">
            <Link
              href={`/ongoing/${detailData.id_perbaikan}/edit`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm font-bold shadow-sm text-blue-600 hover:bg-blue-100 transition-all"
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
              Update Progress
            </Link>
            <Link
              href={`/ongoing/${detailData.id_perbaikan}/print`}
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
              Cetak PDF
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* KOLOM KIRI */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Informasi Pekerjaan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="text-[#2e004f]"
                >
                  <path d="M216,48H40a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V56A8,8,0,0,0,216,48ZM208,192H48V64H208V192ZM128,96a8,8,0,0,1,8,8v8h8a8,8,0,0,1,0,16h-8v8a8,8,0,0,1-16,0v-8h-8a8,8,0,0,1,0-16h8v-8A8,8,0,0,1,128,96Z" />
                </svg>
                Informasi Pekerjaan
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Penanggung Jawab
                  </p>
                  <p className="text-sm font-semibold text-[#1a113c]">
                    {penanggungJawab}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Kapal
                  </p>
                  <p className="text-sm font-semibold text-[#2e004f]">
                    {detailData.nama_kapal || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Lokasi Dok
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    {detailData.nama_tempat || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Kategori Cat
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    {detailData.nama_cat || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Status
                  </p>
                  <p className="text-sm font-semibold text-[#1a113c]">
                    {detailData.nama_status || "-"}
                  </p>
                  {detailData.status_detail && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      {detailData.status_detail}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Target Waktu
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    {detailData.budget_time
                      ? `${detailData.budget_time} Hari`
                      : "-"}
                  </p>
                </div>

                {/* ---------- DUA STATUS BARU ---------- */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Status Perbaikan
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      statusPerbaikan === "selesai"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {statusPerbaikan === "selesai" ? "Selesai" : "Ongoing"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Status Pembayaran
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      statusPembayaran === "lunas"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {statusPembayaran === "lunas" ? "Lunas" : "Belum Lunas"}
                  </span>
                </div>
                {/* ---------- AKHIR STATUS BARU ---------- */}
              </div>
            </div>

            {/* Timeline (tidak berubah) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              {/* ... kode timeline sama seperti sebelumnya ... */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-[#1a113c] flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="text-[#2e004f]"
                  >
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
                  </svg>
                  Timeline & Jadwal Pengerjaan
                </h2>
                <div className="px-3 py-1.5 bg-[#e5e3ec] text-[#2e004f] rounded-lg text-xs font-bold">
                  Realisasi: {detailData.realisasi_waktu_hari || 0} Hari
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
                <div className="hidden md:block absolute top-4 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-10" />
                {timelineSteps.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center relative z-10"
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center mb-3 ${
                        item.isFinal
                          ? "bg-green-100 text-green-600"
                          : item.date
                            ? "bg-[#e5e3ec] text-[#2e004f]"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {item.isFinal ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 256 256"
                        >
                          <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      {item.label}
                    </p>
                    {item.custom ? (
                      <div className="text-[12px] font-medium text-gray-600 mt-1 space-y-1">
                        <p>Naik: {formatDateTime(detailData.waktu_naik)}</p>
                        {detailData.waktu_naik_detail && (
                          <p className="text-[11px] italic">
                            `{detailData.waktu_naik_detail}`
                          </p>
                        )}
                        <p>Turun: {formatDateTime(detailData.waktu_turun)}</p>
                        {detailData.waktu_turun_detail && (
                          <p className="text-[11px] italic">
                            `{detailData.waktu_turun_detail}`
                          </p>
                        )}
                      </div>
                    ) : (
                      <p
                        className={`text-[13px] font-semibold mt-1 ${item.date ? "text-[#1a113c]" : "text-gray-400"}`}
                      >
                        {item.date ? formatDate(item.date) : "-"}
                      </p>
                    )}
                    {item.detail && (
                      <p className="text-[11px] text-gray-500 mt-1 italic">
                        `{item.detail}`
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan & Keterangan (tidak berubah) */}
            {(detailData.keterangan || detailData.status_detail) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4">
                  Catatan & Keterangan
                </h2>
                {detailData.keterangan && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Keterangan Umum
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {detailData.keterangan}
                    </p>
                  </div>
                )}
                {detailData.status_detail && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Detail Status
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {detailData.status_detail}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Spesifikasi Kapal (tidak berubah) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="text-[#2e004f]"
                >
                  <path
                    d="M240,112c-8,64-88,120-112,128C104,232,24,176,16,112,8,48,56,16,128,16S248,48,240,112Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="16"
                  />
                  <line
                    x1="128"
                    y1="16"
                    x2="128"
                    y2="128"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="16"
                  />
                  <line
                    x1="128"
                    y1="128"
                    x2="240"
                    y2="112"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="16"
                  />
                </svg>
                Spesifikasi Dimensi Kapal
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {["flat_bottom", "vertical_side", "bottop", "topside"].map(
                  (key, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 p-5 rounded-xl text-center hover:shadow-md transition-shadow"
                    >
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                        {key.replace("_", " ")}
                      </p>
                      <p className="text-xl font-bold text-[#1a113c]">
                        {detailData[key] || 0}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Lampiran (tidak berubah) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <LampiranViewer urls={lampiran} />
            </div>
          </div>

          {/* KOLOM KANAN (Biaya, Pembayaran - tidak berubah dari aslinya, tetap sama) */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            {/* Biaya & Kontrak */}
            <div className="bg-[#2e004f] rounded-2xl shadow-md p-6 md:p-8 text-white relative overflow-hidden">
              {/* ... sama seperti sebelumnya ... */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none" />
              <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-6 border-b border-white/20 pb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="text-white/80"
                >
                  <path d="M128,166a38,38,0,1,0-38-38A38,38,0,0,0,128,166Zm0-64a26,26,0,1,1-26,26A26,26,0,0,1,128,102ZM240,58H16a6,6,0,0,0-6,6V192a6,6,0,0,0,6,6H240a6,6,0,0,0,6-6V64A6,6,0,0,0,240,58ZM22,108.82A54.73,54.73,0,0,0,60.82,70H195.18A54.73,54.73,0,0,0,234,108.82v38.36A54.73,54.73,0,0,0,195.18,186H60.82A54.73,54.73,0,0,0,22,147.18Z" />
                </svg>
                Biaya & Kontrak
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/80">Budget Cost</span>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold">
                      {formatRupiah(detailData.budget_cost)}
                    </span>
                    {detailData.url_budget_cost && (
                      <a
                        href={detailData.url_budget_cost}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-300 underline mt-1"
                      >
                        Lampiran
                      </a>
                    )}
                  </div>
                </div>
                {hargaItems.map((item, i) => (
                  <div key={i} className="border-t border-white/10 pt-3">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs ${item.isFinal ? "text-white font-semibold uppercase" : "text-white/80"}`}
                      >
                        {item.label}
                      </span>
                      <span
                        className={`text-sm ${item.isFinal ? "font-bold" : "font-semibold"}`}
                      >
                        {formatRupiah(item.value)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-white/50">
                        {item.tgl ? formatDate(item.tgl) : "-"}
                      </p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-300 underline ml-2"
                        >
                          Lampiran
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/20 pt-4 mt-2">
                  <p className="text-xs text-white/70 uppercase tracking-wider mb-1">
                    Total Pembayaran
                  </p>
                  <p className="text-2xl font-bold">
                    {formatRupiah(totalTerbayar)}
                  </p>
                  <p className="text-[10px] text-white/50 mt-1">
                    Tgl Pelunasan:{" "}
                    {formatDate(
                      detailData.tanggal_bayar_4 ||
                        detailData.tanggal_bayar_3 ||
                        detailData.tanggal_bayar_2 ||
                        detailData.tanggal_bayar_1,
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Detail Pembayaran (tidak berubah) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              {/* ... sama seperti sebelumnya ... */}
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-lg font-bold text-[#1a113c]">
                  Detail Pembayaran
                </h2>
              </div>
              {!adaPembayaran ? (
                <div className="py-10 flex flex-col items-center justify-center text-center text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="mb-4 opacity-40"
                  >
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z" />
                  </svg>
                  <p className="text-sm font-medium">
                    Belum ada data pembayaran.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* SMI */}
                  {isSMI && (
                    <>
                      {hasValue(detailData.biaya_jasa) && (
                        <div className="mb-2">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                            Biaya Jasa
                          </p>
                          <p className="text-sm font-semibold">
                            {formatRupiah(detailData.biaya_jasa)}
                          </p>
                        </div>
                      )}
                      {detailData.tanggal_bayar_1 && (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-gray-700">
                              Total Bayar 1
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(detailData.tanggal_bayar_1)}
                            </p>
                          </div>
                          <span className="text-[15px] font-semibold text-[#1a113c]">
                            {formatRupiah(detailData.nominal_bayar_1)}
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] flex flex-col gap-2 pl-5">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-gray-600">Pot. PPH</p>
                          <div className="font-semibold flex flex-col items-end text-gray-600">
                            <p className="font-normal text-gray-400">
                              2% x Biaya Jasa
                            </p>
                            <p>
                              {formatRupiah(detailData.harga_confirm)} -{" "}
                              {formatRupiah(detailData.nominal_bayar_1_bkm)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {detailData.url_pembayaran_1 && (
                        <div className="pl-5 mt-1">
                          <a
                            href={detailData.url_pembayaran_1}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 underline"
                          >
                            Lampiran Bayar 1
                          </a>
                        </div>
                      )}
                    </>
                  )}

                  {/* DPL */}
                  {isDPL && (
                    <>
                      {detailData.tanggal_bayar_1 && (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-gray-700">
                                Total Bayar 1
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(detailData.tanggal_bayar_1)}
                              </p>
                            </div>
                            <span className="text-[15px] font-semibold text-[#1a113c]">
                              {formatRupiah(detailData.nominal_bayar_1)}
                            </span>
                          </div>
                          <div className="text-[10px] flex flex-col gap-2 pl-5">
                            <div className="flex justify-between items-center">
                              <p className="font-bold text-gray-600">BKK</p>
                              <div className="flex flex-col items-end">
                                <p className="font-normal text-gray-400">
                                  50% x Harga Kontrak
                                </p>
                                <span className="font-semibold text-gray-600">
                                  {formatRupiah(detailData.nominal_bayar_1_bkk)}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="font-bold text-gray-600">BKM</p>
                              <div className="font-semibold flex flex-col items-end text-gray-600">
                                <p className="font-normal text-gray-400">
                                  2% x 30% x BKK
                                </p>
                                <p>
                                  -{" "}
                                  {formatRupiah(detailData.nominal_bayar_1_bkm)}
                                </p>
                              </div>
                            </div>
                          </div>
                          {detailData.url_pembayaran_1 && (
                            <div className="pl-5 mt-1">
                              <a
                                href={detailData.url_pembayaran_1}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 underline"
                              >
                                Lampiran Bayar 1
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {(hasValue(detailData.nominal_bayar_2) ||
                        detailData.tanggal_bayar_2) && (
                        <>
                          <div className="w-full h-[1px] bg-gray-200"></div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-gray-700">
                                Bayar 2
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(detailData.tanggal_bayar_2)}
                              </p>
                            </div>
                            <span className="text-[15px] font-semibold text-[#1a113c]">
                              {formatRupiah(detailData.nominal_bayar_2)}
                            </span>
                          </div>
                          {detailData.url_pembayaran_2 && (
                            <div className="pl-5 mt-1">
                              <a
                                href={detailData.url_pembayaran_2}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 underline"
                              >
                                Lampiran Bayar 2
                              </a>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Umum */}
                  {isUmum && (
                    <div className="flex flex-col gap-4">
                      {[1, 2, 3, 4].map((num) => {
                        const nominal = detailData[`nominal_bayar_${num}`];
                        const tanggal = detailData[`tanggal_bayar_${num}`];
                        const deskripsi = detailData[`deskripsi_bayar_${num}`];
                        const url = detailData[`url_pembayaran_${num}`];
                        if (!hasValue(nominal) && !tanggal && !deskripsi)
                          return null;
                        return (
                          <div key={num}>
                            {num > 1 && (
                              <div className="w-full h-[1px] bg-gray-100 mb-4" />
                            )}
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col w-2/3">
                                <p className="text-sm font-bold text-gray-700">
                                  Pembayaran {num}
                                </p>
                                <p className="text-xs text-gray-400 mb-1">
                                  {formatDate(tanggal)}
                                </p>
                                {deskripsi && (
                                  <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-md border border-gray-100">
                                    {deskripsi}
                                  </p>
                                )}
                                {url && (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-600 underline mt-1"
                                  >
                                    Lampiran Bayar {num}
                                  </a>
                                )}
                              </div>
                              <span className="text-[15px] font-semibold text-[#1a113c]">
                                {formatRupiah(nominal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                    <p className="text-sm font-bold text-[#1a113c] uppercase tracking-wide">
                      Total Terbayar
                    </p>
                    <span className="text-xl font-bold text-green-600">
                      {formatRupiah(totalTerbayar)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
