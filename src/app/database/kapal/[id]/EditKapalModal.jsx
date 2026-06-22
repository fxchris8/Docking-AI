"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { simpanKapal } from "@/actions/master.action";

export default function EditKapalModal({ kapal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    formData.set("id_kapal", kapal.id_kapal);
    const res = await simpanKapal(formData);
    setIsLoading(false);
    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm font-bold shadow-sm text-blue-600 hover:bg-blue-100 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
          <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/>
        </svg>
        Edit Kapal
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1a113c]/40 backdrop-blur-sm" onClick={() => !isLoading && setIsOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1a113c]">Edit Kapal</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">Vessel ID</label>
                  <input name="vessel_id" defaultValue={kapal.vessel_id || ""} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]" />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#2e004f] uppercase">Nama Armada *</label>
                  <input name="nama_kapal" defaultValue={kapal.nama_kapal || ""} required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]" />
                </div>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-200 pb-2">Dimensi Fisik (Opsional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {["flat_bottom", "vertical_side", "bottop", "topside"].map((dim) => (
                    <div key={dim} className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-600 capitalize">{dim.replace("_", " ")}</label>
                      <input name={dim} type="number" defaultValue={kapal[dim] || ""} placeholder="0" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  ))}
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