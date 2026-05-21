import pool from "@/lib/db";
export async function getAllPerbaikan() {
  const query = `
    SELECT 
      p.id_perbaikan,

      -- KAPAL
      k.id_kapal,
      k.vessel_id,
      k.nama_kapal,
      k.flat_bottom,
      k.vertical_side,
      k.bottop,
      k.topside,

      -- TEMPAT
      t.id_tempat,
      t.nama_tempat,

      -- STATUS
      s.id_status,
      s.nama_status,

      -- CAT
      c.id_cat,
      c.nama_cat,

      -- PERBAIKAN
      p.waktu_off_operasi,
      p.waktu_masuk,
      p.waktu_naik,
      p.waktu_turun,
      p.waktu_keluar,
      p.waktu_mulai_operasi,
      p.realisasi_waktu_hari,
      p.budget_time,
      p.status_detail,
      p.budget_cost,
      p.harga_penawaran,
      p.tanggal_penawaran,
      p.harga_kontrak,
      p.tanggal_kontrak,
      p.harga_rekalbea,
      p.tanggal_rekalbea,
      p.harga_confirm,
      p.tanggal_confirm,
      p.keterangan,

      -- PEMBAYARAN
      pm.id_pembayaran,
      pm.nominal_bayar_1_bkk,
      pm.tanggal_bayar_1_bkk,

      pm.biaya_jasa,

      pm.nominal_bayar_1_bkm,
      pm.tanggal_bayar_1_bkm,

      pm.nominal_bayar_2,
      pm.tanggal_bayar_2,

      pm.nominal_bayar_3,
      pm.tanggal_bayar_3,

      pm.nominal_bayar_4,
      pm.tanggal_bayar_4,

      pm.total_pembayaran,

      pm.deskripsi_1,
      pm.deskripsi_2,

      -- SUPERINTENDENT
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id_superintendent', sup.id_superintendent,
            'nama_superintendent', sup.nama_superintendent,
            'asal_kota', sup.asal_kota,
            'jabatan', sup.jabatan
          )
        ) FILTER (WHERE sup.id_superintendent IS NOT NULL),
        '[]'
      ) as superintendents,

string_agg(sup.nama_superintendent || ' (' || COALESCE(sup.jabatan, '-') || ')', ', ') AS daftar_superintendent

    FROM perbaikan p

    LEFT JOIN kapal k
      ON p.id_kapal = k.id_kapal

    LEFT JOIN tempat_perbaikan t
      ON p.id_tempat = t.id_tempat

    LEFT JOIN kategori_status s
      ON p.id_status = s.id_status

    LEFT JOIN kategori_cat c
      ON p.id_cat = c.id_cat

    LEFT JOIN pembayaran pm
      ON p.id_pembayaran = pm.id_pembayaran

    LEFT JOIN perbaikan_superintendent ps
      ON p.id_perbaikan = ps.id_perbaikan

    LEFT JOIN superintendent sup
      ON ps.id_superintendent = sup.id_superintendent

    GROUP BY 
      p.id_perbaikan,

      k.id_kapal,
      k.vessel_id,
      k.nama_kapal,
      k.flat_bottom,
      k.vertical_side,
      k.bottop,
      k.topside,

      t.id_tempat,
      t.nama_tempat,

      s.id_status,
      s.nama_status,

      c.id_cat,
      c.nama_cat,

      pm.id_pembayaran

    ORDER BY p.waktu_masuk DESC;
  `;

  try {
    const result = await pool.query(query);

    return result.rows;
  } catch (error) {
    console.error("Error Get All Perbaikan:", error);

    throw new Error("Gagal mengambil data perbaikan");
  }
}

export async function getMasterDataForForm() {
  try {
    const [kapal, tempat, status, cat, superintendent] = await Promise.all([
      pool.query(`
        SELECT 
          id_kapal,
          vessel_id,
          nama_kapal,
          flat_bottom,
          vertical_side,
          bottop,
          topside
        FROM kapal
        ORDER BY nama_kapal ASC
      `),

      pool.query(`
        SELECT 
          id_tempat,
          nama_tempat
        FROM tempat_perbaikan
        ORDER BY nama_tempat ASC
      `),

      pool.query(`
        SELECT 
          id_status,
          nama_status
        FROM kategori_status
        ORDER BY nama_status ASC
      `),

      pool.query(`
        SELECT 
          id_cat,
          nama_cat
        FROM kategori_cat
        ORDER BY nama_cat ASC
      `),

      pool.query(`
        SELECT 
          id_superintendent,
          nama_superintendent,
          asal_kota,
          jabatan
        FROM superintendent
        ORDER BY nama_superintendent ASC
      `),
    ]);

    return {
      kapal: kapal.rows,
      tempat: tempat.rows,
      status: status.rows,
      cat: cat.rows,
      superintendent: superintendent.rows,
    };
  } catch (error) {
    console.error("Error Get Master Data:", error);

    throw new Error("Gagal mengambil master data form");
  }
}

