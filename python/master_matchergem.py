import sys
import pandas as pd
import json
import re
import os
import time
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import google.generativeai as genai  # 🔥 OFFICIAL GEMINI SDK
from thefuzz import fuzz
import warnings

warnings.filterwarnings("ignore")

# ============================================================================
# TANGKAP ARGUMEN DARI NEXT.JS (WEB SCENARIO)
# ============================================================================
ARG_INPUT_JSON = sys.argv[1] if len(sys.argv) > 1 else "scraped_default.json"
ARG_OUTPUT_EXCEL = (
    sys.argv[2] if len(sys.argv) > 2 else "Laporan_Audit_Akurat_v13_Ultimate.xlsx"
)
ARG_GT_KAPAL = float(sys.argv[3]) if len(sys.argv) > 3 else 5562.0

# ========== CONFIGURATION ==========
CONFIG = {
    "json_bill_path": ARG_INPUT_JSON,
    "json_pricelist_path": "pricelist baru.json",
    "kamus_txt_path": "Kata Baku Docking.txt",
    "output_filename": ARG_OUTPUT_EXCEL,
    "kapal_gt": ARG_GT_KAPAL,
    "exact_match_threshold": 0.99,
    "dict_match_threshold": 0.90,
    "fuzzy_match_threshold": 0.90,
    "price_tolerance_percent": 15,
    "gemini_api_key": os.getenv(
        "GEMINI_API_KEY", "AQ.Ab8RN6IH3Y-bdb17gCxYf3TeKS7-FioBzfBSzADvEWmC-Hgg-Q"
    ),
    "gemini_model": "gemini-1.5-flash",
}

# 🔥 Inisialisasi Gemini Client
genai.configure(api_key=CONFIG["gemini_api_key"])


# ============================================================================
# MEMUAT KAMUS SINONIM (DENGAN FITUR ANTI-RTF CORRUPTION)
# ============================================================================
def muat_kamus_dari_txt(filepath: str) -> Dict[str, str]:
    kamus = {
        "selang": "line",
        "pasang": "sambung",
        "lepas": "lepas",
        "buka & tutup": "bongkar pasang",
        "buka tutup": "bongkar pasang",
        "fw": "air tawar",
        "fresh water": "air tawar",
        "freshwater": "air tawar",
        "trash": "sampah",
        "garbage": "sampah",
        "tong sampah": "bak sampah",
        "tugboat": "penundaan",
        "tug": "penundaan",
        "tunda": "penundaan",
        "assist": "penundaan",
        "listrik": "shore connection",
        "power": "shore connection",
        "stanby": "penjaga",
        "standby": "penjaga",
        "staging": "peranca",
        "scaffolding": "peranca",
        "crane": "crane",
        "forklift": "forklift",
        "docking": "merapat",
        "cooling": "pendingin",
        "ventilasi": "sirkulasi udara",
        "cleaning": "pembersihan",
        "water jet": "water jetting",
        "zinc anode": "zinc anoda",
        "manhole": "manhole",
        "valve": "katup",
        "globe valve": "globe",
        "gate valve": "gate",
        "plat lurus": "plat baja",
        "steel plate": "plat baja",
        "di engine room": "engine room",
        "flange": "plendes",
        "flens": "plendes",
        "knee": "elbow",
        "tee": "potongan-t",
        "gantti": "ganti",
        "sch80": "",
        "sch 40": "",
        "sch 80": "",
    }

    if not os.path.exists(filepath):
        return kamus

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        if r"{\rtf1" in content:
            matches = re.findall(
                r"([a-zA-Z0-9\s&/-]+)\s*=\s*([a-zA-Z0-9\s&/-]+)", content
            )
            for kiri, kanan in matches:
                k, v = kiri.strip().lower(), kanan.strip().lower()
                if len(k) > 2 and len(v) > 2 and "rtf" not in k and "fonttbl" not in k:
                    kamus[k] = v
        else:
            for baris in content.split("\n"):
                baris = baris.strip()
                if not baris or baris.startswith("#"):
                    continue
                if "=" in baris:
                    kiri, kanan = baris.split("=", 1)
                    if kiri.strip() and kanan.strip():
                        kamus[kiri.strip().lower()] = kanan.strip().lower()
    except Exception:
        pass

    return kamus


KAMUS_GALANGAN = muat_kamus_dari_txt(CONFIG["kamus_txt_path"])


# ============================================================================
# DATA STRUCTURES
# ============================================================================
@dataclass
class PriceListItemFlat:
    id: str
    kategori: str
    nama: str
    nama_norm: str
    harga: any
    base_price: float
    satuan: str
    catatan: str
    min_charge: float


@dataclass
class BillItem:
    baris: int
    raw_nama: str
    norm_nama: str
    vol: float
    satuan: str
    harga_satuan: float
    total_harga: float
    catatan: str = ""
    pengali_unit: int = 1


# ============================================================================
# NORMALISASI TEKS & PENGHANCUR DISTRAKSI ANGKA
# ============================================================================
class UnitNormalizer:
    UNIT_MAP = {
        "hari": "HARI",
        "hr": "HARI",
        "day": "HARI",
        "days": "HARI",
        "jam": "JAM",
        "hour": "JAM",
        "minggu": "MINGGU",
        "bulan": "BULAN",
        "ton": "TON",
        "t": "TON",
        "kg": "KG",
        "kilogram": "KG",
        "m3": "M3",
        "cbm": "M3",
        "cubic": "M3",
        "m": "METER",
        "meter": "METER",
        "m2": "M2",
        "unit": "UNIT",
        "pcs": "UNIT",
        "piece": "UNIT",
        "buah": "UNIT",
        "set": "SET",
        "paket": "PAKET",
        "kali": "KALI",
        "kx": "KALI",
        "trip": "TRIP",
        "times": "KALI",
        "kapal": "KAPAL",
        "vessel": "KAPAL",
        "tangki": "TANGKI",
        "tank": "TANGKI",
        "balok": "BALOK",
        "ls": "LUMPSUM",
        "lumpsum": "LUMPSUM",
    }

    @staticmethod
    def normalize(satuan: str) -> str:
        if not satuan:
            return ""
        s_lower = str(satuan).lower().strip()
        return UnitNormalizer.UNIT_MAP.get(s_lower, s_lower.upper())

    @staticmethod
    def is_compatible(satuan1: str, satuan2: str) -> float:
        norm1, norm2 = UnitNormalizer.normalize(satuan1), UnitNormalizer.normalize(
            satuan2
        )
        if norm1 == norm2:
            return 1.0
        if norm1 and norm2:
            sim = fuzz.ratio(norm1, norm2) / 100.0
            return sim if sim > 0.6 else 0.0
        return 0.0


def normalize_teks(teks: str) -> str:
    if not teks:
        return ""
    teks = str(teks).lower().strip()

    teks = teks.replace("”", '"').replace("“", '"').replace("’", "'").replace("''", '"')
    teks = teks.replace('"', " inch ")
    teks = re.sub(r"(?:ø|dia\.|diameter)\s*", "", teks)

    teks = teks.replace(" 1/2", ".5").replace(" 1/4", ".25").replace(" 3/4", ".75")
    teks = teks.replace("1/2", "0.5").replace("1/4", "0.25").replace("3/4", "0.75")
    teks = re.sub(r"(\d+),(\d+)\s*inch", r"\1.\2 inch", teks)

    teks = re.sub(r"x\s*\d+(?:\.\d+)?\s*mm", "", teks, flags=re.IGNORECASE)
    teks = re.sub(r"\b\d+k\b", "", teks, flags=re.IGNORECASE)
    teks = re.sub(r"\bpn\s*\d+\b", "", teks, flags=re.IGNORECASE)

    sorted_kamus = dict(
        sorted(KAMUS_GALANGAN.items(), key=lambda item: len(item[0]), reverse=True)
    )
    for key, val in sorted_kamus.items():
        escaped_key = re.escape(key)
        safe_val = str(val).replace("\\", "\\\\")
        pattern = rf"(?<!\w){escaped_key}(?!\w)"
        try:
            teks = re.sub(pattern, safe_val, teks, flags=re.IGNORECASE)
        except Exception:
            pass

    return re.sub(r"\s+", " ", teks)


def ekstrak_minimum_charge(catatan: str) -> float:
    if not catatan:
        return 0.0
    match = re.search(
        r"\b(?:minimum|minimal|min\.?)\b[:\s]*(\d+(?:[.,]\d+)?)",
        str(catatan),
        re.IGNORECASE,
    )
    if match:
        try:
            return float(match.group(1).replace(",", "."))
        except:
            pass
    return 0.0


