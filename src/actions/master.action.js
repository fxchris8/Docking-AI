"use server";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function simpanKapal(formData) {
  try {
    const id_kapal = formData.get("id_kapal");
    const vessel_id = formData.get("vessel_id") || null;
    const nama_kapal = formData.get("nama_kapal") || null;
    const flat_bottom = formData.get("flat_bottom")
      ? Number(formData.get("flat_bottom"))
      : null;
    const vertical_side = formData.get("vertical_side")
      ? Number(formData.get("vertical_side"))
      : null;
    const bottop = formData.get("bottop")
      ? Number(formData.get("bottop"))
      : null;
    const topside = formData.get("topside")
      ? Number(formData.get("topside"))
      : null;

    if (!nama_kapal) throw new Error("Nama Kapal wajib diisi!");

    const client = await pool.connect();
    try {
      if (id_kapal) {
        await client.query(
          "UPDATE kapal SET vessel_id = $1, nama_kapal = $2, flat_bottom = $3, vertical_side = $4, bottop = $5, topside = $6 WHERE id_kapal = $7",
          [
            vessel_id,
            nama_kapal,
            flat_bottom,
            vertical_side,
            bottop,
            topside,
            id_kapal,
          ],
        );
      } else {
        await client.query(
          "INSERT INTO kapal (vessel_id, nama_kapal, flat_bottom, vertical_side, bottop, topside) VALUES ($1, $2, $3, $4, $5, $6)",
          [vessel_id, nama_kapal, flat_bottom, vertical_side, bottop, topside],
        );
      }
      revalidatePath("/database");
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function hapusKapal(id_kapal) {
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM kapal WHERE id_kapal = $1", [id_kapal]);
    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    if (error.code === "23503")
      return {
        success: false,
        message: "Gagal: Kapal masih terkait dengan Nota Docking.",
      };
    return { success: false, message: "Terjadi kesalahan server." };
  } finally {
    client.release();
  }
}

export async function simpanTempat(formData) {
  try {
    const id_tempat = formData.get("id_tempat");
    const nama_tempat = formData.get("nama_tempat");
    if (!nama_tempat) throw new Error("Nama Lokasi wajib diisi!");

    const client = await pool.connect();
    try {
      if (id_tempat) {
        await client.query(
          "UPDATE tempat_perbaikan SET nama_tempat = $1 WHERE id_tempat = $2",
          [nama_tempat, id_tempat],
        );
      } else {
        await client.query(
          "INSERT INTO tempat_perbaikan (nama_tempat) VALUES ($1)",
          [nama_tempat],
        );
      }
      revalidatePath("/database");
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function hapusTempat(id_tempat) {
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM tempat_perbaikan WHERE id_tempat = $1", [
      id_tempat,
    ]);
    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    if (error.code === "23503")
      return {
        success: false,
        message: "Gagal: Lokasi masih terkait dengan Nota Docking.",
      };
    return { success: false, message: "Terjadi kesalahan server." };
  } finally {
    client.release();
  }
}

export async function simpanSuperintendent(formData) {
  try {
    const id_superintendent = formData.get("id_superintendent");
    const nama_superintendent = formData.get("nama_superintendent");
    const asal_kota = formData.get("asal_kota");
    const jabatan = formData.get("jabatan");

    if (!nama_superintendent) throw new Error("Nama Personil wajib diisi!");

    const client = await pool.connect();
    try {
      if (id_superintendent) {
        await client.query(
          "UPDATE superintendent SET nama_superintendent = $1, asal_kota = $2, jabatan = $3 WHERE id_superintendent = $4",
          [nama_superintendent, asal_kota, jabatan, id_superintendent],
        );
      } else {
        await client.query(
          "INSERT INTO superintendent (nama_superintendent, asal_kota, jabatan) VALUES ($1, $2, $3)",
          [nama_superintendent, asal_kota, jabatan],
        );
      }
      revalidatePath("/database");
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function hapusSuperintendent(id_superintendent) {
  const client = await pool.connect();
  try {
    await client.query(
      "DELETE FROM superintendent WHERE id_superintendent = $1",
      [id_superintendent],
    );
    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    if (error.code === "23503")
      return {
        success: false,
        message: "Gagal: Personil masih terkait dengan Nota Docking.",
      };
    return { success: false, message: "Terjadi kesalahan server." };
  } finally {
    client.release();
  }
}
