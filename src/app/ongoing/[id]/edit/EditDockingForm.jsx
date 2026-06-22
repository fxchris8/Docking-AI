/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateMaintenanceDetail } from "@/actions/maintenance.action";
import { formatRupiah } from "@/utils/formatters";

/* ====================== IKON SVG ====================== */
const XMarkIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

/* ====================== INPUT RUPIAH ====================== */
const CurrencyInput = ({
  name,
  value,
  onChange,
  placeholder,
  className = "",
}) => {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay(value ? formatRupiah(value) : "");
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const numeric = raw === "" ? 0 : Number(raw);
    onChange(numeric);
    setDisplay(numeric ? formatRupiah(numeric) : "");
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
      <input type="hidden" name={name} value={value || ""} />
    </div>
  );
};

/* ====================== KOMPONEN FILE INPUT DENGAN EXISTING URL ====================== */
const FileInputWithExisting = ({
  label,
  fileName,
  accept,
  existingUrl,
  onFileSelected,
}) => {
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setSelectedFileName(file ? file.name : "");
    if (onFileSelected) onFileSelected(file);
  };

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase">
        {label}
      </label>
      <input
        type="file"
        name={fileName}
        accept={accept}
        onChange={handleFileChange}
        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer"
      />
      {existingUrl && (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] text-gray-500">File tersimpan:</span>
          <a
            href={existingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-blue-600 underline truncate"
          >
            Lihat
          </a>
        </div>
      )}
      {selectedFileName && (
        <p className="text-[10px] text-green-600 mt-1">
          Baru: {selectedFileName}
        </p>
      )}
    </div>
  );
};

