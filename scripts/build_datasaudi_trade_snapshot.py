from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / '.local/public-research/datasaudi'
OUT_DIR = ROOT / 'data/knowledge/public/datasaudi/2026-08-25'
CAPTURED_AT = '2026-08-25T20:00:00.000Z'
SOURCE_URL = 'https://www.stats.gov.sa/en/statistics-tabs/-/categories/123481?tab=436312&category=123481'

CONFIG = {
    'foreign-trade-exports.json': {
        'sourceId': 'src-gastat-datasaudi-foreign-trade-exports-20260825',
        'tradeFlow': 'Exports',
        'dataUrl': 'https://api.datasaudi.datawheel.us/tesseract/data.jsonrecords?Trade+Flow=2&cube=gastat_foreign_trade&drilldowns=Trade+Flow,Country,Month&measures=Million+SAR&parents=true&locale=en',
    },
    'foreign-trade-imports.json': {
        'sourceId': 'src-gastat-datasaudi-foreign-trade-imports-20260825',
        'tradeFlow': 'Imports',
        'dataUrl': 'https://api.datasaudi.datawheel.us/tesseract/data.jsonrecords?Trade+Flow=1&cube=gastat_trade&drilldowns=Trade+Flow,Country,Month&measures=Million+SAR&parents=true&locale=en',
    },
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    outputs: list[dict[str, Any]] = []
    for filename, config in CONFIG.items():
        raw_path = RAW_DIR / filename
        payload = json.loads(raw_path.read_text(encoding='utf-8'))
        rows = [row for row in payload.get('data', []) if row.get('Country ID') == 'egy']
        rows.sort(key=lambda row: (str(row.get('Month')), str(row.get('Quarter'))))
        observations = []
        for row in rows:
            observations.append({
                'observationId': f"datasaudi-trade-{config['tradeFlow'].lower()}-egy-{row['Month']}",
                'sourceId': config['sourceId'],
                'market': 'SA',
                'counterpartyMarket': 'EG',
                'country': 'Saudi Arabia',
                'counterparty': 'Arab Republic of Egypt',
                'metric': f"saudi_{config['tradeFlow'].lower()}_with_egypt",
                'tradeFlow': config['tradeFlow'],
                'period': row['Month'],
                'year': row['Year'],
                'quarter': row['Quarter'],
                'value': row['Million SAR'],
                'unit': 'million_SAR',
                'capturedAt': CAPTURED_AT,
                'sourceUrl': SOURCE_URL,
                'dataUrl': config['dataUrl'],
                'limitations': [
                    'This is Saudi foreign-trade activity with Egypt, not domestic ecommerce sales or advertising demand.',
                    'The counterparty filter is explicit and does not represent total Saudi trade or total Egyptian trade.',
                    'No causal relationship to campaign outcomes is inferred.',
                ],
            })
        output = {
            'contractVersion': '1.0',
            'artifactType': 'public_saudi_egypt_foreign_trade_snapshot',
            'artifactId': f"datasaudi-gastat-{config['tradeFlow'].lower()}-egypt-20260825",
            'generatedAt': CAPTURED_AT,
            'sourceId': config['sourceId'],
            'sourceUrl': SOURCE_URL,
            'dataUrl': config['dataUrl'],
            'licenseStatus': 'unknown',
            'rawInput': {'path': raw_path.relative_to(ROOT).as_posix(), 'sha256': sha256(raw_path), 'capturedAt': CAPTURED_AT},
            'selection': {'method': 'counterparty_country_id_egy', 'tradeFlow': config['tradeFlow'], 'observationCount': len(observations), 'periodRange': [observations[0]['period'], observations[-1]['period']] if observations else []},
            'observations': observations,
            'unknowns': ['domestic ecommerce GMV', 'absolute search volume', 'audience size', 'CPC', 'CPA', 'CVR', 'ROAS', 'competitor performance', 'customer funnel performance'],
            'limitations': ['GASTAT foreign-trade context is not a marketing benchmark.', 'License status remains unknown until explicit terms are verified.', 'No total-market or category-specific ecommerce inference is made.'],
        }
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = OUT_DIR / f"{config['tradeFlow'].lower()}-egypt-normalized-observations.json"
        out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        outputs.append({'output': out_path.relative_to(ROOT).as_posix(), 'rows': len(observations), 'sha256': output['rawInput']['sha256']})
    print(json.dumps({'status': 'PASS', 'outputs': outputs}, ensure_ascii=False))


if __name__ == '__main__':
    main()
