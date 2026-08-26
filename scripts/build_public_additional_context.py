import csv
import hashlib
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / "data" / "knowledge" / "public"
CAPTURED_AT = "2026-08-26T17:12:09Z"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def raw_input(path: Path) -> dict[str, str]:
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": sha256(path),
        "capturedAt": CAPTURED_AT,
    }


def write_artifact(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def slug(value: str) -> str:
    result = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return result or "unknown"


def industry_relevance(activity: str) -> str | None:
    normalized = activity.lower()
    if "education" in normalized:
        return "education_general"
    if "retail" in normalized or "wholesale" in normalized or "motor vehicles" in normalized:
        return "ecommerce_general"
    if any(term in normalized for term in ("health", "accommodation", "food", "repair", "personal", "transport", "computer", "recreation", "real estate")):
        return "local_service_general"
    return None


def build_kapsarc_establishments() -> dict[str, Any]:
    raw_dir = ROOT / ".local/public-research/kapsarc/2026-08-26-establishments"
    csv_path = PUBLIC_ROOT / "kapsarc/2026-08-26/establishments.csv"
    metadata_path = PUBLIC_ROOT / "kapsarc/2026-08-26/establishments-metadata.json"
    source_id = "src-kapsarc-gastat-establishments-size-activity-sa-20260826"
    source_url = "https://datasource.kapsarc.org/explore/assets/number-of-establishments-by-size-and-economic-activity/"
    api_url = "https://datasource.kapsarc.org/api/explore/v2.1/catalog/datasets/number-of-establishments-by-size-and-economic-activity"

    rows: list[dict[str, Any]] = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        for row in reader:
            activity = (row.get("economic_activity") or "").strip()
            size = (row.get("establishment_size") or "").strip()
            period = (row.get("time_period") or "").strip()
            raw_value = (row.get("number_of_establishments") or "").strip()
            if not activity or not size or not period or not raw_value:
                continue
            value = float(raw_value)
            if value.is_integer():
                value = int(value)
            observation_id = "kapsarc-sa-establishments-{period}-{activity}-{size}".format(
                period=slug(period), activity=slug(activity), size=slug(size)
            )
            item: dict[str, Any] = {
                "observationId": observation_id,
                "sourceId": source_id,
                "market": "SA",
                "marketScope": "national_supply_context",
                "industryRelevance": industry_relevance(activity),
                "observationType": "establishment_count",
                "metric": "number_of_establishments",
                "value": value,
                "unit": "establishments",
                "period": period,
                "status": "observed",
                "sourceUrl": source_url,
                "capturedAt": CAPTURED_AT,
                "dimensions": {
                    "economicActivity": activity,
                    "establishmentSize": size,
                },
                "limitations": [
                    "Aggregate establishment count from the Annual Economic Establishment Survey; it describes supply context, not consumer demand.",
                    "The dataset excludes establishments operating in governmental and external sectors and covers the published 2010–2017 period.",
                    "No sales, revenue, market share, customer count, audience, conversion, CPC, CPA, CVR, ROAS, reach, frequency, saturation, or competitor performance is inferred.",
                ],
            }
            if item["industryRelevance"] is None:
                del item["industryRelevance"]
            rows.append(item)

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    default_meta = metadata.get("metas", {}).get("default", {})
    custom_meta = metadata.get("metas", {}).get("custom", {})
    payload = {
        "contractVersion": "1.0",
        "artifactType": "public_saudi_establishments_supply_context",
        "artifactId": "kapsarc-gastat-establishments-by-size-activity-sa-20260826",
        "generatedAt": CAPTURED_AT,
        "sourceId": source_id,
        "sourceUrl": source_url,
        "apiUrl": api_url,
        "licenseStatus": "approved",
        "rawInputs": [raw_input(csv_path), raw_input(metadata_path)],
        "datasetMetadata": {
            "datasetId": metadata.get("dataset_id"),
            "datasetUid": metadata.get("dataset_uid"),
            "publisher": default_meta.get("publisher") or metadata.get("publisher"),
            "license": default_meta.get("license"),
            "modified": default_meta.get("modified"),
            "recordsCount": default_meta.get("records_count"),
            "temporal": default_meta.get("temporal"),
            "unitOfMeasure": custom_meta.get("unit-of-measure"),
            "publisherPeriodicity": custom_meta.get("publisher-periodicity"),
            "discontinuedData": custom_meta.get("discontinued-data"),
        },
        "observations": rows,
        "unknowns": [
            "No current post-2017 establishment series was included in this downloaded dataset.",
            "The data does not identify establishment revenue, customers, demand, market share, or campaign outcomes.",
            "No exact product/service taxonomy mapping beyond the retained economic-activity label is inferred.",
        ],
        "limitations": [
            "KAPSARC/GASTAT public-domain dataset retained as aggregate Saudi supply context only.",
            "The source metadata marks the dataset as discontinued and the published temporal coverage is 2010–2017.",
            "Public API access was read-only and captured with query/file hashes; no authenticated endpoint was used.",
        ],
    }
    write_artifact(PUBLIC_ROOT / "kapsarc/2026-08-26/normalized-establishments-observations.json", payload)
    return payload


def build_openstreetmap_amenities() -> dict[str, Any]:
    raw_path = PUBLIC_ROOT / "openstreetmap/2026-08-26/cairo-riyadh-amenities.json"
    query_path = PUBLIC_ROOT / "openstreetmap/2026-08-26/cairo-riyadh-amenities.ql"
    source_id = "src-openstreetmap-overpass-cairo-riyadh-20260826"
    source_url = "https://overpass-api.de/api/interpreter"
    wiki_url = "https://wiki.openstreetmap.org/wiki/Overpass_API"
    data = json.loads(raw_path.read_text(encoding="utf-8"))
    timestamp = data.get("osm3s", {}).get("timestamp_osm_base")
    bboxes = {
        "Cairo": (29.95, 31.15, 30.15, 31.45),
        "Riyadh": (24.55, 46.50, 24.90, 46.90),
    }
    counts: dict[str, dict[str, int]] = {city: {} for city in bboxes}
    elements_by_city: dict[str, int] = {city: 0 for city in bboxes}
    for element in data.get("elements", []):
        tags = element.get("tags") or {}
        amenity = tags.get("amenity")
        if not amenity:
            continue
        location = element if "lat" in element else element.get("center") or {}
        lat = location.get("lat")
        lon = location.get("lon")
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            continue
        for city, (south, west, north, east) in bboxes.items():
            if south <= lat <= north and west <= lon <= east:
                counts[city][amenity] = counts[city].get(amenity, 0) + 1
                elements_by_city[city] += 1
                break
    observations: list[dict[str, Any]] = []
    for city in sorted(counts):
        for amenity in sorted(counts[city]):
            observations.append({
                "observationId": f"osm-{slug(city)}-{slug(amenity)}-amenity-count-20260826",
                "sourceId": source_id,
                "market": "EG" if city == "Cairo" else "SA",
                "city": city,
                "marketScope": "city_bbox_mapped_supply_context",
                "industryRelevance": "education_general" if amenity in {"school", "college", "university", "kindergarten"} else "local_service_general",
                "observationType": "mapped_amenity_count",
                "metric": "osm_mapped_amenity_count",
                "value": counts[city][amenity],
                "unit": "mapped_features",
                "period": timestamp,
                "status": "observed",
                "sourceUrl": wiki_url,
                "queryEndpoint": source_url,
                "capturedAt": CAPTURED_AT,
                "dimensions": {"amenity": amenity, "bbox": bboxes[city]},
                "limitations": [
                    "OpenStreetMap mapped-feature count inside the stated bounding box; it is a supply/discovery proxy, not a census of all establishments.",
                    "OpenStreetMap completeness, tagging, duplicates, geometry, and update timing vary by location; counts are not market share, demand, sales, ratings, or audience size.",
                    "No CPC, CPA, CVR, ROAS, reach, frequency, saturation, or competitor campaign performance is inferred.",
                ],
            })
    payload = {
        "contractVersion": "1.0",
        "artifactType": "public_city_mapped_amenity_supply_context",
        "artifactId": "openstreetmap-overpass-cairo-riyadh-amenities-eg-sa-20260826",
        "generatedAt": CAPTURED_AT,
        "sourceId": source_id,
        "sourceUrl": wiki_url,
        "queryEndpoint": source_url,
        "licenseStatus": "approved",
        "license": "Open Database License (ODbL) — OpenStreetMap attribution required",
        "rawInputs": [raw_input(query_path), raw_input(raw_path)],
        "query": query_path.read_text(encoding="utf-8").strip(),
        "queryTimestamp": timestamp,
        "bboxDefinitions": {city: {"south": b[0], "west": b[1], "north": b[2], "east": b[3]} for city, b in bboxes.items()},
        "elementCountByCity": elements_by_city,
        "observations": observations,
        "unknowns": [
            "No address-level completeness audit or deduplication against official registries was performed.",
            "No customer demand, revenue, bookings, ratings, market share, or advertising outcome is supplied.",
        ],
        "limitations": [
            "Read-only public Overpass query with small city bounding boxes; response timestamp and query are retained for reproducibility.",
            "Respect Overpass public-instance usage policies, cache results, identify the client, and stop/back off on HTTP 429/406 or server overload.",
            "OSM/ODbL attribution and share-alike obligations must be preserved for derivative database use.",
        ],
    }
    write_artifact(PUBLIC_ROOT / "openstreetmap/2026-08-26/normalized-cairo-riyadh-amenities.json", payload)
    return payload


def build_capmas_hiecs_metadata() -> dict[str, Any]:
    capture_path = PUBLIC_ROOT / "capmas/2026-08-26/hiecs-2021-capture.md"
    source_id = "src-capmas-hiecs-2021-eg-20260826"
    source_url = "https://censusinfo.capmas.gov.eg/metadata-en-v4.2/index.php/catalog/747/overview"
    dictionary_url = "https://censusinfo.capmas.gov.eg/metadata-en-v4.2/index.php/catalog/747/datafile/F34/V5984"
    payload = {
        "contractVersion": "1.0",
        "artifactType": "public_egypt_household_consumption_metadata",
        "artifactId": "capmas-hiecs-2021-metadata-eg-20260826",
        "generatedAt": CAPTURED_AT,
        "sourceId": source_id,
        "sourceUrl": source_url,
        "licenseStatus": "unknown",
        "rawInputs": [raw_input(capture_path)],
        "studyMetadata": {
            "referenceId": "EGY-CAPMAS-HIECS-2021-v1.0",
            "year": 2021,
            "country": "Egypt",
            "producer": "Central Agency for Public Mobilization and Statistics - Ministry of Planning",
            "kindOfData": "Survey Sample Data",
            "unitsOfAnalysis": "Living household",
            "scope": "Household spending and actual consumption during the survey period, housing conditions, and demographic characteristics.",
            "publicMetadataStatus": "Study metadata and variable dictionary are publicly readable.",
            "microdataStatus": "The catalogue labels the microdata route as licensed data files; no microdata was downloaded.",
            "productionDate": "2024-11-23",
            "catalogueDate": "2025-03-25",
        },
        "variableMetadata": {
            "file": "HH_HEAD2021",
            "variable": "ACT_REC",
            "description": "Main economic activity",
            "publicPageWarning": "Case counts shown by the dictionary are cases in the data file and cannot be interpreted as population summary statistics.",
            "relevantCategories": [
                "Whole trade, retail trade and repairing",
                "Activity of Information and Telecommunications",
                "Education",
                "Health, and social work activity",
                "Other services activity",
            ],
        },
        "observations": [
            {
                "observationId": "capmas-eg-hiecs-2021-consumption-study-scope",
                "sourceId": source_id,
                "market": "EG",
                "marketScope": "national_household_survey_metadata",
                "observationType": "study_scope",
                "metric": "household_consumption_study_scope",
                "value": "Income, spending, consumption, living standards, poverty-line inputs, CPI-weight inputs, housing, and demographic characteristics",
                "unit": "qualitative_study_metadata",
                "status": "observed",
                "sourceUrl": source_url,
                "capturedAt": CAPTURED_AT,
                "limitations": [
                    "Metadata describes a household survey, not online-commerce demand or advertising performance.",
                    "No household-level personal data or licensed microdata was downloaded.",
                ],
            },
            {
                "observationId": "capmas-eg-hiecs-2021-access-boundary",
                "sourceId": source_id,
                "market": "EG",
                "marketScope": "national_household_survey_metadata",
                "observationType": "access_policy",
                "metric": "microdata_access_status",
                "value": "Public study metadata; microdata route labeled licensed data files",
                "unit": "qualitative_access_metadata",
                "status": "observed",
                "sourceUrl": dictionary_url,
                "capturedAt": CAPTURED_AT,
                "limitations": [
                    "The access boundary is retained explicitly; no licensed microdata was requested or inferred.",
                    "Public variable case counts are not population estimates without survey weights and methodology.",
                ],
            },
        ],
        "unknowns": [
            "No public unrestricted HIECS microdata file was downloaded in this batch.",
            "No digital-commerce, product, channel, conversion, audience, or advertising-performance metric is supplied.",
            "No population estimate is derived from the public variable dictionary case counts.",
        ],
        "limitations": [
            "CAPMAS HIECS is retained as public metadata and survey-scope context; microdata remains licensed.",
            "The artifact does not close Egypt ecommerce or local-service market-validation gaps.",
            "Raw HTML captures are retained for provenance; no CAPTCHA, login, or protected route was bypassed.",
        ],
    }
    write_artifact(PUBLIC_ROOT / "capmas/2026-08-26/normalized-hiecs-2021-metadata.json", payload)
    return payload


def main() -> None:
    kapsarc = build_kapsarc_establishments()
    hiecs = build_capmas_hiecs_metadata()
    osm = build_openstreetmap_amenities()
    print(json.dumps({
        "status": "PASS",
        "artifacts": [kapsarc["artifactId"], hiecs["artifactId"]],
        "kapsarcObservationCount": len(kapsarc["observations"]),
        "hiecsObservationCount": len(hiecs["observations"]),
        "osmObservationCount": len(osm["observations"]),
        "capturedAt": CAPTURED_AT,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