def hitung_harga_python(
    harga_db, vol_tagihan, min_charge, gt_kapal
) -> Tuple[float, float, float]:
    vol_efektif = max(float(vol_tagihan), float(min_charge))
    base_price = 0.0

    if isinstance(harga_db, (int, float)):
        base_price = float(harga_db)
    elif isinstance(harga_db, str) and harga_db.strip():
        harga_str = str(harga_db).replace("Rp", "").replace(",", "").strip()
        if "gt" in harga_str.lower() or "grt" in harga_str.lower():
            match = re.search(
                r"([\d\.]+)\s*\+\s*([\d\.]+)\s*\(\s*(?:GRT|GT)\s*-\s*([\d\.]+)\s*\)",
                harga_str,
                re.IGNORECASE,
            )
            if match:
                b_p, mult, lim = (
                    float(match.group(1).replace(".", "")),
                    float(match.group(2).replace(".", "")),
                    float(match.group(3).replace(".", "")),
                )
                base_price = b_p if gt_kapal <= lim else b_p + (mult * (gt_kapal - lim))
        else:
            try:
                base_price = float(harga_str.replace(".", ""))
            except:
                pass

    return base_price, vol_efektif, (base_price * vol_efektif)


# ============================================================================
# MULTI-TIER ENGINE (SUPER LIGHTWEIGHT - 100% FUZZY) 🔥
# ============================================================================
class MultiTierMatcher:
    def __init__(self, pricelist_data: List[PriceListItemFlat]):
        self.pricelist = pricelist_data
        print(
            f"✅ Fast Indexing ready! {len(self.pricelist)} items loaded into Memory.\n"
        )

    def _is_hard_conflict(self, tagihan_nama: str, db_nama: str) -> bool:
        t_lower, d_lower = tagihan_nama.lower(), db_nama.lower()

        if "crane" in t_lower and "forklift" in d_lower:
            return True
        if "forklift" in t_lower and "crane" in d_lower:
            return True
        if "dalam" in d_lower and ("luar" in t_lower):
            return True
        if "luar" in d_lower and "dalam" in t_lower:
            return True

        gt_kapal = float(CONFIG.get("kapal_gt", 0))
        if gt_kapal > 0:
            match_range1 = re.search(
                r"(\d+)\s*(?:-|s/d|–|s\.d)\s*(\d+)\s*(?:gt|grt)", d_lower
            )
            match_range2 = re.search(
                r"(?:gt|grt)\s*(\d+)\s*(?:-|s/d|–|s\.d)\s*(\d+)", d_lower
            )

            match_range = match_range1 or match_range2
            if match_range:
                min_gt, max_gt = float(match_range.group(1)), float(
                    match_range.group(2)
                )
                if not (min_gt <= gt_kapal <= max_gt):
                    return True

            match_sd = re.search(r"(?:s/d|max|maksimal)\s*(\d+)\s*(?:gt|grt)", d_lower)
            if match_sd:
                max_gt = float(match_sd.group(1))
                if gt_kapal > max_gt:
                    return True

            match_keatas = re.search(
                r"(\d+)\s*(?:-|s/d|–)?\s*(?:keatas|ke atas|\+)", d_lower
            )
            if match_keatas:
                min_gt = float(match_keatas.group(1))
                if gt_kapal < min_gt:
                    return True

        return False

    def tier1_exact_match(
        self, norm_nama: str, satuan: str
    ) -> Optional[PriceListItemFlat]:
        for item in self.pricelist:
            if item.nama_norm.lower().strip() == norm_nama.lower().strip():
                if UnitNormalizer.is_compatible(satuan, item.satuan) > 0.8:
                    return item
        return None

    def tier2_dictionary_match(
        self, norm_nama: str, satuan: str
    ) -> Optional[Tuple[PriceListItemFlat, float]]:
        norm_words = set(norm_nama.lower().split())
        best_match, best_score = None, 0.0
        for item in self.pricelist:
            if self._is_hard_conflict(norm_nama, item.nama_norm):
                continue
            item_words = set(item.nama_norm.split())
            overlap = len(norm_words & item_words)
            if overlap == 0:
                continue
            word_score = overlap / max(len(norm_words), len(item_words))
            unit_compat = UnitNormalizer.is_compatible(satuan, item.satuan)
            combined_score = (word_score * 0.7) + (unit_compat * 0.3)
            if (
                combined_score > best_score
                and combined_score >= CONFIG["dict_match_threshold"]
            ):
                best_score = combined_score
                best_match = item
        if best_match:
            return (best_match, min(best_score * 0.95, 0.95))
        return None

    def tier3_fuzzy_match(
        self, norm_nama: str, satuan: str
    ) -> Optional[Tuple[PriceListItemFlat, float]]:
        best_match, best_score = None, 0.0
        for item in self.pricelist:
            if self._is_hard_conflict(norm_nama, item.nama_norm):
                continue
            fuzzy_score = fuzz.token_set_ratio(norm_nama, item.nama_norm) / 100.0
            unit_compat = UnitNormalizer.is_compatible(satuan, item.satuan)
            combined_score = (fuzzy_score * 0.7) + (unit_compat * 0.3)
            if combined_score > best_score:
                best_score = combined_score
                best_match = item
        if best_match and best_score >= CONFIG["fuzzy_match_threshold"]:
            return (best_match, min(best_score * 0.88, 0.88))
        return None

    # 🔥 FUNGSI PENYARING KANDIDAT BERUBAH JADI FUZZY MURNI (TANPA CHROMA/TRANSFORMER)
    def get_top_candidates_for_llm(self, query: str, n=35) -> List[PriceListItemFlat]:
        sub_query = query
        if "-" in query:
            sub_query = query.split("-")[-1].strip()

        fuzzy_scores = []
        for item in self.pricelist:
            score_full = fuzz.token_set_ratio(query, item.nama_norm)
            score_sub = fuzz.token_set_ratio(sub_query, item.nama_norm)
            fuzzy_scores.append((max(score_full, score_sub), item))

        fuzzy_scores.sort(key=lambda x: x[0], reverse=True)

        # Kembalikan top 'n' kandidat ke LLM
        return [item for score, item in fuzzy_scores[:n]]

    def match(
        self, bill_item: BillItem
    ) -> Optional[Tuple[PriceListItemFlat, float, str]]:
        t1 = self.tier1_exact_match(bill_item.norm_nama, bill_item.satuan)
        if t1:
            return (t1, 1.0, "TIER 1: Exact Match")

        t2 = self.tier2_dictionary_match(bill_item.norm_nama, bill_item.satuan)
        if t2:
            return (t2[0], t2[1], "TIER 2: Dictionary")

        t3 = self.tier3_fuzzy_match(bill_item.norm_nama, bill_item.satuan)
        if t3:
            return (t3[0], t3[1], "TIER 3: Fuzzy")

        return None


class PriceValidator:
    def __init__(self, pricelist_data: List[PriceListItemFlat]):
        self.pricelist = pricelist_data

    def is_outlier(self, price: float, kategori: str, satuan: str) -> bool:
        return False

    def validate_price(self, bill_price: float, std_price: float) -> Dict:
        if std_price == 0:
            return {"valid": False, "status": "🔍 RUMUS / MANUAL"}
        diff_pct = ((bill_price - std_price) / std_price) * 100

        if abs(diff_pct) <= CONFIG["price_tolerance_percent"]:
            status = "✅ PRICE OK" if abs(diff_pct) < 5 else "⚠️ PRICE ACCEPTABLE"
            return {"valid": True, "status": status}
        else:
            return {
                "valid": False,
                "status": "❌ OVERPRICE" if diff_pct > 0 else "📉 UNDERPRICE",
            }


