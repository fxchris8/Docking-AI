"use client";
import { useState, useMemo } from "react";
import {
  simpanKapal,
  hapusKapal,
  simpanTempat,
  hapusTempat,
  simpanSuperintendent,
  hapusSuperintendent,
} from "@/actions/master.action";

export default function DatabaseClient({
  dataKapal,
  dataTempat,
  dataSuperintendent,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const [isModalKapal, setIsModalKapal] = useState(false);
  const [editKapal, setEditKapal] = useState(null);
  const [searchKapal, setSearchKapal] = useState("");

  const [isModalTempat, setIsModalTempat] = useState(false);
  const [editTempat, setEditTempat] = useState(null);
  const [searchTempat, setSearchTempat] = useState("");

  const [isModalSup, setIsModalSup] = useState(false);
  const [editSup, setEditSup] = useState(null);
  const [searchSup, setSearchSup] = useState("");

  const confirmDelete = async (actionFn, id, name) => {
    if (confirm(`Yakin ingin menghapus ${name}?`)) {
      const res = await actionFn(id);
      if (!res.success) alert(res.message);
    }
  };

  const submitData = async (e, actionFn, closeModalFn) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const res = await actionFn(formData);
    setIsLoading(false);
    if (res.success) {
      closeModalFn(false);
    } else {
      alert(res.message);
    }
  };

  const filteredKapal = useMemo(() => {
    if (!searchKapal) return dataKapal;
    return dataKapal.filter(
      (k) =>
        k.nama_kapal.toLowerCase().includes(searchKapal.toLowerCase()) ||
        (k.vessel_id &&
          k.vessel_id.toLowerCase().includes(searchKapal.toLowerCase())),
    );
  }, [dataKapal, searchKapal]);

  const filteredTempat = useMemo(() => {
    if (!searchTempat) return dataTempat;
    return dataTempat.filter((t) =>
      t.nama_tempat.toLowerCase().includes(searchTempat.toLowerCase()),
    );
  }, [dataTempat, searchTempat]);

  const filteredSup = useMemo(() => {
    if (!searchSup) return dataSuperintendent;
    return dataSuperintendent.filter(
      (s) =>
        s.nama_superintendent.toLowerCase().includes(searchSup.toLowerCase()) ||
        (s.jabatan &&
          s.jabatan.toLowerCase().includes(searchSup.toLowerCase())) ||
        (s.asal_kota &&
          s.asal_kota.toLowerCase().includes(searchSup.toLowerCase())),
    );
  }, [dataSuperintendent, searchSup]);

  return (
    <div className="main flex-1 p-10 flex flex-col gap-8 text-gray-800 h-screen overflow-y-auto">
      <div className="header flex w-full justify-between items-center">
        <div className="header-left gap-1 flex flex-col">
          <h1 className="title text-[32px] font-bold text-[#1a113c]">
            Database Master
          </h1>
          <p className="subtitle text-[15px] font-medium text-gray-500">
            Kelola entitas data inti terkait armada dan pihak perbaikan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between ">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Total Armada
            </p>
            <h3 className="text-3xl font-bold text-[#1a113c]">
              {dataKapal.length}{" "}
              <span className="text-sm font-medium text-gray-500">Kapal</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-green-100 text-[#2e004f] rounded-xl flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              fill="#00b315"
              viewBox="0 0 256 256"
            >
              <path d="M221.06,110.59,208,106.23V56a16,16,0,0,0-16-16H136V24a8,8,0,0,0-16,0V40H64A16,16,0,0,0,48,56v50.23l-13.06,4.36A16,16,0,0,0,24,125.77V152c0,61.54,97.89,86.72,102.06,87.76a8,8,0,0,0,3.88,0C134.11,238.72,232,213.54,232,152V125.77A16,16,0,0,0,221.06,110.59ZM64,56H192v44.9L130.53,80.41a8,8,0,0,0-5.06,0L64,100.9Zm152,96c0,24.91-23.68,43-43.55,53.83A228.13,228.13,0,0,1,128,223.72,226.85,226.85,0,0,1,83.81,206C47.6,186.35,40,165.79,40,152V125.77L120,99.1V168a8,8,0,0,0,16,0V99.1l80,26.67Z"></path>
            </svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between ">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Lokasi Docking
            </p>
            <h3 className="text-3xl font-bold text-[#1a113c]">
              {dataTempat.length}{" "}
              <span className="text-sm font-medium text-gray-500">
                Galangan
              </span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="#ff9b0f"
              viewBox="0 0 256 256"
            >
              <path d="M200,224H150.54A266.56,266.56,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25a88,88,0,0,0-176,0c0,31.4,14.51,64.68,42,96.25A266.56,266.56,0,0,0,105.46,224H56a8,8,0,0,0,0,16H200a8,8,0,0,0,0-16ZM56,104a72,72,0,0,1,144,0c0,57.23-55.47,105-72,118C111.47,209,56,161.23,56,104Zm112,0a40,40,0,1,0-40,40A40,40,0,0,0,168,104Zm-64,0a24,24,0,1,1,24,24A24,24,0,0,1,104,104Z"></path>
            </svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between ">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Personil Pengawas
            </p>
            <h3 className="text-3xl font-bold text-[#1a113c]">
              {dataSuperintendent.length}{" "}
              <span className="text-sm font-medium text-gray-500">Orang</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="#0a81ff"
              viewBox="0 0 256 256"
            >
              <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-[#2e004f] uppercase tracking-wider">
                Entitas Armada
              </p>
              <h3 className="text-xl font-bold text-[#1a113c]">Daftar Kapal</h3>
            </div>
            <button
              onClick={() => {
                setEditKapal(null);
                setIsModalKapal(true);
              }}
              className="px-3 py-1.5 bg-[#2e004f]/10 text-[#2e004f] hover:bg-[#2e004f] hover:text-white rounded-lg text-xs font-bold transition-all"
            >
              + Tambah
            </button>
          </div>

          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Cari kapal atau ID..."
              value={searchKapal}
              onChange={(e) => setSearchKapal(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2e004f]"
            />
            {searchKapal && (
              <button
                onClick={() => setSearchKapal("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredKapal.map((k) => (
              <div
                key={k.id_kapal}
                className="group p-3 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-[#2e004f]/20 flex items-center justify-between rounded-xl transition-all"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#1a113c]">
                    {k.nama_kapal}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    ID: {k.vessel_id || "-"}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={() => {
                      setEditKapal(k);
                      setIsModalKapal(true);
                    }}
                    className="text-blue-500 hover:bg-blue-100 p-1.5 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#2970ff"
                      viewBox="0 0 256 256"
                    >
                      <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      confirmDelete(hapusKapal, k.id_kapal, k.nama_kapal)
                    }
                    className="text-red-500 hover:bg-red-100 p-1.5 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#ff2929"
                      viewBox="0 0 256 256"
                    >
                      <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-[#2e004f] uppercase tracking-wider">
                Entitas Perusahaan
              </p>
              <h3 className="text-xl font-bold text-[#1a113c]">Lokasi Dok</h3>
            </div>
            <button
              onClick={() => {
                setEditTempat(null);
                setIsModalTempat(true);
              }}
              className="px-3 py-1.5 bg-[#2e004f]/10 text-[#2e004f] hover:bg-[#2e004f] hover:text-white rounded-lg text-xs font-bold transition-all"
            >
              + Tambah
            </button>
          </div>

          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Cari lokasi dok..."
              value={searchTempat}
              onChange={(e) => setSearchTempat(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2e004f]"
            />
            {searchTempat && (
              <button
                onClick={() => setSearchTempat("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredTempat.map((t) => (
              <div
                key={t.id_tempat}
                className="group p-3 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-[#2e004f]/20 flex items-center justify-between rounded-xl transition-all"
              >
                <span className="font-semibold text-sm text-[#1a113c]">
                  {t.nama_tempat}
                </span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={() => {
                      setEditTempat(t);
                      setIsModalTempat(true);
                    }}
                    className="text-blue-500 hover:bg-blue-100 p-1.5 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#2970ff"
                      viewBox="0 0 256 256"
                    >
                      <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      confirmDelete(hapusTempat, t.id_tempat, t.nama_tempat)
                    }
                    className="text-red-500 hover:bg-red-100 p-1.5 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#ff2929"
                      viewBox="0 0 256 256"
                    >
                      <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-[#2e004f] uppercase tracking-wider">
                Entitas Personil
              </p>
              <h3 className="text-xl font-bold text-[#1a113c]">Pengawas</h3>
            </div>
            <button
              onClick={() => {
                setEditSup(null);
                setIsModalSup(true);
              }}
              className="px-3 py-1.5 bg-[#2e004f]/10 text-[#2e004f] hover:bg-[#2e004f] hover:text-white rounded-lg text-xs font-bold transition-all"
            >
              + Tambah
            </button>
          </div>

          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Cari pengawas, kota, jabatan..."
              value={searchSup}
              onChange={(e) => setSearchSup(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2e004f]"
            />
            {searchSup && (
              <button
                onClick={() => setSearchSup("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredSup.map((s) => (
              <div
                key={s.id_superintendent}
                className="group p-3 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-[#2e004f]/20 flex items-center justify-between rounded-xl transition-all"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#1a113c]">
                    {s.nama_superintendent}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {s.jabatan || "-"} | {s.asal_kota || "-"}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={() => {
                      setEditSup(s);
                      setIsModalSup(true);
                    }}
                    className="text-blue-500 hover:bg-blue-100 p-1.5 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#2970ff"
                      viewBox="0 0 256 256"
                    >
                      <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      confirmDelete(
                        hapusSuperintendent,
                        s.id_superintendent,
                        s.nama_superintendent,
                      )
                    }
                    className="text-red-500 hover:bg-red-100 p-1.5 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#ff2929"
                      viewBox="0 0 256 256"
                    >
                      <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalKapal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1a113c]/40 backdrop-blur-sm"
            onClick={() => !isLoading && setIsModalKapal(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1a113c]">
                {editKapal ? "Edit Kapal" : "Tambah Kapal Baru"}
              </h2>
              <button
                onClick={() => setIsModalKapal(false)}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                if (editKapal)
                  e.target.insertAdjacentHTML(
                    "beforeend",
                    `<input type="hidden" name="id_kapal" value="${editKapal.id_kapal}" />`,
                  );
                submitData(e, simpanKapal, setIsModalKapal);
              }}
              className="p-6 flex flex-col gap-5"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Vessel ID
                  </label>
                  <input
                    name="vessel_id"
                    defaultValue={editKapal?.vessel_id || ""}
                    placeholder="Ex: TRA"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#2e004f] uppercase">
                    Nama Armada *
                  </label>
                  <input
                    name="nama_kapal"
                    defaultValue={editKapal?.nama_kapal || ""}
                    required
                    placeholder="Nama lengkap kapal"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-200 pb-2">
                  Dimensi Fisik (Opsional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-600">
                      Flat Bottom
                    </label>
                    <input
                      name="flat_bottom"
                      type="number"
                      defaultValue={editKapal?.flat_bottom || ""}
                      placeholder="0"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-600">
                      Vertical Side
                    </label>
                    <input
                      name="vertical_side"
                      type="number"
                      defaultValue={editKapal?.vertical_side || ""}
                      placeholder="0"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-600">
                      Bottop
                    </label>
                    <input
                      name="bottop"
                      type="number"
                      defaultValue={editKapal?.bottop || ""}
                      placeholder="0"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-600">
                      Topside
                    </label>
                    <input
                      name="topside"
                      type="number"
                      defaultValue={editKapal?.topside || ""}
                      placeholder="0"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-[#2e004f] rounded-lg text-sm font-semibold text-white hover:bg-[#1a0035]"
                >
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalTempat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1a113c]/40 backdrop-blur-sm"
            onClick={() => !isLoading && setIsModalTempat(false)}
          ></div>
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1a113c]">
                {editTempat ? "Edit Lokasi" : "Tambah Lokasi"}
              </h2>
              <button
                onClick={() => setIsModalTempat(false)}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                if (editTempat)
                  e.target.insertAdjacentHTML(
                    "beforeend",
                    `<input type="hidden" name="id_tempat" value="${editTempat.id_tempat}" />`,
                  );
                submitData(e, simpanTempat, setIsModalTempat);
              }}
              className="p-6 flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e004f] uppercase">
                  Nama Perusahaan / Galangan *
                </label>
                <input
                  name="nama_tempat"
                  defaultValue={editTempat?.nama_tempat || ""}
                  required
                  placeholder="PT. Nama Galangan"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-[#2e004f] rounded-lg text-sm font-semibold text-white hover:bg-[#1a0035]"
                >
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalSup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1a113c]/40 backdrop-blur-sm"
            onClick={() => !isLoading && setIsModalSup(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1a113c]">
                {editSup ? "Edit Personil" : "Tambah Personil"}
              </h2>
              <button
                onClick={() => setIsModalSup(false)}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                if (editSup)
                  e.target.insertAdjacentHTML(
                    "beforeend",
                    `<input type="hidden" name="id_superintendent" value="${editSup.id_superintendent}" />`,
                  );
                submitData(e, simpanSuperintendent, setIsModalSup);
              }}
              className="p-6 flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e004f] uppercase">
                  Nama Personil *
                </label>
                <input
                  name="nama_superintendent"
                  defaultValue={editSup?.nama_superintendent || ""}
                  required
                  placeholder="Nama Lengkap"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Jabatan
                  </label>
                  <select
                    name="jabatan"
                    defaultValue={editSup?.jabatan || ""}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                  >
                    <option value="SI">SI</option>
                    <option value="Asst. SI">Asst. SI</option>
                    <option value="SS">SS</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Asal Kota
                  </label>
                  <input
                    name="asal_kota"
                    defaultValue={editSup?.asal_kota || ""}
                    placeholder="Contoh: Surabaya"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-[#2e004f] rounded-lg text-sm font-semibold text-white hover:bg-[#1a0035]"
                >
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
