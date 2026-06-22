#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
HYBRID EXCEL SCRAPER v11.8 PERFECT EDITION (GEMINI PAID API WEB INTEGRATED)
Fixes:
- Menggunakan Official Paid Google Gemini API (google-generativeai SDK).
- Mengaktifkan mode JSON Output bawaan Gemini secara native.
- Menerima parameter dinamis dari Node.js Next.js via sys.argv.
- Memproses 4 Sheet bersamaan secara paralel menggunakan ThreadPoolExecutor.
- Membuang semua item yang memiliki harga/keterangan "Include" secara mutlak.
- Mempertahankan 100% Logika Overlapping Context (contekan 10 baris) dari v11.1.
================================================================================
"""

import sys
import pandas as pd
import json
import re
import os
import time
import concurrent.futures
import google.generativeai as genai
import warnings

warnings.filterwarnings("ignore")

# ========== CONFIG ==========
CONFIG = {
    "input_excel": "tes1.xlsx",  # Cadangan jika dijalankan manual tanpa lewat web
    "output_json": "pricelist_scraped.json",
    "gemini_api_key": os.getenv(
        "GEMINI_API_KEY", "AQ.Ab8RN6LMxCiMAQS0godOnn2V_vJ_odjgBQCm4KDYNH1ONKpfqw"
    ),
    # Gunakan model berbayar pilihanmu (gemini-1.5-flash / gemini-2.5-flash / gemini-1.5-pro)
    "gemini_model": "gemini-3.5-flash",
}

# Inisialisasi Google Gemini Paid Client
genai.configure(api_key=CONFIG["gemini_api_key"])

print("\n" + "=" * 120)
print("🚀 HYBRID EXCEL SCRAPER v11.8 (OFFICIAL GEMINI PAID API - WEB INTEGRATED)")
print("   Logic: Parallel 4 Sheets + Overlapping Context + Strict No-Include Rules")
print("=" * 120 + "\n")


# ============================================================================
# STEP 1: CHUNKING LOGIC (DINAMIS 100 BARIS - TAHAN SAMPAI SUB-ITEM SELESAI)
# ============================================================================
def is_category_header(vals):
    if not vals or vals[0] == "-":
        return False
    text = str(vals[0]).strip().upper()
    if re.match(r"^([A-Z]|\d{1,2}|I{1,3}|IV|V|VI|IX|X|XI|XII)[\.\s]+[A-Z\s]+$", text):
        return True

    real_vals = [v for v in vals if v != "-"]
    if len(real_vals) >= 2:
        v1, v2 = str(real_vals[0]).strip().upper(), str(real_vals[1]).strip().upper()
        if (
            re.match(r"^([A-Z]|\d{1,2}|I{1,3}|IV|V|VI|IX|X|XI|XII)[\.\s]*$", v1)
            and len(v2) > 3
            and v2.isupper()
        ):
            return True

    if len(real_vals) == 1 and len(text) > 5 and text.isupper() and "TOTAL" not in text:
        return True
    return False


def is_main_item(vals):
    for v in vals[:2]:
        if v == "-":
            continue
        val_str = str(v).strip()

        if val_str.endswith(".0"):
            val_str = val_str[:-2]
        if val_str.endswith("."):
            val_str = val_str[:-1]

        if re.match(r"^\d+$", val_str):
            return True
        if re.match(r"^\d+\.\d+$", val_str):
            return True
        if re.match(r"^([a-zA-Z]|I{1,3}|IV|V|VI|IX|X|XI|XII)$", val_str, re.IGNORECASE):
            return True
        return False
    return False


def parse_excel_to_chunks(filepath, sheet_name):
    print(f"1️⃣ READING EXCEL [{sheet_name}] & MENGABAIKAN KOP SURAT...\n", flush=True)
    try:
        df = pd.read_excel(filepath, sheet_name=sheet_name, header=None)
    except Exception as e:
        print(f"❌ ERROR: Gagal membaca sheet {sheet_name}. {e}", flush=True)
        return []

    all_rows = []
    current_category = str(sheet_name).strip().upper()
    total_rows = 0
    table_started = False

    for idx, row in df.iterrows():
        vals = [
            (
                str(x).strip()
                if pd.notna(x) and str(x).strip() not in ["", "NaT", "nan", "NaN"]
                else "-"
            )
            for x in row
        ]
        if all(v == "-" for v in vals):
            continue
        while vals and vals[-1] == "-":
            vals.pop()
        if not vals:
            continue

        row_str_lower = " ".join([v for v in vals if v != "-"]).lower()

        if not table_started:
            if (
                "no." in row_str_lower
                or "no " in row_str_lower
                or "job" in row_str_lower
                or "rincian" in row_str_lower
                or "deskripsi" in row_str_lower
            ):
                table_started = True
                continue
            else:
                continue

        if ("no." in row_str_lower or "job" in row_str_lower) and (
            "harga" in row_str_lower
            or "price" in row_str_lower
            or "total" in row_str_lower
        ):
            continue

        if is_category_header(vals):
            current_category = " ".join([v for v in vals if v != "-"])
            continue

        row_str = " | ".join(vals)
        all_rows.append(
            {
                "row_num": idx + 1,
                "text": row_str,
                "category": current_category,
                "vals": vals,
            }
        )
        total_rows += 1

    chunks = []
    if total_rows == 0:
        return chunks

    if total_rows > 200:
        target_size = 100
        current_chunk = []
        chunk_part = 1

        for i, r in enumerate(all_rows):
            current_chunk.append(r)

            is_safe_to_cut = False
            if i + 1 < total_rows:
                next_r = all_rows[i + 1]
                if next_r["category"] != r["category"]:
                    is_safe_to_cut = True
                elif is_main_item(next_r["vals"]):
                    is_safe_to_cut = True
            else:
                is_safe_to_cut = True

            if len(current_chunk) >= 220:
                is_safe_to_cut = True

            if len(current_chunk) >= target_size and is_safe_to_cut:
                cat = current_chunk[0]["category"]
                formatted_rows = [
                    {"row_num": cr["row_num"], "text": cr["text"]}
                    for cr in current_chunk
                ]
                chunks.append(
                    {"category": f"{cat} (Part {chunk_part})", "rows": formatted_rows}
                )
                current_chunk = []
                chunk_part += 1

        if current_chunk:
            cat = current_chunk[0]["category"]
            formatted_rows = [
                {"row_num": cr["row_num"], "text": cr["text"]} for cr in current_chunk
            ]
            chunks.append(
                {"category": f"{cat} (Part {chunk_part})", "rows": formatted_rows}
            )

    elif total_rows > 0:
        cat = all_rows[0]["category"]
        formatted_rows = [
            {"row_num": r["row_num"], "text": r["text"]} for r in all_rows
        ]
        chunks.append({"category": cat, "rows": formatted_rows})

    print(f"✅ [{sheet_name}] Membagi dinamis menjadi {len(chunks)} Blok", flush=True)
    return chunks


# ============================================================================
# STEP 2: NATIVE GEMINI PARSING WITH STRUCTURED JSON CONFIG
# ============================================================================
def parse_chunk_with_gemini(chunk_idx, chunk, total_chunks, prev_context=""):
    category = chunk["category"]
    rows = chunk["rows"]

    print(
        f"    🔄 Gemini Memproses Kategori {chunk_idx}/{total_chunks}: {category}...",
        end=" ",
        flush=True,
    )
    chunk_text = "\n".join([f"Baris {r['row_num']}: {r['text']}" for r in rows])

    context_block = ""
    if prev_context:
        context_block = f"""