# ============================================================================
# TIER 4 (Eks Tier 5): LLM VERIFICATION (GEMINI PAID API) 🔥
# ============================================================================
def gemini_verify_match(
    bill_nama: str,
    bill_norm: str,
    bill_satuan: str,
    bill_harga: float,
    bill_catatan: str,
    gt_kapal: float,
    candidates: List[PriceListItemFlat],
) -> Tuple[str, str]:
    candidates_str = "\n".join(
        [
            f"- ID: {c.id} | Layanan: {c.nama} | Satuan: {c.satuan} | Harga Dasar: Rp {c.base_price:,.0f}"
            for c in candidates
        ]
    )

    match_inch = re.search(r"(\d+(?:\.\d+)?)\s*inch", bill_norm)
    ukuran_inch = match_inch.group(1) if match_inch else "TIDAK DITEMUKAN"
    nama_inti = bill_norm.split("-")[-1].strip() if "-" in bill_norm else bill_norm

    system_prompt = f"""Kamu adalah Auditor Ahli Galangan Kapal. Tugasmu MEMILIH 1 KANDIDAT ID dari database.

INFORMASI KAPAL: {gt_kapal} GT (Gross Tonnage)
DAFTAR KANDIDAT:
{candidates_str}

ATURAN MUTLAK:
1. IDENTIFIKASI MATERIAL: Jika benda utama adalah "Packing", "Mur Baut", "Flange/Plendes", atau "Elbow/Knee", JANGAN PERNAH memilih "Pipa lurus"!
2. UKURAN INCH TERDETEKSI: Jika ada angka ukuran, kamu WAJIB mencari kandidat dengan rentang yang MENGCOVER ukuran tersebut. (Contoh: "3" masuk ke "s/d 3").
3. FILTER GT: WAJIB pilih rentang yang mencakup Kapal {gt_kapal} GT.
4. KANDIDAT FIKTIF = NONE: HANYA keluarkan "id": "NONE" jika material tidak ada di daftar.
5. FORMAT JSON: DILARANG menggunakan tanda kutip ganda (") di dalam teks jawabanmu, gunakan kutip tunggal ('). Tulis JSON dengan singkat!
6. PERHATIKAN UNTUK ASISTENSI TUG BOAT! Dia ambil dari data kategori "JASA TUNDA DAN PANDU" BUKA KE ASISTENSI NAIK TURUN DOCKING

OUTPUT WAJIB JSON:
{{
  "material_utama": "nama benda",
  "ukuran_target": "angka",
  "id": "ID_TERPILIH",
  "alasan": "maksimal 1 kalimat"
}}"""

    user_prompt = f"TAGIHAN ASLI: {bill_nama}\nMATERIAL INTI: {nama_inti}\nUKURAN INCH TERDETEKSI: {ukuran_inch}\nSATUAN: {bill_satuan}\nHARGA SATUAN: Rp {bill_harga:,.0f}"

    model = genai.GenerativeModel(
        model_name=CONFIG["gemini_model"], system_instruction=system_prompt
    )

    max_coba = 3
    for percobaan in range(max_coba):
        try:
            response = model.generate_content(
                user_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0,
                    response_mime_type="application/json",
                ),
                request_options={"timeout": 60.0},
            )

            raw_output = response.text.strip()
            match_json = re.search(r"\{.*\}", raw_output, re.DOTALL)
            if match_json:
                raw_output = match_json.group(0)

            result = json.loads(raw_output)
            return result.get("id", "NONE"), result.get("alasan", "LLM validation")

        except json.JSONDecodeError as e:
            if percobaan < max_coba - 1:
                time.sleep(2)
                continue
            match_id = re.search(r'"id"\s*:\s*"([^"]+)"', raw_output, re.IGNORECASE)
            if match_id:
                return match_id.group(1), "Terselamatkan oleh Regex Fallback"
            return "NONE", f"ERROR_API_LLM (JSON Syntax): {str(e)}"

        except Exception as e:
            pesan_error = str(e)
            if (
                "503" in pesan_error
                or "429" in pesan_error
                or "tokens" in pesan_error
                or "overloaded" in pesan_error.lower()
                or "timeout" in pesan_error.lower()
            ):
                if percobaan < max_coba - 1:
                    print(
                        f"    ⏳ API Gemini Tersendat. Mencoba ulang dalam {2*(percobaan+1)} detik..."
                    )
                    time.sleep(2 * (percobaan + 1))
                    continue
            return "NONE", f"ERROR_API_LLM: {pesan_error}"

    return "NONE", "Gagal setelah 3x percobaan"


# ============================================================================
# FLATTEN PRICELIST (SAMA PERSIS)
# ============================================================================
def flatten_json_pricelist(input_path):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    flat_list = []

    def process_node(node, category_name, parent_names, parent_notes):
        notes = []
        for k in ["catatan", "catatan_umum", "catatan_pekerjaan"]:
            val = node.get(k, [])
            if isinstance(val, list):
                for item in val:
                    if isinstance(item, dict):
                        pass
                    else:
                        notes.append(str(item))
            elif val:
                notes.append(str(val))

        current_notes = parent_notes + notes
        current_name = str(node.get("nama", "")).strip()

        full_names = parent_names.copy()
        if current_name:
            full_names.append(current_name)

        price_keys = [
            k for k in node.keys() if k.startswith("harga") and node[k] is not None
        ]

        if price_keys:
            for pk in price_keys:
                suffix = ""
                if pk != "harga":
                    suffix = pk.replace("harga_", "").replace("_", " ").title()

                final_name_parts = full_names.copy()
                if suffix:
                    final_name_parts.append(suffix)

                gabungan_nama = " - ".join([n for n in final_name_parts if n])
                gabungan_catatan = " | ".join([c for c in current_notes if c])
                min_charge = ekstrak_minimum_charge(gabungan_catatan)

                bp, _, _ = hitung_harga_python(
                    node[pk], 1, min_charge, CONFIG["kapal_gt"]
                )

                flat_list.append(
                    PriceListItemFlat(
                        id=f"ITEM_{len(flat_list)+1}",
                        kategori=category_name,
                        nama=gabungan_nama,
                        nama_norm=normalize_teks(gabungan_nama),
                        harga=node[pk],
                        base_price=bp,
                        satuan=str(node.get("satuan", "")).strip(),
                        catatan=gabungan_catatan,
                        min_charge=min_charge,
                    )
                )

        for child_key in ["items", "sub_items", "detail", "catatan"]:
            if child_key in node and isinstance(node[child_key], list):
                for child in node[child_key]:
                    if isinstance(child, dict):
                        process_node(child, category_name, full_names, current_notes)

    for kat in data.get("harga_layanan", []):
        k_nama = kat.get("kategori", "")
        for item in kat.get("items", []):
            process_node(item, k_nama, [], [])

    return flat_list


