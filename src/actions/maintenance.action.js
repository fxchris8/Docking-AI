"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ========================
//        HELPERS
// ========================
function parseId(value) {
  if (!value) return null;
  const id = Number(value);
  return Number.isNaN(id) ? null : id;
}

function parseOptionalNumber(value) {
  if (!value) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function parseOptionalString(value) {
  return value ? String(value) : null;
}

function buildPembayaranPayload(formData, urls = {}) {
  return {
    nominal_bayar_1: parseOptionalNumber(formData.get("nominal_bayar_1")),
    tanggal_bayar_1: parseOptionalString(formData.get("tanggal_bayar_1")),
    nominal_bayar_1_bkk: parseOptionalNumber(
      formData.get("nominal_bayar_1_bkk"),
    ),
    nominal_bayar_1_bkm: parseOptionalNumber(
      formData.get("nominal_bayar_1_bkm"),
    ),
    nominal_bayar_2: parseOptionalNumber(formData.get("nominal_bayar_2")),
    tanggal_bayar_2: parseOptionalString(formData.get("tanggal_bayar_2")),
    nominal_bayar_3: parseOptionalNumber(formData.get("nominal_bayar_3")),
    tanggal_bayar_3: parseOptionalString(formData.get("tanggal_bayar_3")),
    nominal_bayar_4: parseOptionalNumber(formData.get("nominal_bayar_4")),
    tanggal_bayar_4: parseOptionalString(formData.get("tanggal_bayar_4")),
    biaya_jasa: parseOptionalNumber(formData.get("biaya_jasa")),
    deskripsi_bayar_1: parseOptionalString(formData.get("deskripsi_1")),
    deskripsi_bayar_2: parseOptionalString(formData.get("deskripsi_2")),
    deskripsi_bayar_3: parseOptionalString(formData.get("deskripsi_3")),
    deskripsi_bayar_4: parseOptionalString(formData.get("deskripsi_4")),
    url_pembayaran_1: urls.pembayaran_1 ?? null,
    url_pembayaran_2: urls.pembayaran_2 ?? null,
    url_pembayaran_3: urls.pembayaran_3 ?? null,
    url_pembayaran_4: urls.pembayaran_4 ?? null,
    // 🔥 BARU
    status_pembayaran: parseOptionalString(formData.get("status_pembayaran")),
  };
}

/**
 * Mengunggah file jika ada (size > 0).
 * Mengembalikan URL baru atau existing URL jika tidak ada file baru.
 */
async function handleFileUpload(supabase, formData, fileKey, existingUrlKey) {
  const files = formData.getAll(fileKey);
  const existingUrl = parseOptionalString(formData.get(existingUrlKey)) || "";

  // Ambil file pertama yang memiliki size > 0
  const file = files.find((f) => f && f.size > 0);
  if (!file) {
    // Tidak ada file baru → pertahankan URL lama
    return existingUrl || null;
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("lampiran_docking")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    throw new Error(`Gagal mengunggah ${file.name}: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from("lampiran_docking")
    .getPublicUrl(fileName);
  return data?.publicUrl || null;
}

// ========================
//   CREATE NEW DOCKING
// ========================
export async function submitMaintenanceBaru(formData) {
  try {
    const id_kapal = parseId(formData.get("id_kapal"));
    const id_tempat = parseId(formData.get("id_tempat"));
    const id_cat = parseId(formData.get("id_cat"));
    const id_status = parseId(formData.get("id_status"));
    const waktu_masuk = parseOptionalString(formData.get("waktu_masuk"));
    const waktu_off_operasi = parseOptionalString(
      formData.get("waktu_off_operasi"),
    );
    const status_detail = parseOptionalString(formData.get("status_detail"));
    const keterangan = parseOptionalString(formData.get("keterangan"));
    const id_superintendents = formData.getAll("id_superintendent");
    const budget_time = parseOptionalNumber(formData.get("budget_time"));
    const budget_cost = parseOptionalNumber(formData.get("budget_cost"));

    if (!id_kapal || !id_tempat || !waktu_masuk) {
      return {
        success: false,
        message: "Kapal, Lokasi Dok, dan Tgl Masuk wajib diisi!",
      };
    }

    const supabase = await createClient();

    const { data: perbaikanBaru, error: insertError } = await supabase
      .from("perbaikan")
      .insert({
        id_kapal,
        id_tempat,
        id_cat,
        id_status,
        waktu_masuk,
        waktu_off_operasi,
        budget_time,
        budget_cost,
        keterangan,
        status_detail,
        lampiran_dokumen: [],
        // 🔥 BARU
        status_perbaikan: "ongoing",
      })
      .select("id_perbaikan")
      .single();

    if (insertError) throw insertError;
    const idPerbaikanBaru = perbaikanBaru.id_perbaikan;

    if (id_superintendents.length > 0) {
      const rows = id_superintendents
        .map(parseId)
        .filter(Boolean)
        .map((id_sup) => ({
          id_perbaikan: idPerbaikanBaru,
          id_superintendent: id_sup,
        }));

      if (rows.length > 0) {
        const { error: supError } = await supabase
          .from("perbaikan_superintendent")
          .insert(rows);

        if (supError) {
          await supabase
            .from("perbaikan")
            .delete()
            .eq("id_perbaikan", idPerbaikanBaru);
          throw supError;
        }
      }
    }

    revalidatePath("/ongoing");
    return { success: true };
  } catch (error) {
    console.error("Error Create:", error);
    return { success: false, message: error.message };
  }
}

// ========================
//   UPDATE DETAIL
// ========================
export async function updateMaintenanceDetail(id_perbaikan, formData) {
  try {
    const supabase = await createClient();

    // --- 1. UPLOAD LAMPIRAN UTAMA (MAX 5 FILE) ---
    const files = formData.getAll("lampiran");
    let uploadedUrls = [];
    const existingLampiranStr = formData.get("existing_lampiran");
    if (existingLampiranStr) {
      try {
        uploadedUrls = JSON.parse(existingLampiranStr);
      } catch (e) {
        uploadedUrls = [];
      }
    }
    const validFiles = files
      .filter((file) => file && file.size > 0)
      .slice(0, 5);
    for (const file of validFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("lampiran_docking")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (uploadError)
        throw new Error(
          `Gagal mengunggah ${file.name}: ${uploadError.message}`,
        );
      const { data } = supabase.storage
        .from("lampiran_docking")
        .getPublicUrl(fileName);
      if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
    }

    // --- 2. UPLOAD FILE HARGA, BUDGET, DAN PEMBAYARAN ---
    const urlHargaPenawaran = await handleFileUpload(
      supabase,
      formData,
      "file_harga_penawaran",
      "existing_url_harga_penawaran",
    );
    const urlHargaKontrak = await handleFileUpload(
      supabase,
      formData,
      "file_harga_kontrak",
      "existing_url_harga_kontrak",
    );
    const urlHargaRekalbea = await handleFileUpload(
      supabase,
      formData,
      "file_harga_rekalbea",
      "existing_url_harga_rekalbea",
    );
    const urlHargaConfirm = await handleFileUpload(
      supabase,
      formData,
      "file_harga_confirm",
      "existing_url_harga_confirm",
    );
    const urlBudgetCost = await handleFileUpload(
      supabase,
      formData,
      "file_budget_cost",
      "existing_url_budget_cost",
    );

    const urlPembayaran1 = await handleFileUpload(
      supabase,
      formData,
      "file_pembayaran_1",
      "existing_url_pembayaran_1",
    );
    const urlPembayaran2 = await handleFileUpload(
      supabase,
      formData,
      "file_pembayaran_2",
      "existing_url_pembayaran_2",
    );
    const urlPembayaran3 = await handleFileUpload(
      supabase,
      formData,
      "file_pembayaran_3",
      "existing_url_pembayaran_3",
    );
    const urlPembayaran4 = await handleFileUpload(
      supabase,
      formData,
      "file_pembayaran_4",
      "existing_url_pembayaran_4",
    );

    // --- 3. DATA PEMBAYARAN LAMA ---
    const { data: perbaikanLama, error: fetchError } = await supabase
      .from("perbaikan")
      .select("id_pembayaran")
      .eq("id_perbaikan", id_perbaikan)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!perbaikanLama) throw new Error("Data perbaikan tidak ditemukan");

    let idPembayaran = perbaikanLama.id_pembayaran;

    const pembayaranPayload = buildPembayaranPayload(formData, {
      pembayaran_1: urlPembayaran1,
      pembayaran_2: urlPembayaran2,
      pembayaran_3: urlPembayaran3,
      pembayaran_4: urlPembayaran4,
    });

    if (idPembayaran) {
      const { error: updatePayError } = await supabase
        .from("pembayaran")
        .update(pembayaranPayload)
        .eq("id_pembayaran", idPembayaran);
      if (updatePayError) throw updatePayError;
    } else {
      const { data: pembayaranBaru, error: insertPayError } = await supabase
        .from("pembayaran")
        .insert(pembayaranPayload)
        .select("id_pembayaran")
        .single();
      if (insertPayError) throw insertPayError;
      idPembayaran = pembayaranBaru.id_pembayaran;
    }

    // --- 4. UPDATE PERBAIKAN ---
    const perbaikanPayload = {
      id_kapal: parseId(formData.get("id_kapal")),
      id_tempat: parseId(formData.get("id_tempat")),
      id_cat: parseId(formData.get("id_cat")),
      id_status: parseId(formData.get("id_status")),
      status_detail: parseOptionalString(formData.get("status_detail")),
      id_pembayaran: idPembayaran,
      waktu_off_operasi: parseOptionalString(formData.get("waktu_off_operasi")),
      waktu_masuk: parseOptionalString(formData.get("waktu_masuk")),
      waktu_masuk_detail: parseOptionalString(
        formData.get("waktu_masuk_detail"),
      ),
      waktu_naik: parseOptionalString(formData.get("waktu_naik")),
      waktu_naik_detail: parseOptionalString(formData.get("waktu_naik_detail")),
      waktu_turun: parseOptionalString(formData.get("waktu_turun")),
      waktu_turun_detail: parseOptionalString(
        formData.get("waktu_turun_detail"),
      ),
      waktu_keluar: parseOptionalString(formData.get("waktu_keluar")),
      waktu_keluar_detail: parseOptionalString(
        formData.get("waktu_keluar_detail"),
      ),
      waktu_mulai_operasi: parseOptionalString(
        formData.get("waktu_mulai_operasi"),
      ),
      waktu_mulai_detail: parseOptionalString(
        formData.get("waktu_mulai_detail"),
      ),
      budget_time: parseOptionalNumber(formData.get("budget_time")),
      budget_cost: parseOptionalNumber(formData.get("budget_cost")),
      url_budget_cost: urlBudgetCost,
      harga_penawaran: parseOptionalNumber(formData.get("harga_penawaran")),
      harga_kontrak: parseOptionalNumber(formData.get("harga_kontrak")),
      harga_rekalbea: parseOptionalNumber(formData.get("harga_rekalbea")),
      harga_confirm: parseOptionalNumber(formData.get("harga_confirm")),
      tanggal_penawaran: parseOptionalString(formData.get("tanggal_penawaran")),
      tanggal_kontrak: parseOptionalString(formData.get("tanggal_kontrak")),
      tanggal_rekalbea: parseOptionalString(formData.get("tanggal_rekalbea")),
      tanggal_confirm: parseOptionalString(formData.get("tanggal_confirm")),
      url_harga_penawaran: urlHargaPenawaran,
      url_harga_kontrak: urlHargaKontrak,
      url_harga_rekalbea: urlHargaRekalbea,
      url_harga_confirm: urlHargaConfirm,
      keterangan: parseOptionalString(formData.get("keterangan")),
      lampiran_dokumen: uploadedUrls,
      // 🔥 BARU
      status_perbaikan: parseOptionalString(formData.get("status_perbaikan")),
    };

    const { error: updatePerbError } = await supabase
      .from("perbaikan")
      .update(perbaikanPayload)
      .eq("id_perbaikan", id_perbaikan);
    if (updatePerbError) throw updatePerbError;

    // --- 5. SYNC SUPERINTENDENT ---
    await supabase
      .from("perbaikan_superintendent")
      .delete()
      .eq("id_perbaikan", id_perbaikan);

    const id_superintendents = formData.getAll("id_superintendent");
    if (id_superintendents.length > 0) {
      const supRows = id_superintendents
        .map(parseId)
        .filter(Boolean)
        .map((id) => ({
          id_perbaikan,
          id_superintendent: id,
        }));
      if (supRows.length > 0) {
        await supabase.from("perbaikan_superintendent").insert(supRows);
      }
    }

    revalidatePath("/ongoing");
    revalidatePath(`/list/${id_perbaikan}`);
    revalidatePath(`/ongoing/${id_perbaikan}`);
    return { success: true };
  } catch (error) {
    console.error("Error Update:", error);
    return { success: false, message: error.message };
  }
}
