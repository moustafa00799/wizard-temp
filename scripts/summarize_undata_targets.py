from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

ROOT = Path('/home/ubuntu/wizard-temp/.local/public-research/undata')
targets = {'Egypt', 'Saudi Arabia', 'Egypt, Arab Rep.', 'Saudi Arabia'}
for path in sorted(ROOT.glob('*.csv')):
    rows: list[dict[str, Any]] = []
    with path.open(newline='', encoding='utf-8-sig', errors='replace') as handle:
        reader = csv.reader(handle)
        raw_header = next(reader, [])
        header = next(reader, [])
        for values in reader:
            if not values:
                continue
            record = {header[i] if header[i] else f'column_{i}': values[i] if i < len(values) else '' for i in range(len(header))}
            area = values[1] if len(values) > 1 else ''
            record['areaName'] = area
            if area in targets:
                rows.append(record)
    print(json.dumps({
        'file': path.name,
        'titleRow': raw_header,
        'columns': header,
        'targetRows': len(rows),
        'areas': sorted({row.get('areaName', '') for row in rows}),
        'series': sorted({row.get('Series', '') for row in rows}),
        'years': sorted({row.get('Year', '') for row in rows}),
        'sample': rows[:5],
        'latest': rows[-5:],
    }, ensure_ascii=False, default=str))
