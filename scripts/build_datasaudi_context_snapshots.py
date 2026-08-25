from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / '.local/public-research/datasaudi'
OUT_DIR = ROOT / 'data/knowledge/public/datasaudi/2026-08-25'
CAPTURED_AT = '2026-08-25T20:10:00.000Z'

CONFIG = {
    'digital-economy-gdp.json': {
        'sourceId': 'src-gastat-datasaudi-digital-economy-gdp-sa-20260825',
        'artifactId': 'datasaudi-digital-economy-gdp-sa-20260825',
        'metricPrefix': 'digital_economy_share_of_gdp',
        'sourceUrl': 'https://www.stats.gov.sa/en/statistics-tabs/-/categories/122941?tab=436312&category=122941',
        'dataUrl': 'https://api.datasaudi.datawheel.us/tesseract/data.jsonrecords?cube=gastat_contribution_of_digital_economy_to_gdp&drilldowns=Year&measures=Percentage&locale=en',
    },
    'digital-establishment-usage.json': {
        'sourceId': 'src-gastat-datasaudi-digital-establishment-usage-sa-20260825',
        'artifactId': 'datasaudi-digital-establishment-usage-sa-20260825',
        'metricPrefix': 'establishment_digital_technology_usage',
        'sourceUrl': 'https://www.stats.gov.sa/en/statistics-tabs/-/categories/122941?tab=436312&category=122941',
        'dataUrl': 'https://api.datasaudi.datawheel.us/tesseract/data.jsonrecords?Establishment%20Usage%20Name=1&cube=gastat_digital_economy_establishment_usage_by_economic_activity&drilldowns=Economic%20Sectors,Year&measures=Percentage&locale=en',
    },
    'higher-education-students.json': {
        'sourceId': 'src-sama-datasaudi-higher-education-students-sa-20260825',
        'artifactId': 'datasaudi-higher-education-students-sa-20260825',
        'metricPrefix': 'higher_education_students',
        'sourceUrl': 'https://www.sama.gov.sa/en-US/Publications/EconomicReports/Pages/report.aspx?cid=127',
        'dataUrl': 'https://api.datasaudi.datawheel.us/tesseract/data.jsonrecords?Student%20Status=1,2,3&cube=sama_higher_education&drilldowns=Year,Student%20Status,Academic%20Status,Sex&measures=Students&locale=en',
    },
    'students-schools-teachers.json': {
        'sourceId': 'src-sama-datasaudi-students-schools-teachers-sa-20260825',
        'artifactId': 'datasaudi-students-schools-teachers-sa-20260825',
        'metricPrefix': 'education_system_scale',
        'sourceUrl': 'https://www.sama.gov.sa/en-US/Publications/EconomicReports/Pages/report.aspx?cid=127',
        'dataUrl': 'https://api.datasaudi.datawheel.us/tesseract/data.jsonrecords?Academic%20Category=1,2,3&cube=sama_students_schools_teachers_region&drilldowns=Academic%20Category,Province,Year&measures=Value&locale=en',
    },
    'education-training-expenditure.json': {
        'sourceId': 'src-gastat-datasaudi-education-expenditure-sa-20260825',
        'artifactId': 'datasaudi-education-expenditure-sa-20260825',
        'metricPrefix': 'education_expenditure_by_region',
        'sourceUrl': 'https://www.stats.gov.sa/en/statistics-tabs?tab=436318&category=514986',
        'dataUrl': 'https://api.datasaudi.datawheel.us/tesseract/data.jsonrecords?cube=gastat_education_training_survey&drilldowns=Province,Expenditure%20Type&measures=Expenditure&locale=en',
    },
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe(text: Any) -> str:
    return str(text or '').lower().replace(' ', '-').replace('/', '-').replace('&', 'and')


def main() -> None:
    outputs = []
    for filename, config in CONFIG.items():
        raw_path = RAW_DIR / filename
        payload = json.loads(raw_path.read_text(encoding='utf-8'))
        rows = payload.get('data', [])
        observations: list[dict[str, Any]] = []
        for index, row in enumerate(rows):
            year = row.get('Year')
            if filename == 'education-training-expenditure.json':
                period = 'portal_current_snapshot'
                metric = f"{config['metricPrefix']}_{safe(row.get('Expenditure Type'))}"
                value = row.get('Expenditure')
                unit = 'million_SAR'
                dimensions = {'province': row.get('Province'), 'expenditureType': row.get('Expenditure Type')}
            elif filename == 'digital-economy-gdp.json':
                period = str(year)
                metric = config['metricPrefix']
                value = row.get('Percentage')
                unit = 'percent'
                dimensions = {}
            elif filename == 'digital-establishment-usage.json':
                period = str(year)
                metric = f"{config['metricPrefix']}_{safe(row.get('Economic Sectors'))}"
                value = row.get('Percentage')
                unit = 'proportion'
                dimensions = {'economicSectorId': row.get('Economic Sectors ID'), 'economicSector': row.get('Economic Sectors')}
            elif filename == 'higher-education-students.json':
                period = str(year)
                metric = 'higher_education_students'
                value = row.get('Students')
                unit = 'students'
                dimensions = {
                    'studentStatus': row.get('Student Status'),
                    'academicStatus': row.get('Academic Status'),
                    'sex': row.get('Sex'),
                }
            else:
                period = str(year)
                metric = f"education_system_{safe(row.get('Academic Category'))}"
                value = row.get('Value')
                unit = 'count'
                dimensions = {'academicCategory': row.get('Academic Category'), 'province': row.get('Province')}
            observations.append({
                'observationId': f"{config['artifactId']}-{index:05d}",
                'sourceId': config['sourceId'],
                'market': 'SA',
                'country': 'Saudi Arabia',
                'metric': metric,
                'period': period,
                'year': int(year) if year is not None else None,
                'value': value,
                'unit': unit,
                'dimensions': dimensions,
                'capturedAt': CAPTURED_AT,
                'sourceUrl': config['sourceUrl'],
                'dataUrl': config['dataUrl'],
                'limitations': [
                    'Official public context data, not advertising audience size or campaign-performance evidence.',
                    'Missing period in the education expenditure table is represented as portal_current_snapshot and not treated as a time-series fact.',
                    'No causal relationship to demand, conversion, CPC, CPA, CVR, or ROAS is inferred.',
                ],
            })
        output = {
            'contractVersion': '1.0',
            'artifactType': 'public_datasaudi_context_snapshot',
            'artifactId': config['artifactId'],
            'generatedAt': CAPTURED_AT,
            'sourceId': config['sourceId'],
            'sourceUrl': config['sourceUrl'],
            'dataUrl': config['dataUrl'],
            'licenseStatus': 'unknown',
            'rawInput': {'path': raw_path.relative_to(ROOT).as_posix(), 'sha256': sha256(raw_path), 'capturedAt': CAPTURED_AT},
            'selection': {'method': 'all_public_rows_from_selected_datasaudi_cube', 'rowCount': len(rows), 'observationCount': len(observations)},
            'observations': observations,
            'unknowns': ['absolute search volume', 'audience size', 'CPC', 'CPA', 'CVR', 'ROAS', 'competitor performance', 'customer-level funnel performance'],
            'limitations': [
                'DataSaudi/GASTAT/SAMA portal data is market or education-system context; it is not a marketing benchmark.',
                'License status remains unknown until explicit terms are verified.',
            ],
        }
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = OUT_DIR / f"{config['artifactId']}.json"
        out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        outputs.append({'output': out_path.relative_to(ROOT).as_posix(), 'rows': len(observations), 'sha256': output['rawInput']['sha256']})
    print(json.dumps({'status': 'PASS', 'outputs': outputs}, ensure_ascii=False))


if __name__ == '__main__':
    main()
