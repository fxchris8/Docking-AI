"use client";
import { useState, useRef, useEffect } from "react";
import SideBar from "@/components/ui/sidebar";

/* ====================== IKON ====================== */
const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M208,128a8,8,0,0,1-8,8H136v64a8,8,0,0,1-16,0V136H56a8,8,0,0,1,0-16h64V56a8,8,0,0,1,16,0v64h64A8,8,0,0,1,208,128Z" />
  </svg>
);

const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const SuccessIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    fill="currentColor"
    viewBox="0 0 256 256"
    className="text-green-500"
  >
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
  </svg>
);

export default function CheckerClient({ dataTempat = [], dataKapal = [] }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // State Galangan (Locked)
  const [selectedTempat, setSelectedTempat] = useState("2");

  // 🔥 STATE DROPDOWN PENCARIAN KAPAL
  const [selectedKapalId, setSelectedKapalId] = useState("");
  const [isKapalOpen, setIsKapalOpen] = useState(false);
  const [kapalSearch, setKapalSearch] = useState("");
  const kapalDropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // === AUTO-CLOSE DROPDOWN JIKA KLIK DI LUAR ===
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        kapalDropdownRef.current &&
        !kapalDropdownRef.current.contains(event.target)
      ) {
        setIsKapalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === FILTER PENCARIAN KAPAL ===
  const filteredKapal = dataKapal.filter(
    (k) =>
      k.ship_name_class_reg
        ?.toLowerCase()
        .includes(kapalSearch.toLowerCase()) ||
      k.id?.toLowerCase().includes(kapalSearch.toLowerCase()),
  );

  // === MENCARI DATA KAPAL OTOMATIS BERDASARKAN ID ===
  const selectedKapalObj = dataKapal.find(
    (k) => String(k.id) === String(selectedKapalId),
  );
  const namaKapal = selectedKapalObj
    ? selectedKapalObj.ship_name_class_reg
    : "";
  const gtKapal = selectedKapalObj ? selectedKapalObj.grt : "";

  // === HANDLER FILE ===
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setDownloadUrl(null);
      setAuditData([]);
      setError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      setFile(f);
      setDownloadUrl(null);
      setAuditData([]);
      setError("");
    } else {
      setError(
        "Format file tidak didukung. Harap upload file Excel (.xlsx / .xls)",
      );
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setDownloadUrl(null);
    setAuditData([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // === HANDLER PROSES API ===
  const handleProses = async () => {
    if (!file || !selectedTempat || !selectedKapalId) {
      setError("Harap lengkapi semua data (File Excel dan Nama Kapal).");
      return;
    }

    setError("");
    setLoading(true);
    setDownloadUrl(null);
    setAuditData([]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("id_tempat", selectedTempat);
    formData.append("nama_kapal", namaKapal);
    formData.append("gt_kapal", gtKapal);

    try {
      const res = await fetch("/api/checker/process", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.error ||
            data.message ||
            "Terjadi kesalahan pada server backend.",
        );
      } else {
        setDownloadUrl(data.downloadUrl);
        setAuditData(data.data || []);
        setTimeout(
          () =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            }),
          300,
        );
      }
    } catch (err) {
      setError(
        "Gagal menghubungi server. Pastikan server web berjalan dengan baik.",
      );
    }
    setLoading(false);
  };

  return (
    <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
      <SideBar />
      <div className="main flex-1 p-6 md:p-10 flex flex-col gap-6 text-gray-800 h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-[#1a113c]">Nota Checker</h1>
          <p className="text-sm text-gray-500">
            Unggah nota Excel dari galangan dan biarkan AI Llama / DeepSeek kami
            melakukan audit kesesuaian harga berdasarkan standar GT Kapal.
          </p>
        </div>

        {/* Form Upload & Input Data */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 p-6 md:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-[#1a113c] border-b border-gray-100 pb-4">
            Pengaturan Audit
          </h2>

          {/* Area Drag & Drop */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-[#2e004f] bg-[#2e004f]/5 scale-[1.02]"
                : file
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-[#2e004f] hover:bg-gray-50"
            }`}
            onClick={() => !file && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="text-green-600"
                >
                  <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM152,88V44l44,44Z" />
                </svg>
                <div>
                  <p className="font-semibold text-green-700">{file.name}</p>
                  <p className="text-xs text-green-600/80">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="mt-2 px-4 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors"
                >
                  Batal / Ganti File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-[#2e004f] text-white" : "bg-[#2e004f]/10 text-[#2e004f]"}`}
                >
                  <UploadIcon />
                </div>
                <p className="font-semibold text-gray-700">
                  {isDragging
                    ? "Lepaskan file di sini..."
                    : "Seret & lepas file Excel di sini"}
                </p>
                <span className="text-xs text-gray-400">
                  atau klik untuk memilih file dari komputer (.xlsx)
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 🔥 CUSTOM SEARCHABLE DROPDOWN UNTUK KAPAL */}
            <div
              className="flex flex-col gap-1.5 relative"
              ref={kapalDropdownRef}
            >
              <label className="text-xs font-bold text-gray-500 uppercase">
                Nama Kapal (Bisa Diketik)
              </label>

              <div
                className="p-3 bg-white/60 border border-gray-200 rounded-lg text-sm cursor-pointer flex justify-between items-center focus:border-[#2e004f] focus:ring-1 focus:ring-[#2e004f]"
                onClick={() => setIsKapalOpen(!isKapalOpen)}
              >
                <span
                  className={
                    selectedKapalId ? "text-gray-900" : "text-gray-400"
                  }
                >
                  {selectedKapalId
                    ? `${selectedKapalObj?.id} - ${selectedKapalObj?.ship_name_class_reg}`
                    : "-- Ketik & Pilih Kapal --"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="text-gray-500"
                >
                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
                </svg>
              </div>

              {/* Box Opsi Pencarian */}
              {isKapalOpen && (
                <div className="absolute z-10 top-[65px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <input
                      type="text"
                      placeholder="Cari ID atau Nama Kapal..."
                      value={kapalSearch}
                      onChange={(e) => setKapalSearch(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded text-sm outline-none focus:border-[#2e004f]"
                      autoFocus
                    />
                  </div>
                  <ul className="max-h-52 overflow-y-auto">
                    {filteredKapal.length > 0 ? (
                      filteredKapal.map((k) => (
                        <li
                          key={k.id}
                          className="px-4 py-2.5 text-sm hover:bg-[#2e004f]/5 cursor-pointer border-b border-gray-50 last:border-0"
                          onClick={() => {
                            setSelectedKapalId(k.id);
                            setIsKapalOpen(false);
                            setKapalSearch("");
                          }}
                        >
                          <span className="font-semibold text-[#2e004f]">
                            {k.id}
                          </span>{" "}
                          - {k.ship_name_class_reg}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-4 text-sm text-gray-500 text-center">
                        Kapal tidak ditemukan
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* 🔥 INPUT GT KAPAL (TERKUNCI / READ ONLY) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                GT Kapal
              </label>
              <input
                type="text"
                readOnly
                placeholder="Otomatis terisi..."
                value={gtKapal ? `${gtKapal} GT` : ""}
                className="p-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* 🔥 TEMPAT DOCKING (TERKUNCI DI PT. DPL) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Tempat Docking (Galangan)
            </label>
            <select
              disabled
              value={selectedTempat}
              className="p-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-sm outline-none cursor-not-allowed font-semibold"
            >
              <option value="2">PT. DPL</option>
              {dataTempat.map((t) => (
                <option key={t.id_tempat} value={t.id_tempat}>
                  {t.nama_tempat}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z" />
              </svg>
              {error}
            </div>
          )}

          <button
            onClick={handleProses}
            disabled={loading || !file || !selectedKapalId}
            className="w-full py-3.5 bg-[#2e004f] hover:bg-[#1a0035] text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
          >
            {loading ? (
              <>
                <Spinner /> AI Sedang Mengekstrak & Mengaudit...
              </>
            ) : (
              "Mulai Audit Nota"
            )}
          </button>
        </div>

        {/* --- AREA HASIL & TABEL --- */}
        {downloadUrl && (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1a113c]">
                  Hasil Audit: {namaKapal}
                </h2>
                <p className="text-sm text-gray-500">
                  Total {auditData.length} item berhasil diaudit.
                </p>
              </div>
              <a
                href={downloadUrl}
                download
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M200,32H163.74a47.92,47.92,0,0,0-71.48,0H56A16,16,0,0,0,40,48V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm-72,0a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm72,184H56V48H80V64a8,8,0,0,0,8,8h80a8,8,0,0,0,8-8V48h24Z" />
                </svg>
                Unduh Laporan Excel
              </a>
            </div>

            {/* Tabel Preview */}
            {auditData.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-inner">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="p-4 border-b border-gray-200 font-bold">
                        No
                      </th>
                      <th className="p-4 border-b border-gray-200 min-w-[200px] font-bold">
                        Item Tagihan
                      </th>
                      <th className="p-4 border-b border-gray-200 font-bold">
                        Vol
                      </th>
                      <th className="p-4 border-b border-gray-200 min-w-[120px] font-bold">
                        Status Harga
                      </th>
                      <th className="p-4 border-b border-gray-200 min-w-[200px] font-bold">
                        Keterangan AI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.map((row, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50/50 border-b border-gray-100 transition-colors"
                      >
                        <td className="p-4 text-gray-500">{row.Nomor}</td>
                        <td className="p-4 font-medium text-[#2e004f]">
                          {row["Item Tagihan"]}
                        </td>
                        <td className="p-4 text-gray-600">
                          {row["Vol Tagihan"]} {row["Satuan Tagihan"]}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              row["Status Harga"].includes("OK")
                                ? "bg-green-100 text-green-700"
                                : row["Status Harga"].includes("OVERPRICE")
                                  ? "bg-red-100 text-red-700"
                                  : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {row["Status Harga"]}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">
                          <span className="font-semibold text-gray-700">
                            {row.Flag}
                          </span>{" "}
                          — {row.Alasan || row.Tier}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center gap-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="text-gray-400"
                >
                  <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm-88,16v56H40V56ZM40,128h88v72H40Zm24,24a8,8,0,0,1,8-8h40a8,8,0,0,1,0,16H72A8,8,0,0,1,64,152Zm152,48H144V128h72Zm0-88H144V56h72V112Z" />
                </svg>
                <span className="text-gray-500 font-medium">
                  Tidak ada data hasil parsing yang valid. Cek kembali format
                  Sheet Excel Anda.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
