import pool from "@/lib/db";

export async function getMasterTable(table) {
  const query = `SELECT * FROM ${table} ORDER BY 1 ASC`;
  const result = await pool.query(query);
  return result.rows;
}