/* ====================== SEARCHABLE MULTI SELECT ====================== */
const SearchableMultiSelect = ({
  options,
  placeholder,
  name,
  initialSelected = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState(initialSelected);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (item) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.value === item.value)
        ? prev.filter((i) => i.value !== item.value)
        : [...prev, item],
    );
  };

  const remove = (e, val) => {
    e.stopPropagation();
    setSelectedItems((prev) => prev.filter((i) => i.value !== val));
  };

  return (
    <div className="relative w-full">
      {selectedItems.map((item) => (
        <input key={item.value} type="hidden" name={name} value={item.value} />
      ))}
      <div
        onClick={() => setIsOpen(true)}
        className="w-full min-h-[44px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer flex flex-wrap gap-2 items-center outline-none focus-within:border-[#2e004f]"
      >
        {selectedItems.length === 0 && (
          <span className="text-gray-400">{placeholder}</span>
        )}
        {selectedItems.map((item) => (
          <span
            key={item.value}
            className="bg-[#2e004f]/10 text-[#2e004f] font-bold px-2 py-1 rounded flex items-center gap-1 text-[11px]"
          >
            {item.label}
            <button
              type="button"
              onClick={(e) => remove(e, item.value)}
              className="hover:text-red-500 ml-1"
            >
              <XMarkIcon />
            </button>
          </span>
        ))}
      </div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
            <input
              autoFocus
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm focus:outline-none"
            />
            <div className="max-h-48 overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map((opt) => {
                  const isSel = selectedItems.some(
                    (i) => i.value === opt.value,
                  );
                  return (
                    <div
                      key={opt.value}
                      onClick={() => toggle(opt)}
                      className={`px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center ${isSel ? "bg-[#2e004f]/10 font-bold text-[#2e004f]" : "hover:bg-gray-50"}`}
                    >
                      <span>{opt.label}</span>
                      {isSel && <CheckIcon />}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Data tidak ditemukan
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ====================== SEARCHABLE SINGLE SELECT ====================== */
const SearchableSelect = ({
  options,
  placeholder,
  name,
  required,
  defaultValue,
  onChangeCallback,
}) => {
  const initialOpt = options.find((o) => o.value == defaultValue) || null;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(initialOpt);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectItem = (item) => {
    setSelectedItem(item);
    setIsOpen(false);
    setSearch("");
    if (onChangeCallback) onChangeCallback(item.value);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        name={name}
        value={selectedItem?.value || ""}
        required={required}
        onChange={() => {}}
        tabIndex={-1}
        className="absolute opacity-0 w-0 h-0 -z-10"
      />
      <div
        onClick={() => setIsOpen(true)}
        className="w-full min-h-[44px] px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer flex justify-between items-center outline-none focus-within:border-[#2e004f]"
      >
        <span
          className={
            selectedItem ? "text-[#1a113c] font-medium" : "text-gray-400"
          }
        >
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <span className="text-gray-400 text-xs">▼</span>
      </div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
            <input
              autoFocus
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm focus:outline-none"
            />
            <div className="max-h-48 overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => selectItem(opt)}
                    className={`px-4 py-2.5 text-sm cursor-pointer ${selectedItem?.value === opt.value ? "bg-[#2e004f]/10 font-bold text-[#2e004f]" : "hover:bg-gray-50"}`}
                  >
                    {opt.label}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Data tidak ditemukan
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ====================== HELPER TANGGAL ====================== */
const toInputDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
};

const toInputDateTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

/* ====================== KOMPONEN UTAMA ====================== */
export default function EditDockingForm({ detailData, masterData }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Harga & biaya
  const [hargaPenawaran, setHargaPenawaran] = useState(
    detailData.harga_penawaran || 0,
  );
  const [hargaKontrak, setHargaKontrak] = useState(
    detailData.harga_kontrak || 0,
  );
  const [hargaRekalbea, setHargaRekalbea] = useState(
    detailData.harga_rekalbea || 0,
  );
  const [hargaConfirm, setHargaConfirm] = useState(
    detailData.harga_confirm || 0,
  );
  const [biayaJasa, setBiayaJasa] = useState(detailData.biaya_jasa || 0);
  const [budgetCost, setBudgetCost] = useState(detailData.budget_cost || 0);

  // Tempat & mode
  const [selectedTempat, setSelectedTempat] = useState(
    detailData.id_tempat || "",
  );
  const tempatTerpilih = masterData.tempat.find(
    (t) => t.id_tempat == selectedTempat,
  );
  const isSMI = tempatTerpilih?.nama_tempat === "PT. SMI";
  const isDPL = tempatTerpilih?.nama_tempat === "PT. DPL";
  const isUmum = !isSMI && !isDPL;

  // State perhitungan
  const adaDataGenerate = !!detailData.nominal_bayar_1;
  const [isCalculated, setIsCalculated] = useState(adaDataGenerate);
  const [isConfirmedPay, setIsConfirmedPay] = useState(
    !!(detailData.nominal_bayar_1 && detailData.tanggal_bayar_1),
  );
  const [calcPembayaran, setCalcPembayaran] = useState({
    nominal_bayar_1: detailData.nominal_bayar_1 || 0,
    nominal_bayar_1_bkk: detailData.nominal_bayar_1_bkk || 0,
    nominal_bayar_1_bkm: detailData.nominal_bayar_1_bkm || 0,
  });
  const [tanggalBayar1, setTanggalBayar1] = useState(
    detailData.tanggal_bayar_1
      ? toInputDate(detailData.tanggal_bayar_1)
      : toInputDate(new Date()),
  );

  // Visible fields mode umum
  const getInitialFieldsCount = () => {
    if (detailData.nominal_bayar_4) return 4;
    if (detailData.nominal_bayar_3) return 3;
    if (detailData.nominal_bayar_2) return 2;
    return 1;
  };
  const [visibleFields, setVisibleFields] = useState(getInitialFieldsCount());

  // Upload file lampiran umum
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const existingLampiranCount = detailData.lampiran_dokumen?.length || 0;

  // State untuk menyimpan URL existing setiap lampiran
  const [urlHargaPenawaran, setUrlHargaPenawaran] = useState(
    detailData.url_harga_penawaran || "",
  );
  const [urlHargaKontrak, setUrlHargaKontrak] = useState(
    detailData.url_harga_kontrak || "",
  );
  const [urlHargaRekalbea, setUrlHargaRekalbea] = useState(
    detailData.url_harga_rekalbea || "",
  );
  const [urlHargaConfirm, setUrlHargaConfirm] = useState(
    detailData.url_harga_confirm || "",
  );
  const [urlBudgetCost, setUrlBudgetCost] = useState(
    detailData.url_budget_cost || "",
  );
  const [urlPembayaran1, setUrlPembayaran1] = useState(
    detailData.url_pembayaran_1 || "",
  );
  const [urlPembayaran2, setUrlPembayaran2] = useState(
    detailData.url_pembayaran_2 || "",
  );
  const [urlPembayaran3, setUrlPembayaran3] = useState(
    detailData.url_pembayaran_3 || "",
  );
  const [urlPembayaran4, setUrlPembayaran4] = useState(
    detailData.url_pembayaran_4 || "",
  );

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    const totalAfterAdd =
      selectedFiles.length + newFiles.length + existingLampiranCount;
    if (totalAfterAdd > 5) {
      alert(
        `Maksimal total lampiran 5 file. Saat ini sudah ada ${existingLampiranCount + selectedFiles.length} file (lama + baru).`,
      );
      e.target.value = "";
      return;
    }
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeSelectedFile = (index) =>
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  // Opsi dropdown
  const supOptions = masterData.superintendent.map((s) => ({
    value: s.id_superintendent,
    label: `${s.nama_superintendent} (${s.jabatan || "-"})`,
  }));
  const kapalOptions = masterData.kapal.map((k) => ({
    value: k.id_kapal,
    label: k.nama_kapal,
  }));
  const tempatOptions = masterData.tempat.map((t) => ({
    value: t.id_tempat,
    label: t.nama_tempat,
  }));
  const catOptions = masterData.cat.map((c) => ({
    value: c.id_cat,
    label: c.nama_cat,
  }));
  const statusOptions = masterData.status.map((s) => ({
    value: s.id_status,
    label: s.nama_status,
  }));
  const initialSupSelected =
    detailData.superintendents?.map((s) => ({
      value: s.id_superintendent,
      label: `${s.nama_superintendent} (${s.jabatan || "-"})`,
    })) || [];

  // Validasi generate
  const canGenerate = () => {
    if (isUmum) return false;
    const basic =
      hargaPenawaran > 0 &&
      hargaKontrak > 0 &&
      hargaRekalbea > 0 &&
      hargaConfirm > 0;
    if (isSMI) return basic && biayaJasa > 0;
    if (isDPL) return basic;
    return false;
  };

  // Generate perhitungan
  const handleGeneratePerhitungan = () => {
    if (!canGenerate()) return;
    if (isSMI) {
      const pph23 = 0.02 * biayaJasa;
      const bayar1 = hargaConfirm - pph23;
      setCalcPembayaran({
        nominal_bayar_1: bayar1,
        nominal_bayar_1_bkk: 0,
        nominal_bayar_1_bkm: pph23,
      });
    } else if (isDPL) {
      const bkk = 0.5 * hargaKontrak;
      const bkm = 0.02 * 0.3 * bkk;
      const bayar1 = bkk - bkm;
      setCalcPembayaran({
        nominal_bayar_1: bayar1,
        nominal_bayar_1_bkk: bkk,
        nominal_bayar_1_bkm: bkm,
      });
    }
    setIsCalculated(true);
    setIsConfirmedPay(false);
  };

  // Konfirmasi
  const handleConfirmPay = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.set("nominal_bayar_1", calcPembayaran.nominal_bayar_1);
    formData.set("nominal_bayar_1_bkk", calcPembayaran.nominal_bayar_1_bkk);
    formData.set("nominal_bayar_1_bkm", calcPembayaran.nominal_bayar_1_bkm);
    formData.set("tanggal_bayar_1", tanggalBayar1);
    const res = await updateMaintenanceDetail(
      detailData.id_perbaikan,
      formData,
    );
    setIsLoading(false);
    if (!res.success) {
      alert("Gagal menyimpan konfirmasi: " + res.message);
      return;
    }
    setIsConfirmedPay(true);
  };

  // Batal konfirmasi
  const handleBatalKonfirmasi = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.set("nominal_bayar_1", "");
    formData.set("nominal_bayar_1_bkk", "");
    formData.set("nominal_bayar_1_bkm", "");
    formData.set("tanggal_bayar_1", "");
    const res = await updateMaintenanceDetail(
      detailData.id_perbaikan,
      formData,
    );
    setIsLoading(false);
    if (!res.success) {
      alert("Gagal membatalkan konfirmasi: " + res.message);
      return;
    }
    setIsConfirmedPay(false);
    setIsCalculated(false);
    setCalcPembayaran({
      nominal_bayar_1: 0,
      nominal_bayar_1_bkk: 0,
      nominal_bayar_1_bkm: 0,
    });
  };

  // Submit
  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.target);

    formData.set("harga_penawaran", hargaPenawaran);
    formData.set("harga_kontrak", hargaKontrak);
    formData.set("harga_rekalbea", hargaRekalbea);
    formData.set("harga_confirm", hargaConfirm);
    formData.set("biaya_jasa", biayaJasa);
    formData.set("budget_cost", budgetCost);

    // Set semua URL existing dari state agar tidak hilang
    formData.set("existing_url_harga_penawaran", urlHargaPenawaran);
    formData.set("existing_url_harga_kontrak", urlHargaKontrak);
    formData.set("existing_url_harga_rekalbea", urlHargaRekalbea);
    formData.set("existing_url_harga_confirm", urlHargaConfirm);
    formData.set("existing_url_budget_cost", urlBudgetCost);
    formData.set("existing_url_pembayaran_1", urlPembayaran1);
    formData.set("existing_url_pembayaran_2", urlPembayaran2);
    formData.set("existing_url_pembayaran_3", urlPembayaran3);
    formData.set("existing_url_pembayaran_4", urlPembayaran4);

    // 🔥 status_perbaikan dan status_pembayaran otomatis terbawa dari form (tidak perlu di-set manual)

    if (isSMI || isDPL) {
      if (isConfirmedPay) {
        formData.set("nominal_bayar_1", calcPembayaran.nominal_bayar_1);
        formData.set("nominal_bayar_1_bkk", calcPembayaran.nominal_bayar_1_bkk);
        formData.set("nominal_bayar_1_bkm", calcPembayaran.nominal_bayar_1_bkm);
        formData.set("tanggal_bayar_1", tanggalBayar1);
      } else if (isCalculated) {
        formData.set("nominal_bayar_1", calcPembayaran.nominal_bayar_1);
        formData.set("nominal_bayar_1_bkk", calcPembayaran.nominal_bayar_1_bkk);
        formData.set("nominal_bayar_1_bkm", calcPembayaran.nominal_bayar_1_bkm);
        formData.set("tanggal_bayar_1", "");
      } else {
        formData.set("nominal_bayar_1", "");
        formData.set("nominal_bayar_1_bkk", "");
        formData.set("nominal_bayar_1_bkm", "");
        formData.set("tanggal_bayar_1", "");
      }
    }

    if (detailData.lampiran_dokumen && detailData.lampiran_dokumen.length > 0) {
      formData.append(
        "existing_lampiran",
        JSON.stringify(detailData.lampiran_dokumen),
      );
    }
    selectedFiles.forEach((file) => formData.append("lampiran", file));

    const res = await updateMaintenanceDetail(
      detailData.id_perbaikan,
      formData,
    );
    setIsLoading(false);
    if (res.success) {
      alert("Data berhasil diubah!");
      router.push(`/ongoing/${detailData.id_perbaikan}`);
    } else {
      alert("Gagal mengupdate data: " + res.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 xl:grid-cols-3 gap-6"
    >
      {/* ---------- KOLOM KIRI ---------- */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        {/* INFORMASI PEKERJAAN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4">
            Informasi Pekerjaan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Penanggung Jawab - full width */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Penanggung Jawab
              </label>
              <SearchableMultiSelect
                name="id_superintendent"
                options={supOptions}
                placeholder="Pilih Penanggung Jawab..."
                initialSelected={initialSupSelected}
              />
            </div>

            {/* Kapal */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Kapal
              </label>
              <SearchableSelect
                name="id_kapal"
                options={kapalOptions}
                placeholder="Pilih Armada"
                defaultValue={detailData.id_kapal}
                required={true}
              />
            </div>

            {/* Lokasi Docking */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Lokasi Docking
              </label>
              <SearchableSelect
                name="id_tempat"
                options={tempatOptions}
                placeholder="Pilih Lokasi Dok"
                defaultValue={detailData.id_tempat}
                required={true}
                onChangeCallback={setSelectedTempat}
              />
            </div>

            {/* Kategori Cat */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Kategori Cat
              </label>
              <SearchableSelect
                name="id_cat"
                options={catOptions}
                placeholder="Pilih Cat"
                defaultValue={detailData.id_cat}
                required={true}
              />
            </div>

            {/* Status & Detail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Status
              </label>
              <SearchableSelect
                name="id_status"
                options={statusOptions}
                placeholder="Pilih Status"
                defaultValue={detailData.id_status}
                required={true}
              />
              <input
                type="text"
                name="status_detail"
                defaultValue={detailData.status_detail || ""}
                placeholder="Detail status opsional..."
                className="p-2 bg-white border border-gray-200 rounded-lg text-xs italic outline-none focus:border-[#2e004f]"
              />
            </div>

            {/* Status Perbaikan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Status Perbaikan
              </label>
              <select
                name="status_perbaikan"
                defaultValue={detailData.status_perbaikan || "ongoing"}
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
              >
                <option value="ongoing">Ongoing</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>

            {/* Keterangan Umum - full width */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Keterangan Umum Nota
              </label>
              <textarea
                name="keterangan"
                rows="3"
                defaultValue={detailData.keterangan || ""}
                placeholder="Catatan general docking..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f] resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4">
            Timeline Perbaikan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Setiap item timeline dibungkus dengan tinggi seragam */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                1. Off Operasi
              </label>
              <input
                type="date"
                name="waktu_off_operasi"
                defaultValue={toInputDate(detailData.waktu_off_operasi)}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                2. Masuk Dok
              </label>
              <input
                type="date"
                name="waktu_masuk"
                defaultValue={toInputDate(detailData.waktu_masuk)}
                required
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
              />
              <input
                type="text"
                name="waktu_masuk_detail"
                defaultValue={detailData.waktu_masuk_detail || ""}
                placeholder="Catatan Masuk opsional..."
                className="p-2 bg-white border border-gray-200 rounded-lg text-xs italic outline-none focus:border-[#2e004f]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                3a. Naik (Wajib Jam)
              </label>
              <input
                type="datetime-local"
                name="waktu_naik"
                defaultValue={toInputDateTime(detailData.waktu_naik)}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
              />
              <input
                type="text"
                name="waktu_naik_detail"
                defaultValue={detailData.waktu_naik_detail || ""}
                placeholder="Catatan Naik opsional..."
                className="p-2 bg-white border border-gray-200 rounded-lg text-xs italic outline-none focus:border-[#2e004f]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                3b. Turun (Wajib Jam)
              </label>
              <input
                type="datetime-local"
                name="waktu_turun"
                defaultValue={toInputDateTime(detailData.waktu_turun)}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
              />
              <input
                type="text"
                name="waktu_turun_detail"
                defaultValue={detailData.waktu_turun_detail || ""}
                placeholder="Catatan Turun opsional..."
                className="p-2 bg-white border border-gray-200 rounded-lg text-xs italic outline-none focus:border-[#2e004f]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                4. Keluar Dok
              </label>
              <input
                type="date"
                name="waktu_keluar"
                defaultValue={toInputDate(detailData.waktu_keluar)}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
              />
              <input
                type="text"
                name="waktu_keluar_detail"
                defaultValue={detailData.waktu_keluar_detail || ""}
                placeholder="Catatan Keluar opsional..."
                className="p-2 bg-white border border-gray-200 rounded-lg text-xs italic outline-none focus:border-[#2e004f]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                5. Mulai Operasi
              </label>
              <input
                type="date"
                name="waktu_mulai_operasi"
                defaultValue={toInputDate(detailData.waktu_mulai_operasi)}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm border-l-4 border-l-green-500 outline-none focus:border-[#2e004f]"
              />
              <input
                type="text"
                name="waktu_mulai_detail"
                defaultValue={detailData.waktu_mulai_detail || ""}
                placeholder="Catatan Operasi opsional..."
                className="p-2 bg-white border border-gray-200 rounded-lg text-xs italic outline-none focus:border-[#2e004f]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- KOLOM KANAN ---------- */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        {/* BIAYA & KONTRAK */}
        <div className="bg-[#2e004f] rounded-2xl shadow-md p-6 md:p-8 text-white">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-6 border-b border-white/20 pb-4">
            Biaya & Kontrak
          </h2>
          <div className="flex flex-col gap-5">
            {/* Target Waktu */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">
                Target Waktu (Hari)
              </label>
              <input
                type="number"
                name="budget_time"
                defaultValue={detailData.budget_time}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none w-full"
              />
            </div>

            {/* Budget Cost */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">Budget Cost Awal</label>
              <CurrencyInput
                name="budget_cost"
                value={budgetCost}
                onChange={setBudgetCost}
                placeholder="Rp"
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none w-full"
              />
              <FileInputWithExisting
                label="Lampiran Budget Cost"
                fileName="file_budget_cost"
                accept="image/*,.pdf"
                existingUrl={urlBudgetCost}
              />
            </div>

            {/* Harga Penawaran */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">Harga Penawaran</label>
              <CurrencyInput
                name="harga_penawaran"
                value={hargaPenawaran}
                onChange={setHargaPenawaran}
                placeholder="Rp"
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none w-full"
              />
              <input
                type="date"
                name="tanggal_penawaran"
                defaultValue={toInputDate(detailData.tanggal_penawaran)}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white/90 focus:outline-none"
              />
              <FileInputWithExisting
                label="Lampiran Penawaran"
                fileName="file_harga_penawaran"
                accept="image/*,.pdf"
                existingUrl={urlHargaPenawaran}
              />
            </div>

            {/* Harga Kontrak */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">Harga Kontrak</label>
              <CurrencyInput
                name="harga_kontrak"
                value={hargaKontrak}
                onChange={setHargaKontrak}
                placeholder="Rp"
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none w-full"
              />
              <input
                type="date"
                name="tanggal_kontrak"
                defaultValue={toInputDate(detailData.tanggal_kontrak)}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white/90 focus:outline-none"
              />
              <FileInputWithExisting
                label="Lampiran Kontrak"
                fileName="file_harga_kontrak"
                accept="image/*,.pdf"
                existingUrl={urlHargaKontrak}
              />
            </div>

            {/* Harga Rekalbea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">Harga Rekalbea</label>
              <CurrencyInput
                name="harga_rekalbea"
                value={hargaRekalbea}
                onChange={setHargaRekalbea}
                placeholder="Rp"
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none w-full"
              />
              <input
                type="date"
                name="tanggal_rekalbea"
                defaultValue={toInputDate(detailData.tanggal_rekalbea)}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white/90 focus:outline-none"
              />
              <FileInputWithExisting
                label="Lampiran Rekalbea"
                fileName="file_harga_rekalbea"
                accept="image/*,.pdf"
                existingUrl={urlHargaRekalbea}
              />
            </div>

            {/* Harga Confirm */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white uppercase">
                Harga Confirm (Final)
              </label>
              <CurrencyInput
                name="harga_confirm"
                value={hargaConfirm}
                onChange={setHargaConfirm}
                placeholder="Rp"
                className="p-2.5 bg-white text-[#1a113c] font-bold border-none rounded-lg text-sm focus:outline-none w-full"
              />
              <input
                type="date"
                name="tanggal_confirm"
                defaultValue={toInputDate(detailData.tanggal_confirm)}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white/90 focus:outline-none"
              />
              <FileInputWithExisting
                label="Lampiran Confirm"
                fileName="file_harga_confirm"
                accept="image/*,.pdf"
                existingUrl={urlHargaConfirm}
              />
            </div>
          </div>
        </div>

        {/* PEMBAYARAN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col gap-5">
          <div className="flex justify-between items-center mb-1 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#1a113c]">Pembayaran</h2>
            <span className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-gray-100 text-gray-700">
              {isSMI ? "PT. SMI" : isDPL ? "PT. DPL" : "Mode Umum"}
            </span>
          </div>

          {/* Status Pembayaran */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase">
              Status Pembayaran
            </label>
            <select
              name="status_pembayaran"
              defaultValue={detailData.status_pembayaran || "belum lunas"}
              className="p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
            >
              <option value="belum lunas">Belum Lunas</option>
              <option value="lunas">Lunas</option>
            </select>
          </div>

          {/* PT. SMI / DPL */}
          {(isSMI || isDPL) && (
            <div className="flex flex-col gap-4">
              {isSMI && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">
                    Masukkan Biaya Jasa *
                  </label>
                  <CurrencyInput
                    name="biaya_jasa"
                    value={biayaJasa}
                    onChange={setBiayaJasa}
                    placeholder="Rp"
                    className="p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f] w-full"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleGeneratePerhitungan}
                disabled={!canGenerate()}
                className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all ${
                  canGenerate()
                    ? "bg-[#2e004f]/10 text-[#2e004f] hover:bg-[#2e004f] hover:text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                ⚙️ Generate Perhitungan
              </button>

              {isCalculated && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3 text-xs">
                  <h4 className="font-bold text-[#1a113c] uppercase text-[10px] tracking-wider text-gray-500">
                    Rincian Sistem
                  </h4>
                  {isSMI && (
                    <>
                      <div className="flex justify-between">
                        <span>Confirm:</span>
                        <span className="font-semibold">
                          {formatRupiah(hargaConfirm)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Pot. PPH (2%):</span>
                        <span className="font-semibold">
                          -{formatRupiah(calcPembayaran.nominal_bayar_1_bkm)}
                        </span>
                      </div>
                    </>
                  )}
                  {isDPL && (
                    <>
                      <div className="flex justify-between">
                        <span>BKK (50%):</span>
                        <span className="font-semibold">
                          {formatRupiah(calcPembayaran.nominal_bayar_1_bkk)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>BKM (2%x30%):</span>
                        <span className="font-semibold">
                          -{formatRupiah(calcPembayaran.nominal_bayar_1_bkm)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-[#2e004f]">
                    <span>Hasil Bayar 1:</span>
                    <span>{formatRupiah(calcPembayaran.nominal_bayar_1)}</span>
                  </div>

                  <div className="mt-2 flex gap-2">
                    {!isConfirmedPay ? (
                      <button
                        type="button"
                        onClick={handleConfirmPay}
                        disabled={isLoading}
                        className="flex-1 py-2 rounded-lg text-[11px] font-bold text-white bg-gray-700 hover:bg-green-600 transition-all disabled:opacity-50"
                      >
                        {isLoading ? "Loading..." : "Konfirmasi Cepat"}
                      </button>
                    ) : (
                      <>
                        <span className="flex-1 py-2 rounded-lg text-[11px] font-bold text-white bg-green-600 text-center flex items-center justify-center gap-1">
                          <CheckIcon /> Terkonfirmasi
                        </span>
                        <button
                          type="button"
                          onClick={handleBatalKonfirmasi}
                          disabled={isLoading}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-[11px] font-bold"
                        >
                          Batal
                        </button>
                      </>
                    )}
                  </div>

                  {isConfirmedPay && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">
                        Tanggal Bayar 1
                      </label>
                      <input
                        type="date"
                        name="tanggal_bayar_1"
                        value={tanggalBayar1}
                        onChange={(e) => setTanggalBayar1(e.target.value)}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">
                      Deskripsi Bayar 1
                    </label>
                    <input
                      type="text"
                      name="deskripsi_1"
                      defaultValue={detailData.deskripsi_bayar_1 || ""}
                      placeholder="Opsional"
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs italic outline-none"
                    />
                  </div>

                  <FileInputWithExisting
                    label="Lampiran Bayar 1"
                    fileName="file_pembayaran_1"
                    accept="image/*,.pdf"
                    existingUrl={urlPembayaran1}
                  />
                </div>
              )}

              {/* Field Pembayaran ke-2 Khusus DPL */}
              {isDPL && (
                <div className="p-4 border border-gray-100 rounded-2xl flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">
                    Tahap 2 (Pelunasan DPL)
                  </h4>
                  <input
                    type="number"
                    name="nominal_bayar_2"
                    defaultValue={detailData.nominal_bayar_2}
                    placeholder="Nominal Bayar 2"
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                  />
                  <input
                    type="date"
                    name="tanggal_bayar_2"
                    defaultValue={toInputDate(detailData.tanggal_bayar_2)}
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none"
                  />
                  <input
                    type="text"
                    name="deskripsi_2"
                    defaultValue={detailData.deskripsi_2 || ""}
                    placeholder="Deskripsi Bayar 2 (Opsional)"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs italic outline-none"
                  />
                  <FileInputWithExisting
                    label="Lampiran Bayar 2"
                    fileName="file_pembayaran_2"
                    accept="image/*,.pdf"
                    existingUrl={urlPembayaran2}
                  />
                </div>
              )}
            </div>
          )}

          {/* MODE UMUM */}
          {isUmum && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((num) => {
                if (num > visibleFields) return null;
                return (
                  <div
                    key={num}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-2"
                  >
                    <h3 className="text-xs font-bold text-gray-600 uppercase">
                      Pembayaran {num}
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name={`nominal_bayar_${num}`}
                        defaultValue={detailData[`nominal_bayar_${num}`] || ""}
                        placeholder="Nominal"
                        className="w-1/2 p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                      />
                      <input
                        type="date"
                        name={`tanggal_bayar_${num}`}
                        defaultValue={toInputDate(
                          detailData[`tanggal_bayar_${num}`],
                        )}
                        className="w-1/2 p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-500 outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      name={`deskripsi_${num}`}
                      defaultValue={detailData[`deskripsi_bayar_${num}`] || ""}
                      placeholder="Deskripsi (Opsional)"
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs italic outline-none"
                    />
                    <FileInputWithExisting
                      label={`Lampiran Bayar ${num}`}
                      fileName={`file_pembayaran_${num}`}
                      accept="image/*,.pdf"
                      existingUrl={detailData[`url_pembayaran_${num}`] || ""}
                    />
                  </div>
                );
              })}
              {visibleFields < 4 && (
                <button
                  type="button"
                  onClick={() => setVisibleFields((prev) => prev + 1)}
                  className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-sm hover:border-[#2e004f] hover:text-[#2e004f] transition-all flex items-center justify-center gap-1"
                >
                  <PlusIcon /> Tambah Tahap
                </button>
              )}
            </div>
          )}
        </div>

        {/* UPLOAD LAMPIRAN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col gap-5">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#1a113c]">
              Lampiran Dokumen
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <input
              type="file"
              name="lampiran"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2e004f]/10 file:text-[#2e004f] hover:file:bg-[#2e004f]/20 cursor-pointer"
            />
            <span className="text-[11px] text-gray-400">
              Maksimal total lampiran 5 file (Gambar/PDF). Terunggah saat klik
              Simpan Perubahan Nota.
            </span>

            {detailData.lampiran_dokumen?.length > 0 && (
              <div className="mt-2 flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[11px] font-bold text-gray-500">
                  File Tersimpan:
                </p>
                {detailData.lampiran_dokumen.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline truncate"
                  >
                    🔗 Lihat Dokumen {idx + 1}
                  </a>
                ))}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="mt-2 flex flex-col gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-[11px] font-bold text-gray-500">
                  File Baru Dipilih:
                </p>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                    >
                      <XMarkIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-600/30 transition-all flex justify-center items-center gap-2"
        >
          {isLoading ? "Menyimpan Perubahan..." : "Simpan Perubahan Nota"}
        </button>
      </div>
    </form>
  );
}
