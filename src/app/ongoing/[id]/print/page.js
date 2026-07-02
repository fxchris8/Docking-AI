import { getPerbaikanById } from "@/services/perbaikan.service";
import { formatRupiah, formatDate } from "@/utils/formatters";
import PrintTrigger from "@/components/ui/PrintTrigger";

/* ---------- helpers ---------- */
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const hasValue = (val) => val !== null && val !== undefined && Number(val) > 0;

// Pindahkan title ke Metadata API untuk menghindari Hydration Error
export async function generateMetadata({ params }) {
  const p = await params;
  return {
    title: `Laporan Detail Docking DC-${p.id}`,
  };
}

export default async function PrintDetailOngoing({ params }) {
  const p = await params;
  const id = p.id;
  const data = await getPerbaikanById(id);

  if (!data) return <p style={{ padding: "2rem" }}>Data tidak ditemukan.</p>;

  // Samakan logic dengan halaman utama
  const penanggungJawab = data.superintendents?.length
    ? data.superintendents
        .map((s) => `${s.nama_superintendent} (${s.jabatan || "-"})`)
        .join(", ")
    : data.daftar_superintendent || "Belum Ditugaskan";

  const isSMI = data.nama_tempat?.includes("SMI");
  const isDPL = data.nama_tempat?.includes("DPL");
  const isUmum = !isSMI && !isDPL;

  const statusPerbaikan = data.status_perbaikan || "ongoing";
  const statusPembayaran = data.status_pembayaran || "belum lunas";

  // Total terbayar (jumlah nominal 1-4)
  const totalTerbayar = [1, 2, 3, 4].reduce(
    (sum, num) => sum + (Number(data[`nominal_bayar_${num}`]) || 0),
    0,
  );

  // Harga dengan tanggal
  const hargaItems = [
    {
      label: "Harga Penawaran",
      value: data.harga_penawaran,
      tgl: data.tanggal_penawaran,
    },
    {
      label: "Harga Kontrak",
      value: data.harga_kontrak,
      tgl: data.tanggal_kontrak,
    },
    {
      label: "Harga Rekalbea",
      value: data.harga_rekalbea,
      tgl: data.tanggal_rekalbea,
    },
    {
      label: "Harga Confirm",
      value: data.harga_confirm,
      tgl: data.tanggal_confirm,
    },
  ];

  return (
    // Gunakan div wrapper pengganti html/body
    <div className="print-wrapper bg-white min-h-screen text-black">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .print-wrapper {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1a113c;
          padding: 3rem 2.5rem;
          font-size: 10.5pt;
          line-height: 1.6;
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

        h2 {
          font-size: 13pt;
          color: #2e004f;
          border-bottom: 1px solid #ddd;
          padding-bottom: 0.3rem;
          margin: 2rem 0 1rem;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
          page-break-inside: auto;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 0.5rem 0.7rem;
          vertical-align: top;
        }
        th {
          background: #f3f4f6;
          font-weight: 600;
          font-size: 9.5pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #444;
          text-align: left;
        }
        td { font-size: 10pt; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: 700; }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem 2rem;
          margin-bottom: 1.5rem;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dotted #ddd;
          padding: 0.4rem 0;
        }
        .info-item .label {
          font-weight: 600;
          color: #555;
        }
        
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 8pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .badge-green { background: #dcfce7 !important; color: #166534 !important; }
        .badge-blue { background: #dbeafe !important; color: #1e40af !important; }
        .badge-red { background: #fee2e2 !important; color: #991b1b !important; }

        .footer {
          margin-top: 2.5rem;
          text-align: right;
          font-size: 9pt;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 1rem;
        }

        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; }
          .print-wrapper { padding: 1.5cm; }
        }
      `}</style>

      {/* KOP LAPORAN */}
      <div className="kop">
        <img src="/Logo.png" alt="SPIL Logo" />
        <div className="company">
          <h1>PT Salam Pacific Indonesia Lines</h1>
          <p>Laporan Resmi Operasional Docking</p>
        </div>
        <div className="doc-id">DC-{data.id_perbaikan}</div>
      </div>

      {/* INFORMASI PEKERJAAN */}
      <h2>Informasi Pekerjaan</h2>
      <div className="info-grid">
        <div className="info-item">
          <span className="label">Penanggung Jawab</span>{" "}
          <span>{penanggungJawab}</span>
        </div>
        <div className="info-item">
          <span className="label">Nama Kapal</span>{" "}
          <span className="bold text-[#2e004f]">{data.nama_kapal || "-"}</span>
        </div>
        <div className="info-item">
          <span className="label">Lokasi Dok</span>{" "}
          <span>{data.nama_tempat || "-"}</span>
        </div>
        <div className="info-item">
          <span className="label">Kategori Cat</span>{" "}
          <span>{data.nama_cat || "-"}</span>
        </div>

        <div className="info-item">
          <span className="label">Target Waktu</span>{" "}
          <span>{data.budget_time ? `${data.budget_time} Hari` : "-"}</span>
        </div>
        <div className="info-item">
          <span className="label">Realisasi</span>{" "}
          <span>{data.realisasi_waktu_hari || 0} Hari</span>
        </div>
        <div className="info-item">
          <span className="label">Estimasi Budget</span>{" "}
          <span>{formatRupiah(data.budget_cost)}</span>
        </div>

        <div className="info-item">
          <span className="label">Status Pekerjaan</span>
          <span>
            {data.nama_status || "-"}
            {data.status_detail ? ` (${data.status_detail})` : ""}
          </span>
        </div>

        {/* Status Perbaikan & Pembayaran Baru */}
        <div className="info-item border-none">
          <span className="label">Status Perbaikan</span>
          <span
            className={`badge ${statusPerbaikan === "selesai" ? "badge-green" : "badge-blue"}`}
          >
            {statusPerbaikan === "selesai" ? "Selesai" : "Ongoing"}
          </span>
        </div>
        <div className="info-item border-none">
          <span className="label">Status Pembayaran</span>
          <span
            className={`badge ${statusPembayaran === "lunas" ? "badge-green" : "badge-red"}`}
          >
            {statusPembayaran === "lunas" ? "Lunas" : "Belum Lunas"}
          </span>
        </div>
      </div>

      {/* CATATAN & KETERANGAN */}
      {(data.keterangan || data.status_detail) && (
        <>
          <h2>Catatan & Keterangan</h2>
          {data.keterangan && (
            <p style={{ marginBottom: "0.8rem" }}>
              <strong>Keterangan Umum:</strong>
              <br />
              {data.keterangan}
            </p>
          )}
          {data.status_detail && (
            <p>
              <strong>Detail Status:</strong>
              <br />
              {data.status_detail}
            </p>
          )}
        </>
      )}

      {/* TIMELINE */}
      <h2>Timeline & Jadwal Pengerjaan</h2>
      <table>
        <thead>
          <tr>
            <th>Tahap</th>
            <th>Waktu</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. Off Operasi</td>
            <td>{formatDate(data.waktu_off_operasi)}</td>
          </tr>
          <tr>
            <td>2. Masuk Dok</td>
            <td>
              {formatDate(data.waktu_masuk)}{" "}
              {data.waktu_masuk_detail ? `(${data.waktu_masuk_detail})` : ""}
            </td>
          </tr>
          <tr>
            <td>3a. Naik</td>
            <td>
              {formatDateTime(data.waktu_naik)}{" "}
              {data.waktu_naik_detail ? `(${data.waktu_naik_detail})` : ""}
            </td>
          </tr>
          <tr>
            <td>3b. Turun</td>
            <td>
              {formatDateTime(data.waktu_turun)}{" "}
              {data.waktu_turun_detail ? `(${data.waktu_turun_detail})` : ""}
            </td>
          </tr>
          <tr>
            <td>4. Keluar Dok</td>
            <td>
              {formatDate(data.waktu_keluar)}{" "}
              {data.waktu_keluar_detail ? `(${data.waktu_keluar_detail})` : ""}
            </td>
          </tr>
          <tr>
            <td>5. Mulai Operasi</td>
            <td>
              {formatDate(data.waktu_mulai_operasi)}{" "}
              {data.waktu_mulai_detail ? `(${data.waktu_mulai_detail})` : ""}
            </td>
          </tr>
        </tbody>
      </table>

      {/* BIAYA & KONTRAK */}
      <h2>Biaya & Kontrak</h2>
      <table>
        <thead>
          <tr>
            <th>Deskripsi</th>
            <th className="text-right">Nilai</th>
            <th>Tanggal</th>
          </tr>
        </thead>
        <tbody>
          {hargaItems.map((item, i) => (
            <tr key={i}>
              <td>{item.label}</td>
              <td className="text-right">{formatRupiah(item.value)}</td>
              <td>{item.tgl ? formatDate(item.tgl) : "-"}</td>
            </tr>
          ))}
          <tr className="bold" style={{ backgroundColor: "#f9fafb" }}>
            <td>Total Terbayar</td>
            <td className="text-right text-[#166534]">
              {formatRupiah(totalTerbayar)}
            </td>
            <td>
              {formatDate(
                data.tanggal_bayar_4 ||
                  data.tanggal_bayar_3 ||
                  data.tanggal_bayar_2 ||
                  data.tanggal_bayar_1,
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* DETAIL PEMBAYARAN (jika ada) */}
      {(isSMI || isDPL
        ? data.tanggal_bayar_1
        : [1, 2, 3, 4].some((num) =>
            hasValue(data[`nominal_bayar_${num}`]),
          )) && (
        <>
          <h2>Detail Pembayaran</h2>
          {isSMI && (
            <table>
              <thead>
                <tr>
                  <th>Komponen</th>
                  <th className="text-right">Nilai</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {hasValue(data.biaya_jasa) && (
                  <tr>
                    <td>Biaya Jasa</td>
                    <td className="text-right">
                      {formatRupiah(data.biaya_jasa)}
                    </td>
                    <td>-</td>
                  </tr>
                )}
                <tr>
                  <td className="bold">Total Bayar 1</td>
                  <td className="text-right bold">
                    {formatRupiah(data.nominal_bayar_1)}
                  </td>
                  <td>{formatDate(data.tanggal_bayar_1)}</td>
                </tr>
                <tr>
                  <td>Pot. PPH (2% x Biaya Jasa)</td>
                  <td className="text-right">
                    -{formatRupiah(data.nominal_bayar_1_bkm)}
                  </td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          )}
          {isDPL && (
            <table>
              <thead>
                <tr>
                  <th>Komponen</th>
                  <th className="text-right">Nilai</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="bold">Total Bayar 1</td>
                  <td className="text-right bold">
                    {formatRupiah(data.nominal_bayar_1)}
                  </td>
                  <td>{formatDate(data.tanggal_bayar_1)}</td>
                </tr>
                <tr>
                  <td>BKK (50% x Harga Kontrak)</td>
                  <td className="text-right">
                    {formatRupiah(data.nominal_bayar_1_bkk)}
                  </td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>BKM (2% x 30% x BKK)</td>
                  <td className="text-right">
                    -{formatRupiah(data.nominal_bayar_1_bkm)}
                  </td>
                  <td>-</td>
                </tr>
                {(hasValue(data.nominal_bayar_2) || data.tanggal_bayar_2) && (
                  <tr>
                    <td className="bold">Bayar 2 (Pelunasan)</td>
                    <td className="text-right bold">
                      {formatRupiah(data.nominal_bayar_2)}
                    </td>
                    <td>{formatDate(data.tanggal_bayar_2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {isUmum && (
            <table>
              <thead>
                <tr>
                  <th>Tahap</th>
                  <th className="text-right">Nilai</th>
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((num) => {
                  const nominal = data[`nominal_bayar_${num}`];
                  const tanggal = data[`tanggal_bayar_${num}`];
                  const desc = data[`deskripsi_bayar_${num}`];
                  if (!hasValue(nominal) && !tanggal && !desc) return null;
                  return (
                    <tr key={num}>
                      <td className="bold">Pembayaran {num}</td>
                      <td className="text-right bold">
                        {formatRupiah(nominal)}
                      </td>
                      <td>{formatDate(tanggal)}</td>
                      <td className="italic text-[#555]">{desc || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* SPESIFIKASI KAPAL */}
      <h2>Spesifikasi Dimensi Kapal</h2>
      <table>
        <thead>
          <tr>
            <th className="text-center">Flat Bottom</th>
            <th className="text-center">Vertical Side</th>
            <th className="text-center">Bottop</th>
            <th className="text-center">Topside</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center bold text-[#1a113c]">
            <td>{data.flat_bottom || 0}</td>
            <td>{data.vertical_side || 0}</td>
            <td>{data.bottop || 0}</td>
            <td>{data.topside || 0}</td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER */}
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