# ============================================================================
# MAIN EXECUTION (CLI MODE) 🔥 DENGAN GEMINI PAID API
# ============================================================================
if __name__ == "__main__":
    print("=" * 100)
    print("🚀 INTELLIGENT BILL AUDIT SYSTEM v13 ULTIMATE (Super Lightweight)")
    print("=" * 100 + "\n")

    print("1️⃣ Meratakan (Flattening) pricelist database...")
    pricelist_data = flatten_json_pricelist(CONFIG["json_pricelist_path"])
    print(f"✅ Flattened! {len(pricelist_data)} unique items extracted.\n")

    print("2️⃣ Initializing matching engines...\n")
    matcher = MultiTierMatcher(pricelist_data)
    validator = PriceValidator(pricelist_data)

    print("3️⃣ Reading bill items from JSON tagihan...")
    try:
        with open(CONFIG["json_bill_path"], "r", encoding="utf-8") as f:
            bill_data = json.load(f)

        bills = []
        baris_counter = 1

        def parse_bill_node(node):
            global baris_counter
            raw_nama = (
                node.get("nama")
                or node.get("nama_pekerjaan")
                or node.get("item")
                or node.get("deskripsi", "")
            )

            if raw_nama and (
                node.get("harga_satuan") is not None
                or node.get("harga_total") is not None
                or node.get("harga") is not None
            ):

                def parse_angka_aman(nilai, nilai_default):
                    if nilai is None:
                        return float(nilai_default)
                    if isinstance(nilai, (int, float)):
                        return float(nilai)
                    nilai_str = str(nilai).replace(",", "").strip()
                    match = re.search(r"[-+]?\d*\.?\d+", nilai_str)
                    if match:
                        try:
                            return float(match.group())
                        except ValueError:
                            pass
                    return float(nilai_default)

                vol = parse_angka_aman(
                    node.get("volume") or node.get("vol") or node.get("qty"), 1.0
                )
                satuan = node.get("satuan") or node.get("unit", "Unit")
                harga_satuan = parse_angka_aman(
                    node.get("harga_satuan") or node.get("harga") or node.get("rate"),
                    0.0,
                )
                total_harga = parse_angka_aman(
                    node.get("harga_total") or node.get("total") or node.get("jumlah"),
                    (vol * harga_satuan),
                )

                catatan_list = node.get("catatan", [])
                catatan_str = " | ".join([str(c) for c in catatan_list])
                pengali = 1

                nama_lower = str(raw_nama).lower()
                if "tug" in nama_lower or "tunda" in nama_lower:
                    tug_count = sum(
                        1
                        for c in catatan_list
                        if "tug" in str(c).lower() or "tb" in str(c).lower()
                    )
                    if tug_count > 0:
                        pengali = tug_count

                baris_excel = node.get("metadata", {}).get(
                    "original_row", baris_counter
                )

                bills.append(
                    BillItem(
                        baris=baris_excel,
                        raw_nama=str(raw_nama).strip(),
                        norm_nama=normalize_teks(str(raw_nama)),
                        vol=vol,
                        satuan=str(satuan).strip(),
                        harga_satuan=harga_satuan,
                        total_harga=total_harga,
                        catatan=catatan_str,
                        pengali_unit=pengali,
                    )
                )
                baris_counter += 1

            for child_key in ["items", "sub_items", "detail"]:
                if child_key in node and isinstance(node[child_key], list):
                    for child in node[child_key]:
                        parse_bill_node(child)

        if isinstance(bill_data, list):
            for item in bill_data:
                parse_bill_node(item)
        elif isinstance(bill_data, dict) and "harga_layanan" in bill_data:
            for kat in bill_data.get("harga_layanan", []):
                for item in kat.get("items", []):
                    parse_bill_node(item)
        elif isinstance(bill_data, dict):
            key_utama = next(
                (k for k in bill_data.keys() if isinstance(bill_data[k], list)), None
            )
            if key_utama:
                for item in bill_data[key_utama]:
                    parse_bill_node(item)

        print(f"✅ Extracted {len(bills)} bill items dari file JSON.\n")
        print("=" * 100)
        print("📋 AUDIT RESULTS (Transparansi Penuh & Presisi Ekstrem)")
        print("=" * 100 + "\n")

        results = []

        for idx, b in enumerate(bills, 1):
            matched_item, tier_confidence, tier_name = None, 0.0, ""
            alasan_llm = ""

            match_result = matcher.match(b)
            if match_result:
                matched_item, tier_confidence, tier_name = match_result
            else:
                candidates = matcher.get_top_candidates_for_llm(b.norm_nama, n=35)

                # 🔥 Panggil Gemini Paid API
                gemini_id, alasan_llm = gemini_verify_match(
                    b.raw_nama,
                    b.norm_nama,
                    b.satuan,
                    b.harga_satuan,
                    b.catatan,
                    CONFIG["kapal_gt"],
                    candidates,
                )

                if gemini_id != "NONE":
                    matched_item = next(
                        (x for x in pricelist_data if x.id == gemini_id), None
                    )
                    tier_confidence, tier_name = 0.85, "TIER 4: Gemini LLM RAG"
                    time.sleep(1)  # 🔥 Jeda aman

                if "ERROR_API" in alasan_llm:
                    print(f"⚠️ [API ERROR FATAL] {alasan_llm}")

            if matched_item:
                hrg_satuan_std, vol_efektif, base_total_std = hitung_harga_python(
                    matched_item.harga,
                    b.vol,
                    matched_item.min_charge,
                    CONFIG["kapal_gt"],
                )

                total_std = base_total_std * b.pengali_unit
                hrg_satuan_std_tampil = hrg_satuan_std * b.pengali_unit
                info_pengali = (
                    f" (x{b.pengali_unit} Unit)" if b.pengali_unit > 1 else ""
                )

                price_validation = validator.validate_price(b.total_harga, total_std)
                is_outlier = validator.is_outlier(
                    hrg_satuan_std, matched_item.kategori, matched_item.satuan
                )

                final_confidence = (
                    (tier_confidence * 0.5)
                    + (1.0 if price_validation["valid"] else 0.4)
                    + (0.0 if is_outlier else 0.1)
                )
                final_confidence = min(final_confidence / 2, 0.99)

                status_vol = (
                    f"⚠️ MIN CHARGE (Min {matched_item.min_charge})"
                    if vol_efektif > b.vol
                    else "✅ Vol OK"
                )

                results.append(
                    {
                        "Nomor": idx,
                        "Item Tagihan": b.raw_nama,
                        "Vol Tagihan": b.vol,
                        "Satuan Tagihan": b.satuan,
                        "H. Satuan Tagihan": f"Rp {b.harga_satuan:,.0f}",
                        "Total Tagihan": f"Rp {b.total_harga:,.0f}",
                        "Item Pricelist": matched_item.nama,
                        "Satuan Std": matched_item.satuan,
                        "Vol Efektif": vol_efektif,
                        "H. Satuan Std": f"Rp {hrg_satuan_std_tampil:,.0f}{info_pengali}",
                        "Total Std": f"Rp {total_std:,.0f}",
                        "Status Harga": price_validation["status"],
                        "Selisih": f"Rp {b.total_harga - total_std:,.0f}",
                        "Status Volume": status_vol,
                        "Confidence": f"{final_confidence:.0%}",
                        "Tier": tier_name,
                        "Flag": "🚨 OUTLIER" if is_outlier else "✅ OK",
                        "Alasan": alasan_llm,
                    }
                )

                print(
                    f"[{idx}] Tagihan : {b.raw_nama} ({b.vol} {b.satuan}) {info_pengali}"
                )
                print(f"    Standar : {matched_item.nama} ({matched_item.satuan})")
                print(
                    f"    H.Satuan: Tagihan Rp {b.harga_satuan:,.0f} | Standar Rp {hrg_satuan_std_tampil:,.0f}{info_pengali}"
                )
                print(
                    f"    Total   : Tagihan Rp {b.total_harga:,.0f} | Standar Rp {total_std:,.0f} (Vol Efektif: {vol_efektif})"
                )
                print(f"    Status  : {price_validation['status']} | {status_vol}")
                print(
                    f"    AI Info : {tier_name} | Confidence: {final_confidence:.0%} | Flag: {'🚨 OUTLIER' if is_outlier else 'OK'}"
                )
                if alasan_llm and "LLM validation" not in alasan_llm:
                    print(f"    Alasan  : {alasan_llm}")
                print("-" * 100)

            else:
                results.append(
                    {
                        "Nomor": idx,
                        "Item Tagihan": b.raw_nama,
                        "Vol Tagihan": b.vol,
                        "Satuan Tagihan": b.satuan,
                        "H. Satuan Tagihan": f"Rp {b.harga_satuan:,.0f}",
                        "Total Tagihan": f"Rp {b.total_harga:,.0f}",
                        "Item Pricelist": "❌ NOT FOUND",
                        "Satuan Std": "-",
                        "Vol Efektif": "-",
                        "H. Satuan Std": "-",
                        "Total Std": "-",
                        "Status Harga": "❓ NEED REVIEW",
                        "Selisih": "-",
                        "Status Volume": "❓ UNKNOWN",
                        "Confidence": "0%",
                        "Tier": "NONE",
                        "Flag": "⚠️ MANUAL REVIEW",
                        "Alasan": "",
                    }
                )
                print(f"[{idx}] Tagihan : {b.raw_nama} ({b.vol} {b.satuan})")
                print(f"    ❌ NO MATCH FOUND - REQUIRES MANUAL REVIEW")
                print("-" * 100)

        print("\n4️⃣ Generating report...\n")
        pd.DataFrame(results).to_excel(CONFIG["output_filename"], index=False)

        json_web_output = CONFIG["output_filename"].replace(".xlsx", ".json")
        with open(json_web_output, "w", encoding="utf-8") as jf:
            json.dump(results, jf, indent=2, ensure_ascii=False)

        print(f"✅ Report saved to: {CONFIG['output_filename']}")
        print(f"✅ Web JSON preview generated: {json_web_output}\n")

    except FileNotFoundError:
        print(
            f"⚠️ Peringatan: File JSON Tagihan '{CONFIG['json_bill_path']}' tidak ditemukan."
        )

# import sys
# import pandas as pd
# import json
# import re
# import os
# import time
# import torch
# from typing import Dict, List, Tuple, Optional
# from dataclasses import dataclass
# import google.generativeai as genai  # 🔥 OFFICIAL GEMINI SDK
# from sentence_transformers import SentenceTransformer
# import chromadb
# from thefuzz import fuzz
# import warnings

# warnings.filterwarnings("ignore")

# # ============================================================================
# # TANGKAP ARGUMEN DARI NEXT.JS (WEB SCENARIO)
# # ============================================================================
# ARG_INPUT_JSON = sys.argv[1] if len(sys.argv) > 1 else "scraped_default.json"
# ARG_OUTPUT_EXCEL = (
#     sys.argv[2] if len(sys.argv) > 2 else "Laporan_Audit_Akurat_v13_Ultimate.xlsx"
# )
# ARG_GT_KAPAL = float(sys.argv[3]) if len(sys.argv) > 3 else 5562.0

# # ========== CONFIGURATION ==========
# CONFIG = {
#     "json_bill_path": ARG_INPUT_JSON,
#     "json_pricelist_path": "pricelist baru.json",
#     "kamus_txt_path": "Kata Baku Docking.txt",
#     "output_filename": ARG_OUTPUT_EXCEL,
#     "kapal_gt": ARG_GT_KAPAL,
#     "exact_match_threshold": 0.99,
#     "dict_match_threshold": 0.90,
#     "fuzzy_match_threshold": 0.90,
#     "vector_match_threshold": 0.90,
#     "price_tolerance_percent": 15,
#     "gemini_api_key": os.getenv(
#         "GEMINI_API_KEY", "AQ.Ab8RN6LMxCiMAQS0godOnn2V_vJ_odjgBQCm4KDYNH1ONKpfqw"
#     ),  # 🔥 API KEY GEMINI
#     "gemini_model": "gemini-3.5-flash",  # 🔥 MODEL TERCEPAT GOOGLE
# }

# # 🔥 Inisialisasi Gemini Client
# genai.configure(api_key=CONFIG["gemini_api_key"])

# # ============================================================================
# # MEMUAT KAMUS SINONIM (DENGAN FITUR ANTI-RTF CORRUPTION)
# # ============================================================================
# def muat_kamus_dari_txt(filepath: str) -> Dict[str, str]:
#     kamus = {
#         "selang": "line",
#         "pasang": "sambung",
#         "lepas": "lepas",
#         "buka & tutup": "bongkar pasang",
#         "buka tutup": "bongkar pasang",
#         "fw": "air tawar",
#         "fresh water": "air tawar",
#         "freshwater": "air tawar",
#         "trash": "sampah",
#         "garbage": "sampah",
#         "tong sampah": "bak sampah",
#         "tugboat": "penundaan",
#         "tug": "penundaan",
#         "tunda": "penundaan",
#         "assist": "penundaan",
#         "listrik": "shore connection",
#         "power": "shore connection",
#         "stanby": "penjaga",
#         "standby": "penjaga",
#         "staging": "peranca",
#         "scaffolding": "peranca",
#         "crane": "crane",
#         "forklift": "forklift",
#         "docking": "merapat",
#         "cooling": "pendingin",
#         "ventilasi": "sirkulasi udara",
#         "cleaning": "pembersihan",
#         "water jet": "water jetting",
#         "zinc anode": "zinc anoda",
#         "manhole": "manhole",
#         "valve": "katup",
#         "globe valve": "globe",
#         "gate valve": "gate",
#         "plat lurus": "plat baja",
#         "steel plate": "plat baja",
#         "di engine room": "engine room",
#         "flange": "plendes",
#         "flens": "plendes",
#         "knee": "elbow",
#         "tee": "potongan-t",
#         "gantti": "ganti",
#         "sch80": "",
#         "sch 40": "",
#         "sch 80": "",
#     }

