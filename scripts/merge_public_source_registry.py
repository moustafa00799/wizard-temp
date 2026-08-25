from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / 'data/knowledge/public'
REGISTRY_PATH = PUBLIC_ROOT / 'public-source-registry-2026-08-25.json'
INPUTS = [
    PUBLIC_ROOT / 'capmas/2026-08-25/source-records.json',
    PUBLIC_ROOT / 'google-trends/2026-08-25/source-records.json',
    PUBLIC_ROOT / 'public-source-record-additions-2026-08-25.json',
]


def main() -> None:
    registry: dict[str, Any] = json.loads(REGISTRY_PATH.read_text(encoding='utf-8'))
    existing = {source['sourceId']: source for source in registry.get('sources', [])}
    for path in INPUTS:
        payload = json.loads(path.read_text(encoding='utf-8'))
        for source in payload.get('sources', []):
            previous = existing.get(source['sourceId'])
            if previous is not None and previous != source:
                raise ValueError(f"Conflicting source record for {source['sourceId']}")
            existing[source['sourceId']] = source
    registry['sources'] = sorted(existing.values(), key=lambda source: source['sourceId'])
    registry['generatedAt'] = '2026-08-25T20:30:00.000Z'
    registry['registryId'] = 'public-source-registry-20260825-extended'
    REGISTRY_PATH.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'PASS', 'output': REGISTRY_PATH.relative_to(ROOT).as_posix(), 'sourceCount': len(registry['sources']), 'sourceIds': [source['sourceId'] for source in registry['sources']]}, ensure_ascii=False))


if __name__ == '__main__':
    main()
