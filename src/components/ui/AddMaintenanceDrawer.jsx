"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitMaintenanceBaru } from "@/actions/maintenance.action";
import { formatRupiah } from "@/utils/formatters";

/* ====================== IKON SVG ====================== */
const XMarkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

/* ====================== INPUT RUPIAH ====================== */
const CurrencyInput = ({ name, value, onChange, placeholder, className = "" }) => {
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
      <input type="text" value={display} onChange={handleChange} placeholder={placeholder} className={className} />
      <input type="hidden" name={name} value={value || ""} />
    </div>
  );
};

// ============================
//   SEARCHABLE MULTI SELECT
// ============================
const SearchableMultiSelect = ({ options, placeholder, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (item) => {
    if (selectedItems.some((i) => i.value === item.value)) {
      setSelectedItems(selectedItems.filter((i) => i.value !== item.value));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const removeItem = (e, valToRemove) => {
    e.stopPropagation();
    setSelectedItems(selectedItems.filter((i) => i.value !== valToRemove));
  };

  return (
    <div className="relative w-full">
      {selectedItems.map((item) => (
        <input key={item.value} type="hidden" name={name} value={item.value} />
      ))}
      <div
        onClick={() => setIsOpen(true)}
        className="w-full min-h-[44px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus-within:ring-2 focus-within:ring-[#2e004f]/20 focus-within:border-[#2e004f] cursor-pointer flex flex-wrap gap-2 items-center"
      >
        {selectedItems.length === 0 && (
          <span className="text-gray-400">{placeholder}</span>
        )}
        {selectedItems.map((item) => (
          <span
            key={item.value}
            className="bg-[#2e004f]/10 text-[#2e004f] font-bold px-2 py-1 rounded flex items-center gap-1 text-[11px] animate-in fade-in zoom-in duration-200"
          >
            {item.label}
            <button
              type="button"
              onClick={(e) => removeItem(e, item.value)}
              className="hover:text-red-500 font-bold ml-1"
            >
              <XMarkIcon />
            </button>
          </span>
        ))}
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
            <input
              autoFocus
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm focus:outline-none"
            />
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = selectedItems.some(
                    (i) => i.value === opt.value
                  );
                  return (
                    <div
                      key={opt.value}
                      onClick={() => toggleItem(opt)}
                      className={`px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? "bg-[#2e004f]/10 font-bold text-[#2e004f]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <CheckIcon />}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
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

// ============================
//   SEARCHABLE SINGLE SELECT
// ============================
const SearchableSelect = ({ options, placeholder, name, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectItem = (item) => {
    setSelectedItem(item);
    setIsOpen(false);
    setSearch("");
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
        className="w-full min-h-[44px] px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer flex justify-between items-center focus-within:ring-2 focus-within:ring-[#2e004f]/20 focus-within:border-[#2e004f]"
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
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
            <input
              autoFocus
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm focus:outline-none"
            />
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => selectItem(opt)}
                    className={`px-4 py-2.5 text-sm cursor-pointer ${
                      selectedItem?.value === opt.value
                        ? "bg-[#2e004f]/10 font-bold text-[#2e004f]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
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

// ============================
//   ADD MAINTENANCE DRAWER
// ============================
export default function AddMaintenanceDrawer({ masterData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formKey, setFormKey] = useState(0); 
  const [budgetCost, setBudgetCost] = useState(0); // State untuk formatting nominal Rp
  const router = useRouter();

  const supOptions =
    masterData?.superintendent?.map((s) => ({
      value: s.id_superintendent,
      label: `${s.nama_superintendent} (${s.jabatan || "-"})`,
    })) || [];

  const kapalOptions =
    masterData?.kapal?.map((k) => ({
      value: k.id_kapal,
      label: k.nama_kapal,
    })) || [];

  const tempatOptions =
    masterData?.tempat?.map((t) => ({
      value: t.id_tempat,
      label: t.nama_tempat,
    })) || [];

  const catOptions =
    masterData?.cat?.map((c) => ({
      value: c.id_cat,
      label: c.nama_cat,
    })) || [];

  const statusOptions =
    masterData?.status?.map((s) => ({
      value: s.id_status,
      label: s.nama_status,
    })) || [];

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.target);
    const response = await submitMaintenanceBaru(formData);
    setIsLoading(false);

    if (response?.success) {
      setIsOpen(false);
      event.target.reset(); 
      setBudgetCost(0); // Reset state CurrencyInput setelah berhasil
      router.refresh();
    } else {
      alert(response?.message || "Gagal menyimpan data. Silakan coba lagi.");
    }
  }

  const handleOpenDrawer = () => {
    setFormKey((prev) => prev + 1);
    setBudgetCost(0);
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpenDrawer}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#2e004f] hover:bg-[#1a0035] rounded-lg text-sm font-semibold shadow-md text-white transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
        </svg>
        Tambah Docking Baru
      </button>

      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-[#1a113c]/30 backdrop-blur-sm"
          onClick={() => !isLoading && setIsOpen(false)}
        ></div>

        <div
          className={`absolute top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* HEADER */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-[#1a113c]">Nota Baru</h2>
              <p className="text-xs text-gray-500 mt-1">
                Buat arsip docking armada berjalan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => !isLoading && setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </button>
          </div>

          {/* FORM */}
          <form
            id="form-maintenance"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
          >
            {/* Penanggung Jawab */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">
                Penanggung Jawab (Bisa lebih dari 1)
              </label>
              <SearchableMultiSelect
                key={`sup-${formKey}`}
                name="id_superintendent"
                options={supOptions}
                placeholder="Pilih Penanggung Jawab..."
              />
            </div>

            {/* Kapal */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">
                Kapal
              </label>
              <SearchableSelect
                key={`kapal-${formKey}`}
                name="id_kapal"
                options={kapalOptions}
                placeholder="-- Pilih Armada --"
                required={true}
              />
            </div>

            {/* Lokasi Dok */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">
                Lokasi Dok
              </label>
              <SearchableSelect
                key={`tempat-${formKey}`}
                name="id_tempat"
                options={tempatOptions}
                placeholder="-- Pilih Lokasi --"
                required={true}
              />
            </div>

            {/* Kategori Cat & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Kategori Cat
                </label>
                <SearchableSelect
                  key={`cat-${formKey}`}
                  name="id_cat"
                  options={catOptions}
                  placeholder="Kategori Cat"
                  required={true}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Status
                </label>
                <SearchableSelect
                  key={`status-${formKey}`}
                  name="id_status"
                  options={statusOptions}
                  placeholder="Status Docking"
                  required={true}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                name="status_detail"
                placeholder="Detail status (Opsional)"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs italic outline-none focus:border-[#2e004f]"
              />
            </div>

            {/* Separator */}
            <div className="w-full h-[1px] bg-gray-100 my-1"></div>

            {/* Tanggal Off Operasi & Masuk */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Tgl. Off Operasi
                </label>
                <input
                  name="waktu_off_operasi"
                  type="date"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Tgl. Masuk Dok
                </label>
                <input
                  name="waktu_masuk"
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                />
              </div>
            </div>

            {/* Target Hari & Estimasi Budget (dengan CurrencyInput) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Target Hari
                </label>
                <div className="relative">
                  <input
                    name="budget_time"
                    type="number"
                    placeholder="0"
                    className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2e004f]/20 focus:border-[#2e004f]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                    HARI
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Estimasi Budget
                </label>
                <CurrencyInput
                  name="budget_cost"
                  value={budgetCost}
                  onChange={setBudgetCost}
                  placeholder="Rp"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2e004f]/20 focus:border-[#2e004f]"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">
                Keterangan Umum
              </label>
              <textarea
                name="keterangan"
                rows="3"
                placeholder="Catatan docking..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f] resize-none"
              ></textarea>
            </div>
          </form>

          {/* FOOTER */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              form="form-maintenance"
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#2e004f] rounded-lg text-sm font-semibold text-white shadow-md hover:bg-[#1a0035] transition-all disabled:bg-gray-400"
            >
              {isLoading ? "Menyimpan..." : "Simpan Nota"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}