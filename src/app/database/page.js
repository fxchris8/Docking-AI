import SideBar from "@/components/ui/sidebar";
import { getMasterDataForForm } from "@/services/perbaikan.service";
import DatabaseClient from "./DatabaseClient";

export default async function DatabasePage() {
  const masterData = await getMasterDataForForm();

  // fallback jika data kosong
  const kapal = masterData?.kapal ?? [];
  const tempat = masterData?.tempat ?? [];
  const superintendent = masterData?.superintendent ?? [];
  const status = masterData?.status ?? [];
  const cat = masterData?.cat ?? [];

  return (
    <div className="w-full flex min-h-screen font-sans bg-[#f3f2f7]">
      <SideBar />
      <DatabaseClient
        dataKapal={kapal}
        dataTempat={tempat}
        dataSuperintendent={superintendent}
        dataStatus={status}
        dataCat={cat}
      />
    </div>
  );
}