import { createClient } from "@/utils/supabase/server";

const PERBAIKAN_DETAIL_SELECT = `
  id_perbaikan,
  waktu_off_operasi,
  waktu_masuk,
  waktu_masuk_detail,
  waktu_naik,
  waktu_naik_detail,
  waktu_turun,
  waktu_turun_detail,
  waktu_keluar,
  waktu_keluar_detail,
  waktu_mulai_operasi,
  waktu_mulai_detail,
  realisasi_waktu_hari,
  budget_time,
  status_detail,
  status_perbaikan,
  budget_cost,
  url_budget_cost,
  harga_penawaran,
  tanggal_penawaran,
  url_harga_penawaran,
  harga_kontrak,
  tanggal_kontrak,
  url_harga_kontrak,
  harga_rekalbea,
  tanggal_rekalbea,
  url_harga_rekalbea,
  harga_confirm,
  tanggal_confirm,
  url_harga_confirm,
  keterangan,
  lampiran_dokumen,
  kapal (id_kapal, vessel_id, nama_kapal, flat_bottom, vertical_side, bottop, topside),
  tempat_perbaikan (id_tempat, nama_tempat, url_company_profile),
  kategori_status (id_status, nama_status),
  kategori_cat (id_cat, nama_cat),
  pembayaran (
    id_pembayaran, biaya_jasa, nominal_bayar_1, tanggal_bayar_1,
    nominal_bayar_1_bkk, nominal_bayar_1_bkm, nominal_bayar_2, tanggal_bayar_2,
    nominal_bayar_3, tanggal_bayar_3, nominal_bayar_4, tanggal_bayar_4,
    total_pembayaran, deskripsi_bayar_1, deskripsi_bayar_2, deskripsi_bayar_3, deskripsi_bayar_4,
    url_pembayaran_1, url_pembayaran_2, url_pembayaran_3, url_pembayaran_4,
    status_pembayaran
  ),
  perbaikan_superintendent (superintendent (id_superintendent, nama_superintendent, asal_kota, jabatan))
`;

function mapPembayaranFields(pembayaran) {
  const pm = pembayaran ?? {};
  return {
    id_pembayaran: pm.id_pembayaran ?? null,
    biaya_jasa: pm.biaya_jasa ?? null,
    nominal_bayar_1: pm.nominal_bayar_1 ?? null,
    tanggal_bayar_1: pm.tanggal_bayar_1 ?? null,
    nominal_bayar_1_bkk: pm.nominal_bayar_1_bkk ?? null,
    nominal_bayar_1_bkm: pm.nominal_bayar_1_bkm ?? null,
    nominal_bayar_2: pm.nominal_bayar_2 ?? null,
    tanggal_bayar_2: pm.tanggal_bayar_2 ?? null,
    nominal_bayar_3: pm.nominal_bayar_3 ?? null,
    tanggal_bayar_3: pm.tanggal_bayar_3 ?? null,
    nominal_bayar_4: pm.nominal_bayar_4 ?? null,
    tanggal_bayar_4: pm.tanggal_bayar_4 ?? null,
    total_pembayaran: pm.total_pembayaran ?? null,
    deskripsi_bayar_1: pm.deskripsi_bayar_1 ?? null,
    deskripsi_bayar_2: pm.deskripsi_bayar_2 ?? null,
    deskripsi_bayar_3: pm.deskripsi_bayar_3 ?? null,
    deskripsi_bayar_4: pm.deskripsi_bayar_4 ?? null,
    url_pembayaran_1: pm.url_pembayaran_1 ?? null,
    url_pembayaran_2: pm.url_pembayaran_2 ?? null,
    url_pembayaran_3: pm.url_pembayaran_3 ?? null,
    url_pembayaran_4: pm.url_pembayaran_4 ?? null,
    status_pembayaran: pm.status_pembayaran ?? null,
  };
}

function mapSuperintendents(perbaikanSuperintendent) {
  const rows = perbaikanSuperintendent ?? [];
  return rows
    .map((row) => row.superintendent)
    .filter((sup) => sup?.id_superintendent != null);
}