#     if not os.path.exists(filepath):
#         return kamus

#     try:
#         with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
#             content = f.read()

#         # Deteksi jika file tidak sengaja tersimpan dalam format RTF
#         if r"{\rtf1" in content:
#             matches = re.findall(
#                 r"([a-zA-Z0-9\s&/-]+)\s*=\s*([a-zA-Z0-9\s&/-]+)", content
#             )
#             for kiri, kanan in matches:
#                 k, v = kiri.strip().lower(), kanan.strip().lower()
#                 if len(k) > 2 and len(v) > 2 and "rtf" not in k and "fonttbl" not in k:
#                     kamus[k] = v
#         else:
#             for baris in content.split("\n"):
#                 baris = baris.strip()
#                 if not baris or baris.startswith("#"):
#                     continue
#                 if "=" in baris:
#                     kiri, kanan = baris.split("=", 1)
#                     if kiri.strip() and kanan.strip():
#                         kamus[kiri.strip().lower()] = kanan.strip().lower()
#     except Exception:
#         pass

#     return kamus


# KAMUS_GALANGAN = muat_kamus_dari_txt(CONFIG["kamus_txt_path"])


# # ============================================================================
# # DATA STRUCTURES
# # ============================================================================
# @dataclass
# class PriceListItemFlat:
#     id: str
#     kategori: str
#     nama: str
#     nama_norm: str
#     harga: any
#     base_price: float
#     satuan: str
#     catatan: str
#     min_charge: float


# @dataclass
# class BillItem:
#     baris: int
#     raw_nama: str
#     norm_nama: str
#     vol: float
#     satuan: str
#     harga_satuan: float
#     total_harga: float
#     catatan: str = ""
#     pengali_unit: int = 1


# # ============================================================================
# # NORMALISASI TEKS & PENGHANCUR DISTRAKSI ANGKA
# # ============================================================================
# class UnitNormalizer:
#     UNIT_MAP = {
#         "hari": "HARI",
#         "hr": "HARI",
#         "day": "HARI",
#         "days": "HARI",
#         "jam": "JAM",
#         "hour": "JAM",
#         "minggu": "MINGGU",
#         "bulan": "BULAN",
#         "ton": "TON",
#         "t": "TON",
#         "kg": "KG",
#         "kilogram": "KG",
#         "m3": "M3",
#         "cbm": "M3",
#         "cubic": "M3",
#         "m": "METER",
#         "meter": "METER",
#         "m2": "M2",
#         "unit": "UNIT",
#         "pcs": "UNIT",
#         "piece": "UNIT",
#         "buah": "UNIT",
#         "set": "SET",
#         "paket": "PAKET",
#         "kali": "KALI",
#         "kx": "KALI",
#         "trip": "TRIP",
#         "times": "KALI",
#         "kapal": "KAPAL",
#         "vessel": "KAPAL",
#         "tangki": "TANGKI",
#         "tank": "TANGKI",
#         "balok": "BALOK",
#         "ls": "LUMPSUM",
#         "lumpsum": "LUMPSUM",
#     }

#     @staticmethod
#     def normalize(satuan: str) -> str:
#         if not satuan:
#             return ""
#         s_lower = str(satuan).lower().strip()
#         return UnitNormalizer.UNIT_MAP.get(s_lower, s_lower.upper())

#     @staticmethod
#     def is_compatible(satuan1: str, satuan2: str) -> float:
#         norm1, norm2 = UnitNormalizer.normalize(satuan1), UnitNormalizer.normalize(
#             satuan2
#         )
#         if norm1 == norm2:
#             return 1.0
#         if norm1 and norm2:
#             sim = fuzz.ratio(norm1, norm2) / 100.0
#             return sim if sim > 0.6 else 0.0
#         return 0.0


# def normalize_teks(teks: str) -> str:
#     if not teks:
#         return ""
#     teks = str(teks).lower().strip()

#     # Standarisasi Inch
#     teks = teks.replace("”", '"').replace("“", '"').replace("’", "'").replace("''", '"')
#     teks = teks.replace('"', " inch ")
#     teks = re.sub(r"(?:ø|dia\.|diameter)\s*", "", teks)

#     # Pecahan ke Desimal
#     teks = teks.replace(" 1/2", ".5").replace(" 1/4", ".25").replace(" 3/4", ".75")
#     teks = teks.replace("1/2", "0.5").replace("1/4", "0.25").replace("3/4", "0.75")
#     teks = re.sub(r"(\d+),(\d+)\s*inch", r"\1.\2 inch", teks)

#     # PENGHANCUR DISTRAKSI (Hapus panjang mm dan rating tekanan yang bikin AI bingung)
#     teks = re.sub(r"x\s*\d+(?:\.\d+)?\s*mm", "", teks, flags=re.IGNORECASE)
#     teks = re.sub(r"\b\d+k\b", "", teks, flags=re.IGNORECASE)
#     teks = re.sub(r"\bpn\s*\d+\b", "", teks, flags=re.IGNORECASE)

#     sorted_kamus = dict(
#         sorted(KAMUS_GALANGAN.items(), key=lambda item: len(item[0]), reverse=True)
#     )
#     for key, val in sorted_kamus.items():
#         escaped_key = re.escape(key)
#         safe_val = str(val).replace("\\", "\\\\")
#         pattern = rf"(?<!\w){escaped_key}(?!\w)"
#         try:
#             teks = re.sub(pattern, safe_val, teks, flags=re.IGNORECASE)
#         except Exception:
#             pass

#     return re.sub(r"\s+", " ", teks)


# def ekstrak_minimum_charge(catatan: str) -> float:
#     if not catatan:
#         return 0.0
#     match = re.search(
#         r"\b(?:minimum|minimal|min\.?)\b[:\s]*(\d+(?:[.,]\d+)?)",
#         str(catatan),
#         re.IGNORECASE,
#     )
#     if match:
#         try:
#             return float(match.group(1).replace(",", "."))
#         except:
#             pass
#     return 0.0


# def hitung_harga_python(
#     harga_db, vol_tagihan, min_charge, gt_kapal
# ) -> Tuple[float, float, float]:
#     vol_efektif = max(float(vol_tagihan), float(min_charge))
#     base_price = 0.0

#     if isinstance(harga_db, (int, float)):
#         base_price = float(harga_db)
#     elif isinstance(harga_db, str) and harga_db.strip():
#         harga_str = str(harga_db).replace("Rp", "").replace(",", "").strip()
#         if "gt" in harga_str.lower() or "grt" in harga_str.lower():
#             match = re.search(
#                 r"([\d\.]+)\s*\+\s*([\d\.]+)\s*\(\s*(?:GRT|GT)\s*-\s*([\d\.]+)\s*\)",
#                 harga_str,
#                 re.IGNORECASE,
#             )
#             if match:
#                 b_p, mult, lim = (
#                     float(match.group(1).replace(".", "")),
#                     float(match.group(2).replace(".", "")),
#                     float(match.group(3).replace(".", "")),
#                 )
#                 base_price = b_p if gt_kapal <= lim else b_p + (mult * (gt_kapal - lim))
#         else:
#             try:
#                 base_price = float(harga_str.replace(".", ""))
#             except:
#                 pass

#     return base_price, vol_efektif, (base_price * vol_efektif)


# # ============================================================================
# # MULTI-TIER ENGINE (TETAP PAKAI SentenceTransformer & ChromaDB)
# # ============================================================================
# class MultiTierMatcher:
#     def __init__(self, pricelist_data: List[PriceListItemFlat]):
#         self.pricelist = pricelist_data
#         self.model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2").to(
#             "cuda" if torch.cuda.is_available() else "cpu"
#         )
#         chroma_client = chromadb.Client()
#         try:
#             chroma_client.delete_collection(name="omni_price_v12")
#         except:
#             pass
#         self.collection = chroma_client.create_collection(name="omni_price_v12")

#         docs = [item.nama_norm for item in self.pricelist]
#         ids = [item.id for item in self.pricelist]
#         embeddings = self.model.encode(docs)

#         metadatas = [
#             {
#                 "id_asli": item.id,
#                 "nama_asli": item.nama,
#                 "satuan": item.satuan,
#                 "catatan": item.catatan,
#             }
#             for item in self.pricelist
#         ]
#         self.collection.add(
#             ids=ids, embeddings=embeddings.tolist(), documents=docs, metadatas=metadatas
#         )
#         print(f"✅ Vector DB ready! {len(docs)} items indexed.\n")

