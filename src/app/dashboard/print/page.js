import { getAllPerbaikan } from "@/services/perbaikan.service";
import { formatRupiah, formatDate } from "@/utils/formatters";
import PrintTrigger from "@/components/ui/PrintTrigger";

// Pindahkan title ke Metadata API Next.js
export const metadata = {
  title: "Laporan Dashboard Docking",
};

export default async function PrintDashboard({ searchParams }) {
  const sp = await searchParams;
  const selectedYear = sp?.year || "";
  const selectedMonth = sp?.month || "";

  const rawData = await getAllPerbaikan();

  // Filter data
  let filteredRawData = rawData;
  if (selectedYear) {
    filteredRawData = filteredRawData.filter(
      (item) =>
        item.waktu_masuk &&
        new Date(item.waktu_masuk).getFullYear().toString() === selectedYear,
    );
  }
  if (selectedMonth) {
    filteredRawData = filteredRawData.filter(
      (item) =>
        item.waktu_masuk &&
        (new Date(item.waktu_masuk).getMonth() + 1).toString() ===
          selectedMonth,
    );
  }

  const dockingData = filteredRawData
    .map((item) => ({
      id: `DC-${item.id_perbaikan}`,
      name: item.daftar_superintendent || "-",
      ship: item.nama_kapal || "N/A",
      tempat: item.nama_tempat || "N/A",
      type: item.nama_cat || "General Docking",
      date: item.waktu_masuk,
      dateout: item.waktu_turun,
      biaya: Number(item.total_pembayaran) || 0,
      realisasi_hari: Number(item.realisasi_waktu_hari) || 0,
      rawId: item.id_perbaikan,
    }))
    .sort((a, b) => b.rawId - a.rawId);

  const ongoingData = dockingData.filter(
    (item) =>
      !filteredRawData.find((d) => d.id_perbaikan === item.rawId)
        ?.waktu_mulai_operasi,
  );

  const totalKapal = ongoingData.length;
  const totalBiaya = dockingData.reduce((acc, curr) => acc + curr.biaya, 0);

  const validHariData = ongoingData.filter((d) => d.realisasi_hari > 0);
  const rataHari =
    validHariData.length > 0
      ? Math.round(
          validHariData.reduce((acc, curr) => acc + curr.realisasi_hari, 0) /
            validHariData.length,
        )
      : 0;

  const biayaOngoing = ongoingData.map((d) => d.biaya).filter((b) => b > 0);
  const rataBiaya =
    biayaOngoing.length > 0
      ? Math.round(
          biayaOngoing.reduce((a, b) => a + b, 0) / biayaOngoing.length,
        )
      : 0;

  const getMonthName = (monthIndex) =>
    new Date(0, monthIndex - 1).toLocaleString("id-ID", { month: "long" });

  return (
    // Menggunakan div sebagai wrapper utama menggantikan html/body
    <div className="print-wrapper bg-white min-h-screen text-black">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .print-wrapper {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1a113c;
          padding: 2.5rem;
          font-size: 10.5pt;
          line-height: 1.5;
        }

        .kop {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          border-bottom: 2px solid #2e004f;
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }
        .kop img { width: 70px; height: auto; }
        .kop .company { flex: 1; }
        .kop .company h1 {
          font-size: 16pt;
          color: #2e004f;
          margin-bottom: 0.2rem;
        }
        .kop .company p {
          font-size: 9pt;
          color: #555;
        }
        .kop .doc-id {
          text-align: right;
          font-weight: bold;
          font-size: 14pt;
          color: #2e004f;
        }

        .summary {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .summary-card {
          flex: 1;
          min-width: 160px;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }
        .summary-card .label {
          font-size: 9pt;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-card .value {
          font-size: 18pt;
          font-weight: bold;
          color: #1a113c;
          margin-top: 0.3rem;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
          page-break-inside: auto;
        }
        th {
          background: #f3f4f6;
          font-weight: 600;
          font-size: 9pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #444;
          border: 1px solid #ccc;
          padding: 0.5rem;
          text-align: left;
        }
        td {
          border: 1px solid #ccc;
          padding: 0.4rem 0.5rem;
          vertical-align: top;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: 700; }

        .footer {
          margin-top: 2.5rem;
          text-align: right;
          font-size: 9pt;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 1rem;
        }

        /* Styling khusus saat window.print() dijalankan */
        @media print {
          @page { 
            size: landscape; 
            margin: 1cm; 
          }
          
          /* 1. Paksa SEMUA parent element (html, body, main, dan div pembungkus layout) 
                agar tidak menyembunyikan konten yang panjang */
          html, body, body > div, main {
            height: auto !important; 
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important; 
          }

          /* 2. Sembunyikan elemen bawaan dashboard (misal ada sidebar/header yang ikut ter-render) */
          body * {
            visibility: hidden;
          }

          /* 3. Tampilkan HANYA area .print-wrapper dan semua anak-anaknya */
          .print-wrapper, .print-wrapper * {
            visibility: visible;
          }

          /* 4. Tarik konten ke paling atas kiri agar pas di kertas */
          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important; /* Hapus padding agar margin @page bekerja maksimal */
          }

          /* Paksa warna background dan border tercetak */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* KOP */}
      <div className="kop">
        <img src="/Logo.png" alt="SPIL Logo" />
        <div className="company">
          <h1>PT Salam Pacific Indonesia Lines</h1>
          <p>Laporan Dashboard Docking</p>
        </div>
        <div className="doc-id">
          {selectedYear ? `Tahun ${selectedYear}` : "Semua Tahun"}
          {selectedMonth ? ` / ${getMonthName(selectedMonth)}` : ""}
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="summary">
        <div className="summary-card">
          <div className="label">Kapal Didocking</div>
          <div className="value">{totalKapal} Unit</div>
        </div>
        <div className="summary-card">
          <div className="label">Rata-rata Waktu</div>
          <div className="value">{rataHari} Hari</div>
        </div>
        <div className="summary-card">
          <div className="label">Rata-rata Biaya</div>
          <div className="value">{formatRupiah(rataBiaya)}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Biaya Docking</div>
          <div className="value">{formatRupiah(totalBiaya)}</div>
        </div>
      </div>

      {/* Tabel Nota Docking Terbaru (5 teratas) */}
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>ID Nota</th>
            <th>Penanggung Jawab</th>
            <th>Kapal</th>
            <th>Lokasi Docking</th>
            <th>Tipe Docking</th>
            <th>Tgl Masuk</th>
            <th>Tgl Keluar</th>
            <th className="text-right">Total Bayar</th>
          </tr>
        </thead>
        <tbody>
          {dockingData.slice(0, 5).map((data, idx) => (
            <tr key={idx}>
              <td className="text-center">{idx + 1}</td>
              <td className="bold">{data.id}</td>
              <td>{data.name}</td>
              <td>{data.ship}</td>
              <td>{data.tempat}</td>
              <td>{data.type}</td>
              <td>{formatDate(data.date)}</td>
              <td>{formatDate(data.dateout)}</td>
              <td className="text-right">{formatRupiah(data.biaya)}</td>
            </tr>
          ))}
          {dockingData.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center">
                Belum ada data docking.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div className="footer">
        <p>Dicetak oleh Sistem Manajemen Docking SPIL</p>
        <p>
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <PrintTrigger />
    </div>
  );
}
