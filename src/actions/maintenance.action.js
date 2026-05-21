"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitMaintenanceBaru(formData) {
  try {
    const id_kapal = formData.get("id_kapal") || null;
    const id_tempat = formData.get("id_tempat") || null;
    const id_cat = formData.get("id_cat") || null;
    const id_status = formData.get("id_status") || null;
    const waktu_masuk = formData.get("waktu_masuk") || null;
    const id_superintendents = formData.getAll("id_superintendent");

    const budget_time = formData.get("budget_time")
      ? Number(formData.get("budget_time"))
      : null;
    const budget_cost = formData.get("budget_cost")
      ? Number(formData.get("budget_cost"))
      : null;

    if (!id_kapal || !id_tempat || !waktu_masuk) {
      throw new Error("Mohon lengkapi data yang wajib diisi!");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const queryPerbaikan = `
        INSERT INTO perbaikan (id_kapal, id_tempat, id_cat, id_status, waktu_masuk, budget_time, budget_cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_perbaikan;
      `;
      const resPerbaikan = await client.query(queryPerbaikan, [
        id_kapal,
        id_tempat,
        id_cat,
        id_status,
        waktu_masuk,
        budget_time,
        budget_cost,
      ]);
      const idPerbaikanBaru = resPerbaikan.rows[0].id_perbaikan;

      if (id_superintendents.length > 0) {
        for (const id_sup of id_superintendents) {
          await client.query(
            "INSERT INTO perbaikan_superintendent (id_perbaikan, id_superintendent) VALUES ($1, $2)",
            [idPerbaikanBaru, id_sup],
          );
        }
      }

      await client.query("COMMIT");
      revalidatePath("/ongoing");
      return { success: true };
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error Create:", error);
    return { success: false, message: error.message };
  }
}

