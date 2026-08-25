from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / '.local/public-research/undata'
OUT_DIR = ROOT / 'data/knowledge/public/undata/2026-08-25'
OUT_PATH = OUT_DIR / 'normalized-observations.json'
CAPTURED_AT = '2026-08-25T20:30:00.000Z'
SOURCE_PAGE = 'https://data.un.org/'
TARGETS = {'Egypt': 'EG', 'Saudi Arabia': 'SA'}
FILES = {
    'population.csv': 'population_and_density',
    'gdp.csv': 'gdp_and_gdp_per_capita',
    'gva-by-activity.csv': 'gva_by_activity',
    'education.csv': 'education_enrollment',
    'teaching-staff.csv': 'teaching_staff',
    'education-expenditure.csv': 'education_ict_access',
    'labour-force.csv': 'labour_force_and_unemployment',
    'employment.csv': 'employment_by_activity',
    'cpi.csv': 'consumer_price_index',
    'trade.csv': 'trade_balance',
    'internet-usage.csv': 'internet_usage',
}
INDUSTRY = {
    'education.csv': 'education_general',
    'teaching-staff.csv': 'education_general',
    'education-expenditure.csv': 'education_general',
    'employment.csv': 'cross_industry_market_context',
    'labour-force.csv': 'cross_industry_market_context',
    'internet-usage.csv': 'cross_industry_digital_context',
    'population.csv': 'cross_market_context',
    'gdp.csv': 'cross_market_context',
    'gva-by-activity.csv': 'cross_market_context',
    'cpi.csv': 'cross_market_context',
    'trade.csv': 'cross_market_context',
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def number(raw: str) -> float | None:
    text = (raw or '').strip().replace(',', '')
    if not text or text.upper() in {'NA', 'N/A', '..', '-'}:
        return None
    match = re.fullmatch(r'\(?-?[0-9]+(?:\.[0-9]+)?\)?', text)
    if not match:
        return None
    value = float(text.strip('()'))
    return -value if text.startswith('(') else value


def source_id(filename: str) -> str:
    return f"src-undata-{FILES[filename]}-egy-sau-20260825"


def source_url(filename: str) -> str:
    return f"https://data.un.org/_Docs/SYB/CSV/{filename}"


def main() -> None:
    observations: list[dict[str, Any]] = []
    file_meta: list[dict[str, Any]] = []
    for filename, dataset_key in FILES.items():
        raw_path = RAW_DIR / filename
        file_meta.append({'filename': filename, 'datasetKey': dataset_key, 'sha256': sha256(raw_path), 'path': raw_path.relative_to(ROOT).as_posix()})
        with raw_path.open(newline='', encoding='utf-8-sig', errors='replace') as handle:
            reader = csv.reader(handle)
            title_row = next(reader, [])
            header = next(reader, [])
            for row_index, values in enumerate(reader, start=3):
                if len(values) < 4 or values[1] not in TARGETS:
                    continue
                record = {header[i] if header[i] else f'column_{i}': values[i] if i < len(values) else '' for i in range(len(header))}
                raw_value = record.get('Value', '')
                value = number(raw_value)
                if value is None:
                    continue
                series = record.get('Series', '')
                observation = {
                    'observationId': f"undata-{dataset_key}-{values[1].lower().replace(' ', '-')}-{record.get('Year')}-{row_index}",
                    'sourceId': source_id(filename),
                    'market': TARGETS[values[1]],
                    'country': values[1],
                    'dataset': dataset_key,
                    'metric': series,
                    'year': int(record['Year']) if str(record.get('Year', '')).isdigit() else record.get('Year'),
                    'value': value,
                    'unit': series,
                    'footnotes': record.get('Footnotes', ''),
                    'upstreamSource': record.get('Source', ''),
                    'industryRelevance': INDUSTRY[filename],
                    'capturedAt': CAPTURED_AT,
                    'sourceUrl': SOURCE_PAGE,
                    'dataUrl': source_url(filename),
                    'limitations': [
                        'UNdata statistical context is not advertising audience size, search demand, or campaign-performance evidence.',
                        'Values preserve the source series label and footnotes; no currency conversion, interpolation, or benchmark inference is applied.',
                        'Coverage is the table release shown on the public UNdata page and may have uneven years by series.',
                    ],
                }
                observations.append(observation)
    observations.sort(key=lambda item: (item['market'], item['dataset'], str(item['metric']), str(item['year']), item['observationId']))
    output = {
        'contractVersion': '1.0',
        'artifactType': 'public_undata_context_snapshot',
        'artifactId': 'undata-egy-sau-20260825',
        'generatedAt': CAPTURED_AT,
        'sourceId': 'src-undata-statistical-yearbook-egy-sau-20260825',
        'sourceUrl': SOURCE_PAGE,
        'licenseStatus': 'unknown',
        'rawInputs': file_meta,
        'selection': {
            'method': 'all_non_null_value_rows_for_Egypt_and_Saudi_Arabia_across_selected_public_tables',
            'datasetCount': len(FILES),
            'observationCount': len(observations),
            'markets': sorted({item['market'] for item in observations}),
            'datasetKeys': list(FILES.values()),
        },
        'observations': observations,
        'unknowns': [
            'absolute search volume',
            'advertising audience size',
            'CPC',
            'CPA',
            'CVR',
            'ROAS',
            'competitor performance',
            'customer-level funnel performance',
            'domestic ecommerce GMV by category',
        ],
        'limitations': [
            'UNdata aggregates official and partner statistical series; each observation retains its upstream source and footnotes.',
            'The landing page lists the table update dates; the snapshot does not claim all series are current to the same year.',
            'License status was not presumed from the landing page and remains unknown pending explicit terms verification.',
        ],
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'PASS', 'output': OUT_PATH.relative_to(ROOT).as_posix(), 'observationCount': len(observations), 'datasetCount': len(FILES), 'rawInputs': len(file_meta)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
