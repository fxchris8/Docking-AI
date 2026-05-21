import SideBar from "@/components/ui/sidebar";
import pool from "@/lib/db";
import DatabaseClient from "./DatabaseClient";

export default async function DatabasePage() {
  const [kapal, tempat, superintendent, status, cat] = await Promise.all([
    pool.query("SELECT * FROM kapal ORDER BY id_kapal DESC"),
    pool.query("SELECT * FROM tempat_perbaikan ORDER BY nama_tempat ASC"),
    pool.query(
      "SELECT * FROM superintendent ORDER BY jabatan ASC, nama_superintendent ASC",
    ),
    pool.query("SELECT * FROM kategori_status ORDER BY id_status ASC"),
    pool.query("SELECT * FROM kategori_cat ORDER BY id_cat ASC"),
  ]);

  return (
    <div className="w-full flex min-h-screen font-sans bg-[#f3f2f7]">
      <SideBar />
      <DatabaseClient
        dataKapal={kapal.rows}
        dataTempat={tempat.rows}
        dataSuperintendent={superintendent.rows}
        dataStatus={status.rows}
        dataCat={cat.rows}
      />
    </div>
  );
}
