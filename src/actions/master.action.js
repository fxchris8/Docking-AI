"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

function isForeignKeyError(error) {
  return error?.code === "23503";
}

function parseOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function parseId(value) {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isNaN(id) ? null : id;
}

export async function simpanKapal(formData) {
  try {
    const id_kapal = parseId(formData.get("id_kapal"));
    const vessel_id = formData.get("vessel_id") || null;
    const nama_kapal = formData.get("nama_kapal") || null;
    const flat_bottom = parseOptionalNumber(formData.get("flat_bottom"));
    const vertical_side = parseOptionalNumber(formData.get("vertical_side"));
    const bottop = parseOptionalNumber(formData.get("bottop"));
    const topside = parseOptionalNumber(formData.get("topside"));

    if (!nama_kapal) throw new Error("Nama Kapal wajib diisi!");

    const supabase = await createClient();
    const payload = {
      vessel_id,
      nama_kapal,
      flat_bottom,
      vertical_side,
      bottop,
      topside,
    };

    if (id_kapal) {
      const { error } = await supabase
        .from("kapal")
        .update(payload)
        .eq("id_kapal", id_kapal);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("kapal").insert(payload);

      if (error) throw error;
    }

    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function hapusKapal(id_kapal) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("kapal")
      .delete()
      .eq("id_kapal", id_kapal);

    if (error) throw error;

    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    if (isForeignKeyError(error)) {
      return {
        success: false,
        message: "Gagal: Kapal masih terkait dengan Nota Docking.",
      };
    }
    return { success: false, message: "Terjadi kesalahan server." };
  }
}

export async function simpanTempat(formData) {
  try {
    const id_tempat = parseId(formData.get("id_tempat"));
    const nama_tempat = formData.get("nama_tempat");
    const url_company_profile = formData.get("url_company_profile") || null; // 🔥 BARU

    if (!nama_tempat) throw new Error("Nama Lokasi wajib diisi!");

    const supabase = await createClient();
    const payload = {
      nama_tempat,
      url_company_profile, // 🔥 BARU
    };

    if (id_tempat) {
      const { error } = await supabase
        .from("tempat_perbaikan")
        .update(payload)
        .eq("id_tempat", id_tempat);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("tempat_perbaikan").insert(payload);

      if (error) throw error;
    }

    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function hapusTempat(id_tempat) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("tempat_perbaikan")
      .delete()
      .eq("id_tempat", id_tempat);

    if (error) throw error;

    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    if (isForeignKeyError(error)) {
      return {
        success: false,
        message: "Gagal: Lokasi masih terkait dengan Nota Docking.",
      };
    }
    return { success: false, message: "Terjadi kesalahan server." };
  }
}

export async function simpanSuperintendent(formData) {
  try {
    const id_superintendent = parseId(formData.get("id_superintendent"));
    const nama_superintendent = formData.get("nama_superintendent");
    const asal_kota = formData.get("asal_kota") || null;
    const jabatan = formData.get("jabatan") || null;

    if (!nama_superintendent) throw new Error("Nama Personil wajib diisi!");

    const supabase = await createClient();
    const payload = {
      nama_superintendent,
      asal_kota,
      jabatan,
    };

    if (id_superintendent) {
      const { error } = await supabase
        .from("superintendent")
        .update(payload)
        .eq("id_superintendent", id_superintendent);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("superintendent").insert(payload);

      if (error) throw error;
    }

    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function hapusSuperintendent(id_superintendent) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("superintendent")
      .delete()
      .eq("id_superintendent", id_superintendent);

    if (error) throw error;

    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    if (isForeignKeyError(error)) {
      return {
        success: false,
        message: "Gagal: Personil masih terkait dengan Nota Docking.",
      };
    }
    return { success: false, message: "Terjadi kesalahan server." };
  }
}
