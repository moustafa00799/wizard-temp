from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / "data" / "knowledge" / "public"
REGISTRY_PATH = PUBLIC_ROOT / "public-source-registry-2026-08-25.json"
WORLD_BANK_LATEST = PUBLIC_ROOT / "world-bank/2026-08-25/latest-observations.json"
TRENDS_NORMALIZED = PUBLIC_ROOT / "google-trends/2026-08-25/normalized-observations.json"
CAPMAS_FACTS = PUBLIC_ROOT / "capmas/2026-08-25/normalized-facts.json"
OUTPUT_PATH = PUBLIC_ROOT / "public-knowledge-batch-2026-08-25.json"
CAPTURED_AT = "2026-08-25T00:26:31.000Z"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def raw_snapshot(path: Path, source_id: str, source_url: str) -> dict[str, Any]:
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": sha256(path),
        "capturedAt": CAPTURED_AT,
        "sourceId": source_id,
        "sourceUrl": source_url,
        "storage": "local_artifact_hash_only_until_object_storage_policy_is_selected",
    }


def main() -> None:
    registry = read_json(REGISTRY_PATH)
    world_bank = read_json(WORLD_BANK_LATEST)
    trends = read_json(TRENDS_NORMALIZED)
    capmas = read_json(CAPMAS_FACTS)
    source_by_id = {source["sourceId"]: source for source in registry["sources"]}

    raw: list[dict[str, Any]] = []
    for path in sorted((PUBLIC_ROOT / "world-bank/2026-08-25").glob("*.json")):
        if path.name in {"latest-observations.json"}:
            continue
        source_id = "src-world-bank-egy-indicators-v2-20260825"
        raw.append(raw_snapshot(path, source_id, source_by_id[source_id]["sourceUrl"]))
    capmas_central = "src-capmas-central-data-catalog-20260825"
    education = "src-capmas-education-bulletin-2019-2020"
    telecommunications = "src-capmas-telecommunications-bulletin-2016-2017"
    for path in sorted((PUBLIC_ROOT / "capmas/2026-08-25").glob("catalog.html")):
        raw.append(raw_snapshot(path, capmas_central, source_by_id[capmas_central]["sourceUrl"]))
    for path in sorted((PUBLIC_ROOT / "capmas/2026-08-25/searches").glob("*.html")):
        raw.append(raw_snapshot(path, capmas_central, source_by_id[capmas_central]["sourceUrl"]))
    education_path = PUBLIC_ROOT / "capmas/2026-08-25/pdfs/education-foundation-2019-2020.pdf"
    telecom_path = PUBLIC_ROOT / "capmas/2026-08-25/pdfs/telecommunications-2016-2017.pdf"
    if education_path.exists():
        raw.append(raw_snapshot(education_path, education, source_by_id[education]["sourceUrl"]))
    if telecom_path.exists():
        raw.append(raw_snapshot(telecom_path, telecommunications, source_by_id[telecommunications]["sourceUrl"]))
    for path in sorted((PUBLIC_ROOT / "google-trends/2026-08-25").glob("*-explore.html")):
        market = "sa" if path.name.startswith("sa-") else "eg"
        source_id = f"src-google-trends-{market}-explore-20260825"
        raw.append(raw_snapshot(path, source_id, "https://trends.google.com/trends/"))

    derived = []
    for path in [WORLD_BANK_LATEST, TRENDS_NORMALIZED, CAPMAS_FACTS]:
        derived.append({
            "path": path.relative_to(ROOT).as_posix(),
            "sha256": sha256(path),
            "generatedAt": CAPTURED_AT,
            "artifactType": path.stem,
        })

    output = {
        "contractVersion": "1.0",
        "manifestId": "public-knowledge-batch-20260825-002",
        "generatedAt": CAPTURED_AT,
        "scope": {
            "markets": ["EG", "SA"],
            "industries": ["ecommerce_general", "education_general", "local_service_general"],
            "locales": ["ar", "en"],
            "currencies": ["EGP", "SAR", "USD"],
        },
        "sources": registry["sources"],
        "rawSnapshots": raw,
        "derivedArtifacts": derived,
        "worldBankSelection": world_bank["selection"],
        "observations": world_bank["observations"],
        "directionalSearchInterest": trends["snapshots"],
        "capmasEducationFacts": capmas["facts"],
        "rawArtifactPolicy": {
            "curatedArtifactsCommitted": True,
            "largeRawArtifactsMayRemainLocal": True,
            "rebuildFromOfficialUrls": True,
            "missingRawOnCloneIsExplicitGap": True,
        },
        "quality": {
            "marketValidated": False,
            "readyEvidencePackages": 0,
            "limitedEvidencePackagesPlanned": 3,
            "discoveryOnlySourceIds": [
                "src-capmas-central-data-catalog-20260825",
                "src-gastat-open-data-20260825",
                "src-gastat-statistics-categories-20260825",
            ],
            "unavailableMetrics": [
                "audience size",
                "absolute search volume",
                "CPC",
                "CPA",
                "CVR",
                "ROAS",
                "reach",
                "frequency",
                "saturation",
                "competitor performance",
                "client funnel performance",
            ],
            "limitations": [
                "World Bank observations are broad contextual indicators and are not industry-specific.",
                "CAPMAS education facts are historical 2019/2020 education-supply context only.",
                "Google Trends observations are relative directional search-interest signals captured from public pages.",
                "GASTAT rows are portal/discovery metadata until an official dataset export or authorized API response is available.",
                "TikTok first-party reporting is kept outside this public manifest because it is account-owned and must not become a public benchmark.",
            ],
        },
    }
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "PASS",
        "output": OUTPUT_PATH.relative_to(ROOT).as_posix(),
        "sourceCount": len(output["sources"]),
        "rawSnapshotCount": len(output["rawSnapshots"]),
        "worldBankObservationCount": len(output["observations"]),
        "trendSnapshotCount": len(output["directionalSearchInterest"]),
        "capmasFactCount": len(output["capmasEducationFacts"]),
        "marketValidated": output["quality"]["marketValidated"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
