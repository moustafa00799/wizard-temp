from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / ".local/public-research/kapsarc/pos-transactions.json"
OUTPUT_DIR = ROOT / "data/knowledge/public/kapsarc/2026-08-25"
OUTPUT_PATH = OUTPUT_DIR / "normalized-observations.json"
CAPTURED_AT = "2026-08-25T19:28:13.000Z"
SOURCE_URL = "https://datasource.kapsarc.org/explore/assets/pos-transactions/"
DATA_URL = "https://datasource.kapsarc.org/api/explore/v2.1/catalog/datasets/pos-transactions/exports/json/?lang=en&timezone=UTC"
SOURCE_ID = "src-kapsarc-sama-pos-ecommerce-sa-20260825"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalized(value: str) -> str:
    return " ".join(value.split())


def observation_key(row: dict[str, Any]) -> tuple[str, str, int, str, str]:
    return (
        normalized(row.get("indicator", "")),
        row.get("periodicity", ""),
        int(row.get("year") or 0),
        row.get("quarter") or "",
        row.get("month") or "",
    )


def main() -> None:
    rows = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    selected = {
        "E-Commerce Transactions Using Mada Cards : Number of Transactions": {
            "metric": "ecommerce_transactions_count",
            "unit": "transactions",
        },
        "E-Commerce Transactions Using Mada Cards : Sales (In Thousand Riyals)": {
            "metric": "ecommerce_sales",
            "unit": "thousand_SAR",
        },
        "Total POS : Number of Transactions": {
            "metric": "total_pos_transactions_count",
            "unit": "transactions",
        },
        "Total POS : Sales (In Thousand Riyals)": {
            "metric": "total_pos_sales",
            "unit": "thousand_SAR",
        },
        "Total POS : Number of Points of Sale Terminals": {
            "metric": "pos_terminals_count",
            "unit": "terminals",
        },
    }
    observations = []
    for row in rows:
        if row.get("periodicity") != "Annually":
            continue
        indicator = normalized(row.get("indicator", ""))
        config = selected.get(indicator)
        if config is None:
            continue
        year = int(row["year"])
        observations.append({
            "observationId": f"kapsarc-pos-{config['metric']}-{year}",
            "sourceId": SOURCE_ID,
            "market": "SA",
            "country": "Saudi Arabia",
            "industryRelevance": "ecommerce_general" if config["metric"].startswith("ecommerce_") else "cross_industry_payment_context",
            "metric": config["metric"],
            "indicator": indicator,
            "periodicity": row["periodicity"],
            "period": str(year),
            "year": year,
            "value": row["value_in_different_units"],
            "unit": config["unit"],
            "sourceDate": row.get("date_object"),
            "capturedAt": CAPTURED_AT,
            "sourceUrl": SOURCE_URL,
            "dataUrl": DATA_URL,
            "limitations": [
                "Mada-card transactions only; excludes Visa, Mastercard, and other credit cards according to the dataset description.",
                "Payment activity is a market-activity context signal, not an advertising audience size or campaign-performance benchmark.",
                "Annual values are reported in the source unit; sales are in thousand Saudi Riyals and are not converted to another currency.",
            ],
        })

    observations.sort(key=lambda item: (item["metric"], item["year"]))
    output = {
        "contractVersion": "1.0",
        "artifactType": "public_saudi_ecommerce_payment_context_snapshot",
        "artifactId": "kapsarc-sama-pos-ecommerce-sa-20260825",
        "generatedAt": CAPTURED_AT,
        "sourceId": SOURCE_ID,
        "sourceUrl": SOURCE_URL,
        "dataUrl": DATA_URL,
        "licenseStatus": "unknown",
        "rawInput": {
            "path": RAW_PATH.relative_to(ROOT).as_posix(),
            "sha256": sha256(RAW_PATH),
            "capturedAt": CAPTURED_AT,
        },
        "selection": {
            "method": "annual_rows_for_selected_payment_indicators",
            "metrics": sorted({item["metric"] for item in observations}),
            "years": sorted({item["year"] for item in observations}),
            "observationCount": len(observations),
        },
        "observations": observations,
        "unknowns": [
            "credit-card networks outside Mada",
            "advertising audience size",
            "search volume",
            "CPC",
            "CPA",
            "CVR",
            "ROAS",
            "competitor performance",
            "customer-level funnel performance",
        ],
        "limitations": [
            "Source describes Saudi payment activity and is relevant to ecommerce market context, not proof of demand for every ecommerce category.",
            "License status was not presumed; it remains unknown until explicit terms are verified.",
            "No causal relationship between payment activity and advertising outcomes is inferred.",
        ],
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "PASS",
        "output": OUTPUT_PATH.relative_to(ROOT).as_posix(),
        "observationCount": len(observations),
        "yearRange": [min(item["year"] for item in observations), max(item["year"] for item in observations)],
        "rawSha256": output["rawInput"]["sha256"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
