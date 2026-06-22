import { NextResponse } from "next/server";
import { spawn } from "child_process"; // 🔥 JURUS BARU: Ganti ke spawn biar bisa LIVE STREAMING log Python
import path from "path";
import fs from "fs/promises";

// Helper fungsi untuk menjembatani Python ke terminal Node.js secara Real-Time
function runPythonStream(exePath, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(exePath, args, {
      cwd: options.cwd,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" }, // Amankan mata dari eror emoji
    });

    // 🕒 REM DARURAT (TIMEOUT): Kalau 5 menit (300.000 ms) gak kelar, matikan paksa! Jangan tunggu sampai 50 menit lagi.
    const timeoutLimit = 30000000;
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          "TIMEOUT DETECTED: Proses AI memakan waktu lebih dari 5 menit. Dihentikan paksa!",
        ),
      );
    }, timeoutLimit);

    // 🔥 LIVE STREAMING STDOUT: Setiap kali Python nge-print, detik itu juga langsung muntahin ke terminal VS Code!
    child.stdout.on("data", (data) => {
      process.stdout.write(data.toString());
    });

    // 🔥 LIVE STREAMING STDERR: Tangkap jika ada error atau warning dari Python saat itu juga
    child.stderr.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    child.on("close", (code) => {
      clearTimeout(timer); // Hapus timer kalau sukses sebelum 5 min
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Proses Python terhenti dengan error code: ${code}`));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const idTempat = formData.get("id_tempat");
    const namaKapalRaw = formData.get("nama_kapal") || "Kapal_Unknown";
    const gtKapal = formData.get("gt_kapal") || "0";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File Excel tidak ditemukan!" },
        { status: 400 },
      );
    }

    const safeNamaKapal = namaKapalRaw.replace(/[^a-zA-Z0-9]/g, "_");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `draft_${safeNamaKapal}_${Date.now()}.xlsx`;
    const uploadDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    const pythonDir = path.join(process.cwd(), "python"); // Sesuaikan jika namanya foldermu "pyt"
    const outputJsonPath = path.join(pythonDir, `scraped_${Date.now()}.json`);

    const finalReportName = `Laporan_Audit_${safeNamaKapal}_${Date.now()}.xlsx`;
    const finalReportPath = path.join(process.cwd(), "public", finalReportName);
    const webDataJsonPath = finalReportPath.replace(".xlsx", ".json");

    const pythonExe = path.join(
      process.cwd(),
      ".venv",
      "Scripts",
      "python.exe",
    );

    // ========================================================================
    // 4. EKSEKUSI SCRAPER (LIVE STREAMING MODE)
    // ========================================================================
    console.log(`\n========================================================`);
    console.log(`🎬 [START PROCESS] KAPAL: ${namaKapalRaw}`);
    console.log(`========================================================`);
    console.log(`[1/2] Menjalankan Scraper...`);

    // Keuntungan pake spawn: Argumen dipecah jadi array, bebas dari bug eror spasi path!
    await runPythonStream(
      pythonExe,
      ["master_scrapper.py", filePath, outputJsonPath],
      { cwd: pythonDir },
    );

    // ========================================================================
    // 5. EKSEKUSI MATCHER (LIVE STREAMING MODE)
    // ========================================================================
    console.log(`\n[2/2] Menjalankan AI Matcher (GT Kapal: ${gtKapal})...`);
    await runPythonStream(
      pythonExe,
      ["master_matcher.py", outputJsonPath, finalReportPath, gtKapal],
      { cwd: pythonDir },
    );

    // 6. BACA DATA JSON UNTUK TABEL WEB
    let auditData = [];
    try {
      const rawWebData = await fs.readFile(webDataJsonPath, "utf-8");
      auditData = JSON.parse(rawWebData);
    } catch (readErr) {
      console.log(
        "⚠️ Info: Gagal membaca JSON web acuan, kemungkinan hasil kosong.",
      );
    }

    // Bersihkan file sampah temporer
    await fs.unlink(filePath).catch(() => {});
    await fs.unlink(outputJsonPath).catch(() => {});
    await fs.unlink(webDataJsonPath).catch(() => {});

    console.log(`\n========================================================`);
    console.log(`✅ [SUCCESS] AUDIT SELESAI UNTUK ${namaKapalRaw}`);
    console.log(`========================================================\n`);

    return NextResponse.json({
      success: true,
      message: "Audit Selesai!",
      downloadUrl: `/${finalReportName}`,
      data: auditData,
    });
  } catch (error) {
    console.error("\n🚨 [PROSES ROUTER GAGAL TOTAL]:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