#     def _is_hard_conflict(self, tagihan_nama: str, db_nama: str) -> bool:
#         t_lower, d_lower = tagihan_nama.lower(), db_nama.lower()

#         if "crane" in t_lower and "forklift" in d_lower:
#             return True
#         if "forklift" in t_lower and "crane" in d_lower:
#             return True
#         if "dalam" in d_lower and ("luar" in t_lower):
#             return True
#         if "luar" in d_lower and "dalam" in t_lower:
#             return True

#         gt_kapal = float(CONFIG.get("kapal_gt", 0))
#         if gt_kapal > 0:
#             match_range1 = re.search(
#                 r"(\d+)\s*(?:-|s/d|–|s\.d)\s*(\d+)\s*(?:gt|grt)", d_lower
#             )
#             match_range2 = re.search(
#                 r"(?:gt|grt)\s*(\d+)\s*(?:-|s/d|–|s\.d)\s*(\d+)", d_lower
#             )

#             match_range = match_range1 or match_range2
#             if match_range:
#                 min_gt, max_gt = float(match_range.group(1)), float(
#                     match_range.group(2)
#                 )
#                 if not (min_gt <= gt_kapal <= max_gt):
#                     return True

#             match_sd = re.search(r"(?:s/d|max|maksimal)\s*(\d+)\s*(?:gt|grt)", d_lower)
#             if match_sd:
#                 max_gt = float(match_sd.group(1))
#                 if gt_kapal > max_gt:
#                     return True

#             match_keatas = re.search(
#                 r"(\d+)\s*(?:-|s/d|–)?\s*(?:keatas|ke atas|\+)", d_lower
#             )
#             if match_keatas:
#                 min_gt = float(match_keatas.group(1))
#                 if gt_kapal < min_gt:
#                     return True

#         return False

#     def tier1_exact_match(
#         self, norm_nama: str, satuan: str
#     ) -> Optional[PriceListItemFlat]:
#         for item in self.pricelist:
#             if item.nama_norm.lower().strip() == norm_nama.lower().strip():
#                 if UnitNormalizer.is_compatible(satuan, item.satuan) > 0.8:
#                     return item
#         return None

#     def tier2_dictionary_match(
#         self, norm_nama: str, satuan: str
#     ) -> Optional[Tuple[PriceListItemFlat, float]]:
#         norm_words = set(norm_nama.lower().split())
#         best_match, best_score = None, 0.0
#         for item in self.pricelist:
#             if self._is_hard_conflict(norm_nama, item.nama_norm):
#                 continue
#             item_words = set(item.nama_norm.split())
#             overlap = len(norm_words & item_words)
#             if overlap == 0:
#                 continue
#             word_score = overlap / max(len(norm_words), len(item_words))
#             unit_compat = UnitNormalizer.is_compatible(satuan, item.satuan)
#             combined_score = (word_score * 0.7) + (unit_compat * 0.3)
#             if (
#                 combined_score > best_score
#                 and combined_score >= CONFIG["dict_match_threshold"]
#             ):
#                 best_score = combined_score
#                 best_match = item
#         if best_match:
#             return (best_match, min(best_score * 0.95, 0.95))
#         return None

#     def tier3_fuzzy_match(
#         self, norm_nama: str, satuan: str
#     ) -> Optional[Tuple[PriceListItemFlat, float]]:
#         best_match, best_score = None, 0.0
#         for item in self.pricelist:
#             if self._is_hard_conflict(norm_nama, item.nama_norm):
#                 continue
#             fuzzy_score = fuzz.token_set_ratio(norm_nama, item.nama_norm) / 100.0
#             unit_compat = UnitNormalizer.is_compatible(satuan, item.satuan)
#             combined_score = (fuzzy_score * 0.7) + (unit_compat * 0.3)
#             if combined_score > best_score:
#                 best_score = combined_score
#                 best_match = item
#         if best_match and best_score >= CONFIG["fuzzy_match_threshold"]:
#             return (best_match, min(best_score * 0.88, 0.88))
#         return None

#     def tier4_vector_match(
#         self, norm_nama: str, satuan: str
#     ) -> Optional[Tuple[PriceListItemFlat, float]]:
#         query_embedding = self.model.encode(norm_nama).tolist()
#         results = self.collection.query(query_embeddings=[query_embedding], n_results=5)
#         best_match, best_score = None, 0.0
#         for i, item_id in enumerate(results["ids"][0]):
#             item = next((x for x in self.pricelist if x.id == item_id), None)
#             if not item or self._is_hard_conflict(norm_nama, item.nama_norm):
#                 continue
#             vector_score = 1 - results["distances"][0][i]
#             unit_compat = UnitNormalizer.is_compatible(satuan, item.satuan)
#             combined_score = (vector_score * 0.7) + (unit_compat * 0.3)
#             if combined_score > best_score:
#                 best_score = combined_score
#                 best_match = item
#         if best_match and best_score >= CONFIG["vector_match_threshold"]:
#             return (best_match, min(best_score, 0.95))
#         return None

#     def get_top_candidates_for_llm(self, query: str, n=35) -> List[PriceListItemFlat]:
#         candidates_dict = {}

#         sub_query = query
#         if "-" in query:
#             sub_query = query.split("-")[-1].strip()

#         query_embedding = self.model.encode([query]).tolist()
#         vector_res = self.collection.query(
#             query_embeddings=query_embedding, n_results=n
#         )
#         for id_asli in vector_res["ids"][0]:
#             item = next((x for x in self.pricelist if x.id == id_asli), None)
#             if item:
#                 candidates_dict[item.id] = item

#         if sub_query != query:
#             query_embedding_sub = self.model.encode([sub_query]).tolist()
#             vector_res_sub = self.collection.query(
#                 query_embeddings=query_embedding_sub, n_results=10
#             )
#             for id_asli in vector_res_sub["ids"][0]:
#                 item = next((x for x in self.pricelist if x.id == id_asli), None)
#                 if item and item.id not in candidates_dict:
#                     candidates_dict[item.id] = item

#         fuzzy_scores = []
#         for item in self.pricelist:
#             if item.id not in candidates_dict:
#                 score_full = fuzz.token_set_ratio(query, item.nama_norm)
#                 score_sub = fuzz.token_set_ratio(sub_query, item.nama_norm)
#                 fuzzy_scores.append((max(score_full, score_sub), item))
#         fuzzy_scores.sort(key=lambda x: x[0], reverse=True)

#         for score, item in fuzzy_scores[:15]:
#             candidates_dict[item.id] = item

#         return list(candidates_dict.values())

#     def match(
#         self, bill_item: BillItem
#     ) -> Optional[Tuple[PriceListItemFlat, float, str]]:
#         t1 = self.tier1_exact_match(bill_item.norm_nama, bill_item.satuan)
#         if t1:
#             return (t1, 1.0, "TIER 1: Exact Match")
#         t2 = self.tier2_dictionary_match(bill_item.norm_nama, bill_item.satuan)
#         if t2:
#             return (t2[0], t2[1], "TIER 2: Dictionary")
#         t3 = self.tier3_fuzzy_match(bill_item.norm_nama, bill_item.satuan)
#         if t3:
#             return (t3[0], t3[1], "TIER 3: Fuzzy")
#         t4 = self.tier4_vector_match(bill_item.norm_nama, bill_item.satuan)
#         if t4:
#             return (t4[0], t4[1], "TIER 4: Vector")
#         return None


# class PriceValidator:
#     def __init__(self, pricelist_data: List[PriceListItemFlat]):
#         self.pricelist = pricelist_data

#     def is_outlier(self, price: float, kategori: str, satuan: str) -> bool:
#         return False

#     def validate_price(self, bill_price: float, std_price: float) -> Dict:
#         if std_price == 0:
#             return {"valid": False, "status": "🔍 RUMUS / MANUAL"}
#         diff_pct = ((bill_price - std_price) / std_price) * 100

#         if abs(diff_pct) <= CONFIG["price_tolerance_percent"]:
#             status = "✅ PRICE OK" if abs(diff_pct) < 5 else "⚠️ PRICE ACCEPTABLE"
#             return {"valid": True, "status": status}
#         else:
#             return {
#                 "valid": False,
#                 "status": "❌ OVERPRICE" if diff_pct > 0 else "📉 UNDERPRICE",
#             }


# # ============================================================================
# # TIER 5: LLM VERIFICATION (GEMINI PAID API) 🔥
# # ============================================================================
# def gemini_verify_match(
#     bill_nama: str,
#     bill_norm: str,
#     bill_satuan: str,
#     bill_harga: float,
#     bill_catatan: str,
#     gt_kapal: float,
#     candidates: List[PriceListItemFlat],
# ) -> Tuple[str, str]:
#     candidates_str = "\n".join(
#         [
#             f"- ID: {c.id} | Layanan: {c.nama} | Satuan: {c.satuan} | Harga Dasar: Rp {c.base_price:,.0f}"
#             for c in candidates
#         ]
#     )