[REFERENSI KONTEKS DARI CHUNK SEBELUMNYA]
{prev_context}
(INFO: Gunakan referensi di atas HANYA untuk mengetahui siapa Induk dari sub-item di bawah ini. DILARANG KERAS mengekstrak ulang referensi ini ke dalam output JSON!)
--------------------------------------------------
"""

    system_prompt = """Kamu adalah Data Engineer Jenius.
TUGAS: Parse seluruh data Excel ini menjadi JSON yang RAPI dan TEPAT, langsung dalam format 1 BARIS (FLAT) untuk setiap tagihan!

ATURAN PENGGABUNGAN ITEM & SUB-ITEM (WAJIB DIIKUTI 100%):
1. JIKA ITEM UTAMA ADA HARGA TAPI SUB-ITEM KOSONG HARGA:
   - "nama": Nama Item Utama.
   - Semua teks dari sub-item/rincian masuk ke array `catatan`.
2. JIKA ITEM UTAMA KOSONG HARGA TAPI SUB-ITEM ADA HARGA:
   - "nama": Gabungan "Nama Item Utama - Nama Sub Item".
   - Teks rincian lain yang tidak ada harganya, lempar ke array `catatan`.
3. ITEM "INCLUDE" DILARANG MASUK SAMA SEKALI (ATURAN MUTLAK):
   - Jika ada item/pekerjaan yang harganya ditulis "Include", "Inc", atau keterangannya adalah include, ABAIKAN DAN BUANG ITEM TERSEBUT! JANGAN diekstrak ke dalam output JSON.
