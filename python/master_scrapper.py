#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
HYBRID EXCEL SCRAPER v11.5 TURBO (OPENROUTER WEB EDITION)
Fixes:
- MENGGUNAKAN OPENROUTER API (OpenAI SDK Compatible) tanpa max_tokens!
- 100% Meniru Logika internal Chunking & Overlap Konteks dari v11.1 milik User.
- Menangkap parameter dinamis dari Node.js (Input Excel & Output JSON) via sys.argv.
- Auto-Detect Sheet & Eksekusi 4 Sheet bersamaan pakai ThreadPoolExecutor.
- 🔥 UPDATE: ITEM INCLUDE SEKARANG DIABAIKAN TOTAL (TIDAK MASUK SCRAPING!)
================================================================================
"""

import pandas as pd
import json
import re
import os
import sys
import time
import concurrent.futures
from openai import OpenAI  # 🔥 FIX: Menggunakan OpenAI SDK untuk OpenRouter
import warnings

warnings.filterwarnings("ignore")

# ========== CONFIG ==========
CONFIG = {
    "input_excel": "tes1.xlsx",  # Cuma kepake kalau dirun manual tanpa web
    "output_json": "pricelist_scraped.json",
    # 🔥 GANTI DENGAN API KEY OPENROUTER KAMU
    "openrouter_api_key": os.getenv(
        "OPENROUTER_API_KEY",
        "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",
    ),
    # 🔥 MODEL 130B OSS / DEEPSEEK PILIHANMU
    "openrouter_model": "deepseek/deepseek-v3.2",
    "debug": False,
}

# Inisialisasi OpenRouter Client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=CONFIG["openrouter_api_key"],
)

print("\n" + "=" * 120)
print("🚀 HYBRID EXCEL SCRAPER v11.5 (OPENROUTER TURBO MULTITHREADING)")
print("   Logic: 100% Logika User + Ekstrak 4 Sheet Bersamaan (NO INCLUDE)")
print("=" * 120 + "\n")


# ============================================================================
# STEP 1: CHUNKING (DINAMIS 100 BARIS - 100% KODE USER V11.1)
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


def parse_excel_to_chunks(filepath, sheet_idx):
    print(f"1️⃣ READING EXCEL [{sheet_idx}] & MENGABAIKAN KOP SURAT...\n")
    try:
        df = pd.read_excel(filepath, sheet_name=sheet_idx, header=None)
    except Exception as e:
        raise SystemExit(f"❌ ERROR: Gagal baca {filepath}. {e}")

    all_rows = []
    current_category = str(sheet_idx).strip().upper()
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

    print(f"✅ [{sheet_idx}] Membagi menjadi {len(chunks)} Blok")
    return chunks


# ============================================================================
# STEP 2: OPENROUTER PARSING
# ============================================================================
def parse_chunk_with_openrouter(chunk_idx, chunk, total_chunks, prev_context=""):
    category = chunk["category"]
    rows = chunk["rows"]

    print(
        f"    🔄 OpenRouter Memproses Kategori {chunk_idx}/{total_chunks}: {category}...",
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

    # 🔥 FIX: Aturan ke-3 Diubah Drastis untuk MENGABAIKAN Include
    system_prompt = """Kamu adalah Data Engineer Jenius.
TUGAS: Parse seluruh data Excel ini menjadi JSON yang RAPI dan TEPAT, langsung dalam format 1 BARIS (FLAT) untuk setiap tagihan!

ATURAN PENGGABUNGAN ITEM & SUB-ITEM (WAJIB DIIKUTI 100%):
1. JIKA ITEM UTAMA ADA HARGA TAPI SUB-ITEM KOSONG HARGA:
   - "nama": Nama Item Utama.
   - Semua teks dari sub-item/rincian masuk ke array `catatan`.
2. JIKA ITEM UTAMA KOSONG HARGA TAPI SUB-ITEM ADA HARGA:
   - "nama": Gabungan "Nama Item Utama - Nama Sub Item".
   - Teks rincian lain yang tidak ada harganya, lempar ke array `catatan`.
3. ITEM "INCLUDE" DILARANG MASUK SAMA SEKALI:
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

OUTPUT HANYA JSON VALID. DILARANG MENAMBAH TEKS LAIN."""

    user_prompt = f"""KATEGORI: {category}

{context_block}
[DATA ROWS CHUNK INI (WAJIB DI-PARSE MENJADI JSON!)]
{chunk_text}

