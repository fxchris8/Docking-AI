import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs/promises";

// Promisify agar exec bisa pakai async/await
const execPromise = util.promisify(exec);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "File Excel tidak ditemukan!" },
        { status: 400 },
      );
    }

    // 1. Simpan file Excel dari UI ke folder lokal "uploads"
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `draft_bill_${Date.now()}.xlsx`;
    const uploadDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    // 2. Set Path untuk skrip Python dan output
    const pythonEngineDir = path.join(process.cwd(), "python_engine");
    const outputJsonPath = path.join(
      pythonEngineDir,
      `scraped_${Date.now()}.json`,
    );
    const finalReportName = `Laporan_Audit_${Date.now()}.xlsx`;
    const finalReportPath = path.join(process.cwd(), "public", finalReportName);

    // 3. EKSEKUSI SCRAPER (Akan berjalan multithreading di dalam Python)
    console.log("Menjalankan Scraper 4 Sheet Bersamaan...");
    const scrapeCmd = `python master_scraper.py "${filePath}" "${outputJsonPath}"`;
    await execPromise(scrapeCmd, { cwd: pythonEngineDir });

    // 4. EKSEKUSI MATCHER
    console.log("Menjalankan AI Matcher...");
    const matchCmd = `python master_matcher.py "${outputJsonPath}" "${finalReportPath}"`;
    await execPromise(matchCmd, { cwd: pythonEngineDir });

    // 5. Bersihkan file sampah temporer
    await fs.unlink(filePath);
    await fs.unlink(outputJsonPath);

    // 6. Kembalikan link ke Frontend
    return NextResponse.json({
      success: true,
      message: "Audit Selesai!",
      downloadUrl: `/${finalReportName}`,
    });
  } catch (error) {
    console.error("Proses Gagal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
