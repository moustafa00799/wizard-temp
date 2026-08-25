from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data/knowledge/public/kapsarc/2026-08-25"
RAW_DIR = ROOT / ".local/public-research/kapsarc"
CAPTURED_AT = "2026-08-25T19:55:00.000Z"

SOURCES = {
    "sector": {
        "file": RAW_DIR / "sector.json",
        "sourceId": "src-kapsarc-sama-pos-sector-sa-20260825",
        "sourceUrl": "https://datasource.kapsarc.org/explore/assets/points-of-sale-transactions-and-sales-by-sector/",
        "dataUrl": "https://datasource.kapsarc.org/api/explore/v2.1/catalog/datasets/points-of-sale-transactions-and-sales-by-sector/exports/json/?lang=en&timezone=UTC",
    },
    "sector-city": {
        "file": RAW_DIR / "sector-city.json",
        "sourceId": "src-kapsarc-sama-pos-sector-city-sa-20260825",
        "sourceUrl": "https://datasource.kapsarc.org/explore/assets/point-of-sale-transactions-by-sector-and-city/",
        "dataUrl": "https://datasource.kapsarc.org/api/explore/v2.1/catalog/datasets/point-of-sale-transactions-by-sector-and-city/exports/json/?lang=en&timezone=UTC",
    },
    "detailed-sector-city": {
        "file": RAW_DIR / "detailed-sector-city.json",
        "sourceId": "src-kapsarc-sama-pos-detailed-sector-city-sa-20260825",
        "sourceUrl": "https://datasource.kapsarc.org/explore/assets/detailed-point-of-sale-transactions-by-sector-and-city/",
        "dataUrl": "https://datasource.kapsarc.org/api/explore/v2.1/catalog/datasets/detailed-point-of-sale-transactions-by-sector-and-city/exports/json/?lang=en&timezone=UTC",
    },
}

