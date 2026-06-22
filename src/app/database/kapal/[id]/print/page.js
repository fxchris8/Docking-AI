import { getAllPerbaikan } from "@/services/perbaikan.service";
import { createClient } from "@/utils/supabase/server";
import { formatRupiah, formatDate } from "@/utils/formatters";
import PrintTrigger from "@/components/ui/PrintTrigger";

export default async function PrintKapal({ params, searchParams }) {
  const id = (await params).id;
  const sp = await searchParams;
  const selectedYear = sp?.year || "";
  const selectedTempat = sp?.tempat || "";
  const selectedStatus = sp?.status || "";

  const supabase = await createClient();

  const { data: kapal } = await supabase
    .from("kapal")
    .select("*")
    .eq("id_kapal", id)
    .single();

  if (!kapal) {
    return (
      <html>
        <body style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          Data kapal tidak ditemukan.
        </body>
      </html>
    );
  }

  const allPerbaikan = await getAllPerbaikan();
  const perbaikanKapal = allPerbaikan.filter((item) => item.id_kapal === Number(id));

  let filteredData = perbaikanKapal;
  if (selectedYear) {
    filteredData = filteredData.filter(
      (item) => item.waktu_masuk && new Date(item.waktu_masuk).getFullYear().toString() === selectedYear
    );
  }
  if (selectedTempat) {
    filteredData = filteredData.filter((item) => item.nama_tempat === selectedTempat);
  }
  if (selectedStatus) {
    filteredData = filteredData.filter((item) => item.nama_status === selectedStatus);
  }

  // Statistik (logika sama dengan halaman view)
  const jumlahDocking = filteredData.length;
  let totalBiaya = 0;
  let rataWaktu = 0;
  let rataBiaya = 0;

  if (jumlahDocking === 1) {
    rataWaktu = Number(filteredData[0].realisasi_waktu_hari) || Number(filteredData[0].budget_time) || 0;
    totalBiaya = Number(filteredData[0].total_pembayaran) || 0;
    rataBiaya = totalBiaya;
  } else if (jumlahDocking > 1) {
    let sumHari = 0, countHari = 0, sumBiaya = 0, countBiaya = 0;
    filteredData.forEach((d) => {
      const biaya = Number(d.total_pembayaran) || 0;
      const hari = Number(d.realisasi_waktu_hari) || Number(d.budget_time) || 0;
      totalBiaya += biaya;
      if (hari > 0) { sumHari += hari; countHari++; }
      if (biaya > 0) { sumBiaya += biaya; countBiaya++; }
    });
    rataWaktu = countHari > 0 ? Math.round(sumHari / countHari) : 0;
    rataBiaya = countBiaya > 0 ? Math.round(sumBiaya / countBiaya) : 0;
  }

  return (
    <html>
      <head>
        <title>Laporan Detail Kapal - {kapal.nama_kapal}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1a113c;
            padding: 2.5rem;
            font-size: 10.5pt;
            line-height: 1.5;
          }
          .kop {
            display: flex; align-items: center; gap: 1.5rem;
            border-bottom: 2px solid #2e004f; padding-bottom: 1.5rem; margin-bottom: 2rem;
          }
          .kop img { width: 70px; height: auto; }
          .kop .company { flex: 1; }
          .kop .company h1 { font-size: 16pt; color: #2e004f; margin-bottom: 0.2rem; }
          .kop .company p { font-size: 9pt; color: #555; }
          .kop .doc-id { text-align: right; font-weight: bold; font-size: 14pt; color: #2e004f; }

          .kapal-info { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
          .kapal-info .info-box {
            flex: 1; min-width: 150px; border: 1px solid #ddd; border-radius: 8px; padding: 0.8rem; text-align: center;
          }
          .kapal-info .info-box .label { font-size: 9pt; color: #666; text-transform: uppercase; }
          .kapal-info .info-box .value { font-size: 14pt; font-weight: bold; color: #1a113c; margin-top: 0.2rem; }

          .summary { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
          .summary-card {
            flex: 1; min-width: 160px; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; text-align: center;
          }
          .summary-card .label { font-size: 9pt; color: #666; text-transform: uppercase; }
          .summary-card .value { font-size: 18pt; font-weight: bold; color: #1a113c; margin-top: 0.3rem; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
          th {
            background: #f3f4f6; font-weight: 600; font-size: 9pt; text-transform: uppercase;
            letter-spacing: 0.5px; color: #444; border: 1px solid #ccc; padding: 0.5rem; text-align: left;
          }
          td { border: 1px solid #ccc; padding: 0.4rem 0.5rem; vertical-align: top; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .bold { font-weight: 700; }

          .footer { margin-top: 2.5rem; text-align: right; font-size: 9pt; color: #777; border-top: 1px solid #eee; padding-top: 1rem; }

          @media print {
            body { padding: 1.2cm; }
            @page { size: landscape; margin: 0; }
          }
        `}</style>
      </head>
      <body>
        {/* KOP */}
        <div className="kop">
          <img src="/Logo.png" alt="SPIL Logo" />
          <div className="company">
            <h1>PT Salam Pacific Indonesia Lines</h1>
            <p>Laporan Detail Kapal</p>
          </div>
          <div className="doc-id">
            {kapal.nama_kapal}
            {selectedYear ? ` / Tahun ${selectedYear}` : ""}
            {selectedTempat ? ` / Lokasi ${selectedTempat}` : ""}
            {selectedStatus ? ` / Status ${selectedStatus}` : ""}
          </div>
        </div>

        {/* Informasi Kapal */}
        <div className="kapal-info">
          <div className="info-box">
            <div className="label">Vessel ID</div>
            <div className="value">{kapal.vessel_id || "-"}</div>
          </div>
          <div className="info-box">
            <div className="label">Flat Bottom</div>
            <div className="value">{kapal.flat_bottom || 0}</div>
          </div>
          <div className="info-box">
            <div className="label">Vertical Side</div>
            <div className="value">{kapal.vertical_side || 0}</div>
          </div>
          <div className="info-box">
            <div className="label">Bottop</div>
            <div className="value">{kapal.bottop || 0}</div>
          </div>
          <div className="info-box">
            <div className="label">Topside</div>
            <div className="value">{kapal.topside || 0}</div>
          </div>
        </div>

        {/* Ringkasan Statistik */}
        <div className="summary">
          <div className="summary-card">
            <div className="label">Jumlah Docking</div>
            <div className="value">{jumlahDocking}</div>
          </div>
          <div className="summary-card">
            <div className="label">Total Biaya</div>
            <div className="value">{formatRupiah(totalBiaya)}</div>
          </div>
          <div className="summary-card">
            <div className="label">Rata‑rata Waktu</div>
            <div className="value">{rataWaktu} Hari</div>
          </div>
          <div className="summary-card">
            <div className="label">Rata‑rata Biaya</div>
            <div className="value">{formatRupiah(rataBiaya)}</div>
          </div>
        </div>

        {/* Tabel Riwayat Docking */}
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>ID Nota</th>
              <th>Lokasi</th>
              <th>Tgl Masuk</th>
              <th>Tgl Keluar</th>
              <th>Status</th>
              <th className="text-right">Total Bayar</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => (
                <tr key={item.id_perbaikan}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="bold">DC-{item.id_perbaikan}</td>
                  <td>{item.nama_tempat || "-"}</td>
                  <td>{formatDate(item.waktu_masuk)}</td>
                  <td>{formatDate(item.waktu_keluar)}</td>
                  <td>{item.nama_status || "-"}</td>
                  <td className="text-right">{formatRupiah(item.total_pembayaran)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center">Tidak ada riwayat docking.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="footer">
          <p>Dicetak oleh Sistem Manajemen Docking SPIL</p>
          <p>{new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <PrintTrigger />
      </body>
    </html>
  );
}