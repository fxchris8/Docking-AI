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

export default async function PrintListDetail({ params }) {
  const id = (await params).id;
  const data = await getPerbaikanById(id);

  if (!data) return <p style={{ padding: "2rem" }}>Data tidak ditemukan.</p>;

  const isSMI = data.nama_tempat?.includes("SMI");
  const isDPL = data.nama_tempat?.includes("DPL");
  const isUmum = !isSMI && !isDPL;

  const totalTerbayar = [1, 2, 3, 4].reduce(
    (sum, num) => sum + (Number(data[`nominal_bayar_${num}`]) || 0),
    0,
  );

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
    <html>
      <head>
        <title>{`Laporan Docking DC-${data.id_perbaikan}`}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1a113c;
            padding: 3rem 2.5rem;
            font-size: 11pt;
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
          .kop img {
            width: 70px;
            height: auto;
          }
          .kop .company {
            flex: 1;
          }
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
          }
          th, td {
            border: 1px solid #ccc;
            padding: 0.5rem 0.7rem;
            vertical-align: top;
          }
          th {
            background: #f3f4f6;
            font-weight: 600;
            font-size: 10pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #444;
          }
          td {
            font-size: 10.5pt;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .bold { font-weight: 700; }
          .italic { font-style: italic; }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem 1.5rem;
            margin-bottom: 1.5rem;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dotted #ddd;
            padding: 0.3rem 0;
          }
          .info-item .label {
            font-weight: 600;
            color: #555;
          }

          .footer {
            margin-top: 2.5rem;
            text-align: right;
            font-size: 9pt;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 1rem;
          }

          @media print {
            body { padding: 1.5cm 1.5cm; }
            @page { size: A4; margin: 0; }
          }
        `}</style>
      </head>
      <body>
        {/* KOP */}
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
            <span>{data.daftar_superintendent || "-"}</span>
          </div>
          <div className="info-item">
            <span className="label">Nama Kapal</span>{" "}
            <span>{data.nama_kapal || "-"}</span>
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
            <span className="label">Status</span>{" "}
            <span>
              {data.nama_status || "-"}
              {data.status_detail ? ` (${data.status_detail})` : ""}
            </span>
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
        </div>

        {/* CATATAN & KETERANGAN */}
        {(data.keterangan || data.status_detail) && (
          <>
            <h2>Catatan & Keterangan</h2>
            {data.keterangan && (
              <p style={{ marginBottom: "0.8rem" }}>
                <strong>Keterangan Umum:</strong> {data.keterangan}
              </p>
            )}
            {data.status_detail && (
              <p>
                <strong>Detail Status:</strong> {data.status_detail}
              </p>
            )}
          </>
        )}

        {/* BIAYA & KONTRAK */}
        <h2>Biaya & Kontrak</h2>
        <table>
          <thead>
            <tr>
              <th>Deskripsi</th>
              <th>Nilai</th>
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
            <tr className="bold">
              <td>Total Pembayaran</td>
              <td className="text-right">{formatRupiah(totalTerbayar)}</td>
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

        {/* DETAIL PEMBAYARAN */}
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
                    <th>Nilai</th>
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
                    <td>Total Bayar 1</td>
                    <td className="text-right">
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
                    <th>Nilai</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Bayar 1</td>
                    <td className="text-right">
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
                      <td>Bayar 2 (Pelunasan)</td>
                      <td className="text-right">
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
                    <th>Pembayaran</th>
                    <th>Nilai</th>
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
                        <td>Bayar {num}</td>
                        <td className="text-right">{formatRupiah(nominal)}</td>
                        <td>{formatDate(tanggal)}</td>
                        <td>{desc || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* TIMELINE */}
        <h2>Timeline Pengerjaan</h2>
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
                {data.waktu_keluar_detail
                  ? `(${data.waktu_keluar_detail})`
                  : ""}
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

        {/* SPESIFIKASI KAPAL */}
        <h2>Spesifikasi Dimensi Kapal</h2>
        <table>
          <thead>
            <tr>
              <th>Flat Bottom</th>
              <th>Vertical Side</th>
              <th>Bottop</th>
              <th>Topside</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
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
      </body>
    </html>
  );
}
