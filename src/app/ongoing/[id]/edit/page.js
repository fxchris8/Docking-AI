import SideBar from "@/components/ui/sidebar";
import Link from "next/link";
import {
  getPerbaikanById,
  getMasterDataForForm,
} from "@/services/perbaikan.service";
import EditDockingForm from "./EditDockingForm";

export default async function EditDockingPage({ params }) {
  const p = await params;
  const id = p.id;

  const [detailData, masterData] = await Promise.all([
    getPerbaikanById(id),
    getMasterDataForForm(),
  ]);

  if (!detailData) {
    return (
      <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
        <SideBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-bold text-[#1a113c]">
            Data Tidak Ditemukan
          </h2>
          <Link
            href="/ongoing"
            className="mt-4 px-6 py-2 bg-[#2e004f] text-white rounded-lg"
          >
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex min-h-screen bg-[#f3f2f7] font-sans">
      <SideBar />
      <div className="main flex-1 p-10 flex flex-col gap-6 text-gray-800 h-screen overflow-y-auto">
        <div className="header flex w-full justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <Link
              href={`/ongoing`}
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#2e004f] transition-all"
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
                Edit Nota #DC-{detailData.id_perbaikan}
              </h1>
              <p className="text-sm font-medium text-gray-500">
                Ubah informasi operasional dan rincian pembayaran docking.
              </p>
            </div>
          </div>
        </div>

        <EditDockingForm detailData={detailData} masterData={masterData} />
      </div>
    </div>
  );
}
