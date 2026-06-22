"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { simpanSuperintendent } from "@/actions/master.action";

export default function EditSuperintendentModal({ superintendent }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    formData.set("id_superintendent", superintendent.id_superintendent);
    const res = await simpanSuperintendent(formData);
    setIsLoading(false);
    if (res.success) {
      setIsModalOpen(false);
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm font-bold shadow-sm text-blue-600 hover:bg-blue-100 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
          <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/>
        </svg>
        Edit Personil
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1a113c]/40 backdrop-blur-sm" onClick={() => !isLoading && setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1a113c]">Edit Personil</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e004f] uppercase">Nama Personil *</label>
                <input name="nama_superintendent" defaultValue={superintendent.nama_superintendent || ""} required placeholder="Nama Lengkap" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">Jabatan</label>
                  <select name="jabatan" defaultValue={superintendent.jabatan || ""} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]">
                    <option value="SI">SI</option>
                    <option value="Asst. SI">Asst. SI</option>
                    <option value="SS">SS</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">Asal Kota</label>
                  <input name="asal_kota" defaultValue={superintendent.asal_kota || ""} placeholder="Contoh: Surabaya" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-[#2e004f] rounded-lg text-sm font-semibold text-white hover:bg-[#1a0035]">{isLoading ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}