export async function getPerbaikanById(id) {
  const query = `
    SELECT 
      p.id_perbaikan,

      -- KAPAL
      k.id_kapal,
      k.vessel_id,
      k.nama_kapal,
      k.flat_bottom,
      k.vertical_side,
      k.bottop,
      k.topside,

      -- TEMPAT
      t.id_tempat,
      t.nama_tempat,

      -- STATUS
      s.id_status,
      s.nama_status,

      -- CAT
      c.id_cat,
      c.nama_cat,

      -- PERBAIKAN
      p.waktu_off_operasi,
      p.waktu_masuk,
      p.waktu_naik,
      p.waktu_turun,
      p.waktu_keluar,
      p.waktu_mulai_operasi,
      p.realisasi_waktu_hari,
      p.budget_time,
      p.status_detail,
      p.budget_cost,
      p.harga_penawaran,
      p.tanggal_penawaran,
      p.harga_kontrak,
      p.tanggal_kontrak,
      p.harga_rekalbea,
      p.tanggal_rekalbea,
      p.harga_confirm,
      p.tanggal_confirm,
      p.keterangan,

      -- PEMBAYARAN
      pm.id_pembayaran,

      pm.nominal_bayar_1_bkk,
      pm.tanggal_bayar_1_bkk,

      pm.biaya_jasa,

      pm.nominal_bayar_1_bkm,
      pm.tanggal_bayar_1_bkm,

      pm.nominal_bayar_2,
      pm.tanggal_bayar_2,

      pm.nominal_bayar_3,
      pm.tanggal_bayar_3,

      pm.nominal_bayar_4,
      pm.tanggal_bayar_4,

      pm.total_pembayaran,

      pm.deskripsi_1,
      pm.deskripsi_2,

      -- SUPERINTENDENT
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id_superintendent', sup.id_superintendent,
            'nama_superintendent', sup.nama_superintendent,
            'asal_kota', sup.asal_kota,
            'jabatan', sup.jabatan
          )
        ) FILTER (WHERE sup.id_superintendent IS NOT NULL),
        '[]'
      ) as superintendents

    FROM perbaikan p

    LEFT JOIN kapal k
      ON p.id_kapal = k.id_kapal

    LEFT JOIN tempat_perbaikan t
      ON p.id_tempat = t.id_tempat

    LEFT JOIN kategori_status s
      ON p.id_status = s.id_status

    LEFT JOIN kategori_cat c
      ON p.id_cat = c.id_cat

    LEFT JOIN pembayaran pm
      ON p.id_pembayaran = pm.id_pembayaran

    LEFT JOIN perbaikan_superintendent ps
      ON p.id_perbaikan = ps.id_perbaikan

    LEFT JOIN superintendent sup
      ON ps.id_superintendent = sup.id_superintendent

    WHERE p.id_perbaikan = $1

    GROUP BY 
      p.id_perbaikan,

      k.id_kapal,
      k.vessel_id,
      k.nama_kapal,
      k.flat_bottom,
      k.vertical_side,
      k.bottop,
      k.topside,

      t.id_tempat,
      t.nama_tempat,

      s.id_status,
      s.nama_status,

      c.id_cat,
      c.nama_cat,

      pm.id_pembayaran
  `;

  try {
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error Get Perbaikan By ID:", error);

    throw new Error("Gagal mengambil detail perbaikan");
  }
}

/*
  ======================================================
  DELETE PERBAIKAN
  ======================================================
*/

export async function deletePerbaikan(id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
      AMBIL ID PEMBAYARAN
    */

    const perbaikanResult = await client.query(
      `
        SELECT id_pembayaran
        FROM perbaikan
        WHERE id_perbaikan = $1
      `,
      [id],
    );

    const perbaikan = perbaikanResult.rows[0];

    if (!perbaikan) {
      throw new Error("Data perbaikan tidak ditemukan");
    }

    /*
      HAPUS RELASI SUPERINTENDENT
    */

    await client.query(
      `
      DELETE FROM perbaikan_superintendent
      WHERE id_perbaikan = $1
    `,
      [id],
    );

    await client.query(
      `
      DELETE FROM perbaikan
      WHERE id_perbaikan = $1
    `,
      [id],
    );

    if (perbaikan.id_pembayaran) {
      await client.query(
        `
        DELETE FROM pembayaran
        WHERE id_pembayaran = $1
      `,
        [perbaikan.id_pembayaran],
      );
    }

    await client.query("COMMIT");

    return {
      success: true,
      message: "Data perbaikan berhasil dihapus",
    };
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error Delete Perbaikan:", error);

    throw new Error("Gagal menghapus data perbaikan");
  } finally {
    client.release();
  }
}