function mapPerbaikanRow(row, { includeDaftarSuperintendent = false } = {}) {
  const kapal = row.kapal ?? {};
  const tempat = row.tempat_perbaikan ?? {};
  const status = row.kategori_status ?? {};
  const cat = row.kategori_cat ?? {};
  const superintendents = mapSuperintendents(row.perbaikan_superintendent);

  const mapped = {
    id_perbaikan: row.id_perbaikan,
    id_kapal: kapal.id_kapal ?? null,
    vessel_id: kapal.vessel_id ?? null,
    nama_kapal: kapal.nama_kapal ?? null,
    flat_bottom: kapal.flat_bottom ?? null,
    vertical_side: kapal.vertical_side ?? null,
    bottop: kapal.bottop ?? null,
    topside: kapal.topside ?? null,
    id_tempat: tempat.id_tempat ?? null,
    nama_tempat: tempat.nama_tempat ?? null,
    url_company_profile: tempat.url_company_profile ?? null,
    id_status: status.id_status ?? null,
    nama_status: status.nama_status ?? null,
    id_cat: cat.id_cat ?? null,
    nama_cat: cat.nama_cat ?? null,
    waktu_off_operasi: row.waktu_off_operasi,
    waktu_masuk: row.waktu_masuk,
    waktu_masuk_detail: row.waktu_masuk_detail,
    waktu_naik: row.waktu_naik,
    waktu_naik_detail: row.waktu_naik_detail,
    waktu_turun: row.waktu_turun,
    waktu_turun_detail: row.waktu_turun_detail,
    waktu_keluar: row.waktu_keluar,
    waktu_keluar_detail: row.waktu_keluar_detail,
    waktu_mulai_operasi: row.waktu_mulai_operasi,
    waktu_mulai_detail: row.waktu_mulai_detail,
    realisasi_waktu_hari: row.realisasi_waktu_hari,
    budget_time: row.budget_time,
    status_detail: row.status_detail,
    status_perbaikan: row.status_perbaikan ?? null,
    budget_cost: row.budget_cost,
    url_budget_cost: row.url_budget_cost ?? null,
    harga_penawaran: row.harga_penawaran,
    tanggal_penawaran: row.tanggal_penawaran,
    url_harga_penawaran: row.url_harga_penawaran ?? null,
    harga_kontrak: row.harga_kontrak,
    tanggal_kontrak: row.tanggal_kontrak,
    url_harga_kontrak: row.url_harga_kontrak ?? null,
    harga_rekalbea: row.harga_rekalbea,
    tanggal_rekalbea: row.tanggal_rekalbea,
    url_harga_rekalbea: row.url_harga_rekalbea ?? null,
    harga_confirm: row.harga_confirm,
    tanggal_confirm: row.tanggal_confirm,
    url_harga_confirm: row.url_harga_confirm ?? null,
    keterangan: row.keterangan,
    lampiran_dokumen: row.lampiran_dokumen || [],
    ...mapPembayaranFields(row.pembayaran),
    superintendents,
  };

  if (includeDaftarSuperintendent) {
    mapped.daftar_superintendent = superintendents
      .map((sup) => `${sup.nama_superintendent} (${sup.jabatan ?? "-"})`)
      .join(", ");
  }
  return mapped;
}

export async function getAllPerbaikan() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perbaikan")
    .select(PERBAIKAN_DETAIL_SELECT)
    .order("waktu_masuk", { ascending: false, nullsFirst: false });
  if (error) throw new Error("Gagal mengambil data perbaikan");
  return (data ?? []).map((row) =>
    mapPerbaikanRow(row, { includeDaftarSuperintendent: true }),
  );
}

export async function getMasterDataForForm() {
  const supabase = await createClient();
  const [kapal, tempat, status, cat, superintendent] = await Promise.all([
    supabase
      .from("kapal")
      .select(
        "id_kapal, vessel_id, nama_kapal, flat_bottom, vertical_side, bottop, topside",
      )
      .order("nama_kapal", { ascending: true }),
    supabase
      .from("tempat_perbaikan")
      .select("id_tempat, nama_tempat, url_company_profile")
      .order("nama_tempat", { ascending: true }),
    supabase
      .from("kategori_status")
      .select("id_status, nama_status")
      .order("nama_status", { ascending: true }),
    supabase
      .from("kategori_cat")
      .select("id_cat, nama_cat")
      .order("nama_cat", { ascending: true }),
    supabase
      .from("superintendent")
      .select("id_superintendent, nama_superintendent, asal_kota, jabatan")
      .order("nama_superintendent", { ascending: true }),
  ]);
  return {
    kapal: kapal.data ?? [],
    tempat: tempat.data ?? [],
    status: status.data ?? [],
    cat: cat.data ?? [],
    superintendent: superintendent.data ?? [],
  };
}

export async function getPerbaikanById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perbaikan")
    .select(PERBAIKAN_DETAIL_SELECT)
    .eq("id_perbaikan", id)
    .maybeSingle();
  if (error) throw new Error("Gagal mengambil detail perbaikan");
  if (!data) return null;
  return mapPerbaikanRow(data);
}

export async function deletePerbaikan(id) {
  const supabase = await createClient();
  const { data: perbaikan } = await supabase
    .from("perbaikan")
    .select("id_perbaikan, id_pembayaran")
    .eq("id_perbaikan", id)
    .maybeSingle();
  if (!perbaikan) throw new Error("Data perbaikan tidak ditemukan");

  await supabase
    .from("perbaikan_superintendent")
    .delete()
    .eq("id_perbaikan", id);
  await supabase.from("perbaikan").delete().eq("id_perbaikan", id);
  if (perbaikan.id_pembayaran)
    await supabase
      .from("pembayaran")
      .delete()
      .eq("id_pembayaran", perbaikan.id_pembayaran);

  return { success: true, message: "Data perbaikan berhasil dihapus" };
}
