"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMaintenanceDetail } from "@/actions/maintenance.action";

export default function EditPembayaranModal({ perbaikanId, initialData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    formData.set(
      "status_pembayaran",
      formData.get("status_pembayaran") || "lunas",
    ); // kalau tidak dipilih, default lunas
    const res = await updateMaintenanceDetail(perbaikanId, formData);
    setIsLoading(false);
    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  // bantu set format tanggal untuk input date
  const toInputDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-200 transition-all"
      >
        Edit Pembayaran
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1a113c]/40 backdrop-blur-sm"
            onClick={() => !isLoading && setIsOpen(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1a113c]">
                Edit Pembayaran
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase">
                      Nominal Bayar {num}
                    </label>
                    <input
                      type="number"
                      name={`nominal_bayar_${num}`}
                      defaultValue={initialData[`nominal_bayar_${num}`] || ""}
                      placeholder="Rp"
                      className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                    />
                    <input
                      type="date"
                      name={`tanggal_bayar_${num}`}
                      defaultValue={toInputDate(
                        initialData[`tanggal_bayar_${num}`],
                      )}
                      className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Status Pembayaran
                </label>
                <select
                  name="status_pembayaran"
                  defaultValue={initialData.status_pembayaran || "belum lunas"}
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2e004f]"
                >
                  <option value="belum lunas">Belum Lunas</option>
                  <option value="lunas">Lunas</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-[#2e004f] rounded-lg text-sm font-semibold text-white hover:bg-[#1a0035]"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Pembayaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