TUGAS: BACA DATA ROWS DI ATAS! SAMBUNGKAN KONTEKS JIKA ADA REFERENSI! EKSTRAK JUGA TOTAL HARGA KATEGORI KE FIELD total_kategori! OUTPUT: JSON ONLY."""

    try:
        # 🔥 Panggilan ke OpenRouter API dengan OpenAI SDK TANPA max_tokens
        response = client.chat.completions.create(
            model=CONFIG["openrouter_model"],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
        )

        raw_output = response.choices[0].message.content.strip()

        match = re.search(r"\{.*\}", raw_output, re.DOTALL)
        if match:
            print(f"✓")
            return json.loads(match.group(0))
        else:
            print(f"✓")
            return json.loads(raw_output)

    except Exception as e:
        print(f"\n      ⚠️ ERROR PADA OPENROUTER API: {str(e)[:150]}")
        return None


# ============================================================================
# STEP 3: MERGE CHUNKS (Membersihkan (Part X) agar menyatu)
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
# PROSES 1 SHEET LENGKAP (DIPANGGIL SECARA PARALEL OLEH THREAD)
# ============================================================================
def process_single_sheet(filepath, sheet_name):
    """Wrapper murni untuk memproses 1 sheet dengan mempertahankan 100% logika perulangan v11.1"""
    chunks = parse_excel_to_chunks(filepath, sheet_name)
    all_chunks = []
    prev_context = ""

    for idx, chunk in enumerate(chunks, 1):
        parsed = parse_chunk_with_openrouter(idx, chunk, len(chunks), prev_context)
        if parsed:
            all_chunks.append(parsed)

        # 🔥 KONTEKS NYAMBUNG SAKRAL (MUTLAK -10 BARIS SESUAI KODE USER V11.1)
        last_10_rows = chunk["rows"][-10:]
        prev_context = "\n".join(
            [f"Baris {r['row_num']}: {r['text']}" for r in last_10_rows]
        )
        time.sleep(1)

    # Bungkus hasil merge di tingkat individual sheet
    return merge_chunks(all_chunks)


# ============================================================================
# MAIN EXECUTOR (TURBO MULTITHREADING MODE - HUBUNGAN KE NEXT.JS)
# ============================================================================
def main():
    # Tangkap lemparan argumen dinamis dari jembatan API Node.js Next.js
    input_excel = sys.argv[1] if len(sys.argv) > 1 else CONFIG["input_excel"]
    output_json = sys.argv[2] if len(sys.argv) > 2 else CONFIG["output_json"]

    print(f"📥 Menerima file input: {input_excel}")
    try:
        xl = pd.ExcelFile(input_excel)
        all_sheets = xl.sheet_names
    except Exception as e:
        raise SystemExit(f"❌ ERROR: Tidak bisa membuka file Excel! {e}")

    # Kamus Filter & Detektor Sheet Pintar (Super Lengkap Lintas Bahasa & Case)
    TARGET_SHEETS = [
        (
            1,
            [
                # Lowercase
                "general services",
                "general service",
                "umum",
                "general",
                "gs",
                "pelayanan",
                "pelayanan umum",
                "jasa umum",
                # Title Case
                "General Services",
                "General Service",
                "Umum",
                "General",
                "Gs",
                "GS",
                "Pelayanan",
                "Pelayanan Umum",
                "Jasa Umum",
                # Uppercase
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
        #         # Lowercase
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
        #         # Title Case
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
        #         # Uppercase
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
                # Lowercase
                "pipa",
                "piping",
                "pipe",
                "pemipaan",
                "sistem pipa",
                "piping system",
                # Title Case
                "Pipa",
                "Piping",
                "Pipe",
                "Pemipaan",
                "Sistem Pipa",
                "Piping System",
                # Uppercase
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
                # Lowercase
                "valve",
                "valves",
                "katup",
                "klep",
                # Title Case
                "Valve",
                "Valves",
                "Katup",
                "Klep",
                # Uppercase
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
        print("❌ WARNING: Tidak ada sheet target yang cocok!")
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump({"harga_layanan": []}, f)
        return

    print(
        f"🎯 Menemukan {len(sheets_to_process)} sheet target. Memulai Multithreading dengan OPENROUTER..."
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
                    f"❌ [ERROR THREAD] Gagal memproses sheet {sheet_info['name']}: {exc}"
                )

    # 🔥 PENGURUTAN SAKRAL ABSOLUT (GS -> Hull -> Piping -> Valve)
    thread_results.sort(key=lambda x: x["order"])

    final_master_json = {"harga_layanan": []}
    for res in thread_results:
        if res["data"] and "harga_layanan" in res["data"]:
            final_master_json["harga_layanan"].extend(res["data"]["harga_layanan"])

    # SIMPAN KE FILE UTAMA UNTUK DITELAN OLEH MASTER_MATCHER.PY
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(final_master_json, f, indent=2, ensure_ascii=False)

    print(f"\n✅ MASTER JSON BERHASIL DISIMPAN DI: {output_json}")
    print("=" * 120)
    print("✨ SCRAPING OPENROUTER MULTITHREADING SELESAI ✨")
    print("=" * 120)


if __name__ == "__main__":
    main()
