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
ADDITIONAL_ARTIFACT_PATHS = [
    PUBLIC_ROOT / "unesco/2026-08-25/normalized-observations.json",
    PUBLIC_ROOT / "unctad/2026-08-25/normalized-observations.json",
    PUBLIC_ROOT / "undata/2026-08-25/normalized-observations.json",
    PUBLIC_ROOT / "datasaudi/2026-08-25/datasaudi-digital-economy-gdp-sa-20260825.json",
    PUBLIC_ROOT / "datasaudi/2026-08-25/datasaudi-digital-establishment-usage-sa-20260825.json",
    PUBLIC_ROOT / "datasaudi/2026-08-25/datasaudi-higher-education-students-sa-20260825.json",
    PUBLIC_ROOT / "datasaudi/2026-08-25/datasaudi-students-schools-teachers-sa-20260825.json",
    PUBLIC_ROOT / "datasaudi/2026-08-25/datasaudi-education-expenditure-sa-20260825.json",
    PUBLIC_ROOT / "datasaudi/2026-08-25/exports-egypt-normalized-observations.json",
    PUBLIC_ROOT / "datasaudi/2026-08-25/imports-egypt-normalized-observations.json",
    PUBLIC_ROOT / "kapsarc/2026-08-25/normalized-observations.json",
    PUBLIC_ROOT / "kapsarc/2026-08-25/sector-normalized-observations.json",
    PUBLIC_ROOT / "kapsarc/2026-08-25/sector-city-latest-observations.json",
    PUBLIC_ROOT / "kapsarc/2026-08-25/detailed-sector-city-latest-observations.json",
    PUBLIC_ROOT / "kapsarc/2026-08-26/normalized-establishments-observations.json",
    PUBLIC_ROOT / "capmas/2026-08-26/normalized-hiecs-2021-metadata.json",
    PUBLIC_ROOT / "openstreetmap/2026-08-26/normalized-cairo-riyadh-amenities.json",
    PUBLIC_ROOT / "cbe/2026-08-25/normalized-payment-system-observation.json",
    PUBLIC_ROOT / "sama/2026-08-25/normalized-payment-context.json",
    PUBLIC_ROOT / "sama/2026-08-25/normalized-ecommerce-interface-observation.json",
    PUBLIC_ROOT / "sama/2026-08-25/normalized-weekly-pos-page-observation.json",
    PUBLIC_ROOT / "egypt-public/2026-08-25/normalized-national-accounts-discovery.json",
    PUBLIC_ROOT / "egypt-public/2026-08-25/normalized-customs-fx-context.json",
    PUBLIC_ROOT / "marketplaces/2026-08-25/normalized-storefront-observations.json",
    PUBLIC_ROOT / "app-stores/2026-08-25/normalized-app-store-observations.json",
]
CAPTURED_AT = "2026-08-25T20:30:00.000Z"


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
    additional_artifacts = [(path, read_json(path)) for path in ADDITIONAL_ARTIFACT_PATHS if path.exists()]
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
    additional_derived = []
    for path, artifact in additional_artifacts:
        raw_inputs = artifact.get("rawInput", artifact.get("rawInputs", []))
        if isinstance(raw_inputs, dict): raw_inputs = [raw_inputs]
        additional_derived.append({
            "path": path.relative_to(ROOT).as_posix(),
            "sha256": sha256(path),
            "generatedAt": artifact.get("generatedAt", CAPTURED_AT),
            "artifactType": artifact.get("artifactType", path.stem),
            "artifactId": artifact.get("artifactId", path.stem),
            "sourceIds": sorted({str(artifact.get("sourceId"))} | {str(observation.get("sourceId")) for observation in artifact.get("observations", []) if observation.get("sourceId")}),
            "observationCount": len(artifact.get("observations", [])),
            "rawInputs": raw_inputs,
            "limitations": artifact.get("limitations", []),
        })

    output = {
        "contractVersion": "1.0",
        "manifestId": "public-knowledge-batch-20260825-004",
        "generatedAt": CAPTURED_AT,
        "scope": {
            "markets": ["EG", "SA"],
            "industries": ["ecommerce_general", "education_general", "local_service_general"],
            "locales": ["ar", "en"],
            "currencies": ["EGP", "SAR", "USD"],
        },
        "sources": registry["sources"],
        "rawSnapshots": raw,
        "derivedArtifacts": derived + additional_derived,
        "publicContextArtifacts": additional_derived,
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
            "additionalPublicArtifactCount": len(additional_derived),
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
                "Selected DataSaudi/GASTAT and KAPSARC artifacts are aggregate market or education-system context, not advertising benchmarks; license status remains unknown where terms were not explicit.",
                "UNESCO, UNCTAD, UNdata, and ITU observations preserve their own periods, upstream sources, and regional/country coverage limitations.",
                "CBE and SAMA payment sources are retained as institutional/payment-ecosystem context and do not close ecommerce demand or advertising-performance gaps.",
                "Marketplace observations are page-level snapshots with unknown reuse license; they are not representative samples or competitor-performance evidence.",
                "App-store observations retain Google Play en_US and Apple App Store US scope and cannot be mapped to Egypt or Saudi country metrics.",
                "Egypt data.gov.eg and Egypt Data Portal remained discovery/unavailable routes in this batch; no values were inferred from them.",
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
        "additionalPublicArtifactCount": len(output["publicContextArtifacts"]),
        "marketValidated": output["quality"]["marketValidated"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
