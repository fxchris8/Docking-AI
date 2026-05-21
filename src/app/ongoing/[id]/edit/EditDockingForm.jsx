"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMaintenanceDetail } from "@/actions/maintenance.action";

const SearchableMultiSelect = ({
  options,
  placeholder,
  name,
  initialSelected = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState(initialSelected);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
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
        className="w-full min-h-[44px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer flex flex-wrap gap-2 items-center"
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
              onClick={(e) => removeItem(e, item.value)}
              className="hover:text-red-500 font-bold ml-1"
            >
              ✕
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
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = selectedItems.some(
                    (i) => i.value === opt.value,
                  );
                  return (
                    <div
                      key={opt.value}
                      onClick={() => toggleItem(opt)}
                      className={`px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center ${isSelected ? "bg-[#2e004f]/10 font-bold text-[#2e004f]" : "hover:bg-gray-50"}`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span className="text-[#2e004f]">✓</span>}
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

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
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
        type="hidden"
        name={name}
        value={selectedItem?.value || ""}
        required={required}
      />
      <div
        onClick={() => setIsOpen(true)}
        className="w-full min-h-[44px] px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer flex justify-between items-center"
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
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
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

export default function EditDockingForm({ detailData, masterData }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [selectedTempat, setSelectedTempat] = useState(
    detailData.id_tempat || "",
  );
  const tempatTerpilih = masterData.tempat.find(
    (t) => t.id_tempat == selectedTempat,
  );
  const isSMI = tempatTerpilih?.nama_tempat === "PT. SMI";
  const isDPL = tempatTerpilih?.nama_tempat === "PT. DPL";
  const isUmum = !isSMI && !isDPL;

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

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.target);
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
      <div className="xl:col-span-2 flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4">
            Informasi Pekerjaan
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 flex flex-col gap-1.5">
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
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-[#1a113c] mb-6 border-b border-gray-100 pb-4">
            Timeline Perbaikan
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
            </div>
          </div>
        </div>
      </div>

      {/* KOLOM KANAN (Keuangan & Action) */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        {/* HARGA KONTRAK */}
        <div className="bg-[#2e004f] rounded-2xl shadow-md p-8 text-white">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-6 border-b border-white/20 pb-4">
            Biaya & Kontrak
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">
                Target Waktu (Hari)
              </label>
              <input
                type="number"
                name="budget_time"
                defaultValue={detailData.budget_time}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">Budget Cost Awal</label>
              <input
                type="number"
                name="budget_cost"
                defaultValue={detailData.budget_cost}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">Harga Penawaran</label>
              <input
                type="number"
                name="harga_penawaran"
                defaultValue={detailData.harga_penawaran}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">Harga Kontrak</label>
              <input
                type="number"
                name="harga_kontrak"
                defaultValue={detailData.harga_kontrak}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">Harga Rekalbea</label>
              <input
                type="number"
                name="harga_rekalbea"
                defaultValue={detailData.harga_rekalbea}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white uppercase">
                Harga Confirm (Final)
              </label>
              <input
                type="number"
                name="harga_confirm"
                defaultValue={detailData.harga_confirm}
                className="p-2.5 bg-white text-[#1a113c] font-bold border-none rounded-lg text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#1a113c]">Pembayaran</h2>
           
          </div>

          <div className="flex flex-col gap-4">
            {(isSMI || isDPL) && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase">
                  Tahap 1
                </h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="nominal_bayar_1_bkk"
                    defaultValue={detailData.nominal_bayar_1_bkk}
                    placeholder="Nominal BKK"
                    className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                  />
                  <input
                    type="date"
                    name="tanggal_bayar_1_bkk"
                    defaultValue={toInputDate(detailData.tanggal_bayar_1_bkk)}
                    className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none focus:border-[#2e004f]"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="nominal_bayar_1_bkm"
                    defaultValue={detailData.nominal_bayar_1_bkm}
                    placeholder="Nominal BKM"
                    className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                  />
                  <input
                    type="date"
                    name="tanggal_bayar_1_bkm"
                    defaultValue={toInputDate(detailData.tanggal_bayar_1_bkm)}
                    className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none focus:border-[#2e004f]"
                  />
                </div>
              </div>
            )}

            {isSMI && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col gap-3 animate-in fade-in zoom-in duration-300">
                <h3 className="text-xs font-bold text-blue-700 uppercase">
                  Biaya Jasa (SMI)
                </h3>
                <input
                  type="number"
                  name="biaya_jasa"
                  defaultValue={detailData.biaya_jasa}
                  placeholder="Nominal Biaya Jasa"
                  className="w-full p-2.5 border border-blue-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                />
              </div>
            )}

            {isDPL && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-3 animate-in fade-in zoom-in duration-300">
                <h3 className="text-xs font-bold text-gray-500 uppercase">
                  Tahap 2 (Pelunasan)
                </h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="nominal_bayar_2"
                    defaultValue={detailData.nominal_bayar_2}
                    placeholder="Nominal Bayar 2"
                    className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                  />
                  <input
                    type="date"
                    name="tanggal_bayar_2"
                    defaultValue={toInputDate(detailData.tanggal_bayar_2)}
                    className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none focus:border-[#2e004f]"
                  />
                </div>
              </div>
            )}

            {isUmum && (
              <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">
                    Pembayaran 1
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="nominal_bayar_1_bkm"
                      defaultValue={detailData.nominal_bayar_1_bkm}
                      placeholder="Nominal Bayar 1"
                      className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                    />
                    <input
                      type="date"
                      name="tanggal_bayar_1_bkm"
                      defaultValue={toInputDate(detailData.tanggal_bayar_1_bkm)}
                      className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none focus:border-[#2e004f]"
                    />
                  </div>
                  <input
                    type="text"
                    name="deskripsi_1"
                    defaultValue={detailData.deskripsi_1 || ""}
                    placeholder="Deskripsi / Keterangan (Opsional)"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs italic outline-none focus:border-[#2e004f]"
                  />
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">
                    Pembayaran 2
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="nominal_bayar_2"
                      defaultValue={detailData.nominal_bayar_2}
                      placeholder="Nominal Bayar 2"
                      className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                    />
                    <input
                      type="date"
                      name="tanggal_bayar_2"
                      defaultValue={toInputDate(detailData.tanggal_bayar_2)}
                      className="w-1/2 p-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none focus:border-[#2e004f]"
                    />
                  </div>
                  <input
                    type="text"
                    name="deskripsi_2"
                    defaultValue={detailData.deskripsi_2 || ""}
                    placeholder="Deskripsi / Keterangan (Opsional)"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs italic outline-none focus:border-[#2e004f]"
                  />
                </div>
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
