from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/knowledge/public/public-source-record-additions-2026-08-25.json'
OBSERVED_AT = '2026-08-25T20:30:00.000Z'
BASE_LIMITATIONS = [
    'Public contextual source; not advertising audience size or campaign-performance evidence.',
    'CPC, CPA, CVR, ROAS, reach, frequency, saturation, and competitor performance are not supplied by this source.',
]


def record(source_id: str, publisher: str, url: str, source_type: str, *, market: str | None = None, language: str | None = None, license_status: str = 'unknown', freshness: str = 'monthly', limitations: list[str] | None = None, version: str = '2026-08-25') -> dict[str, object]:
    item: dict[str, object] = {
        'contractVersion': '1.0',
        'sourceId': source_id,
        'publisher': publisher,
        'sourceUrl': url,
        'sourceType': source_type,
        'licenseStatus': license_status,
        'observedAt': OBSERVED_AT,
        'freshnessPolicy': freshness,
        'limitations': limitations or BASE_LIMITATIONS,
        'version': version,
        'enabled': True,
    }
    if market is not None:
        item['market'] = market
    if language is not None:
        item['language'] = language
    return item


def main() -> None:
    sources: list[dict[str, object]] = []
    sources.append(record(
        'src-unesco-uis-egy-sau-education-20260825',
        'UNESCO Institute for Statistics (UIS)',
        'https://api.uis.unesco.org/api/public/documentation/',
        'official_api',
        license_status='approved',
        freshness='monthly',
        version='20260507-91260335',
        limitations=[
            'UIS education supply and participation indicators are not advertising demand or campaign performance.',
            'The public API response states CC BY-SA 4.0; preserve attribution and share-alike requirements.',
            'Latest available year varies by indicator and country; missing years are not interpolated.',
        ],
    ))
    sources.append(record(
        'src-unctad-digital-economy-egy-sau-20260825',
        'UNCTAD via World Bank Data360',
        'https://data360.worldbank.org/en/dataset/UNCTAD_DE',
        'official_api',
        license_status='unknown',
        freshness='monthly',
        version='2026-08-25',
        limitations=[
            'Digital economy, ICT, and digitally-deliverable-services context; not advertising demand or campaign performance.',
            'International digitally-deliverable services trade is not domestic ecommerce GMV.',
            'Data availability varies by indicator and year; blank cells are not interpolated.',
        ],
    ))
    undata_pages = {
        'population_and_density': 'https://data.un.org/_Docs/SYB/CSV/SYB68_1_202511_Population%2C%20Surface%20Area%20and%20Density.csv',
        'gdp_and_gdp_per_capita': 'https://data.un.org/_Docs/SYB/CSV/SYB68_230_202511_GDP%20and%20GDP%20Per%20Capita.csv',
        'gva_by_activity': 'https://data.un.org/_Docs/SYB/CSV/SYB68_153_202511_Gross%20Value%20Added%20by%20Economic%20Activity.csv',
        'education_enrollment': 'https://data.un.org/_Docs/SYB/CSV/SYB68_309_202511_Education.csv',
        'teaching_staff': 'https://data.un.org/_Docs/SYB/CSV/SYB68_323_202511_Teaching%20Staff%20in%20education.csv',
        'education_ict_access': 'https://data.un.org/_Docs/SYB/CSV/SYB68_245_202511_Public%20expenditure%20on%20education%20and%20access%20to%20computers.csv',
        'labour_force_and_unemployment': 'https://data.un.org/_Docs/SYB/CSV/SYB68_329_202511_Labour%20Force%20and%20Unemployment.csv',
        'employment_by_activity': 'https://data.un.org/_Docs/SYB/CSV/SYB68_200_202511_Employment.csv',
        'consumer_price_index': 'https://data.un.org/_Docs/SYB/CSV/SYB68_128_202511_Consumer%20Price%20Index.csv',
        'trade_balance': 'https://data.un.org/_Docs/SYB/CSV/SYB68_123_202511_Total%20Imports%20Exports%20and%20Balance%20of%20Trade.csv',
        'internet_usage': 'https://data.un.org/_Docs/SYB/CSV/SYB68_314_202511_Internet%20Usage.csv',
    }
    for dataset, url in undata_pages.items():
        sources.append(record(
            f'src-undata-{dataset}-egy-sau-20260825',
            'United Nations Statistics Division (UNdata)',
            url,
            'official_api',
            license_status='unknown',
            freshness='monthly',
            version='SYB68-202511',
            limitations=[
                'UNdata statistical context; not advertising audience size, search demand, or campaign performance.',
                'The table contains series from the named upstream agency; preserve series-level source and footnotes.',
                'Coverage years differ by series and may be estimates or projections as indicated by footnotes.',
            ],
        ))
    kapsarc = [
        ('src-kapsarc-sama-pos-sector-sa-20260825', 'https://datasource.kapsarc.org/explore/assets/points-of-sale-transactions-and-sales-by-sector/'),
        ('src-kapsarc-sama-pos-sector-city-sa-20260825', 'https://datasource.kapsarc.org/explore/assets/point-of-sale-transactions-by-sector-and-city/'),
        ('src-kapsarc-sama-pos-detailed-sector-city-sa-20260825', 'https://datasource.kapsarc.org/explore/assets/detailed-point-of-sale-transactions-by-sector-and-city/'),
    ]
    for source_id, url in kapsarc:
        sources.append(record(
            source_id,
            'KAPSARC Data Portal / Saudi Central Bank (SAMA)',
            url,
            'official_api',
            market='SA',
            license_status='unknown',
            freshness='monthly',
            version='2026-08-25',
            limitations=[
                'SAMA payment activity is market-context evidence and not proof of online-only demand for each sector.',
                'Records are aggregate payment activity and do not identify customer, advertising source, or conversion attribution.',
                'The public portal export is GET-only; source license status remains unknown until explicit terms are verified.',
            ],
        ))
    datasaudi = [
        ('src-gastat-datasaudi-digital-economy-gdp-sa-20260825', 'General Authority for Statistics (GASTAT) / DataSaudi', 'https://www.stats.gov.sa/en/statistics-tabs/-/categories/122941?tab=436312&category=122941'),
        ('src-gastat-datasaudi-digital-establishment-usage-sa-20260825', 'General Authority for Statistics (GASTAT) / DataSaudi', 'https://www.stats.gov.sa/en/statistics-tabs/-/categories/122941?tab=436312&category=122941'),
        ('src-gastat-datasaudi-foreign-trade-exports-20260825', 'General Authority for Statistics (GASTAT) / DataSaudi', 'https://www.stats.gov.sa/en/statistics-tabs/-/categories/123481?tab=436312&category=123481'),
        ('src-gastat-datasaudi-foreign-trade-imports-20260825', 'General Authority for Statistics (GASTAT) / DataSaudi', 'https://www.stats.gov.sa/en/statistics-tabs/-/categories/123481?tab=436312&category=123481'),
        ('src-gastat-datasaudi-education-expenditure-sa-20260825', 'General Authority for Statistics (GASTAT) / DataSaudi', 'https://www.stats.gov.sa/en/statistics-tabs?tab=436318&category=514986'),
        ('src-sama-datasaudi-higher-education-students-sa-20260825', 'Saudi Central Bank (SAMA) / DataSaudi', 'https://www.sama.gov.sa/en-US/Publications/EconomicReports/Pages/report.aspx?cid=127'),
        ('src-sama-datasaudi-students-schools-teachers-sa-20260825', 'Saudi Central Bank (SAMA) / DataSaudi', 'https://www.sama.gov.sa/en-US/Publications/EconomicReports/Pages/report.aspx?cid=127'),
    ]
    for source_id, publisher, url in datasaudi:
        sources.append(record(
            source_id,
            publisher,
            url,
            'official_api',
            market='SA',
            license_status='unknown',
            freshness='monthly',
            version='2026-08-25',
            limitations=[
                'DataSaudi portal data is official market or education-system context, not an advertising benchmark.',
                'The selected cube can have uneven periods and dimensions; no missing period is inferred.',
                'License status is not presumed from the portal and remains unknown pending explicit terms verification.',
            ],
        ))
    sources.append(record(
        'src-undata-statistical-yearbook-egy-sau-20260825',
        'United Nations Statistics Division (UNdata)',
        'https://data.un.org/',
        'official_api',
        license_status='unknown',
        freshness='monthly',
        version='SYB68-202511',
        limitations=[
            'Container record for the selected UNdata tables; individual table source IDs are used by observations.',
            'UNdata context is not advertising audience size, search demand, or campaign performance.',
        ],
    ))
    sources.append(record(
        'src-itu-key-ict-regional-2025',
        'International Telecommunication Union (ITU)',
        'https://www.itu.int/en/ITU-D/Statistics/pages/stat/default.aspx',
        'official_document',
        license_status='unknown',
        freshness='monthly',
        version='Nov-2025',
        limitations=[
            'The downloaded workbook contains regional/global aggregates; no direct Egypt or Saudi Arabia rows were found.',
            'Regional aggregates are not substituted for country values and are not advertising benchmarks.',
        ],
    ))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'contractVersion': '1.0', 'generatedAt': OBSERVED_AT, 'sources': sorted(sources, key=lambda item: str(item['sourceId']))}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'PASS', 'output': OUT.relative_to(ROOT).as_posix(), 'sourceCount': len(sources)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