#     # Ekstrak Angka Ukuran Paksa via Python
#     match_inch = re.search(r"(\d+(?:\.\d+)?)\s*inch", bill_norm)
#     ukuran_inch = match_inch.group(1) if match_inch else "TIDAK DITEMUKAN"
#     nama_inti = bill_norm.split("-")[-1].strip() if "-" in bill_norm else bill_norm

#     system_prompt = f"""Kamu adalah Auditor Ahli Galangan Kapal. Tugasmu MEMILIH 1 KANDIDAT ID dari database.

# INFORMASI KAPAL: {gt_kapal} GT (Gross Tonnage)
# DAFTAR KANDIDAT:
# {candidates_str}

# ATURAN MUTLAK:
# 1. IDENTIFIKASI MATERIAL: Jika benda utama adalah "Packing", "Mur Baut", "Flange/Plendes", atau "Elbow/Knee", JANGAN PERNAH memilih "Pipa lurus"!
# 2. UKURAN INCH TERDETEKSI: Jika ada angka ukuran, kamu WAJIB mencari kandidat dengan rentang yang MENGCOVER ukuran tersebut. (Contoh: "3" masuk ke "s/d 3").
# 3. FILTER GT: WAJIB pilih rentang yang mencakup Kapal {gt_kapal} GT.
# 4. KANDIDAT FIKTIF = NONE: HANYA keluarkan "id": "NONE" jika material tidak ada di daftar.
# 5. FORMAT JSON: DILARANG menggunakan tanda kutip ganda (") di dalam teks jawabanmu, gunakan kutip tunggal ('). Tulis JSON dengan singkat!
# 6. PERHATIKAN UNTUK ASISTENSI TUG BOAT! Dia ambil dari data kategori "JASA TUNDA DAN PANDU" BUKA KE ASISTENSI NAIK TURUN DOCKING

# OUTPUT WAJIB JSON:
# {{
#   "material_utama": "nama benda",
#   "ukuran_target": "angka",
#   "id": "ID_TERPILIH",
#   "alasan": "maksimal 1 kalimat"
# }}"""

#     user_prompt = f"TAGIHAN ASLI: {bill_nama}\nMATERIAL INTI: {nama_inti}\nUKURAN INCH TERDETEKSI: {ukuran_inch}\nSATUAN: {bill_satuan}\nHARGA SATUAN: Rp {bill_harga:,.0f}"

#     # Setup Generative Model Gemini dengan System Instruction
#     model = genai.GenerativeModel(
#         model_name=CONFIG["gemini_model"],
#         system_instruction=system_prompt
#     )

#     max_coba = 3
#     for percobaan in range(max_coba):
#         try:
#             # 🔥 Panggil Gemini API native
#             response = model.generate_content(
#                 user_prompt,
#                 generation_config=genai.types.GenerationConfig(
#                     temperature=0.0,
#                     response_mime_type="application/json",  # Paksa JSON di Gemini
#                 ),
#                 request_options={"timeout": 600000000.0}
#             )

#             raw_output = response.text.strip()

#             # --- PENGAMAN GANDA ---
#             match_json = re.search(r"\{.*\}", raw_output, re.DOTALL)
#             if match_json:
#                 raw_output = match_json.group(0)

#             result = json.loads(raw_output)
#             return result.get("id", "NONE"), result.get("alasan", "LLM validation")

#         except json.JSONDecodeError as e:
#             if percobaan < max_coba - 1:
#                 time.sleep(2)
#                 continue
#             match_id = re.search(r'"id"\s*:\s*"([^"]+)"', raw_output, re.IGNORECASE)
#             if match_id:
#                 return match_id.group(1), "Terselamatkan oleh Regex Fallback"
#             return "NONE", f"ERROR_API_LLM (JSON Syntax): {str(e)}"

#         except Exception as e:
#             pesan_error = str(e)
#             if (
#                 "503" in pesan_error
#                 or "429" in pesan_error
#                 or "tokens" in pesan_error
#                 or "overloaded" in pesan_error.lower()
#                 or "timeout" in pesan_error.lower()
#             ):
#                 if percobaan < max_coba - 1:
#                     print(
#                         f"    ⏳ API Gemini Tersendat. Mencoba ulang dalam {2*(percobaan+1)} detik..."
#                     )
#                     time.sleep(2 * (percobaan + 1))
#                     continue
#             return "NONE", f"ERROR_API_LLM: {pesan_error}"

#     return "NONE", "Gagal setelah 3x percobaan"


# # ============================================================================
# # FLATTEN PRICELIST (SAMA PERSIS)
# # ============================================================================
# def flatten_json_pricelist(input_path):
#     with open(input_path, "r", encoding="utf-8") as f:
#         data = json.load(f)
#     flat_list = []

#     def process_node(node, category_name, parent_names, parent_notes):
#         notes = []
#         for k in ["catatan", "catatan_umum", "catatan_pekerjaan"]:
#             val = node.get(k, [])
#             if isinstance(val, list):
#                 for item in val:
#                     if isinstance(item, dict):
#                         pass
#                     else:
#                         notes.append(str(item))
#             elif val:
#                 notes.append(str(val))

#         current_notes = parent_notes + notes
#         current_name = str(node.get("nama", "")).strip()

#         full_names = parent_names.copy()
#         if current_name:
#             full_names.append(current_name)

#         price_keys = [
#             k for k in node.keys() if k.startswith("harga") and node[k] is not None
#         ]

#         if price_keys:
#             for pk in price_keys:
#                 suffix = ""
#                 if pk != "harga":
#                     suffix = pk.replace("harga_", "").replace("_", " ").title()

#                 final_name_parts = full_names.copy()
#                 if suffix:
#                     final_name_parts.append(suffix)

#                 gabungan_nama = " - ".join([n for n in final_name_parts if n])
#                 gabungan_catatan = " | ".join([c for c in current_notes if c])
#                 min_charge = ekstrak_minimum_charge(gabungan_catatan)

#                 bp, _, _ = hitung_harga_python(
#                     node[pk], 1, min_charge, CONFIG["kapal_gt"]
#                 )

#                 flat_list.append(
#                     PriceListItemFlat(
#                         id=f"ITEM_{len(flat_list)+1}",
#                         kategori=category_name,
#                         nama=gabungan_nama,
#                         nama_norm=normalize_teks(gabungan_nama),
#                         harga=node[pk],
#                         base_price=bp,
#                         satuan=str(node.get("satuan", "")).strip(),
#                         catatan=gabungan_catatan,
#                         min_charge=min_charge,
#                     )
#                 )

#         for child_key in ["items", "sub_items", "detail", "catatan"]:
#             if child_key in node and isinstance(node[child_key], list):
#                 for child in node[child_key]:
#                     if isinstance(child, dict):
#                         process_node(child, category_name, full_names, current_notes)

#     for kat in data.get("harga_layanan", []):
#         k_nama = kat.get("kategori", "")
#         for item in kat.get("items", []):
#             process_node(item, k_nama, [], [])

#     return flat_list


# # ============================================================================
# # MAIN EXECUTION (CLI MODE) 🔥 DENGAN GEMINI PAID API
# # ============================================================================
# if __name__ == "__main__":
#     print("=" * 100)
#     print("🚀 INTELLIGENT BILL AUDIT SYSTEM v13 ULTIMATE (Gemini Paid API)")
#     print("=" * 100 + "\n")

#     print("1️⃣ Meratakan (Flattening) pricelist database...")
#     pricelist_data = flatten_json_pricelist(CONFIG["json_pricelist_path"])
#     print(f"✅ Flattened! {len(pricelist_data)} unique items extracted.\n")

#     print("2️⃣ Initializing matching engines...\n")
#     matcher = MultiTierMatcher(pricelist_data)
#     validator = PriceValidator(pricelist_data)

#     print("3️⃣ Reading bill items from JSON tagihan...")
#     try:
#         with open(CONFIG["json_bill_path"], "r", encoding="utf-8") as f:
#             bill_data = json.load(f)

#         bills = []
#         baris_counter = 1

#         def parse_bill_node(node):
#             global baris_counter
#             raw_nama = (
#                 node.get("nama")
#                 or node.get("nama_pekerjaan")
#                 or node.get("item")
#                 or node.get("deskripsi", "")
#             )

#             if raw_nama and (
#                 node.get("harga_satuan") is not None
#                 or node.get("harga_total") is not None
#                 or node.get("harga") is not None
#             ):

#                 def parse_angka_aman(nilai, nilai_default):
#                     if nilai is None:
#                         return float(nilai_default)
#                     if isinstance(nilai, (int, float)):
#                         return float(nilai)
#                     nilai_str = str(nilai).replace(",", "").strip()
#                     match = re.search(r"[-+]?\d*\.?\d+", nilai_str)
#                     if match:
#                         try:
#                             return float(match.group())
#                         except ValueError:
#                             pass
#                     return float(nilai_default)