export async function updateMaintenanceDetail(id_perbaikan, formData) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const id_kapal = formData.get("id_kapal") || null;
    const id_tempat = formData.get("id_tempat") || null;
    const id_cat = formData.get("id_cat") || null;
    const id_status = formData.get("id_status") || null;
    const waktu_off_operasi = formData.get("waktu_off_operasi") || null;
    const waktu_masuk = formData.get("waktu_masuk") || null;
    const waktu_naik = formData.get("waktu_naik") || null;
    const waktu_turun = formData.get("waktu_turun") || null;
    const waktu_keluar = formData.get("waktu_keluar") || null;
    const waktu_mulai_operasi = formData.get("waktu_mulai_operasi") || null;
    const budget_time = formData.get("budget_time")
      ? Number(formData.get("budget_time"))
      : null;
    const budget_cost = formData.get("budget_cost")
      ? Number(formData.get("budget_cost"))
      : null;
    const harga_penawaran = formData.get("harga_penawaran")
      ? Number(formData.get("harga_penawaran"))
      : null;
    const harga_kontrak = formData.get("harga_kontrak")
      ? Number(formData.get("harga_kontrak"))
      : null;
    const harga_rekalbea = formData.get("harga_rekalbea")
      ? Number(formData.get("harga_rekalbea"))
      : null;
    const harga_confirm = formData.get("harga_confirm")
      ? Number(formData.get("harga_confirm"))
      : null;

    const nominal_bayar_1_bkk = formData.get("nominal_bayar_1_bkk")
      ? Number(formData.get("nominal_bayar_1_bkk"))
      : null;
    const tanggal_bayar_1_bkk = formData.get("tanggal_bayar_1_bkk") || null;
    const nominal_bayar_1_bkm = formData.get("nominal_bayar_1_bkm")
      ? Number(formData.get("nominal_bayar_1_bkm"))
      : null;
    const tanggal_bayar_1_bkm = formData.get("tanggal_bayar_1_bkm") || null;
    const nominal_bayar_2 = formData.get("nominal_bayar_2")
      ? Number(formData.get("nominal_bayar_2"))
      : null;
    const tanggal_bayar_2 = formData.get("tanggal_bayar_2") || null;
    const nominal_bayar_3 = formData.get("nominal_bayar_3")
      ? Number(formData.get("nominal_bayar_3"))
      : null;
    const tanggal_bayar_3 = formData.get("tanggal_bayar_3") || null;
    const nominal_bayar_4 = formData.get("nominal_bayar_4")
      ? Number(formData.get("nominal_bayar_4"))
      : null;
    const tanggal_bayar_4 = formData.get("tanggal_bayar_4") || null;
    const biaya_jasa = formData.get("biaya_jasa")
      ? Number(formData.get("biaya_jasa"))
      : null;
    const deskripsi_1 = formData.get("deskripsi_1") || null;
    const deskripsi_2 = formData.get("deskripsi_2") || null;

    const cekPerbaikan = await client.query(
      "SELECT id_pembayaran FROM perbaikan WHERE id_perbaikan = $1",
      [id_perbaikan],
    );
    let idPembayaran = cekPerbaikan.rows[0]?.id_pembayaran;

    const payParams = [
      nominal_bayar_1_bkk,
      tanggal_bayar_1_bkk,
      nominal_bayar_1_bkm,
      tanggal_bayar_1_bkm,
      nominal_bayar_2,
      tanggal_bayar_2,
      nominal_bayar_3,
      tanggal_bayar_3,
      nominal_bayar_4,
      tanggal_bayar_4,
      biaya_jasa,
      deskripsi_1,
      deskripsi_2,
    ];

    if (idPembayaran) {
      await client.query(
        `
        UPDATE pembayaran SET 
          nominal_bayar_1_bkk=$1, tanggal_bayar_1_bkk=$2, 
          nominal_bayar_1_bkm=$3, tanggal_bayar_1_bkm=$4, 
          nominal_bayar_2=$5, tanggal_bayar_2=$6, 
          nominal_bayar_3=$7, tanggal_bayar_3=$8, 
          nominal_bayar_4=$9, tanggal_bayar_4=$10, 
          biaya_jasa=$11, deskripsi_1=$12, deskripsi_2=$13
        WHERE id_pembayaran = $14`,
        [...payParams, idPembayaran],
      );
    } else {
      const resPay = await client.query(
        `
        INSERT INTO pembayaran (
          nominal_bayar_1_bkk, tanggal_bayar_1_bkk, 
          nominal_bayar_1_bkm, tanggal_bayar_1_bkm, 
          nominal_bayar_2, tanggal_bayar_2, 
          nominal_bayar_3, tanggal_bayar_3, 
          nominal_bayar_4, tanggal_bayar_4, 
          biaya_jasa, deskripsi_1, deskripsi_2
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id_pembayaran`,
        payParams,
      );
      idPembayaran = resPay.rows[0].id_pembayaran;
    }

    await client.query(
      `
      UPDATE perbaikan SET 
        id_kapal=$1, id_tempat=$2, id_cat=$3, id_status=$4, id_pembayaran=$5, 
        waktu_off_operasi=$6, waktu_masuk=$7, waktu_naik=$8, waktu_turun=$9, waktu_keluar=$10, waktu_mulai_operasi=$11, 
        budget_time=$12, budget_cost=$13, harga_penawaran=$14, harga_kontrak=$15, harga_rekalbea=$16, harga_confirm=$17
      WHERE id_perbaikan = $18`,
      [
        id_kapal,
        id_tempat,
        id_cat,
        id_status,
        idPembayaran,
        waktu_off_operasi,
        waktu_masuk,
        waktu_naik,
        waktu_turun,
        waktu_keluar,
        waktu_mulai_operasi,
        budget_time,
        budget_cost,
        harga_penawaran,
        harga_kontrak,
        harga_rekalbea,
        harga_confirm,
        id_perbaikan,
      ],
    );

    await client.query(
      "DELETE FROM perbaikan_superintendent WHERE id_perbaikan = $1",
      [id_perbaikan],
    );
    const id_superintendents = formData.getAll("id_superintendent");
    for (const id_sup of id_superintendents) {
      await client.query(
        "INSERT INTO perbaikan_superintendent (id_perbaikan, id_superintendent) VALUES ($1, $2)",
        [id_perbaikan, id_sup],
      );
    }

    await client.query("COMMIT");
    revalidatePath("/ongoing");
    revalidatePath(`/list/${id_perbaikan}`);
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error Update:", error);
    return { success: false, message: error.message };
  } finally {
    client.release();
  }
}
