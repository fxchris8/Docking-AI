import { getAllPerbaikan } from "@/services/perbaikan.service";
import { formatRupiah, formatDate } from "@/utils/formatters";
import PrintTrigger from "@/components/ui/PrintTrigger";

// Pindahkan title ke Metadata API (Mencegah Hydration Error)
export const metadata = {
  title: "Laporan Daftar Docking (Selesai)",
};

export default async function PrintList({ searchParams }) {
  const sp = await searchParams;
  const searchTerm = sp?.search?.toLowerCase() || "";
  const selectedYear = sp?.year || "";
  const selectedMonth = sp?.month || "";
  const sortCol = sp?.sort || "id";
  const sortDir = sp?.dir || "desc";

  const rawDatas = await getAllPerbaikan();

  // PERBAIKAN 1: Samakan filter dengan halaman utama
  const rawData = rawDatas.filter(
    (item) => item.status_perbaikan === "selesai",
  );

  let dockingData = rawData.map((item) => ({
    rawId: item.id_perbaikan,
    id: `DC-${item.id_perbaikan}`,
    name: item.daftar_superintendent || "Belum Ditugaskan",
    ship: item.nama_kapal || "N/A",
    tempat: item.nama_tempat || "-",
    type: item.nama_cat || "General Docking",
    date: item.waktu_masuk,
    dateout: item.waktu_turun,
    biaya: Number(item.total_pembayaran) || 0,
    realisasi_hari: Number(item.realisasi_waktu_hari) || 0,
    // PERBAIKAN 2: Masukkan data status pembayaran
    status_pembayaran: item.status_pembayaran || "belum lunas",
  }));

  // Filtering
  if (selectedYear) {
    dockingData = dockingData.filter(
      (d) =>
        d.date && new Date(d.date).getFullYear().toString() === selectedYear,
    );
  }
  if (selectedMonth) {
    dockingData = dockingData.filter(
      (d) =>
        d.date &&
        (new Date(d.date).getMonth() + 1).toString() === selectedMonth,
    );
  }
  if (searchTerm) {
    dockingData = dockingData.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm),
      ),
    );
  }

  // Sorting
  dockingData.sort((a, b) => {
    if (sortCol === "id") {
      return sortDir === "asc" ? a.rawId - b.rawId : b.rawId - a.rawId;
    }
    let valA = a[sortCol] || "";
    let valB = b[sortCol] || "";
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalNota = dockingData.length;
  const totalBiaya = dockingData.reduce((acc, curr) => acc + curr.biaya, 0);
  const validHariData = dockingData.filter((d) => d.realisasi_hari > 0);
  const rataHari =
    validHariData.length > 0
      ? Math.round(
          validHariData.reduce((acc, curr) => acc + curr.realisasi_hari, 0) /
            validHariData.length,
        )
      : 0;

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const getMonthName = (monthIndex) => monthNames[monthIndex - 1] || "";

  return (
    // PERBAIKAN 3: Gunakan div sebagai wrapper utama
    <div className="print-wrapper bg-white min-h-screen text-black">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .print-wrapper {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1a113c;
          padding: 2.5rem;
          font-size: 9.5pt;
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
          font-size: 8pt;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-card .value {
          font-size: 16pt;
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
          font-size: 8.5pt;
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
          vertical-align: middle;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: 700; }

        /* Styling Badge Pembayaran */
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 7.5pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .badge-lunas { background: #dcfce7 !important; color: #166534 !important; }
        .badge-belum { background: #fee2e2 !important; color: #991b1b !important; }

        .footer {
          margin-top: 2.5rem;
          text-align: right;
          font-size: 9pt;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 1rem;
        }

        @media print {
          @page { size: landscape; margin: 0; }
          body { background: white !important; }
          .print-wrapper { padding: 1.2cm; }
        }
      `}</style>

      {/* KOP */}
      <div className="kop">
        <img src="/Logo.png" alt="SPIL Logo" />
        <div className="company">
          <h1>PT Salam Pacific Indonesia Lines</h1>
          <p>Laporan Docking Selesai (Daftar)</p>
        </div>
        <div className="doc-id">
          {selectedYear ? `Tahun ${selectedYear}` : "Semua Tahun"}
          {selectedMonth ? ` / ${getMonthName(selectedMonth)}` : ""}
          {searchTerm ? ` / Pencarian: "${searchTerm}"` : ""}
        </div>
      </div>

      {/* Ringkasan */}
      <div className="summary">
        <div className="summary-card">
          <div className="label">Total Nota Selesai</div>
          <div className="value">{totalNota} Data</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Biaya</div>
          <div className="value">{formatRupiah(totalBiaya)}</div>
        </div>
        <div className="summary-card">
          <div className="label">Rata-rata Waktu</div>
          <div className="value">{rataHari} Hari</div>
        </div>
      </div>

      {/* Tabel Docking */}
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
            <th className="text-center">Pembayaran</th>
            <th className="text-right">Total Bayar</th>
          </tr>
        </thead>
        <tbody>
          {dockingData.length > 0 ? (
            dockingData.map((data, idx) => (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td className="bold text-[#2e004f]">{data.id}</td>
                <td>{data.name}</td>
                <td className="bold">{data.ship}</td>
                <td>{data.tempat}</td>
                <td>{data.type}</td>
                <td>{formatDate(data.date)}</td>
                <td>{formatDate(data.dateout)}</td>
                <td className="text-center">
                  <span
                    className={`badge ${data.status_pembayaran === "lunas" ? "badge-lunas" : "badge-belum"}`}
                  >
                    {data.status_pembayaran === "lunas" ? "Lunas" : "Belum"}
                  </span>
                </td>
                <td className="text-right bold">{formatRupiah(data.biaya)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={10}
                className="text-center"
                style={{ padding: "2rem" }}
              >
                Tidak ada data arsip docking.
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
