from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / "data" / "knowledge" / "public"
DATE_DIR = PUBLIC_ROOT / "world-bank" / "2026-08-25"
REGISTRY_PATH = PUBLIC_ROOT / "public-source-registry-2026-08-25.json"
MANIFEST_PATH = PUBLIC_ROOT / "public-knowledge-batch-2026-08-25.json"
OUTPUT_PATH = DATE_DIR / "latest-observations.json"

INDICATORS = {
    "SP.POP.TOTL": {"name": "Population, total", "unit": "people"},
    "IT.NET.USER.ZS": {"name": "Individuals using the Internet (% of population)", "unit": "percent_of_population"},
    "SP.URB.TOTL.IN.ZS": {"name": "Urban population (% of total population)", "unit": "percent_of_population"},
    "SE.ADT.LITR.ZS": {"name": "Adult literacy rate, population 15+ years, total (%)", "unit": "percent_of_population"},
    "NY.GDP.PCAP.PP.CD": {"name": "GDP per capita, PPP (current international $)", "unit": "current_international_dollars_per_person"},
}
COUNTRY_TO_MARKET = {"EGY": "EG", "SAU": "SA"}
CONTEXT_LIMITATIONS = [
    "Global contextual indicator; not a targetable audience size or campaign benchmark.",
    "Use only with the recorded country, period, indicator definition, and source.",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def raw_records(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list) and len(payload) >= 2 and isinstance(payload[1], list):
        return [item for item in payload[1] if isinstance(item, dict)]
    if isinstance(payload, dict) and isinstance(payload.get("data"), list):
        return [item for item in payload["data"] if isinstance(item, dict)]
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    raise ValueError("Unsupported World Bank payload shape")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(OUTPUT_PATH))
    args = parser.parse_args()

    registry = read_json(REGISTRY_PATH)
    manifest = read_json(MANIFEST_PATH)
    registry_by_id = {source["sourceId"]: source for source in registry["sources"]}
    manifest_snapshots = {
        snapshot["path"]: snapshot for snapshot in manifest.get("rawSnapshots", [])
    }

    candidates: dict[tuple[str, str], dict[str, Any]] = {}
    raw_snapshot_records: list[dict[str, Any]] = []
    for indicator in sorted(INDICATORS):
        raw_path = DATE_DIR / f"{indicator}.json"
        if not raw_path.exists():
            raise FileNotFoundError(raw_path)
        relative_path = raw_path.relative_to(ROOT).as_posix()
        actual_hash = sha256(raw_path)
        declared = manifest_snapshots.get(relative_path)
        if declared and declared.get("sha256") != actual_hash:
            raise ValueError(f"Raw hash mismatch for {relative_path}")
        source_id = declared["sourceId"] if declared else "src-world-bank-egy-indicators-v2-20260825"
        if source_id not in registry_by_id:
            raise ValueError(f"Unregistered source {source_id}")
        raw_snapshot_records.append({
            "path": relative_path,
            "sha256": actual_hash,
            "capturedAt": (declared or {}).get("capturedAt", manifest["generatedAt"]),
            "sourceId": source_id,
            "queryUrl": registry_by_id[source_id]["sourceUrl"],
            "indicator": indicator,
        })
        for record in raw_records(read_json(raw_path)):
            country_iso3 = record.get("countryiso3code") or record.get("country", {}).get("id")
            period = str(record.get("date")) if record.get("date") is not None else ""
            value = record.get("value")
            if country_iso3 not in COUNTRY_TO_MARKET or not period or value is None:
                continue
            if not period.isdigit():
                continue
            candidate = {
                "observationId": f"wb-{COUNTRY_TO_MARKET[country_iso3].lower()}-{indicator}-{period}",
                "sourceId": source_id,
                "indicator": indicator,
                "indicatorName": INDICATORS[indicator]["name"],
                "market": COUNTRY_TO_MARKET[country_iso3],
                "countryIso3": country_iso3,
                "period": period,
                "value": value,
                "unit": INDICATORS[indicator]["unit"],
                "status": "observed",
                "observedAt": (declared or {}).get("capturedAt", manifest["generatedAt"]),
                "sourceUrl": registry_by_id[source_id]["sourceUrl"],
                "queryUrl": f"{registry_by_id[source_id]['sourceUrl']}/indicator/{indicator}?format=json&per_page=100",
                "limitations": CONTEXT_LIMITATIONS,
            }
            key = (country_iso3, indicator)
            current = candidates.get(key)
            if current is None or int(candidate["period"]) > int(current["period"]):
                candidates[key] = candidate

    if len(candidates) != len(COUNTRY_TO_MARKET) * len(INDICATORS):
        expected = len(COUNTRY_TO_MARKET) * len(INDICATORS)
        raise ValueError(f"Expected {expected} selected observations, got {len(candidates)}")

    selected = sorted(candidates.values(), key=lambda item: (item["market"], item["indicator"]))
    output = {
        "contractVersion": "1.0",
        "artifactType": "public_market_context_snapshot",
        "artifactId": "world-bank-latest-observations-20260825",
        "generatedAt": manifest["generatedAt"],
        "selection": {
            "method": "latest_non_null_observation_per_country_indicator",
            "markets": sorted(COUNTRY_TO_MARKET.values()),
            "indicators": sorted(INDICATORS),
            "observationCount": len(selected),
        },
        "sourceIds": sorted({item["sourceId"] for item in selected}),
        "rawSnapshots": raw_snapshot_records,
        "observations": selected,
        "notProvidedByThisArtifact": [
            "audience size",
            "search volume",
            "CPC",
            "CPA",
            "CVR",
            "ROAS",
            "reach",
            "frequency",
            "saturation",
            "competitor performance",
        ],
    }
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "PASS",
        "output": output_path.relative_to(ROOT).as_posix(),
        "observationCount": len(selected),
        "rawSnapshotCount": len(raw_snapshot_records),
        "generatedAt": output["generatedAt"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
