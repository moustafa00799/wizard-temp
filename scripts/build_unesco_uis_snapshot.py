from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / ".local/public-research/unesco/egy-sau-education-data.json"
OUTPUT_DIR = ROOT / "data/knowledge/public/unesco/2026-08-25"
OUTPUT_PATH = OUTPUT_DIR / "normalized-observations.json"
CAPTURED_AT = "2026-08-25T19:17:42.000Z"
VERSION = "20260507-91260335"
QUERY_URL = (
    "https://api.uis.unesco.org/api/public/data/indicators?"
    "indicator=20060&indicator=20062&indicator=20082&indicator=25053&indicator=CR.1&"
    "indicator=PRYA.12MO.AG15T64&indicator=LR.AG15T24&indicator=LR.AG15T99&"
    "geoUnit=EGY&geoUnit=SAU&start=2010&end=2025&footnotes=true&indicatorMetadata=true&"
    f"version={VERSION}"
)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def unit_from_name(name: str) -> str:
    match = re.search(r"\(([^()]*)\)\s*$", name)
    if match:
        value = match.group(1).lower()
        if value == "number":
            return "number"
        if "%" in value:
            return "percent"
        return value
    return "unspecified"


def main() -> None:
    raw = read_json(RAW_PATH)
    metadata = {item["indicatorCode"]: item for item in raw.get("indicatorMetadata", [])}
    records = [record for record in raw.get("records", []) if record.get("value") is not None]
    latest: dict[tuple[str, str], dict[str, Any]] = {}
    for record in records:
        key = (record["geoUnit"], record["indicatorId"])
        existing = latest.get(key)
        if existing is None or int(record["year"]) > int(existing["year"]):
            latest[key] = record

    observations = []
    for (geo_unit, indicator_id), record in sorted(latest.items()):
        definition = metadata.get(indicator_id, {})
        name = definition.get("name", indicator_id)
        observations.append({
            "observationId": f"unesco-uis-{geo_unit.lower()}-{indicator_id.lower().replace('.', '-')}-{record['year']}",
            "sourceId": "src-unesco-uis-egy-sau-education-20260825",
            "geoUnit": geo_unit,
            "market": "EG" if geo_unit == "EGY" else "SA",
            "indicatorCode": indicator_id,
            "indicatorName": name,
            "theme": definition.get("theme", "EDUCATION"),
            "year": record["year"],
            "value": record["value"],
            "unit": unit_from_name(name),
            "magnitude": record.get("magnitude"),
            "qualifier": record.get("qualifier"),
            "footnotes": record.get("footnotes", []),
            "observedAt": f"{record['year']}-12-31T00:00:00.000Z",
            "capturedAt": CAPTURED_AT,
            "version": VERSION,
            "queryUrl": QUERY_URL,
            "limitations": [
                "Education supply, participation, completion, literacy, or training-context indicator; not advertising demand or campaign performance.",
                "Latest available year can differ by indicator and market; do not infer missing years.",
                "Footnotes and magnitude/qualifier fields must be retained when present.",
            ],
        })

    output = {
        "contractVersion": "1.0",
        "artifactType": "public_education_context_snapshot",
        "artifactId": "unesco-uis-egy-sau-education-20260825",
        "generatedAt": CAPTURED_AT,
        "sourceId": "src-unesco-uis-egy-sau-education-20260825",
        "sourceUrl": "https://api.uis.unesco.org/api/public/documentation/",
        "dataUrl": QUERY_URL,
        "version": VERSION,
        "license": "CC BY-SA 4.0",
        "rawInput": {
            "path": RAW_PATH.relative_to(ROOT).as_posix(),
            "sha256": sha256(RAW_PATH),
            "capturedAt": CAPTURED_AT,
        },
        "selection": {
            "method": "latest_non_null_record_per_country_indicator",
            "requestedMarkets": ["EG", "SA"],
            "requestedIndicatorCodes": sorted({record["indicatorId"] for record in records}),
            "observationCount": len(observations),
        },
        "observations": observations,
        "unknowns": [
            "industry-specific education demand",
            "absolute search volume",
            "audience size",
            "CPC",
            "CPA",
            "CVR",
            "ROAS",
            "competitor performance",
        ],
        "limitations": [
            "UNESCO UIS is used for cross-national education context, not for current advertising demand or performance benchmarks.",
            "A record is included only when UIS returned a non-null value; absence remains unavailable.",
            "Estimates, survey definitions, and data-source footnotes are not interchangeable across years or indicators.",
        ],
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "PASS",
        "output": OUTPUT_PATH.relative_to(ROOT).as_posix(),
        "observationCount": len(observations),
        "markets": sorted({item["market"] for item in observations}),
        "indicatorCount": len(output["selection"]["requestedIndicatorCodes"]),
        "rawSha256": output["rawInput"]["sha256"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
