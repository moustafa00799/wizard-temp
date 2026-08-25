from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / ".local/public-research/unctad/UNCTAD_DE_WIDEF.csv"
DICT_PATH = ROOT / ".local/public-research/unctad/UNCTAD_DE_DATADICT.csv"
OUTPUT_DIR = ROOT / "data/knowledge/public/unctad/2026-08-25"
OUTPUT_PATH = OUTPUT_DIR / "normalized-observations.json"
CAPTURED_AT = "2026-08-25T19:40:00.000Z"
SOURCE_ID = "src-unctad-digital-economy-egy-sau-20260825"
SOURCE_URL = "https://data360.worldbank.org/en/dataset/UNCTAD_DE"
DATA_URL = "https://data360files.worldbank.org/data360-data/data/UNCTAD_DE/UNCTAD_DE_WIDEF.csv"
DICT_URL = "https://data360files.worldbank.org/data360-data/data/UNCTAD_DE/UNCTAD_DE_DATADICT.csv"
TARGETS = {"EGY": "EG", "SAU": "SA"}
YEAR_COLUMNS = [str(year) for year in range(2010, 2024)]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def to_value(raw: str) -> float | None:
    value = raw.strip()
    return None if not value else float(value)


def unit_label(unit_measure: str, unit_label_text: str, unit_mult: str) -> str:
    if unit_measure == "USD":
        return f"USD_x10^{unit_mult}"
    if unit_measure in {"PT_BS", "PT_SAL"}:
        return "percent"
    return unit_label_text or unit_measure


def main() -> None:
    observations: list[dict[str, Any]] = []
    with RAW_PATH.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            country_code = row.get("REF_AREA", "")
            if country_code not in TARGETS:
                continue
            for year in YEAR_COLUMNS:
                value = to_value(row.get(year, ""))
                if value is None:
                    continue
                indicator = row.get("INDICATOR", "")
                observations.append({
                    "observationId": f"unctad-de-{country_code.lower()}-{indicator.lower()}-{year}",
                    "sourceId": SOURCE_ID,
                    "market": TARGETS[country_code],
                    "countryCode": country_code,
                    "countryName": row.get("REF_AREA_LABEL"),
                    "indicatorCode": indicator,
                    "indicatorName": row.get("INDICATOR_LABEL"),
                    "frequency": row.get("FREQ_LABEL"),
                    "year": int(year),
                    "value": value,
                    "unitMeasure": row.get("UNIT_MEASURE"),
                    "unit": unit_label(row.get("UNIT_MEASURE", ""), row.get("UNIT_MEASURE_LABEL", ""), row.get("UNIT_MULT", "0")),
                    "unitMultiplier": int(float(row.get("UNIT_MULT", "0") or 0)),
                    "aggregationMethod": row.get("AGG_METHOD_LABEL"),
                    "observationStatus": row.get("OBS_STATUS_LABEL"),
                    "confidentiality": row.get("OBS_CONF_LABEL"),
                    "capturedAt": CAPTURED_AT,
                    "sourceUrl": SOURCE_URL,
                    "dataUrl": DATA_URL,
                    "limitations": [
                        "UNCTAD digital-economy and business-ICT context; not advertising audience size, keyword demand, or campaign performance.",
                        "Availability is uneven by indicator and year; blank cells remain unavailable and are not interpolated.",
                        "Digitally-deliverable services trade is international trade context, not domestic ecommerce sales.",
                    ],
                })
    observations.sort(key=lambda item: (item["market"], item["indicatorCode"], item["year"]))
    output = {
        "contractVersion": "1.0",
        "artifactType": "public_digital_economy_context_snapshot",
        "artifactId": "unctad-digital-economy-egy-sau-20260825",
        "generatedAt": CAPTURED_AT,
        "sourceId": SOURCE_ID,
        "sourceUrl": SOURCE_URL,
        "dataUrl": DATA_URL,
        "dictionaryUrl": DICT_URL,
        "licenseStatus": "unknown",
        "rawInput": {
            "dataPath": RAW_PATH.relative_to(ROOT).as_posix(),
            "dataSha256": sha256(RAW_PATH),
            "dictionaryPath": DICT_PATH.relative_to(ROOT).as_posix(),
            "dictionarySha256": sha256(DICT_PATH),
            "capturedAt": CAPTURED_AT,
        },
        "selection": {
            "method": "all_non_null_year_cells_for_target_countries",
            "markets": ["EG", "SA"],
            "years": [2010, 2023],
            "observationCount": len(observations),
            "indicatorCodes": sorted({item["indicatorCode"] for item in observations}),
        },
        "observations": observations,
        "unknowns": [
            "domestic ecommerce GMV by category",
            "absolute search volume",
            "audience size",
            "CPC",
            "CPA",
            "CVR",
            "ROAS",
            "competitor performance",
            "customer-level funnel performance",
        ],
        "limitations": [
            "Data360 page describes the collection as 14 indicators covering 2010-2023 and sourced from UNCTAD; the snapshot preserves only target-country non-null cells.",
            "The source license was not presumed from the landing page and remains unknown pending explicit terms verification.",
            "No marketing benchmark or causal relationship to advertising outcomes is inferred.",
        ],
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "PASS",
        "output": OUTPUT_PATH.relative_to(ROOT).as_posix(),
        "observationCount": len(observations),
        "indicatorCount": len(output["selection"]["indicatorCodes"]),
        "markets": sorted({item["market"] for item in observations}),
        "dataSha256": output["rawInput"]["dataSha256"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
