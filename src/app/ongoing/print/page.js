import { getAllPerbaikan } from "@/services/perbaikan.service";
import { formatRupiah, formatDate } from "@/utils/formatters";
import PrintTrigger from "@/components/ui/PrintTrigger";

// Pindahkan title ke Metadata API (Mencegah Hydration Error)
export const metadata = {
  title: "Laporan Ongoing Docking",
};

export default async function PrintOngoing({ searchParams }) {
  const sp = await searchParams;
  const searchTerm = sp?.search?.toLowerCase() || "";
  const selectedYear = sp?.year || "";
  const selectedMonth = sp?.month || "";
  const sortCol = sp?.sort || "id";
  const sortDir = sp?.dir || "desc";

  const rawDatas = await getAllPerbaikan();
  const safeRawDatas = Array.isArray(rawDatas) ? rawDatas : [];

  // PERBAIKAN 1: Samakan filter status dengan halaman utama agar data 100% akurat
  const rawData = safeRawDatas.filter(
    (item) => item.status_perbaikan === "ongoing",
  );

  let dockingData = rawData.map((item) => ({
    rawId: item.id_perbaikan,
    id: `DC-${item.id_perbaikan}`,
    name: item.daftar_superintendent || "Belum Ditugaskan",
    ship: item.nama_kapal || "N/A",
    tempat: item.nama_tempat || "-",
    type: item.nama_cat || "General Docking",
    status: item.nama_status || "-",
    status_detail: item.status_detail || "",
    date: item.waktu_masuk,
    target_hari: Number(item.budget_time) || 0,
    estimasi_biaya: Number(item.budget_cost) || 0,
    tgl_penawaran: item.tanggal_penawaran,
    tgl_kontrak: item.tanggal_kontrak,
    tgl_rekalbea: item.tanggal_rekalbea,
    tgl_confirm: item.tanggal_confirm,
    keterangan: item.keterangan || "-",
    // PERBAIKAN 2: Tambahkan status_pembayaran ke mapping data
    status_pembayaran: item.status_pembayaran || "belum lunas",
  }));

  // Filtering (Year, Month, Search)
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

  const totalEstimasi = dockingData.reduce(
    (acc, curr) => acc + curr.estimasi_biaya,
    0,
  );
  const rataTarget =
    dockingData.length > 0
      ? Math.round(
          dockingData.reduce((acc, curr) => acc + curr.target_hari, 0) /
            dockingData.length,
        )
      : 0;

  const getMonthName = (monthIndex) =>
    new Date(0, monthIndex - 1).toLocaleString("id-ID", { month: "long" });

  return (
    // PERBAIKAN 3: Gunakan div wrapper, hilangkan html/body agar tidak blank page
    <div className="print-wrapper bg-white min-h-screen text-black">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .print-wrapper {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1a113c;
          padding: 2.5rem;
          font-size: 8.5pt; /* Diperkecil sedikit agar muat 14 kolom */
          line-height: 1.4;
        }

        .kop {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          border-bottom: 2px solid #2e004f;
          padding-bottom: 1.5rem;
          margin-bottom: 1.5rem;
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
          min-width: 150px;
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
          font-size: 8pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #444;
          border: 1px solid #ccc;
          padding: 0.4rem;
          text-align: left;
          vertical-align: middle;
        }
        td {
          border: 1px solid #ccc;
          padding: 0.4rem;
          vertical-align: top;
          font-size: 8.5pt;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: 700; }
        
        /* Styling Badge Pembayaran Khusus Print */
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
          margin-top: 2rem;
          text-align: right;
          font-size: 8pt;
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
          <p>Laporan Docking Aktif (Ongoing)</p>
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
          <div className="label">Total Aktif</div>
          <div className="value">{dockingData.length} Unit</div>
        </div>
        <div className="summary-card">
          <div className="label">Rata-rata Target</div>
          <div className="value">{rataTarget} Hari</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Estimasi Budget</div>
          <div className="value">{formatRupiah(totalEstimasi)}</div>
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
            <th>Lokasi</th>
            <th>Status Perbaikan</th>
            <th className="text-center">Pembayaran</th>
            <th>Tgl Masuk</th>
            <th>Tgl Penawaran</th>
            <th>Tgl Kontrak</th>
            <th>Tgl Rekalbea</th>
            <th>Tgl Confirm</th>
            <th className="text-center">Target</th>
            <th className="text-right">Estimasi Biaya</th>
          </tr>
        </thead>
        <tbody>
          {dockingData.length > 0 ? (
            dockingData.map((data, index) => (
              <tr key={index}>
                <td className="text-center">{index + 1}</td>
                <td className="bold text-[#2e004f]">{data.id}</td>
                <td>{data.name}</td>
                <td className="bold">{data.ship}</td>
                <td>{data.tempat}</td>
                <td>
                  {data.status}
                  {data.status_detail ? (
                    <>
                      <br />
                      <span style={{ fontSize: "7pt", color: "#666" }}>
                        ({data.status_detail})
                      </span>
                    </>
                  ) : (
                    ""
                  )}
                </td>
                <td className="text-center">
                  <span
                    className={`badge ${data.status_pembayaran === "lunas" ? "badge-lunas" : "badge-belum"}`}
                  >
                    {data.status_pembayaran === "lunas" ? "Lunas" : "Belum"}
                  </span>
                </td>
                <td>{formatDate(data.date)}</td>
                <td>{formatDate(data.tgl_penawaran)}</td>
                <td>{formatDate(data.tgl_kontrak)}</td>
                <td>{formatDate(data.tgl_rekalbea)}</td>
                <td>{formatDate(data.tgl_confirm)}</td>
                <td className="text-center">{data.target_hari} Hari</td>
                <td className="text-right bold">
                  {formatRupiah(data.estimasi_biaya)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={14}
                className="text-center"
                style={{ padding: "2rem" }}
              >
                Tidak ada data docking aktif.
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
