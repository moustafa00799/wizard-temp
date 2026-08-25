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


def record(source_id: str, publisher: str, url: str, source_type: str, *, market: str | None = None, industry: str | None = None, language: str | None = None, license_status: str = 'unknown', freshness: str = 'monthly', limitations: list[str] | None = None, version: str = '2026-08-25') -> dict[str, object]:
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
    if industry is not None:
        item['industry'] = industry
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
        ('src-kapsarc-sama-pos-ecommerce-sa-20260825', 'https://datasource.kapsarc.org/explore/assets/pos-transactions/'),
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
    sources.append(record(
        'src-cbe-payment-system-eg-20260825',
        'Central Bank of Egypt (CBE)',
        'https://www.cbe.org.eg/en/payment-systems-and-services',
        'official_document',
        market='EG',
        language='en',
        license_status='unknown',
        freshness='on_demand',
        limitations=[
            'Qualitative CBE national payment-system and institutional context; no numerical ecommerce series was captured from this page.',
            'The public browser rendered the page while the text extraction endpoint returned an official server rejection; reproducibility is limited.',
            'Not audience size, ecommerce demand, CPC, CPA, CVR, ROAS, reach, frequency, saturation, market share, or competitor performance.',
        ],
        version='payment-systems-2026-07-08',
    ))
    sources.append(record(
        'src-sama-national-payment-news1139-sa-20260825',
        'Saudi Central Bank (SAMA)',
        'https://www.sama.gov.sa/en-US/MediaCenter/News/pages/news-1139.aspx',
        'official_document',
        market='SA',
        language='en',
        license_status='unknown',
        freshness='on_demand',
        limitations=[
            'Official national payment-ecosystem facts for 2024 and 2025; not ecommerce-only sales, demand, audience, or advertising performance.',
            'The source does not provide product, industry, city, customer, or ad-attribution breakdowns.',
        ],
        version='news-1139-2026-04-12',
    ))
    sources.append(record(
        'src-sama-ecommerce-interface-news1095-sa-20260825',
        'Saudi Central Bank (SAMA)',
        'https://sama.gov.sa/en-US/MediaCenter/News/pages/news-1095.aspx',
        'official_document',
        market='SA',
        language='en',
        license_status='unknown',
        freshness='on_demand',
        limitations=[
            'Payment-infrastructure description for ecommerce; not ecommerce sales, demand, audience, market share, or ad performance.',
            'No adoption count or channel-level outcome is inferred from the interface description.',
        ],
        version='news-1095-2025-07-07',
    ))
    sources.append(record(
        'src-sama-weekly-pos-page-sa-20260825',
        'Saudi Central Bank (SAMA)',
        'https://www.sama.gov.sa/en-US/Statistics/Indices/Pages/POS.aspx',
        'official_document',
        market='SA',
        language='en',
        license_status='unknown',
        freshness='weekly',
        limitations=[
            'Public report-availability and dimension context; the captured page did not expose a downloadable numerical row.',
            'Existing KAPSARC/SAMA exports remain the numeric POS artifacts; no ecommerce-only demand or advertising performance is inferred.',
        ],
        version='weekly-pos-page-2026-08-25',
    ))
    egypt_portal = record(
        'src-egypt-national-open-data-portal-20260825',
        'Government of Egypt',
        'https://data.gov.eg/',
        'official_document',
        market='EG',
        language='ar',
        license_status='unknown',
        freshness='on_demand',
        limitations=[
            'Discovery-only record: the public portal did not resolve in the permitted retrieval attempt and no dataset was asserted.',
            'Disabled until an official endpoint and dataset metadata can be read without bypassing protection.',
        ],
        version='unavailable-discovery-2026-08-25',
    )
    egypt_portal['enabled'] = False
    sources.append(egypt_portal)
    sources.append(record(
        'src-mped-national-accounts-eg-20260825',
        'Egypt Ministry of Planning and Economic Development',
        'https://mped.gov.eg/Analytics?lang=en',
        'official_document',
        market='EG',
        language='en',
        license_status='unknown',
        freshness='monthly',
        limitations=[
            'The page confirms interactive GDP and regional-account dataset scope; linked numerical tables were not copied into this batch.',
            'Macroeconomic and regional context only; not ecommerce demand, audience, market share, or advertising performance.',
        ],
        version='national-accounts-discovery-2026-08-25',
    ))
    sources.append(record(
        'src-nafeza-customs-fx-eg-20260825',
        'Egyptian Customs Authority via Nafeza',
        'https://sandbox.nafeza.gov.eg/ar/currencies',
        'official_document',
        market='EG',
        language='ar',
        license_status='unknown',
        freshness='daily',
        limitations=[
            'Customs conversion rates for the displayed date; not consumer market prices or advertising benchmarks.',
            'Use only for explicit currency normalization while retaining the displayed date and source label.',
        ],
        version='customs-fx-2026-02-24',
    ))
    marketplace_records = [
        ('src-noon-eg-mobile-category-20260825', 'Noon Egypt', 'https://www.noon.com/egypt-en/electronics-and-mobiles/mobiles-and-accessories/mobiles-20905/', 'EG'),
        ('src-noon-eg-galaxy-a17-product-20260825', 'Noon Egypt', 'https://www.noon.com/egypt-en/galaxy-a17-dual-sim-4g-black-4gb-ram-128gb-middle-east-version/N70214276V/p/?o=b93223709b1aab3c', 'EG'),
        ('src-noon-sa-mobile-category-20260825', 'Noon Saudi Arabia', 'https://www.noon.com/saudi-en/electronics-and-mobiles/mobiles-and-accessories/mobiles-20905/', 'SA'),
        ('src-noon-sa-galaxy-s25-product-20260825', 'Noon Saudi Arabia', 'https://www.noon.com/saudi-en/galaxy-s25-ultra-dual-sim-titanium-black-12gb-ram-256gb-5g-international-version/N70142933V/p/', 'SA'),
        ('src-amazon-eg-homepage-20260825', 'Amazon Egypt', 'https://www.amazon.eg/-/en/', 'EG'),
        ('src-amazon-eg-product-captcha-20260825', 'Amazon Egypt', 'https://www.amazon.eg/-/en/Silver-Crest-Performance-Convection-DR-8803S/dp/B0C1ZJJ1XG', 'EG'),
        ('src-amazon-sa-anker-product-20260825', 'Amazon Saudi Arabia', 'https://www.amazon.sa/-/en/Anker-2-Pack-Premium-Charger-Samsung/dp/B07DC5PPFV/', 'SA'),
    ]
    for source_id, publisher, url, market in marketplace_records:
        item = record(
            source_id,
            publisher,
            url,
            'public_library',
            market=market,
            industry='ecommerce_general',
            language='en',
            license_status='unknown',
            freshness='on_demand',
            limitations=[
                'Public storefront observation at a point in time; not a representative sample, demand estimate, sales volume, or market share.',
                'Visible price, rating, review count, seller, stock, fulfillment, rank, and merchandising claims can change over time.',
                'No CPC, CPA, CVR, ROAS, reach, frequency, saturation, or competitor campaign performance is inferred.',
            ],
            version='storefront-capture-2026-08-25',
        )
        if source_id == 'src-amazon-eg-product-captcha-20260825':
            item['enabled'] = False
            item['limitations'] = [
                'The public product request returned a CAPTCHA/interstitial and was not bypassed.',
                'No product value was inferred and no further automated retries were made.',
            ]
        sources.append(item)
    app_records = [
        ('src-google-play-noon-en-us-20260825', 'Noon Online Shopping & Grocery', 'https://play.google.com/store/apps/details?id=com.noon.buyerapp&hl=en_US'),
        ('src-google-play-amazon-en-us-20260825', 'Amazon Shopping', 'https://play.google.com/store/apps/details?id=com.amazon.mShop.android.shopping&hl=en_US'),
        ('src-apple-store-noon-us-20260825', 'Noon Shopping, Food, Grocery', 'https://apps.apple.com/us/app/noon-shopping-food-grocery/id1269038866'),
        ('src-apple-store-amazon-us-20260825', 'Amazon Shopping', 'https://apps.apple.com/us/app/amazon-shopping/id297606951'),
    ]
    for source_id, publisher, url in app_records:
        sources.append(record(
            source_id,
            publisher,
            url,
            'public_library',
            language='en',
            license_status='unknown',
            freshness='on_demand',
            limitations=[
                'Global or store-locale app-page observation; not country-specific active users, installs, market share, or performance.',
                'Header/detail review-count differences are retained as displayed and are not reconciled into a new metric.',
                'Ratings and downloads do not establish sales, retention, conversion, CPC, CPA, CVR, ROAS, or campaign success.',
            ],
            version='app-store-capture-2026-08-25',
        ))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'contractVersion': '1.0', 'generatedAt': OBSERVED_AT, 'sources': sorted(sources, key=lambda item: str(item['sourceId']))}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'PASS', 'output': OUT.relative_to(ROOT).as_posix(), 'sourceCount': len(sources)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