4. LARANGAN KERAS NAMA ITEM: Jangan pernah menamai item pekerjaan dengan awalan "Start", "Tanggal", "Manpower". Masukkan ke `catatan`.

ATURAN KONTEKS LINTAS-CHUNK (SANGAT FATAL!):
Jika kamu diberikan [REFERENSI KONTEKS DARI CHUNK SEBELUMNYA], dan baris pertama pada data utamamu adalah sebuah sub-item yang terpotong dari induknya, carilah siapa nama Induk (Item Utama) di dalam Referensi tersebut! GABUNGKAN nama Induk dari Referensi dengan sub-item di datamu saat ini agar konteksnya tidak hilang.

ATURAN ANTI-CRASH JSON (STANDARISASI INCH - SANGAT FATAL!):
Jika kamu melihat TANDA KUTIP GANDA (") di dalam teks Excel yang merepresentasikan ukuran (Misalnya ukuran pipa/valve seperti Ø 3" atau Ø 12"), KAMU WAJIB MENGUBAH TANDA KUTIP GANDA TERSEBUT MENJADI KATA 'inch' (Contoh hasil yang benar: Ø 3 inch atau Ø 12 inch). JANGAN PERNAH menggunakan kutip ganda (") ataupun kutip tunggal (') untuk lambang ukuran karena akan merusak format JSON dan Database!

ATURAN ANTI-DUPLIKASI / HUMAN ERROR:
JIKA ADA 1 BARIS YANG TIDAK MEMILIKI HARGA, DAN NAMANYA MENGULANG PERSIS DENGAN BARIS SETELAH ATAU SEBELUMNYA, MAKA ITEM ITU DIJADIKAN 1 BARIS SAJA! 

ATURAN GRAND TOTAL (SANGAT WAJIB):
Di bagian akhir data baris, cari baris penutup yang menuliskan pentotalan harga kategori (Contoh: "GENERAL SERVICE | 343.374.848").
Tarik angka tersebut menjadi angka murni tanpa titik (Contoh: 343374848) dan petakan ke field "total_kategori". Jangan masukkan baris ini ke dalam daftar items!

FORMAT JSON YANG DIHARAPKAN:
{
  "harga_layanan": [
    {
      "kategori": "NAMA KATEGORI",
      "total_kategori": 343374848, 
      "items": [
        {
          "nomor": "00.01",
          "nama": "Contoh Pipa - Pipa Sch80 Ø 3 inch x 100 mm",
          "volume": 1,
          "satuan": "Pcs",
          "harga_satuan": 1111000,
          "harga_total": 1111000,
          "catatan": ["Material lama"],
          "metadata": {"original_row": 33}
        }
      ]
    }
  ]
}

OUTPUT HANYA JSON VALID BERDASARKAN ATURAN DI ATAS."""

    user_prompt = f"""KATEGORI: {category}

{context_block}
[DATA ROWS CHUNK INI (WAJIB DI-PARSE MENJADI JSON!)]
{chunk_text}

TUGAS: BACA DATA ROWS DI ATAS! SAMBUNGKAN KONTEKS JIKA ADA REFERENSI! EKSTRAK JUGA TOTAL HARGA KATEGORI KE FIELD total_kategori! OUTPUT: JSON ONLY."""

    # Set up model dengan system instruction bawaan SDK Gemini
    model = genai.GenerativeModel(
        model_name=CONFIG["gemini_model"], system_instruction=system_prompt
    )

    try:
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.0,
                response_mime_type="application/json",  # Paksa Gemini ngeluarin JSON murni
            ),
            request_options={"timeout": 600000000.0},  # Batas aman respon
        )

        raw_output = response.text.strip()
        match = re.search(r"\{.*\}", raw_output, re.DOTALL)

        if match:
            print("✓", flush=True)
            return json.loads(match.group(0))
        else:
            print("✓", flush=True)
            return json.loads(raw_output)

    except Exception as e:
        print(f"\n      ⚠️ ERROR PADA GEMINI API: {str(e)[:150]}", flush=True)
        return None


# ============================================================================
# STEP 3: MERGE CHUNKS (Pembersihan Partisi agar Menyatu Sempurna)
# ============================================================================
def merge_chunks(all_chunks):
    master = {"harga_layanan": []}
    for chunk_data in all_chunks:
        if not chunk_data or "harga_layanan" not in chunk_data:
            continue
        for kat_data in chunk_data["harga_layanan"]:
            kat_name = kat_data.get("kategori", "UMUM")

            base_kat_name = re.sub(
                r"\s*\(part\s*\d+\)\s*", "", kat_name, flags=re.IGNORECASE
            ).strip()

            existing_kat = next(
                (k for k in master["harga_layanan"] if k["kategori"] == base_kat_name),
                None,
            )

            if existing_kat:
                existing_kat["items"].extend(kat_data.get("items", []))
                if kat_data.get("total_kategori"):
                    existing_kat["total_kategori"] = kat_data["total_kategori"]
            else:
                kat_data["kategori"] = base_kat_name
                master["harga_layanan"].append(kat_data)

    return master


# ============================================================================
# PROSES 1 SHEET LENGKAP (DIJALANKAN SECARA PARALEL OLEH THREAD)
# ============================================================================
def process_single_sheet(filepath, sheet_name):
    chunks = parse_excel_to_chunks(filepath, sheet_name)
    all_chunks = []
    prev_context = ""

    for idx, chunk in enumerate(chunks, 1):
        parsed = parse_chunk_with_gemini(idx, chunk, len(chunks), prev_context)
        if parsed:
            all_chunks.append(parsed)

        # Simpan 10 baris terakhir sebagai contekan ke blok berikutnya
        last_10_rows = chunk["rows"][-10:]
        prev_context = "\n".join(
            [f"Baris {r['row_num']}: {r['text']}" for r in last_10_rows]
        )
        time.sleep(0.5)

    return merge_chunks(all_chunks)


# ============================================================================
# MAIN EXECUTOR (WEB INTEGRATED CONCURRENT TIMELINE)
# ============================================================================
def main():
    # Tangkap lemparan argumen dinamis dari jembatan API Node.js Next.js
    input_excel = sys.argv[1] if len(sys.argv) > 1 else CONFIG["input_excel"]
    output_json = sys.argv[2] if len(sys.argv) > 2 else CONFIG["output_json"]

    print(f"📥 Menerima file input: {input_excel}", flush=True)
    try:
        xl = pd.ExcelFile(input_excel)
        all_sheets = xl.sheet_names
    except Exception as e:
        raise SystemExit(f"❌ ERROR: Tidak bisa membuka file Excel! {e}")

    # Kamus Filter & Detektor Sheet Pintar (Super Lengkap Lintas Bahasa, Spasi & Case)
    TARGET_SHEETS = [
        (
            1,
            [
                "general services",
                "general service",
                "umum",
                "general",
                "gs",
                "pelayanan",
                "pelayanan umum",
                "jasa umum",
                "General Services",
                "General Service",
                "Umum",
                "General",
                "Gs",
                "GS",
                "Pelayanan",
                "Pelayanan Umum",
                "Jasa Umum",
                "GENERAL SERVICES",
                "GENERAL SERVICE",
                "UMUM",
                "GENERAL",
                "PELAYANAN",
                "PELAYANAN UMUM",
                "JASA UMUM",
            ],
        ),
        # (
        #     2,
        #     [
        #         "hull",
        #         "konstruksi",
        #         "lambung",
        #         "construction",
        #         "baja",
        #         "konstruksi baja",
        #         "steel",
        #         "steel construction",
        #         "pelat",
        #         "hull & construction",
        #         "hull and construction",
        #         "hull construction",
        #         "construction & hull",
        #         "construction and hull",
        #         "hull & steel construction",
        #         "hull & steel",
        #         "hull and steel",
        #         "Hull",
        #         "Konstruksi",
        #         "Lambung",
        #         "Construction",
        #         "Baja",
        #         "Konstruksi Baja",
        #         "Steel",
        #         "Steel Construction",
        #         "Pelat",
        #         "Hull & Construction",
        #         "Hull And Construction",
        #         "Hull Construction",
        #         "Construction & Hull",
        #         "Construction And Hull",
        #         "Hull & Steel Construction",
        #         "Hull & Steel",
        #         "Hull And Steel",
        #         "HULL",
        #         "KONSTRUKSI",
        #         "LAMBUNG",
        #         "CONSTRUCTION",
        #         "BAJA",
        #         "KONSTRUKSI BAJA",
        #         "STEEL",
        #         "STEEL CONSTRUCTION",
        #         "PELAT",
        #         "HULL & CONSTRUCTION",
        #         "HULL AND CONSTRUCTION",
        #         "HULL CONSTRUCTION",
        #         "CONSTRUCTION & HULL",
        #         "CONSTRUCTION AND HULL",
        #         "HULL & STEEL CONSTRUCTION",
        #         "HULL & STEEL",
        #         "HULL AND STEEL",
        #     ],
        # ),
        (
            2,
            [
                "pipa",
                "piping",
                "pipe",
                "pemipaan",
                "sistem pipa",
                "piping system",
                "Pipa",
                "Piping",
                "Pipe",
                "Pemipaan",
                "Sistem Pipa",
                "Piping System",
                "PIPA",
                "PIPING",
                "PIPE",
                "PEMIPAAN",
                "SISTEM PIPA",
                "PIPING SYSTEM",
            ],
        ),
        (
            3,
            [
                "valve",
                "valves",
                "katup",
                "klep",
                "Valve",
                "Valves",
                "Katup",
                "Klep",
                "VALVE",
                "VALVES",
                "KATUP",
                "KLEP",
            ],
        ),
    ]

    sheets_to_process = []
    for nama_sheet in all_sheets:
        nama_lower = nama_sheet.lower()
        for urutan, keywords in TARGET_SHEETS:
            if any(kw in nama_lower for kw in keywords):
                sheets_to_process.append({"name": nama_sheet, "order": urutan})
                break

    if not sheets_to_process:
        print("❌ WARNING: Tidak ada sheet target yang cocok!", flush=True)
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump({"harga_layanan": []}, f)
        return

    print(
        f"🎯 Menemukan {len(sheets_to_process)} sheet target. Memulai Multithreading dengan PAID GEMINI API...",
        flush=True,
    )

    # 🔥 EKSEKUSI MULTITHREADING SERENTAK (MAX 4 WORKERS)
    thread_results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_to_sheet = {
            executor.submit(process_single_sheet, input_excel, sheet["name"]): sheet
            for sheet in sheets_to_process
        }

        for future in concurrent.futures.as_completed(future_to_sheet):
            sheet_info = future_to_sheet[future]
            try:
                data_json = future.result()
                thread_results.append({"order": sheet_info["order"], "data": data_json})
            except Exception as exc:
                print(
                    f"❌ [ERROR THREAD] Gagal memproses sheet {sheet_info['name']}: {exc}",
                    flush=True,
                )

    # 🔥 PENGURUTAN MUTLAK SEBELUM SAVE (GS -> Hull -> Piping -> Valve)
    thread_results.sort(key=lambda x: x["order"])

    final_master_json = {"harga_layanan": []}
    for res in thread_results:
        if res["data"] and "harga_layanan" in res["data"]:
            final_master_json["harga_layanan"].extend(res["data"]["harga_layanan"])

    # SIMPAN KE FILE UTAMA UNTUK DITELAN OLEH MASTER_MATCHER.PY
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(final_master_json, f, indent=2, ensure_ascii=False)

    print(f"\n✅ MASTER JSON BERHASIL DISIMPAN DI: {output_json}", flush=True)
    print("=" * 120, flush=True)
    print("✨ SCRAPING GEMINI PAID API MULTITHREADING SELESAI ✨", flush=True)
    print("=" * 120, flush=True)


if __name__ == "__main__":
    main()