SECTOR_RELEVANCE = {
    "Electronic & Electric Devices": "ecommerce_general",
    "Clothing and Footwear": "ecommerce_general",
    "Furniture": "ecommerce_general",
    "Jewelry": "ecommerce_general",
    "Education": "education_general",
    "Health": "local_service_general",
    "Restaurants & Café": "local_service_general",
    "Transportation": "local_service_general",
    "Telecommunication": "local_service_general",
    "Public Utilities": "local_service_general",
    "Miscellaneous Goods and Services": "local_service_general",
    "1.5.Freight Transport & Postal & Courier Services": "local_service_general",
    "1.4.Maintenance & Repair of Vehicles": "local_service_general",
    "1.2.Auto & Equipment Rentals": "local_service_general",
    "2.1.Medical Services": "local_service_general",
    "2.2.Pharmacies & Medical Supplies": "local_service_general",
    "2.3.Personal Care": "local_service_general",
    "18.Laundry Services": "local_service_general",
    "9.Professional & Business Services": "local_service_general",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_date(row: dict[str, Any]) -> str:
    return str(row.get("date_object") or row.get("starting_date") or "")


def relevance(sector: str) -> str:
    return SECTOR_RELEVANCE.get(sector, "cross_industry_payment_context")


def normalize_sector_row(row: dict[str, Any], source: dict[str, Any]) -> dict[str, Any]:
    sector_name = row.get("transactions_sales")
    metric_name = row.get("sector")
    if metric_name == "Sales":
        metric = "sector_sales"
        unit = "thousand_SAR"
    else:
        metric = "sector_transactions"
        unit = "thousand_transactions"
    return {
        "observationId": f"kapsarc-sector-{sector_name}-{metric}-{row.get('date')}",
        "sourceId": source["sourceId"],
        "market": "SA",
        "country": "Saudi Arabia",
        "industryRelevance": relevance(str(sector_name)),
        "sector": sector_name,
        "metric": metric,
        "sourceMetric": metric_name,
        "periodicity": row.get("periodicity"),
        "period": row.get("date"),
        "year": int(row["year"]) if row.get("year") else None,
        "quarter": row.get("quarter"),
        "month": row.get("month"),
        "value": row.get("value_in_different_units"),
        "unit": unit,
        "sourceDate": row.get("date_object"),
        "capturedAt": CAPTURED_AT,
        "sourceUrl": source["sourceUrl"],
        "dataUrl": source["dataUrl"],
    }


def normalize_city_row(row: dict[str, Any], source: dict[str, Any]) -> dict[str, Any]:
    sector_name = row.get("sectors")
    metric_name = row.get("number_value_change_transactions")
    if metric_name == "Value of Transactions (In Thousand SAR)":
        metric = "sector_city_transaction_value"
        unit = "thousand_SAR"
    elif metric_name == "Number of Transactions (In Thousand)":
        metric = "sector_city_transaction_count"
        unit = "thousand_transactions"
    elif metric_name == "Value of Transactions Change %":
        metric = "sector_city_transaction_value_change_pct"
        unit = "percent"
    else:
        metric = "sector_city_transaction_count_change_pct"
        unit = "percent"
    date = row.get("starting_date")
    safe_sector = str(sector_name).lower().replace(" ", "-").replace("&", "and").replace("/", "-")
    safe_city = str(row.get("city")).lower().replace(" ", "-")
    return {
        "observationId": f"kapsarc-city-{safe_sector}-{safe_city}-{metric}-{date}",
        "sourceId": source["sourceId"],
        "market": "SA",
        "country": "Saudi Arabia",
        "industryRelevance": relevance(str(sector_name)),
        "sector": sector_name,
        "city": row.get("city"),
        "metric": metric,
        "sourceMetric": metric_name,
        "period": date,
        "value": row.get("value"),
        "unit": unit,
        "sourceDate": date,
        "capturedAt": CAPTURED_AT,
        "sourceUrl": source["sourceUrl"],
        "dataUrl": source["dataUrl"],
    }


def main() -> None:
    outputs: list[dict[str, Any]] = []
    for key, source in SOURCES.items():
        rows = json.loads(source["file"].read_text(encoding="utf-8"))
        if key == "sector":
            rows = [row for row in rows if row.get("transactions_sales") in SECTOR_RELEVANCE]
            normalized = [normalize_sector_row(row, source) for row in rows]
            selection = {
                "method": "all_rows_for_mapped_priority_sectors",
                "sourceTemporal": "2016-2023",
            }
        else:
            latest_date = max(parse_date(row) for row in rows)
            rows = [row for row in rows if parse_date(row) == latest_date and row.get("sectors") in SECTOR_RELEVANCE]
            normalized = [normalize_city_row(row, source) for row in rows]
            selection = {
                "method": "latest_available_date_for_mapped_priority_sectors_and_all_cities",
                "latestAvailableDate": latest_date,
            }
        normalized.sort(key=lambda item: (str(item.get("sector")), str(item.get("city", "")), str(item.get("metric")), str(item.get("period"))))
        artifact_name = {
            "sector": "sector-normalized-observations.json",
            "sector-city": "sector-city-latest-observations.json",
            "detailed-sector-city": "detailed-sector-city-latest-observations.json",
        }[key]
        output = {
            "contractVersion": "1.0",
            "artifactType": f"public_saudi_pos_{key.replace('-', '_')}_snapshot",
            "artifactId": f"kapsarc-sama-pos-{key}-sa-20260825",
            "generatedAt": CAPTURED_AT,
            "sourceId": source["sourceId"],
            "sourceUrl": source["sourceUrl"],
            "dataUrl": source["dataUrl"],
            "licenseStatus": "unknown",
            "rawInput": {
                "path": source["file"].relative_to(ROOT).as_posix(),
                "sha256": sha256(source["file"]),
                "capturedAt": CAPTURED_AT,
            },
            "selection": selection | {
                "mappedSectorCount": len(set(item["sector"] for item in normalized)),
                "observationCount": len(normalized),
            },
            "observations": normalized,
            "unknowns": [
                "advertising audience size",
                "absolute search volume",
                "CPC",
                "CPA",
                "CVR",
                "ROAS",
                "competitor performance",
                "customer-level funnel performance",
            ],
            "limitations": [
                "SAMA payment activity is market-context evidence, not proof of online-only demand for each sector.",
                "Sector and city payment records are not customer-level data and do not identify advertising source or attribution.",
                "Source license status was not presumed and remains unknown pending explicit terms verification.",
                "Change-percent rows are retained as source-reported changes and are not treated as advertising performance.",
            ],
        }
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        out_path = DATA_DIR / artifact_name
        out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        outputs.append({"file": out_path.relative_to(ROOT).as_posix(), "observations": len(normalized), "sha256": output["rawInput"]["sha256"]})
    print(json.dumps({"status": "PASS", "outputs": outputs}, ensure_ascii=False))


if __name__ == "__main__":
    main()
