from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / "data/knowledge/public"
OUT_ROOT = PUBLIC_ROOT / "source-expansion/2026-08-27"
CAPTURED_AT = "2026-08-27T00:00:00.000Z"
REGISTRY_BASE = PUBLIC_ROOT / "public-source-registry-2026-08-25.json"
REGISTRY_OUT = PUBLIC_ROOT / "public-source-registry-2026-08-27.json"

BASE_LIMITATIONS = [
    "Public contextual evidence only; not advertising audience size or campaign-performance evidence.",
    "CPC, CPA, CVR, ROAS, reach, frequency, saturation, market share, and competitor performance are not inferred unless explicitly supplied by a source, and no such metrics are created here.",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source(
    source_id: str,
    publisher: str,
    url: str,
    source_type: str,
    *,
    market: str | None = None,
    industry: str | None = None,
    language: str | None = None,
    jurisdiction: str | None = None,
    license_status: str = "unknown",
    freshness: str = "on_demand",
    version: str = "2026-08-27",
    limitations: list[str] | None = None,
) -> dict[str, Any]:
    item: dict[str, Any] = {
        "contractVersion": "1.0",
        "sourceId": source_id,
        "publisher": publisher,
        "sourceUrl": url,
        "sourceType": source_type,
        "licenseStatus": license_status,
        "observedAt": CAPTURED_AT,
        "freshnessPolicy": freshness,
        "limitations": limitations or BASE_LIMITATIONS,
        "version": version,
        "enabled": True,
    }
    for key, value in (("market", market), ("industry", industry), ("language", language), ("jurisdiction", jurisdiction)):
        if value is not None:
            item[key] = value
    return item


def observation(observation_id: str, source_id: str, market: str, *, industry: str = "ecommerce_general", **fields: Any) -> dict[str, Any]:
    item: dict[str, Any] = {
        "observationId": observation_id,
        "sourceId": source_id,
        "market": market,
        "marketScope": "country_context" if fields.get("observationType", "").startswith(("official", "digital_economy", "ecommerce_context")) else "market_page_observation",
        "industryRelevance": industry,
        "status": "observed",
        "capturedAt": CAPTURED_AT,
        "limitations": list(BASE_LIMITATIONS),
    }
    item.update(fields)
    return item


def write_capture(name: str, title: str, urls: list[str], body: str) -> tuple[str, str]:
    path = OUT_ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    text = f"# {title}\n\nCaptured at: {CAPTURED_AT}\n\n" + "\n".join(f"- Source: {url}" for url in urls) + "\n\n" + body.strip() + "\n"
    path.write_text(text, encoding="utf-8")
    return path.relative_to(ROOT).as_posix(), sha256(path)


def main() -> None:
    base = json.loads(REGISTRY_BASE.read_text(encoding="utf-8"))
    existing_ids = {item["sourceId"] for item in base["sources"]}

    sources = [
        source(
            "src-gastat-digital-economy-methodology-sa-20260827",
            "General Authority for Statistics (GASTAT)",
            "https://www.stats.gov.sa/en/w/methodology-and-quality-report-of-digital-economy-statistics",
            "official_document",
            market="SA",
            language="en",
            jurisdiction="SA",
            freshness="monthly",
            version="methodology-quality-2025-05-25",
            limitations=[
                "Official methodology and quality documentation for the Saudi Digital Economy Survey; it is not itself a complete numerical market dataset.",
                "The page states 2022–2023 availability and 2023 reference period; missing indicators are not filled or interpolated.",
                "Digital economy survey scope is broader than ecommerce and is not advertising-performance evidence.",
            ],
        ),
        source(
            "src-saudi-mcit-digital-economy-news-20250427-20260827",
            "Saudi Ministry of Communications and Information Technology (MCIT)",
            "https://mcit.gov.sa/en/news/saudi-arabia%E2%80%99s-digital-economy-new-era-tech-growth-innovation-and-global-impact-empowered-hrh",
            "official_document",
            market="SA",
            language="en",
            jurisdiction="SA",
            version="news-2025-04-27",
            limitations=[
                "Official MCIT news-page context dated 2025-04-27; figures are publisher-stated national digital-economy and ICT context.",
                "The figures are not ecommerce-only demand, sales, market share, or advertising benchmarks.",
                "No reconciliation is performed against GASTAT, SAMA, or third-party series in this batch.",
            ],
        ),
        source(
            "src-ita-egypt-digital-economy-guide-20251121-20260827",
            "International Trade Administration, U.S. Department of Commerce",
            "https://www.trade.gov/country-commercial-guides/egypt-digital-economy",
            "official_document",
            market="EG",
            language="en",
            jurisdiction="EG",
            version="guide-2025-11-21",
            limitations=[
                "Official U.S. government country-guide context prepared by the International Trade Administration; it is secondary context for Egypt.",
                "Some figures are attributed by the page to Egyptian authorities or third-party reports; publisher attribution and date must be retained.",
                "Not a substitute for a primary Egyptian statistical release and not advertising-performance evidence.",
            ],
        ),
        source(
            "src-ita-egypt-ecommerce-guide-20251121-20260827",
            "International Trade Administration, U.S. Department of Commerce",
            "https://www.trade.gov/country-commercial-guides/egypt-ecommerce",
            "official_document",
            market="EG",
            industry="ecommerce_general",
            language="en",
            jurisdiction="EG",
            version="guide-2025-11-21",
            limitations=[
                "Official U.S. government country-guide context prepared by the International Trade Administration; it is secondary context for Egypt.",
                "The guide discusses ecommerce adoption, payments, logistics, and internet context but does not provide the client's store performance.",
                "Not a primary Egyptian administrative dataset and not advertising-performance evidence.",
            ],
        ),
        source(
            "src-ita-saudi-digital-economy-guide-20260512-20260827",
            "International Trade Administration, U.S. Department of Commerce",
            "https://www.trade.gov/country-commercial-guides/saudi-arabia-digital-economy-0",
            "official_document",
            market="SA",
            language="en",
            jurisdiction="SA",
            version="guide-2026-05-12",
            limitations=[
                "Official U.S. government country-guide context prepared by the International Trade Administration; it includes publisher-attributed secondary sources.",
                "Digital economy and ICT indicators are broader than ecommerce and must not be treated as a single market-size series.",
                "Not advertising-performance, CPC, CPA, CVR, ROAS, or competitor-campaign evidence.",
            ],
        ),
        source(
            "src-ita-saudi-ecommerce-guide-20260519-20260827",
            "International Trade Administration, U.S. Department of Commerce",
            "https://www.trade.gov/country-commercial-guides/saudi-arabia-ecommerce",
            "official_document",
            market="SA",
            industry="ecommerce_general",
            language="en",
            jurisdiction="SA",
            version="guide-2026-05-19",
            limitations=[
                "Official U.S. government country-guide context prepared by the International Trade Administration; cited market figures may come from secondary sources named on the page.",
                "Platform names and channel context are not market share or sales-volume measurements.",
                "Not advertising-performance, CPC, CPA, CVR, ROAS, or competitor-campaign evidence.",
            ],
        ),
        source(
            "src-sis-egypt-ict-sector-20240129-20260827",
            "State Information Service / Ministry of Communications and Information Technology (Egypt)",
            "https://sis.gov.eg/en/media-center/files/ict-sector/",
            "official_document",
            market="EG",
            language="en",
            jurisdiction="EG",
            version="ict-sector-2024-01-29",
            limitations=[
                "Egyptian government information-service page summarizing 2023 ICT-sector achievements and publisher-attributed indicators.",
                "Sector-level ICT figures are broader than ecommerce and are not campaign or customer-performance evidence.",
                "Figures are retained with their stated period and are not reconciled with the later ITA country-guide figures.",
            ],
        ),
        source(
            "src-jumia-eg-electronics-category-20260827",
            "Jumia Egypt",
            "https://www.jumia.com.eg/mlp-electronics-products-deals/",
            "public_library",
            market="EG",
            industry="ecommerce_general",
            language="en",
            jurisdiction="EG",
            version="category-capture-2026-08-27",
            limitations=[
                "Single public category-page observation; visible listing count, prices, promotions, ratings, seller signals, and availability can change.",
                "The page is not a representative assortment, price index, demand estimate, sales volume, or market-share sample.",
                "No competitor campaign performance or customer-level data is inferred.",
            ],
        ),
        source(
            "src-carrefour-eg-food-cupboard-20260827",
            "Carrefour Egypt",
            "https://www.carrefouregypt.com/mafegy/en/food-cupboard/n/c/clp_FEGY1700000",
            "public_library",
            market="EG",
            industry="ecommerce_general",
            language="en",
            jurisdiction="EG",
            version="category-capture-2026-08-27",
            limitations=[
                "Single public Cairo storefront/category observation; location, delivery slot, price, stock, and promotions can change.",
                "Visible product examples are not a national price average, representative sample, demand estimate, or sales-volume measurement.",
                "No customer-level or advertising-performance data is inferred.",
            ],
        ),
        source(
            "src-jarir-sa-smartphones-category-20260827",
            "Jarir Bookstore Saudi Arabia",
            "https://www.jarir.com/sa-en/smartphones.html",
            "public_library",
            market="SA",
            industry="ecommerce_general",
            language="en",
            jurisdiction="SA",
            version="category-capture-2026-08-27",
            limitations=[
                "Single public Saudi category-page observation; the rendered view exposed taxonomy and service context but not a stable product-price grid.",
                "Category and service observations are not a representative assortment, demand estimate, sales volume, or market share.",
                "No competitor campaign performance or customer-level data is inferred.",
            ],
        ),
        source(
            "src-google-play-jumia-en-us-20260827",
            "JUMIA Online Shopping",
            "https://play.google.com/store/apps/details?id=com.jumia.android&hl=en_US",
            "public_library",
            industry="ecommerce_general",
            language="en",
            version="app-capture-2026-08-27",
            limitations=[
                "Google Play en_US app-page observation; displayed rating, review count, and download band are global/store-locale indicators.",
                "These indicators do not establish Egypt-specific active users, installs, retention, revenue, sales, or market share.",
                "Data-safety disclosures are developer declarations and may change.",
            ],
        ),
        source(
            "src-google-play-jarir-en-us-20260827",
            "Jarir Bookstore",
            "https://play.google.com/store/apps/details?id=com.jarirbookstore.JBMarketingApp&hl=en_US",
            "public_library",
            market="SA",
            industry="ecommerce_general",
            language="en",
            jurisdiction="SA",
            version="app-capture-2026-08-27",
            limitations=[
                "Google Play en_US app-page observation; displayed rating, review count, and download band are not Saudi active-user or sales measurements.",
                "The app description and data-safety declarations are not campaign-performance evidence.",
                "Displayed values can change over time and vary by store locale.",
            ],
        ),
        source(
            "src-apple-store-jumia-eg-20260827",
            "Jumia Online Shopping",
            "https://apps.apple.com/eg/app/jumia-online-shopping/id925015459",
            "public_library",
            market="EG",
            industry="ecommerce_general",
            language="en",
            jurisdiction="EG",
            version="app-capture-2026-08-27",
            limitations=[
                "Egypt-locale Apple App Store page observation; ratings and chart position are public storefront signals, not active users, sales, or market share.",
                "Review text is not imported as evidence; only displayed aggregate metadata is retained.",
                "App-store values and ranking can change over time.",
            ],
        ),
        source(
            "src-apple-store-jarir-us-20260827",
            "Jarir Bookstore",
            "https://apps.apple.com/us/app/jarir-bookstore/id535777677",
            "public_library",
            market="SA",
            industry="ecommerce_general",
            language="en",
            jurisdiction="SA",
            version="app-capture-2026-08-27",
            limitations=[
                "US-locale Apple App Store page observation for a Saudi retailer; ratings and app metadata are not Saudi active users, sales, or market share.",
                "Review text and user identity are not imported as evidence.",
                "App-store values can change over time and are not reconciled with Google Play values.",
            ],
        ),
    ]

    duplicate_ids = existing_ids.intersection({item["sourceId"] for item in sources})
    if duplicate_ids:
        raise ValueError(f"New source IDs already exist in the baseline: {sorted(duplicate_ids)}")

    official_urls = [item["sourceUrl"] for item in sources if item["sourceType"] == "official_document"]
    official_capture, official_hash = write_capture(
        "official-context-capture.md",
        "Official public context expansion",
        official_urls,
        """
The GASTAT methodology page states that the Saudi Digital Economy Survey covers all economic activities, uses ISIC4, represents Saudi Arabia's 13 regions, and has 2023 as its reference period with availability stated for 2022–2023. It is methodology and quality evidence, not a complete ecommerce demand series.

The Saudi MCIT page dated 2025-04-27 publishes national digital-economy and ICT context, including publisher-stated digital-economy size, GDP contribution, ICT-market, connectivity, and digital-talent indicators. These remain publisher-attributed national context.

The ITA Egypt digital-economy and ecommerce pages dated 2025-11-21 provide official U.S. government country-guide context about Egypt's ICT sector, internet usage, ecommerce adoption, payments, and logistics. They are secondary context and are retained with the named publisher and date.

The ITA Saudi digital-economy and ecommerce pages dated 2026-05-12 and 2026-05-19 provide official U.S. government country-guide context about ICT, digital infrastructure, ecommerce channels, and payments. The pages cite secondary material for some figures; no figure is promoted to a primary Saudi statistical series.

The Egyptian State Information Service page dated 2024-01-29 summarizes 2023 ICT-sector achievements and publisher-attributed indicators. It is kept separate from the ITA page and is not numerically reconciled with it.
""",
    )
    marketplace_urls = [item["sourceUrl"] for item in sources if item["sourceId"].startswith(("src-jumia-", "src-carrefour-", "src-jarir-"))]
    marketplace_capture, marketplace_hash = write_capture(
        "marketplaces-capture.md",
        "Public marketplace expansion",
        marketplace_urls,
        """
Jumia Egypt electronics page: the public category page displayed a point-in-time listing count, EGP prices and reference prices, discounts, ratings/review counts, seller-score and official-store filters, and availability/fulfillment signals. The captured page is a single public storefront observation.

Carrefour Egypt Food Cupboard page: the public Cairo storefront displayed category taxonomy, EGP product prices, promotions, delivery-slot context, and stock labels such as limited quantity. The captured page is not a national grocery price index.

Jarir Saudi smartphones page: the public page displayed Saudi storefront context, smartphone/electronics taxonomy, brands, promotional banners, service/payment/warranty/returns/delivery context, but no stable product-price grid in the rendered capture. No price value is asserted for Jarir in this batch.
""",
    )
    app_urls = [item["sourceUrl"] for item in sources if item["sourceId"].startswith(("src-google-play-", "src-apple-store-"))]
    app_capture, app_hash = write_capture(
        "app-stores-capture.md",
        "Public app-store expansion",
        app_urls,
        """
Google Play Jumia page: displayed rating 4.4, approximately 2.69M reviews, and a 100M+ download band, plus a product-category and data-safety description. These are global/store-locale app-page indicators.

Google Play Jarir page: displayed rating 4.8, approximately 89.6K reviews, and a 10M+ download band, plus shopping-category and data-safety descriptions. These are store-locale indicators, not Saudi active users.

Apple App Store Jumia Egypt page: displayed Egypt-locale rating 4.7 with approximately 93K ratings and a Shopping chart position. It is an Egypt-locale storefront signal, not sales or active-user evidence.

Apple App Store Jarir US page: displayed rating 4.8 with approximately 5.7K ratings, Shopping category, and app metadata. It is a US-locale storefront observation for a Saudi retailer, not a Saudi usage measure.

Review text and reviewer identity were not retained as evidence.
        """,
    )

    official_observations = [
        observation("gastat-digital-economy-reference-period-2023", "src-gastat-digital-economy-methodology-sa-20260827", "SA", observationType="official_methodology", metric="digital_economy_survey_reference_period", value=2023, unit="year", period="2023", methodology="annual survey; all economic activities; ISIC4; 13 administrative regions", limitations=["Official methodology metadata; not a numerical ecommerce demand or advertising-performance series."]),
        observation("gastat-digital-economy-time-coverage-2022-2023", "src-gastat-digital-economy-methodology-sa-20260827", "SA", observationType="official_methodology", metric="digital_economy_survey_time_coverage", value="2022-2023", unit="period", period="2022-2023", limitations=["Official methodology metadata; availability statement is retained as published and does not fill missing indicators."]),
        observation("saudi-mcit-digital-economy-size-2025", "src-saudi-mcit-digital-economy-news-20250427-20260827", "SA", observationType="official_national_context", metric="digital_economy_size", value=495, unit="SAR_billion", period="2025 publication; underlying period as stated by publisher", limitations=["Publisher-stated national digital-economy context; not ecommerce-only market size or advertising benchmark."]),
        observation("saudi-mcit-digital-economy-gdp-share-2025", "src-saudi-mcit-digital-economy-news-20250427-20260827", "SA", observationType="official_national_context", metric="digital_economy_gdp_share", value=15, unit="percent", period="2025 publication; underlying period as stated by publisher", limitations=["Publisher-stated national digital-economy context; not ecommerce-only share."]),
        observation("saudi-mcit-ict-market-2024", "src-saudi-mcit-digital-economy-news-20250427-20260827", "SA", observationType="official_national_context", metric="ict_market_size", value=180, unit="SAR_billion_lower_bound", period="2024", limitations=["The page states the ICT market surpassed this value; it is not an ecommerce-only series."]),
        observation("egypt-ita-ict-growth-fy2022-2023", "src-ita-egypt-digital-economy-guide-20251121-20260827", "EG", observationType="official_secondary_context", metric="ict_sector_growth", value=15.2, unit="percent", period="FY2022/2023", limitations=["Official U.S. government guide; secondary context and not an advertising-performance metric."]),
        observation("egypt-ita-ict-gdp-share-fy2022-2023", "src-ita-egypt-digital-economy-guide-20251121-20260827", "EG", observationType="official_secondary_context", metric="ict_sector_gdp_share", value=5.1, unit="percent", period="FY2022/2023", limitations=["Official U.S. government guide; secondary context and not ecommerce-only share."]),
        observation("egypt-ita-ict-investment-fy2022-2023", "src-ita-egypt-digital-economy-guide-20251121-20260827", "EG", observationType="official_secondary_context", metric="ict_sector_investment", value=4.2, unit="USD_billion", period="FY2022/2023", limitations=["Publisher-attributed investment context; not ecommerce investment or advertising spend."]),
        observation("egypt-ita-internet-users-2025", "src-ita-egypt-ecommerce-guide-20251121-20260827", "EG", observationType="ecommerce_context", metric="internet_users", value=96.3, unit="million_people", period="January 2025", limitations=["Country-guide context; internet users are not ecommerce buyers, customers, or ad audiences."]),
        observation("egypt-ita-internet-penetration-2025", "src-ita-egypt-ecommerce-guide-20251121-20260827", "EG", observationType="ecommerce_context", metric="internet_penetration", value=81.9, unit="percent", period="January 2025", limitations=["Country-guide context; not ecommerce conversion or active buyer rate."]),
        observation("egypt-ita-regular-online-purchase-share-2025", "src-ita-egypt-ecommerce-guide-20251121-20260827", "EG", observationType="ecommerce_context", metric="regular_online_purchase_share", value=8.3, unit="percent", period="2025 guide", limitations=["Publisher-stated adoption context; definition and sampling belong to the cited source and are not extrapolated."]),
        observation("saudi-ita-ict-market-2025", "src-ita-saudi-digital-economy-guide-20260512-20260827", "SA", observationType="official_secondary_context", metric="ict_market_size", value=48, unit="USD_billion", period="May 2025", limitations=["Country-guide secondary ICT context; not ecommerce-only market size."]),
        observation("saudi-ita-internet-penetration-2025", "src-ita-saudi-digital-economy-guide-20260512-20260827", "SA", observationType="official_secondary_context", metric="internet_penetration", value=99, unit="percent", period="2025 guide", limitations=["Country-guide context; not active ecommerce buyers or ad audiences."]),
        observation("saudi-ita-ecommerce-users-2025", "src-ita-saudi-ecommerce-guide-20260519-20260827", "SA", observationType="ecommerce_context", metric="ecommerce_users", value=34.5, unit="million_people", period="end-2025 expectation", limitations=["Publisher-stated expectation; not observed sales, active users, or market share."]),
        observation("saudi-ita-ecommerce-retail-share-2026", "src-ita-saudi-ecommerce-guide-20260519-20260827", "SA", observationType="ecommerce_context", metric="ecommerce_share_of_retail", value=10, unit="percent", period="2026 guide statement", limitations=["The page attributes this to McKinsey; it is a secondary contextual estimate and not a Saudi official statistical series."]),
        observation("egypt-sis-ict-growth-fy2022-2023", "src-sis-egypt-ict-sector-20240129-20260827", "EG", observationType="official_national_context", metric="ict_sector_growth", value=16.3, unit="percent", period="FY2022/2023", limitations=["Egyptian government information-service summary; definition and methodology remain publisher-specific."]),
        observation("egypt-sis-ict-revenue-current-fy", "src-sis-egypt-ict-sector-20240129-20260827", "EG", observationType="official_national_context", metric="ict_sector_revenue", value=315, unit="EGP_billion", period="current fiscal year as stated on 2024 page", limitations=["Publisher-stated ICT-sector context; not ecommerce GMV or advertising revenue."]),
        observation("egypt-sis-digital-exports-2023", "src-sis-egypt-ict-sector-20240129-20260827", "EG", observationType="official_national_context", metric="digital_exports", value=6.2, unit="USD_billion", period="2023", limitations=["Publisher-stated digital-export context; not domestic ecommerce sales."]),
    ]

    marketplace_observations = [
        observation("jumia-eg-electronics-category-listings-20260827", "src-jumia-eg-electronics-category-20260827", "EG", platform="Jumia", observationType="category_structure", pageUrl="https://www.jumia.com.eg/mlp-electronics-products-deals/", visibleListingCount=19595, visiblePriceSampleRange={"min": 68.0, "max": 99999.0, "currency": "EGP"}, priceObserved=True, discountObserved=True, ratingObserved=True, availabilitySignalObserved=True, visibleFilterGroups=["brand", "price", "campaigns", "product rating", "seller score", "official store"], limitations=["Single public electronics category snapshot; the visible listing count and sample price range are not a representative market index or demand estimate."]),
        observation("carrefour-eg-food-cupboard-cairo-20260827", "src-carrefour-eg-food-cupboard-20260827", "EG", platform="Carrefour", observationType="category_structure", pageUrl="https://www.carrefouregypt.com/mafegy/en/food-cupboard/n/c/clp_FEGY1700000", deliveryLocation="Maadi - Cairo", visiblePriceSampleRange={"min": 8.5, "max": 1713.5, "currency": "EGP"}, promotionObserved=True, stockLabelObserved=True, deliverySlotObserved=True, visibleCategory="Food Cupboard", limitations=["Cairo storefront/category snapshot; sample price range is not a national price average or market-demand estimate."]),
        observation("jarir-sa-smartphones-category-structure-20260827", "src-jarir-sa-smartphones-category-20260827", "SA", platform="Jarir", observationType="category_structure", pageUrl="https://www.jarir.com/sa-en/smartphones.html", visibleCategories=["smartphones", "smartphone accessories", "headphones and speakers", "smartwatches and wearables", "cameras and accessories", "smart home"], visibleBrands=["Apple", "Samsung", "Huawei", "Xiaomi", "Motorola"], serviceSignals=["payment", "warranty", "returns", "delivery"], stableProductPriceGridObserved=False, limitations=["The rendered public page exposed taxonomy and service context but no stable product-price grid; no Jarir price is asserted."]),
    ]

    app_observations = [
        observation("google-play-jumia-en-us-metadata-20260827", "src-google-play-jumia-en-us-20260827", "EG", platform="Google Play", storeLocale="en_US", marketScope="global_or_store_locale", observationType="app_store_metadata", pageUrl="https://play.google.com/store/apps/details?id=com.jumia.android&hl=en_US", app={"name": "JUMIA Online Shopping", "packageId": "com.jumia.android"}, rating={"value": 4.4, "reviewCountText": "2.69M"}, downloadCountText="100M+", lastUpdateDisplayed="2026-08-20", dataSafetySignals=["may share personal and financial information", "encrypted in transit", "data deletion request available"], limitations=["Global/store-locale app-page indicators; not Egypt-specific users, installs, sales, retention, or market share."]),
        observation("google-play-jarir-en-us-metadata-20260827", "src-google-play-jarir-en-us-20260827", "SA", platform="Google Play", storeLocale="en_US", marketScope="global_or_store_locale", observationType="app_store_metadata", pageUrl="https://play.google.com/store/apps/details?id=com.jarirbookstore.JBMarketingApp&hl=en_US", app={"name": "Jarir Bookstore", "packageId": "com.jarirbookstore.JBMarketingApp"}, rating={"value": 4.8, "reviewCountText": "89.6K"}, downloadCountText="10M+", lastUpdateDisplayed="2026-08-10", dataSafetySignals=["no data shared with third parties declared", "location and personal info may be collected", "encrypted in transit", "data deletion request available"], limitations=["Global/store-locale app-page indicators; not Saudi-specific users, installs, sales, retention, or market share."]),
        observation("apple-store-jumia-eg-metadata-20260827", "src-apple-store-jumia-eg-20260827", "EG", platform="Apple App Store", storeLocale="EG", marketScope="country_store_locale", observationType="app_store_metadata", pageUrl="https://apps.apple.com/eg/app/jumia-online-shopping/id925015459", app={"name": "Jumia Online Shopping", "appId": "925015459"}, rating={"value": 4.7, "ratingsCountText": "93K"}, chartPosition={"chart": "top-free shopping", "position": 14}, category="Shopping", languagesDisplayed="English, Arabic, French", versionDisplayed="20.0.0", reviewTextImported=False, limitations=["Egypt-locale app-page indicators; not active users, sales, retention, or market share."]),
        observation("apple-store-jarir-us-metadata-20260827", "src-apple-store-jarir-us-20260827", "SA", platform="Apple App Store", storeLocale="US", marketScope="global_or_store_locale", observationType="app_store_metadata", pageUrl="https://apps.apple.com/us/app/jarir-bookstore/id535777677", app={"name": "Jarir Bookstore", "appId": "535777677"}, rating={"value": 4.8, "ratingsCountText": "5.7K"}, category="Shopping", languagesDisplayed="English, Arabic", versionDisplayed="9.9.6", reviewTextImported=False, limitations=["US-locale app-page indicators for a Saudi retailer; not Saudi active users, sales, retention, or market share."]),
    ]

    captures = {
        "official": {"path": official_capture, "sha256": official_hash},
        "marketplaces": {"path": marketplace_capture, "sha256": marketplace_hash},
        "apps": {"path": app_capture, "sha256": app_hash},
    }

    all_sources = sorted(base["sources"] + sources, key=lambda item: item["sourceId"])
    if len({(item["sourceId"], item["version"]) for item in all_sources}) != len(all_sources):
        raise ValueError("Duplicate sourceId/version in expanded registry")
    REGISTRY_OUT.write_text(json.dumps({"contractVersion": "1.0", "generatedAt": CAPTURED_AT, "sources": all_sources}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    artifacts = {
        "official": {
            "contractVersion": "1.0",
            "artifactType": "public_official_context_expansion",
            "artifactId": "public-official-context-expansion-eg-sa-20260827",
            "generatedAt": CAPTURED_AT,
            "rawInput": captures["official"],
            "observations": official_observations,
            "unknowns": ["These sources do not provide advertising audience, CPC, CPA, CVR, ROAS, or campaign-performance data."],
            "limitations": ["Official government or government-guide context is retained with source attribution and scope; secondary figures are not promoted to primary national series."],
        },
        "marketplaces": {
            "contractVersion": "1.0",
            "artifactType": "public_marketplace_storefront_expansion",
            "artifactId": "public-marketplace-storefront-expansion-eg-sa-20260827",
            "generatedAt": CAPTURED_AT,
            "rawInput": captures["marketplaces"],
            "observations": marketplace_observations,
            "unknowns": ["No representative price average, demand, sales volume, market share, competitor performance, or campaign attribution is available from the storefront captures."],
            "limitations": ["Storefront values are point-in-time observations and must be refreshed on demand."],
        },
        "apps": {
            "contractVersion": "1.0",
            "artifactType": "public_app_store_expansion",
            "artifactId": "public-app-store-expansion-eg-sa-20260827",
            "generatedAt": CAPTURED_AT,
            "rawInput": captures["apps"],
            "observations": app_observations,
            "unknowns": ["Country-specific active users, installs, retention, revenue, sales, conversion, and market share are unavailable from public app pages."],
            "limitations": ["App-store indicators are kept by store locale and are not reconciled into country performance metrics."],
        },
    }
    for key, artifact in artifacts.items():
        path = OUT_ROOT / f"normalized-{key}-observations.json"
        path.write_text(json.dumps(artifact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    manifest = {
        "contractVersion": "1.0",
        "artifactType": "public_source_expansion_manifest",
        "manifestId": "public-source-expansion-20260827",
        "generatedAt": CAPTURED_AT,
        "baselineRegistry": "data/knowledge/public/public-source-registry-2026-08-25.json",
        "expandedRegistry": "data/knowledge/public/public-source-registry-2026-08-27.json",
        "newSourceCount": len(sources),
        "newObservationCounts": {"official": len(official_observations), "marketplaces": len(marketplace_observations), "apps": len(app_observations)},
        "newSourceIds": [item["sourceId"] for item in sources],
        "sourceTypes": {"official": "official_document", "marketplaces": "public_library", "apps": "public_library"},
        "marketValidated": False,
        "captures": captures,
        "policy": {
            "noCaptchaBypass": True,
            "noLogin": True,
            "noPurchaseOrMutation": True,
            "noRawReviewText": True,
            "noPersonalIdentity": True,
            "noMarketBenchmarkFabrication": True,
            "noAdPerformanceInference": True,
        },
    }
    (OUT_ROOT / "MANIFEST.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "PASS", "expandedRegistry": str(REGISTRY_OUT.relative_to(ROOT)), "newSourceCount": len(sources), "newObservationCounts": manifest["newObservationCounts"], "marketValidated": False}, ensure_ascii=False))


if __name__ == "__main__":
    main()