#                 vol = parse_angka_aman(
#                     node.get("volume") or node.get("vol") or node.get("qty"), 1.0
#                 )
#                 satuan = node.get("satuan") or node.get("unit", "Unit")
#                 harga_satuan = parse_angka_aman(
#                     node.get("harga_satuan") or node.get("harga") or node.get("rate"),
#                     0.0,
#                 )
#                 total_harga = parse_angka_aman(
#                     node.get("harga_total") or node.get("total") or node.get("jumlah"),
#                     (vol * harga_satuan),
#                 )

#                 catatan_list = node.get("catatan", [])
#                 catatan_str = " | ".join([str(c) for c in catatan_list])
#                 pengali = 1

#                 nama_lower = str(raw_nama).lower()
#                 if "tug" in nama_lower or "tunda" in nama_lower:
#                     tug_count = sum(
#                         1
#                         for c in catatan_list
#                         if "tug" in str(c).lower() or "tb" in str(c).lower()
#                     )
#                     if tug_count > 0:
#                         pengali = tug_count

#                 baris_excel = node.get("metadata", {}).get("original_row", baris_counter)

#                 bills.append(
#                     BillItem(
#                         baris=baris_excel,
#                         raw_nama=str(raw_nama).strip(),
#                         norm_nama=normalize_teks(str(raw_nama)),
#                         vol=vol,
#                         satuan=str(satuan).strip(),
#                         harga_satuan=harga_satuan,
#                         total_harga=total_harga,
#                         catatan=catatan_str,
#                         pengali_unit=pengali,
#                     )
#                 )
#                 baris_counter += 1

#             for child_key in ["items", "sub_items", "detail"]:
#                 if child_key in node and isinstance(node[child_key], list):
#                     for child in node[child_key]:
#                         parse_bill_node(child)

#         if isinstance(bill_data, list):
#             for item in bill_data:
#                 parse_bill_node(item)
#         elif isinstance(bill_data, dict) and "harga_layanan" in bill_data:
#             for kat in bill_data.get("harga_layanan", []):
#                 for item in kat.get("items", []):
#                     parse_bill_node(item)
#         elif isinstance(bill_data, dict):
#             key_utama = next(
#                 (k for k in bill_data.keys() if isinstance(bill_data[k], list)), None
#             )
#             if key_utama:
#                 for item in bill_data[key_utama]:
#                     parse_bill_node(item)

#         print(f"✅ Extracted {len(bills)} bill items dari file JSON.\n")
#         print("=" * 100)
#         print("📋 AUDIT RESULTS (Transparansi Penuh & Presisi Ekstrem)")
#         print("=" * 100 + "\n")

#         results = []

#         for idx, b in enumerate(bills, 1):
#             matched_item, tier_confidence, tier_name = None, 0.0, ""
#             alasan_llm = ""

#             match_result = matcher.match(b)
#             if match_result:
#                 matched_item, tier_confidence, tier_name = match_result
#             else:
#                 candidates = matcher.get_top_candidates_for_llm(b.norm_nama, n=35)

#                 # 🔥 Panggil Gemini Paid API
#                 gemini_id, alasan_llm = gemini_verify_match(
#                     b.raw_nama,
#                     b.norm_nama,
#                     b.satuan,
#                     b.harga_satuan,
#                     b.catatan,
#                     CONFIG["kapal_gt"],
#                     candidates,
#                 )

#                 if gemini_id != "NONE":
#                     matched_item = next(
#                         (x for x in pricelist_data if x.id == gemini_id), None
#                     )
#                     tier_confidence, tier_name = 0.85, "TIER 5: Gemini LLM RAG"
#                     time.sleep(1)  # 🔥 Jeda aman anti rate-limit

#                 if "ERROR_API" in alasan_llm:
#                     print(f"⚠️ [API ERROR FATAL] {alasan_llm}")

#             if matched_item:
#                 hrg_satuan_std, vol_efektif, base_total_std = hitung_harga_python(
#                     matched_item.harga,
#                     b.vol,
#                     matched_item.min_charge,
#                     CONFIG["kapal_gt"],
#                 )

#                 total_std = base_total_std * b.pengali_unit
#                 hrg_satuan_std_tampil = hrg_satuan_std * b.pengali_unit
#                 info_pengali = (
#                     f" (x{b.pengali_unit} Unit)" if b.pengali_unit > 1 else ""
#                 )

#                 price_validation = validator.validate_price(b.total_harga, total_std)
#                 is_outlier = validator.is_outlier(
#                     hrg_satuan_std, matched_item.kategori, matched_item.satuan
#                 )

#                 final_confidence = (
#                     (tier_confidence * 0.5)
#                     + (1.0 if price_validation["valid"] else 0.4)
#                     + (0.0 if is_outlier else 0.1)
#                 )
#                 final_confidence = min(final_confidence / 2, 0.99)

#                 status_vol = (
#                     f"⚠️ MIN CHARGE (Min {matched_item.min_charge})"
#                     if vol_efektif > b.vol
#                     else "✅ Vol OK"
#                 )

#                 results.append(
#                     {
#                         "Nomor": idx,
#                         "Item Tagihan": b.raw_nama,
#                         "Vol Tagihan": b.vol,
#                         "Satuan Tagihan": b.satuan,
#                         "H. Satuan Tagihan": f"Rp {b.harga_satuan:,.0f}",
#                         "Total Tagihan": f"Rp {b.total_harga:,.0f}",
#                         "Item Pricelist": matched_item.nama,
#                         "Satuan Std": matched_item.satuan,
#                         "Vol Efektif": vol_efektif,
#                         "H. Satuan Std": f"Rp {hrg_satuan_std_tampil:,.0f}{info_pengali}",
#                         "Total Std": f"Rp {total_std:,.0f}",
#                         "Status Harga": price_validation["status"],
#                         "Selisih": f"Rp {b.total_harga - total_std:,.0f}",
#                         "Status Volume": status_vol,
#                         "Confidence": f"{final_confidence:.0%}",
#                         "Tier": tier_name,
#                         "Flag": "🚨 OUTLIER" if is_outlier else "✅ OK",
#                         "Alasan": alasan_llm,
#                     }
#                 )

#                 print(
#                     f"[{idx}] Tagihan : {b.raw_nama} ({b.vol} {b.satuan}) {info_pengali}"
#                 )
#                 print(f"    Standar : {matched_item.nama} ({matched_item.satuan})")
#                 print(
#                     f"    H.Satuan: Tagihan Rp {b.harga_satuan:,.0f} | Standar Rp {hrg_satuan_std_tampil:,.0f}{info_pengali}"
#                 )
#                 print(
#                     f"    Total   : Tagihan Rp {b.total_harga:,.0f} | Standar Rp {total_std:,.0f} (Vol Efektif: {vol_efektif})"
#                 )
#                 print(f"    Status  : {price_validation['status']} | {status_vol}")
#                 print(
#                     f"    AI Info : {tier_name} | Confidence: {final_confidence:.0%} | Flag: {'🚨 OUTLIER' if is_outlier else 'OK'}"
#                 )
#                 if alasan_llm and "LLM validation" not in alasan_llm:
#                     print(f"    Alasan  : {alasan_llm}")
#                 print("-" * 100)

#             else:
#                 results.append(
#                     {
#                         "Nomor": idx,
#                         "Item Tagihan": b.raw_nama,
#                         "Vol Tagihan": b.vol,
#                         "Satuan Tagihan": b.satuan,
#                         "H. Satuan Tagihan": f"Rp {b.harga_satuan:,.0f}",
#                         "Total Tagihan": f"Rp {b.total_harga:,.0f}",
#                         "Item Pricelist": "❌ NOT FOUND",
#                         "Satuan Std": "-",
#                         "Vol Efektif": "-",
#                         "H. Satuan Std": "-",
#                         "Total Std": "-",
#                         "Status Harga": "❓ NEED REVIEW",
#                         "Selisih": "-",
#                         "Status Volume": "❓ UNKNOWN",
#                         "Confidence": "0%",
#                         "Tier": "NONE",
#                         "Flag": "⚠️ MANUAL REVIEW",
#                         "Alasan": "",
#                     }
#                 )
#                 print(f"[{idx}] Tagihan : {b.raw_nama} ({b.vol} {b.satuan})")
#                 print(f"    ❌ NO MATCH FOUND - REQUIRES MANUAL REVIEW")
#                 print("-" * 100)

#         print("\n4️⃣ Generating report...\n")
#         # Simpan laporan Excel
#         pd.DataFrame(results).to_excel(CONFIG["output_filename"], index=False)

#         # Simpan JSON untuk web preview
#         json_web_output = CONFIG["output_filename"].replace(".xlsx", ".json")
#         with open(json_web_output, "w", encoding="utf-8") as jf:
#             json.dump(results, jf, indent=2, ensure_ascii=False)

#         print(f"✅ Report saved to: {CONFIG['output_filename']}")
#         print(f"✅ Web JSON preview generated: {json_web_output}\n")

#     except FileNotFoundError:
#         print(
#             f"⚠️ Peringatan: File JSON Tagihan '{CONFIG['json_bill_path']}' tidak ditemukan."
#         )
