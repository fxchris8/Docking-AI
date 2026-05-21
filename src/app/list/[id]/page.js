import SideBar from "@/components/ui/sidebar";
import Link from "next/link";
import { getPerbaikanById } from "@/services/perbaikan.service";
import { formatRupiah, formatDate } from "@/utils/formatters";

export default async function DetailDocking({ params }) {
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
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1a113c]">
            Data Tidak Ditemukan
          </h2>
          <p className="text-gray-500">
            Arsip nota docking tidak ditemukan di database.
          </p>
          <Link
            href="/list"
            className="mt-4 px-6 py-2 bg-[#2e004f] text-white rounded-lg font-medium hover:bg-[#1a0035] transition-all"
          >
            Kembali ke Daftar
          </Link>
        </div>
      </div>
    );
  }

  const penanggungJawab =
    detailData.superintendents && detailData.superintendents.length > 0
      ? detailData.superintendents
          .map((s) => `${s.nama_superintendent} (${s.jabatan || "-"})`)
          .join(", ")
      : "Belum Ditugaskan";

  const isSMI = detailData.nama_tempat?.includes("SMI");
  const isDPL = detailData.nama_tempat?.includes("DPL");
  const isLainnya = !isSMI && !isDPL;

  return (
    <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
      <SideBar />

      <div className="main flex-1 p-10 flex flex-col gap-6 text-gray-800 h-screen overflow-y-auto">
        <div className="header flex w-full justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <Link
              href="/list"
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#2e004f] transition-all"
              title="Kembali"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </Link>
            <div className="flex flex-col">
              <h1 className="title text-[28px] font-bold text-[#1a113c]">
                Rincian Nota #DC-{detailData.id_perbaikan}
              </h1>
              <p className="text-sm font-medium text-gray-500">
                Arsip lengkap detail operasional docking dan pembayaran.
              </p>
            </div>
          </div>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm text-[#2e004f] hover:bg-gray-50 transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M200,32H163.74a47.92,47.92,0,0,0-71.48,0H56A16,16,0,0,0,40,48V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm-72,0a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm72,184H56V48H80V64a8,8,0,0,0,8,8h80a8,8,0,0,0,8-8V48h24Z"></path>
            </svg>
            Cetak PDF
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4">
                Informasi Pekerjaan
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Penanggung Jawab
                  </p>
                  <p className="text-[15px] font-semibold text-[#1a113c]">
                    {penanggungJawab}
                  </p>
                </div>
                <div className="md:col-span-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Nama Kapal
                  </p>
                  <p className="text-[15px] font-semibold text-[#2e004f]">
                    {detailData.nama_kapal || "N/A"}
                  </p>
                </div>
                <div className="md:col-span-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Lokasi Dok
                  </p>
                  <p className="text-[15px] font-medium text-gray-700">
                    {detailData.nama_tempat || "-"}
                  </p>
                </div>
                <div className="md:col-span-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Target Waktu
                  </p>
                  <p className="text-[15px] font-medium text-gray-700">
                    {detailData.budget_time
                      ? `${detailData.budget_time} Hari`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-[#1a113c]">
                  Timeline & Jadwal Pengerjaan
                </h2>
                <div className="px-3 py-1.5 bg-[#e5e3ec] text-[#2e004f] rounded-lg text-xs font-bold">
                  Realisasi: {detailData.realisasi_waktu_hari || 0} Hari
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
                <div className="hidden md:block absolute top-4 left-[10%] right-[10%] h-0.5 bg-gray-100 -z-10"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#f3f2f7] border-2 border-white shadow-sm flex items-center justify-center text-gray-500 mb-3">
                    1
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Off Operasi
                  </p>
                  <p className="text-[13px] font-medium text-[#1a113c] mt-1">
                    {formatDate(detailData.waktu_off_operasi)}
                  </p>
                </div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#e5e3ec] border-2 border-white shadow-sm flex items-center justify-center text-[#2e004f] mb-3">
                    2
                  </div>
                  <p className="text-[11px] font-bold text-[#2e004f] uppercase tracking-wide">
                    Waktu Masuk
                  </p>
                  <p className="text-[13px] font-semibold text-[#1a113c] mt-1">
                    {formatDate(detailData.waktu_masuk)}
                  </p>
                </div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#e5e3ec] border-2 border-white shadow-sm flex items-center justify-center text-[#2e004f] mb-3">
                    3
                  </div>
                  <p className="text-[11px] font-bold text-[#2e004f] uppercase tracking-wide">
                    Naik / Turun
                  </p>
                  <p className="text-[12px] font-medium text-gray-600 mt-1">
                    Naik: {formatDate(detailData.waktu_naik)} <br />
                    Turun: {formatDate(detailData.waktu_turun)}
                  </p>
                </div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#e5e3ec] border-2 border-white shadow-sm flex items-center justify-center text-[#2e004f] mb-3">
                    4
                  </div>
                  <p className="text-[11px] font-bold text-[#2e004f] uppercase tracking-wide">
                    Waktu Keluar
                  </p>
                  <p className="text-[13px] font-semibold text-[#1a113c] mt-1">
                    {formatDate(detailData.waktu_keluar)}
                  </p>
                </div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white shadow-sm flex items-center justify-center text-green-600 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
                    </svg>
                  </div>
                  <p className="text-[11px] font-bold text-green-700 uppercase tracking-wide">
                    Mulai Operasi
                  </p>
                  <p className="text-[13px] font-bold text-green-700 mt-1">
                    {formatDate(detailData.waktu_mulai_operasi)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4">
                Spesifikasi Dimensi Kapal
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Flat Bottom
                  </p>
                  <p className="text-xl font-bold text-[#1a113c]">
                    {detailData.flat_bottom || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Vertical Side
                  </p>
                  <p className="text-xl font-bold text-[#1a113c]">
                    {detailData.vertical_side || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Bottop
                  </p>
                  <p className="text-xl font-bold text-[#1a113c]">
                    {detailData.bottop || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Topside
                  </p>
                  <p className="text-xl font-bold text-[#1a113c]">
                    {detailData.topside || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1 flex flex-col gap-6">
            <div className="bg-[#2e004f] rounded-2xl shadow-md p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>

              <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2">
                Total Pembayaran
              </h2>
              <h1 className="text-[36px] font-bold mb-6">
                {formatRupiah(detailData.total_pembayaran)}
              </h1>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-sm text-white/80">Tgl Pelunasan</span>
                  <span className="text-sm font-semibold">
                    {formatDate(
                      detailData.tanggal_bayar_4 ||
                        detailData.tanggal_bayar_3 ||
                        detailData.tanggal_bayar_2 ||
                        detailData.tanggal_bayar_1_bkm,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-sm text-white/80">
                    Budget Cost Awal
                  </span>
                  <span className="text-sm font-semibold">
                    {formatRupiah(detailData.budget_cost)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-sm text-white/80">Harga Penawaran</span>
                  <span className="text-sm font-semibold">
                    {formatRupiah(detailData.harga_penawaran)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-sm text-white/80">Harga Kontrak</span>
                  <span className="text-sm font-semibold">
                    {formatRupiah(detailData.harga_kontrak)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-sm text-white/80">Harga Rekalbea</span>
                  <span className="text-sm font-semibold">
                    {formatRupiah(detailData.harga_rekalbea)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg text-white font-semibold">
                    Harga Confirm
                  </span>
                  <span className="text-lg text-white font-semibold">
                    {formatRupiah(detailData.harga_confirm)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-lg font-bold text-[#1a113c]">
                  Detail Pembayaran
                </h2>
              </div>

              {detailData.total_pembayaran ? (
                <div className="flex flex-col gap-5">
                  {isSMI && (
                    <div className="bayar-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-700">
                            Total Bayar 1
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(detailData.tanggal_bayar_1_bkm)}
                          </p>
                        </div>
                        <span className="text-[15px] font-semibold text-[#1a113c]">
                          {formatRupiah(
                            Number(detailData.nominal_bayar_1_bkk) -
                              Number(detailData.nominal_bayar_1_bkm),
                          )}
                        </span>
                      </div>
                      <div className="detail-bayar-1 flex text-[10px] flex-col gap-2 pl-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-600">
                              Bayar (BKK)
                            </p>
                            <p className="text-gray-400">
                              {formatDate(detailData.tanggal_bayar_1_bkk)}
                            </p>
                          </div>
                          <span className="font-semibold text-gray-600">
                            {formatRupiah(detailData.nominal_bayar_1_bkk)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-600">
                              Bayar (BKM)
                            </p>
                            <p className="text-gray-400">
                              {formatDate(detailData.tanggal_bayar_1_bkm)}
                            </p>
                          </div>
                          <div className="font-semibold flex flex-col items-end text-gray-600">
                            <p className="font-normal text-gray-400">
                              2% x {formatRupiah(detailData.biaya_jasa)}
                            </p>
                            <p>
                              - {formatRupiah(detailData.nominal_bayar_1_bkm)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isDPL && (
                    <>
                      <div className="bayar-1 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-gray-700">
                              Total Bayar 1
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(detailData.tanggal_bayar_1_bkm)}
                            </p>
                          </div>
                          <span className="text-[15px] font-semibold text-[#1a113c]">
                            {formatRupiah(
                              Number(detailData.nominal_bayar_1_bkk) -
                                Number(detailData.nominal_bayar_1_bkm),
                            )}
                          </span>
                        </div>
                        <div className="detail-bayar-1 flex text-[10px] flex-col gap-2 pl-5">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-600">
                                Bayar 1 (BKK)
                              </p>
                              <p className="text-gray-400">
                                {formatDate(detailData.tanggal_bayar_1_bkk)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="font-normal text-gray-400">
                                50% x {formatRupiah(detailData.harga_kontrak)}
                              </p>
                              <span className="font-semibold text-gray-600">
                                {formatRupiah(detailData.nominal_bayar_1_bkk)}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-600">
                                Bayar 1 (BKM)
                              </p>
                              <p className="text-gray-400">
                                {formatDate(detailData.tanggal_bayar_1_bkm)}
                              </p>
                            </div>
                            <div className="font-semibold flex flex-col items-end text-gray-600">
                              <p className="font-normal text-gray-400">
                                2% x 30% x{" "}
                                {formatRupiah(detailData.harga_kontrak * 0.5)}
                              </p>
                              <p>
                                - {formatRupiah(detailData.nominal_bayar_1_bkm)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
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
                    </>
                  )}

                  {isLainnya && (
                    <div className="flex flex-col gap-4">
                      {detailData.nominal_bayar_1_bkm !== null && (
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col w-2/3">
                            <p className="text-sm font-bold text-gray-700">
                              Bayar 1
                            </p>
                            <p className="text-xs text-gray-400 mb-1">
                              {formatDate(detailData.tanggal_bayar_1_bkm)}
                            </p>
                            {detailData.deskripsi_1 && (
                              <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-md border border-gray-100">
                                {detailData.deskripsi_1}
                              </p>
                            )}
                          </div>
                          <span className="text-[15px] font-semibold text-[#1a113c]">
                            {formatRupiah(detailData.nominal_bayar_1_bkm)}
                          </span>
                        </div>
                      )}

                      {detailData.nominal_bayar_2 !== null && (
                        <>
                          <div className="w-full h-[1px] bg-gray-100"></div>
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col w-2/3">
                              <p className="text-sm font-bold text-gray-700">
                                Bayar 2
                              </p>
                              <p className="text-xs text-gray-400 mb-1">
                                {formatDate(detailData.tanggal_bayar_2)}
                              </p>
                              {detailData.deskripsi_2 && (
                                <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-md border border-gray-100">
                                  {detailData.deskripsi_2}
                                </p>
                              )}
                            </div>
                            <span className="text-[15px] font-semibold text-[#1a113c]">
                              {formatRupiah(detailData.nominal_bayar_2)}
                            </span>
                          </div>
                        </>
                      )}

                      {detailData.nominal_bayar_3 !== null && (
                        <>
                          <div className="w-full h-[1px] bg-gray-100"></div>
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col w-2/3">
                              <p className="text-sm font-bold text-gray-700">
                                Bayar 3
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(detailData.tanggal_bayar_3)}
                              </p>
                            </div>
                            <span className="text-[15px] font-semibold text-[#1a113c]">
                              {formatRupiah(detailData.nominal_bayar_3)}
                            </span>
                          </div>
                        </>
                      )}

                      {detailData.nominal_bayar_4 !== null && (
                        <>
                          <div className="w-full h-[1px] bg-gray-100"></div>
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col w-2/3">
                              <p className="text-sm font-bold text-gray-700">
                                Bayar 4
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(detailData.tanggal_bayar_4)}
                              </p>
                            </div>
                            <span className="text-[15px] font-semibold text-[#1a113c]">
                              {formatRupiah(detailData.nominal_bayar_4)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* TOTAL AKHIR UNTUK SEMUA MODE */}
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                    <p className="text-sm font-bold text-[#1a113c] uppercase tracking-wide">
                      Total Terbayar
                    </p>
                    <span className="text-xl font-bold text-green-600">
                      {formatRupiah(detailData.total_pembayaran)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    Rincian pembayaran belum tercatat di sistem.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
