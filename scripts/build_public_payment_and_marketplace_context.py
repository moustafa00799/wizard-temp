import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / "data" / "knowledge" / "public"
CAPTURED_AT = "2026-08-25T20:30:00.000Z"

BASE_LIMITATIONS = [
    "Public read-only observation captured at a point in time; not a representative sample.",
    "The source does not provide CPC, CPA, CVR, ROAS, reach, frequency, saturation, market share, or competitor campaign performance.",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def raw_input(relative_path: str) -> dict[str, str]:
    path = ROOT / relative_path
    return {
        "path": relative_path,
        "sha256": sha256(path),
        "capturedAt": CAPTURED_AT,
    }


def observation(
    observation_id: str,
    source_id: str,
    source_url: str,
    *,
    market: str | None = None,
    industry_relevance: str | None = None,
    metric: str,
    value: Any,
    unit: str | None = None,
    period: str | None = None,
    source_date: str | None = None,
    limitations: list[str] | None = None,
    **extra: Any,
) -> dict[str, Any]:
    item: dict[str, Any] = {
        "observationId": observation_id,
        "sourceId": source_id,
        "metric": metric,
        "value": value,
        "status": "observed",
        "capturedAt": CAPTURED_AT,
        "sourceUrl": source_url,
        "limitations": limitations or BASE_LIMITATIONS,
    }
    if market is not None:
        item["market"] = market
    if industry_relevance is not None:
        item["industryRelevance"] = industry_relevance
    if unit is not None:
        item["unit"] = unit
    if period is not None:
        item["period"] = period
    if source_date is not None:
        item["sourceDate"] = source_date
    item.update(extra)
    return item


def unavailable_observation(
    observation_id: str,
    source_id: str,
    source_url: str,
    *,
    market: str,
    metric: str,
    reason: str,
) -> dict[str, Any]:
    return {
        "observationId": observation_id,
        "sourceId": source_id,
        "market": market,
        "metric": metric,
        "value": None,
        "status": "unavailable",
        "capturedAt": CAPTURED_AT,
        "sourceUrl": source_url,
        "unavailableReason": reason,
        "limitations": [
            "The public product request returned a CAPTCHA/interstitial and was not bypassed.",
            "No price, rating, seller, stock, or product-performance value was inferred.",
        ],
    }


def write_artifact(relative_path: str, payload: dict[str, Any]) -> None:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_payment_context() -> None:
    cbe_url = "https://www.cbe.org.eg/en/payment-systems-and-services"
    write_artifact(
        "data/knowledge/public/cbe/2026-08-25/normalized-payment-system-observation.json",
        {
            "contractVersion": "1.0",
            "artifactType": "public_egypt_payment_system_context",
            "artifactId": "cbe-payment-system-eg-20260825",
            "generatedAt": CAPTURED_AT,
            "sourceId": "src-cbe-payment-system-eg-20260825",
            "sourceUrl": cbe_url,
            "licenseStatus": "unknown",
            "rawInput": raw_input("data/knowledge/public/cbe/2026-08-25/browser-capture.md"),
            "observations": [
                observation(
                    "cbe-eg-national-payment-system-components-2026",
                    "src-cbe-payment-system-eg-20260825",
                    cbe_url,
                    market="EG",
                    industry_relevance="ecommerce_general",
                    metric="national_payment_system_components",
                    value="RTGS, government-securities book-entry, Cheques Clearing House, National Switch/ATM, Automated Clearing House, central securities depository, internet/mobile/phone banking, government payments and bill payments",
                    unit="qualitative_system_description",
                    source_date="2026-07-08",
                    limitations=[
                        "Qualitative CBE institutional and payment-system context; no numerical payment series was visible on the captured page.",
                        "The browser-rendered page was accessible, while the text extractor returned an official server rejection; reproducibility is therefore limited.",
                        "This observation is not ecommerce sales, audience, demand, conversion, advertising, or competitor-performance evidence.",
                    ],
                ),
                observation(
                    "cbe-eg-electronic-payment-policy-objectives-2026",
                    "src-cbe-payment-system-eg-20260825",
                    cbe_url,
                    market="EG",
                    industry_relevance="ecommerce_general",
                    metric="electronic_payment_policy_objectives",
                    value="Develop payment systems, promote electronic payments, interoperability, standards, consumer protection, controlled risk, and competitive market conditions",
                    unit="qualitative_policy_context",
                    source_date="2026-07-08",
                    limitations=[
                        "Institutional policy context only; it does not establish adoption rate, ecommerce GMV, market share, or advertising outcomes.",
                        "The browser-rendered page was accessible, while the text extractor returned an official server rejection.",
                    ],
                ),
            ],
            "unknowns": [
                "No current CBE numerical ecommerce/payment series was captured from this page.",
                "No industry-specific demand, audience, conversion, or advertising-performance metric is supplied.",
            ],
            "limitations": [
                "CBE page is a qualitative institutional/payment-system source in this batch.",
                "No protected endpoint or server rejection was bypassed.",
            ],
        },
    )

    sama_news_url = "https://www.sama.gov.sa/en-US/MediaCenter/News/pages/news-1139.aspx"
    write_artifact(
        "data/knowledge/public/sama/2026-08-25/normalized-payment-context.json",
        {
            "contractVersion": "1.0",
            "artifactType": "public_saudi_payment_context",
            "artifactId": "sama-national-payment-context-sa-20260825",
            "generatedAt": CAPTURED_AT,
            "sourceId": "src-sama-national-payment-news1139-sa-20260825",
            "sourceUrl": sama_news_url,
            "licenseStatus": "unknown",
            "rawInput": raw_input("data/knowledge/public/sama/2026-08-25/news-1139-browser-capture.md"),
            "observations": [
                observation(
                    "sama-sa-electronic-retail-payment-share-2025",
                    "src-sama-national-payment-news1139-sa-20260825",
                    sama_news_url,
                    market="SA",
                    industry_relevance="ecommerce_general",
                    metric="electronic_retail_payment_share",
                    value=85,
                    unit="percent_of_total_retail_payments",
                    period="2025",
                    source_date="2026-04-12",
                    limitations=[
                        "Official national total-retail payment context, not ecommerce-only GMV or product demand.",
                        "The page does not provide audience size, attribution, CPC, CPA, CVR, ROAS, reach, frequency, saturation, or competitor performance.",
                    ],
                ),
                observation(
                    "sama-sa-electronic-retail-payment-share-2024",
                    "src-sama-national-payment-news1139-sa-20260825",
                    sama_news_url,
                    market="SA",
                    industry_relevance="ecommerce_general",
                    metric="electronic_retail_payment_share",
                    value=79,
                    unit="percent_of_total_retail_payments",
                    period="2024",
                    source_date="2026-04-12",
                    limitations=[
                        "Official national total-retail payment context, not ecommerce-only GMV or product demand.",
                        "The page does not provide advertising performance or customer-level attribution.",
                    ],
                ),
                observation(
                    "sama-sa-electronic-transaction-count-2025",
                    "src-sama-national-payment-news1139-sa-20260825",
                    sama_news_url,
                    market="SA",
                    industry_relevance="ecommerce_general",
                    metric="electronic_transaction_count",
                    value=14.6,
                    unit="billion_transactions",
                    period="2025",
                    source_date="2026-04-12",
                    limitations=[
                        "National electronic transaction count across the payment ecosystem; not online retail orders or ad-attributed conversions.",
                        "The page does not provide industry, product, audience, or campaign breakdowns.",
                    ],
                ),
                observation(
                    "sama-sa-electronic-transaction-count-2024",
                    "src-sama-national-payment-news1139-sa-20260825",
                    sama_news_url,
                    market="SA",
                    industry_relevance="ecommerce_general",
                    metric="electronic_transaction_count",
                    value=12.6,
                    unit="billion_transactions",
                    period="2024",
                    source_date="2026-04-12",
                    limitations=[
                        "National electronic transaction count across the payment ecosystem; not online retail orders or ad-attributed conversions.",
                        "The page does not provide industry, product, audience, or campaign breakdowns.",
                    ],
                ),
                observation(
                    "sama-sa-payment-systems-mada-pos-ecommerce-context-2025",
                    "src-sama-national-payment-news1139-sa-20260825",
                    sama_news_url,
                    market="SA",
                    industry_relevance="ecommerce_general",
                    metric="payment_system_scope",
                    value="mada, POS and ecommerce payments were cited as parts of growth in national payment systems",
                    unit="qualitative_payment_context",
                    period="2025",
                    source_date="2026-04-12",
                    limitations=[
                        "Qualitative scope statement; no channel-level share or ecommerce-only value is supplied.",
                        "Not a marketing or competitor-performance benchmark.",
                    ],
                ),
            ],
            "unknowns": [
                "The source does not disaggregate the national figures into ecommerce-only payments.",
                "No product category, city, audience, customer, or advertising attribution is supplied.",
            ],
            "limitations": [
                "SAMA national payment facts are retained as limited external market context only.",
                "Values are copied as stated by SAMA; no forecast or derived rate was added.",
            ],
        },
    )

    interface_url = "https://sama.gov.sa/en-US/MediaCenter/News/pages/news-1095.aspx"
    write_artifact(
        "data/knowledge/public/sama/2026-08-25/normalized-ecommerce-interface-observation.json",
        {
            "contractVersion": "1.0",
            "artifactType": "public_saudi_ecommerce_payment_interface_context",
            "artifactId": "sama-ecommerce-interface-sa-20260825",
            "generatedAt": CAPTURED_AT,
            "sourceId": "src-sama-ecommerce-interface-news1095-sa-20260825",
            "sourceUrl": interface_url,
            "licenseStatus": "unknown",
            "rawInput": raw_input("data/knowledge/public/sama/2026-08-25/payment-interface-and-pos-browser-capture.md"),
            "observations": [
                observation(
                    "sama-sa-ecommerce-payment-interface-2025",
                    "src-sama-ecommerce-interface-news1095-sa-20260825",
                    interface_url,
                    market="SA",
                    industry_relevance="ecommerce_general",
                    metric="ecommerce_payment_interface_features",
                    value="mada integration with global payment networks, unified technical specifications, centralized registration, financing solutions, and card tokenization",
                    unit="qualitative_infrastructure_context",
                    period="2025",
                    source_date="2025-07-07",
                    limitations=[
                        "Official payment-infrastructure description; not ecommerce sales, demand, audience, conversion, or advertising-performance evidence.",
                        "No adoption count or channel-level outcome is inferred from the interface description.",
                    ],
                ),
            ],
            "unknowns": ["No numeric adoption or ecommerce sales series was exposed by this page."],
            "limitations": ["Payment infrastructure context only; license terms were not explicit on the captured page."],
        },
    )

    pos_url = "https://www.sama.gov.sa/en-US/Statistics/Indices/Pages/POS.aspx"
    write_artifact(
        "data/knowledge/public/sama/2026-08-25/normalized-weekly-pos-page-observation.json",
        {
            "contractVersion": "1.0",
            "artifactType": "public_saudi_weekly_pos_reporting_context",
            "artifactId": "sama-weekly-pos-page-sa-20260825",
            "generatedAt": CAPTURED_AT,
            "sourceId": "src-sama-weekly-pos-page-sa-20260825",
            "sourceUrl": pos_url,
            "licenseStatus": "unknown",
            "rawInput": raw_input("data/knowledge/public/sama/2026-08-25/payment-interface-and-pos-browser-capture.md"),
            "observations": [
                observation(
                    "sama-sa-weekly-pos-report-availability",
                    "src-sama-weekly-pos-page-sa-20260825",
                    pos_url,
                    market="SA",
                    industry_relevance="ecommerce_general",
                    metric="weekly_pos_reporting_dimensions",
                    value="transaction count, transaction value, and weekly percentage changes by business activity and city",
                    unit="qualitative_reporting_scope",
                    limitations=[
                        "The public page describes the report dimensions but the captured text did not expose a downloadable numerical table.",
                        "No numerical row was inferred; this is not ecommerce-only demand or advertising performance.",
                    ],
                ),
            ],
            "unknowns": ["No numeric POS row was captured from this page in this batch."],
            "limitations": ["Report-availability context only; existing KAPSARC/SAMA public exports remain the numeric POS artifacts."],
        },
    )

    mped_url = "https://mped.gov.eg/Analytics?lang=en"
    write_artifact(
        "data/knowledge/public/egypt-public/2026-08-25/normalized-national-accounts-discovery.json",
        {
            "contractVersion": "1.0",
            "artifactType": "public_egypt_national_accounts_discovery",
            "artifactId": "mped-national-accounts-discovery-eg-20260825",
            "generatedAt": CAPTURED_AT,
            "sourceId": "src-mped-national-accounts-eg-20260825",
            "sourceUrl": mped_url,
            "licenseStatus": "unknown",
            "rawInput": raw_input("data/knowledge/public/egypt-public/2026-08-25/ministry-and-nafeza-browser-capture.md"),
            "observations": [
                observation(
                    "mped-eg-national-accounts-dataset-availability",
                    "src-mped-national-accounts-eg-20260825",
                    mped_url,
                    market="EG",
                    metric="national_accounts_dataset_scope",
                    value="annual and quarterly GDP by expenditure elements and economic activities, GDP and investment growth rates, and regional accounts by economic region and governorate",
                    unit="qualitative_dataset_discovery",
                    limitations=[
                        "The public discovery page was read successfully, but linked interactive tables were not copied into this batch.",
                        "This supports macroeconomic and regional context only, not ecommerce demand, audience, or campaign performance.",
                    ],
                ),
            ],
            "unknowns": ["No numeric national-accounts row was captured from the interactive linked tables in this batch."],
            "limitations": ["Dataset discovery/context only; no substitution from third-party portals."],
        },
    )

    nafeza_url = "https://sandbox.nafeza.gov.eg/ar/currencies"
    write_artifact(
        "data/knowledge/public/egypt-public/2026-08-25/normalized-customs-fx-context.json",
        {
            "contractVersion": "1.0",
            "artifactType": "public_egypt_customs_fx_context",
            "artifactId": "nafeza-customs-fx-eg-20260825",
            "generatedAt": CAPTURED_AT,
            "sourceId": "src-nafeza-customs-fx-eg-20260825",
            "sourceUrl": nafeza_url,
            "licenseStatus": "unknown",
            "rawInput": raw_input("data/knowledge/public/egypt-public/2026-08-25/ministry-and-nafeza-browser-capture.md"),
            "observations": [
                observation(
                    "nafeza-eg-usd-egp-customs-rate-2026-02-24",
                    "src-nafeza-customs-fx-eg-20260825",
                    nafeza_url,
                    market="EG",
                    metric="customs_conversion_rate_usd_egp",
                    value=47.88,
                    unit="EGP_per_USD",
                    period="2026-02-24",
                    source_date="2026-02-24",
                    limitations=[
                        "Egyptian Customs conversion rate displayed by Nafeza for the stated date; not a consumer market-price or advertising benchmark.",
                        "Use only for explicit currency normalization while preserving the source date and source label.",
                    ],
                ),
                observation(
                    "nafeza-eg-sar-egp-customs-rate-2026-02-24",
                    "src-nafeza-customs-fx-eg-20260825",
                    nafeza_url,
                    market="EG",
                    metric="customs_conversion_rate_sar_egp",
                    value=12.7646,
                    unit="EGP_per_SAR",
                    period="2026-02-24",
                    source_date="2026-02-24",
                    limitations=[
                        "Egyptian Customs conversion rate displayed by Nafeza for the stated date; not a consumer market-price or advertising benchmark.",
                        "Use only for explicit currency normalization while preserving the source date and source label.",
                    ],
                ),
            ],
            "unknowns": ["No product pricing, sales, demand, or market-share metric is provided."],
            "limitations": ["Customs FX context only; do not use as a current consumer exchange-rate forecast."],
        },
    )


def product_offer(
    observation_id: str,
    source_id: str,
    page_url: str,
    market: str,
    platform: str,
    product_name: str,
    *,
    current_price: float | None = None,
    currency: str | None = None,
    list_price: float | None = None,
    discount_percent: float | None = None,
    rating_value: float | None = None,
    review_count: int | None = None,
    seller: str | None = None,
    fulfillment: str | None = None,
    availability: str | None = None,
    delivery_context: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    item = {
        "observationId": observation_id,
        "sourceId": source_id,
        "market": market,
        "marketScope": "market_page_observation",
        "platform": platform,
        "industryRelevance": "ecommerce_general",
        "observationType": "product_offer",
        "status": "observed",
        "pageUrl": page_url,
        "capturedAt": CAPTURED_AT,
        "product": {"name": product_name},
        "limitations": [
            "Single public product-page snapshot; not a representative market sample or average price.",
            "Visible price, rating, review count, seller, fulfillment, stock, and merchandising claims can change over time.",
            "No sales volume, market share, demand, conversion, CPC, CPA, CVR, ROAS, reach, frequency, saturation, or competitor campaign performance is inferred.",
        ],
    }
    if current_price is not None:
        item["price"] = {"current": current_price, "currency": currency, **({"list": list_price} if list_price is not None else {}), **({"discountPercent": discount_percent} if discount_percent is not None else {})}
    if rating_value is not None or review_count is not None:
        item["rating"] = {key: value for key, value in {"value": rating_value, "reviewCount": review_count}.items() if value is not None}
    for key, value in {"seller": seller, "fulfillment": fulfillment, "availability": availability, "deliveryContext": delivery_context}.items():
        if value is not None:
            item[key] = value
    if extra:
        item.update(extra)
    return item


def build_marketplace_context() -> None:
    noon_eg_category = "https://www.noon.com/egypt-en/electronics-and-mobiles/mobiles-and-accessories/mobiles-20905/"
    noon_eg_product = "https://www.noon.com/egypt-en/galaxy-a17-dual-sim-4g-black-4gb-ram-128gb-middle-east-version/N70214276V/p/?o=b93223709b1aab3c"
    noon_sa_category = "https://www.noon.com/saudi-en/electronics-and-mobiles/mobiles-and-accessories/mobiles-20905/"
    noon_sa_product = "https://www.noon.com/saudi-en/galaxy-s25-ultra-dual-sim-titanium-black-12gb-ram-256gb-5g-international-version/N70142933V/p/"
    amazon_eg_home = "https://www.amazon.eg/-/en/"
    amazon_eg_product = "https://www.amazon.eg/-/en/Silver-Crest-Performance-Convection-DR-8803S/dp/B0C1ZJJ1XG"
    amazon_sa_product = "https://www.amazon.sa/-/en/Anker-2-Pack-Premium-Charger-Samsung/dp/B07DC5PPFV/"
    observations: list[dict[str, Any]] = [
        {
            "observationId": "noon-eg-mobile-category-structure-20260825",
            "sourceId": "src-noon-eg-mobile-category-20260825",
            "market": "EG",
            "marketScope": "market_page_observation",
            "platform": "Noon",
            "industryRelevance": "ecommerce_general",
            "observationType": "category_structure",
            "status": "observed",
            "pageUrl": noon_eg_category,
            "capturedAt": CAPTURED_AT,
            "categories": ["mobile phones", "electronics and mobiles"],
            "visibleBrands": ["Samsung", "Apple", "Xiaomi", "HUAWEI", "Motorola", "OnePlus", "Google", "Lenovo"],
            "visibleSellerExamples": ["noon", "Yalla Tager", "Dr.Mobile", "almustaqbal for trade", "Radio Talaat", "Arab Crown for Mobile Phone Trading", "Ehab Group", "iQ"],
            "visibleFilters": ["brand", "price", "rating", "product status", "network", "memory", "RAM", "display", "battery", "camera", "operating system", "seller"],
            "limitations": [
                "Category-page structure and visible examples only; stable product cards with prices and ratings were not exposed in the captured text.",
                "Not a representative assortment, demand, market-share, or competitor-performance sample.",
            ],
        },
        product_offer(
            "noon-eg-galaxy-a17-offer-20260825",
            "src-noon-eg-galaxy-a17-product-20260825",
            noon_eg_product,
            "EG",
            "Noon",
            "Galaxy A17 Dual SIM 4G Black 4GB RAM 128GB - Middle East Version",
            current_price=10315.00,
            currency="EGP",
            rating_value=4.5,
            review_count=2652,
            seller="iQ",
            fulfillment="noon-express",
            availability="only 1 left in stock",
            delivery_context="page displayed expected delivery 27 Aug",
            extra={"rank": "#44 in Smartphones", "badge": "Best Seller in Smartphones", "sellerRating": 4.6, "sellerPositivePercent": 82, "sellerItemAsShownPercent": 90},
        ),
        {
            "observationId": "noon-sa-mobile-category-structure-20260825",
            "sourceId": "src-noon-sa-mobile-category-20260825",
            "market": "SA",
            "marketScope": "market_page_observation",
            "platform": "Noon",
            "industryRelevance": "ecommerce_general",
            "observationType": "category_structure",
            "status": "observed",
            "pageUrl": noon_sa_category,
            "capturedAt": CAPTURED_AT,
            "categories": ["mobile phones", "electronics and mobiles"],
            "visibleHomepageTaxonomy": ["mobiles", "laptops/desktops", "beauty", "fashion", "appliances", "health & nutrition", "headphones", "wearables", "grocery", "sports", "gaming", "baby", "toys", "stationery", "home & kitchen", "furniture"],
            "visibleMerchandisingSections": ["deals", "bestsellers", "highly-rated"],
            "limitations": [
                "The category extraction returned only a footer and no stable product cards; the taxonomy observation is retained from the public Saudi navigation/homepage context.",
                "Not a representative assortment, demand, market-share, or competitor-performance sample.",
            ],
        },
        product_offer(
            "noon-sa-galaxy-s25-ultra-offer-20260825",
            "src-noon-sa-galaxy-s25-product-20260825",
            noon_sa_product,
            "SA",
            "Noon",
            "Samsung Galaxy S25 Ultra Dual SIM Titanium Black 12GB RAM 256GB 5G - International Version",
            current_price=3298.95,
            currency="SAR",
            list_price=3559.00,
            discount_percent=7,
            rating_value=4.5,
            review_count=6830,
            seller="H Store",
            fulfillment="noon-express",
            availability="only 2 left in stock",
            delivery_context="Riyadh context; page displayed expected delivery 3 Dec",
            extra={"freeDelivery": True, "sellerRating": 4.3, "sellerPositivePercent": 88, "sellerItemAsShownPercent": 90, "sellerPartnerSince": "3+ years", "visibleOffers": ["15% cashback", "extra 25% off coupon", "extra 20% off coupon"]},
        ),
        {
            "observationId": "amazon-eg-homepage-price-bands-20260825",
            "sourceId": "src-amazon-eg-homepage-20260825",
            "market": "EG",
            "marketScope": "market_page_observation",
            "platform": "Amazon",
            "industryRelevance": "ecommerce_general",
            "observationType": "merchandising_price_bands",
            "status": "observed",
            "pageUrl": amazon_eg_home,
            "capturedAt": CAPTURED_AT,
            "visibleCategories": ["Electronics", "Fashion", "Computers", "Home & Garden", "Grocery", "Health/Household/Baby Care", "Books", "Toys & Games", "Sports", "Automotive", "Office Products"],
            "priceBands": ["below EGP 199", "below EGP 499", "from EGP 500", "from EGP 999"],
            "merchandisingExample": "mattresses from EGP 935",
            "limitations": [
                "Displayed homepage merchandising bands only; not average prices, product-level market prices, demand, sales, or market share.",
                "Bands can change with page personalization and time.",
            ],
        },
        unavailable_observation(
            "amazon-eg-product-captcha-unavailable-20260825",
            "src-amazon-eg-product-captcha-20260825",
            amazon_eg_product,
            market="EG",
            metric="product_offer_snapshot",
            reason="The public product request returned a CAPTCHA/interstitial. The interstitial was not bypassed and no further automated retries were made.",
        ),
        product_offer(
            "amazon-sa-anker-usb-cable-offer-20260825",
            "src-amazon-sa-anker-product-20260825",
            amazon_sa_product,
            "SA",
            "Amazon",
            "Anker USB C Cable, 2-pack, 6ft, USB-A to USB-C, Black",
            current_price=38.90,
            currency="SAR",
            list_price=59.00,
            discount_percent=34,
            rating_value=4.5,
            review_count=106328,
            seller="AnkerDirect SA",
            fulfillment="Fulfilled by Amazon",
            availability="In Stock",
            delivery_context="Riyadh context; page displayed Thursday, 27 August",
            extra={"visibleBadges": ["Back to School Deal", "Amazon's Choice"], "pageClaim": "300+ bought in past month", "pageClaimStatus": "unverified_page_claim"},
        ),
    ]
    recommendations = [
        ("amazon-sa-recommendation-ugreen-1m-24", "UGREEN Type C Cable 1M 2-pack", 24.00, 38, 4.6, 3869),
        ("amazon-sa-recommendation-anker-zolo-2890", "Anker Zolo USB-to-USB-C Cable", 28.90, 41, 4.6, 1587),
        ("amazon-sa-recommendation-anker-c-to-c-3890", "Anker USB C to USB C Cable 1.8m 2-pack", 38.90, 34, 4.6, 68503),
        ("amazon-sa-recommendation-ugreen-1m-2700", "UGREEN Type C Cable 1M 2-pack", 27.00, 51, 4.4, 7783),
    ]
    for rec_id, name, price, discount, rating, reviews in recommendations:
        observations.append({
            "observationId": rec_id,
            "sourceId": "src-amazon-sa-anker-product-20260825",
            "market": "SA",
            "marketScope": "market_page_observation",
            "platform": "Amazon",
            "industryRelevance": "ecommerce_general",
            "observationType": "recommendation_card",
            "status": "observed",
            "pageUrl": amazon_sa_product,
            "capturedAt": CAPTURED_AT,
            "product": {"name": name},
            "price": {"current": price, "currency": "SAR", "discountPercent": discount},
            "rating": {"value": rating, "reviewCount": reviews},
            "limitations": [
                "Recommendation-card observation from one Amazon Saudi product page; not a representative market sample.",
                "No recommendation click, sale, conversion, market share, or competitor performance is inferred.",
            ],
        })
    write_artifact(
        "data/knowledge/public/marketplaces/2026-08-25/normalized-storefront-observations.json",
        {
            "contractVersion": "1.0",
            "artifactType": "public_marketplace_storefront_observations",
            "artifactId": "public-marketplace-storefront-observations-eg-sa-20260825",
            "generatedAt": CAPTURED_AT,
            "sourceId": "src-noon-eg-mobile-category-20260825",
            "sourceUrl": noon_eg_category,
            "licenseStatus": "unknown",
            "rawInput": raw_input("data/knowledge/public/marketplaces/2026-08-25/storefront-capture.md"),
            "observations": observations,
            "unknowns": [
                "No representative product sample or total marketplace demand series was collected.",
                "Amazon Egypt product-level data remained unavailable after CAPTCHA and was not bypassed.",
                "No sales volume, market share, customer-level demand, or advertising outcome is supplied.",
            ],
            "limitations": [
                "Marketplace pages are public library observations with unknown reuse license and on-demand freshness.",
                "Observed prices, ratings, reviews, stock, rankings, sellers, and merchandising cards are time-sensitive page values.",
                "No competitor performance or advertising benchmark is inferred from product pages.",
            ],
        },
    )


def build_app_store_context() -> None:
    observations = [
        {
            "observationId": "google-play-noon-en-us-metadata-20260825",
            "sourceId": "src-google-play-noon-en-us-20260825",
            "platform": "Google Play",
            "storeLocale": "en_US",
            "marketScope": "global_or_store_locale",
            "industryRelevance": "ecommerce_general",
            "observationType": "app_store_metadata",
            "status": "observed",
            "pageUrl": "https://play.google.com/store/apps/details?id=com.noon.buyerapp&hl=en_US",
            "capturedAt": CAPTURED_AT,
            "app": {"name": "noon Online Shopping & Grocery", "packageId": "com.noon.buyerapp"},
            "rating": {"value": 4.6, "headerReviewCountText": "1.16M", "ratingsSectionReviewCountText": "1.14M"},
            "downloadCountText": "50M+",
            "lastUpdateDisplayed": "2026-08-24",
            "descriptionScope": "The description mentioned UAE, KSA, and Egypt and shopping, food, grocery, payment, and delivery features.",
            "limitations": [
                "Google Play en_US page observation; not country-specific active users, installs, market share, or performance.",
                "Header and rating-section review counts are preserved separately and are not reconciled into a new metric.",
            ],
        },
        {
            "observationId": "google-play-amazon-en-us-metadata-20260825",
            "sourceId": "src-google-play-amazon-en-us-20260825",
            "platform": "Google Play",
            "storeLocale": "en_US",
            "marketScope": "global_or_store_locale",
            "industryRelevance": "ecommerce_general",
            "observationType": "app_store_metadata",
            "status": "observed",
            "pageUrl": "https://play.google.com/store/apps/details?id=com.amazon.mShop.android.shopping&hl=en_US",
            "capturedAt": CAPTURED_AT,
            "app": {"name": "Amazon Shopping", "packageId": "com.amazon.mShop.android.shopping"},
            "rating": {"value": 4.3, "headerReviewCountText": "4.67M", "ratingsSectionReviewCountText": "4.54M"},
            "downloadCountText": "1B+",
            "lastUpdateDisplayed": "2026-07-16",
            "descriptionScope": "The description covered browsing, search, review reading, shipment tracking, price-drop notifications, and visual search.",
            "limitations": [
                "Google Play en_US page observation; not country-specific active users, installs, market share, or performance.",
                "Header and rating-section review counts are preserved separately and are not reconciled into a new metric.",
            ],
        },
        {
            "observationId": "apple-store-noon-us-metadata-20260825",
            "sourceId": "src-apple-store-noon-us-20260825",
            "platform": "Apple App Store",
            "storeLocale": "US",
            "marketScope": "global_or_store_locale",
            "industryRelevance": "ecommerce_general",
            "observationType": "app_store_metadata",
            "status": "observed",
            "pageUrl": "https://apps.apple.com/us/app/noon-shopping-food-grocery/id1269038866",
            "capturedAt": CAPTURED_AT,
            "app": {"name": "noon Shopping, Food, Grocery", "appId": "1269038866"},
            "rating": {"value": 4.5, "ratingsCountText": "326K"},
            "category": "Shopping",
            "sizeMB": 299.6,
            "ageRating": "4+",
            "languagesDisplayed": "English plus one additional language",
            "versionDisplayed": "4.260824",
            "limitations": [
                "Apple App Store US page observation; not country-specific active users, installs, market share, or performance.",
                "Ratings are preserved as displayed and are not converted to a country-specific metric.",
            ],
        },
        {
            "observationId": "apple-store-amazon-us-metadata-20260825",
            "sourceId": "src-apple-store-amazon-us-20260825",
            "platform": "Apple App Store",
            "storeLocale": "US",
            "marketScope": "global_or_store_locale",
            "industryRelevance": "ecommerce_general",
            "observationType": "app_store_metadata",
            "status": "observed",
            "pageUrl": "https://apps.apple.com/us/app/amazon-shopping/id297606951",
            "capturedAt": CAPTURED_AT,
            "app": {"name": "Amazon Shopping", "appId": "297606951"},
            "rating": {"value": 4.8, "ratingsCountText": "8.4M"},
            "category": "Shopping",
            "sizeMB": 248.6,
            "ageRating": "13+",
            "languagesDisplayed": "English plus 24 languages",
            "versionDisplayed": "27.13.0; 7 August",
            "limitations": [
                "Apple App Store US page observation; not country-specific active users, installs, market share, or performance.",
                "Ratings are preserved as displayed and are not converted to a country-specific metric.",
            ],
        },
    ]
    write_artifact(
        "data/knowledge/public/app-stores/2026-08-25/normalized-app-store-observations.json",
        {
            "contractVersion": "1.0",
            "artifactType": "public_app_store_observations",
            "artifactId": "public-app-store-observations-global-locale-20260825",
            "generatedAt": CAPTURED_AT,
            "sourceId": "src-google-play-noon-en-us-20260825",
            "sourceUrl": "https://play.google.com/store/apps/details?id=com.noon.buyerapp&hl=en_US",
            "licenseStatus": "unknown",
            "rawInput": raw_input("data/knowledge/public/app-stores/2026-08-25/app-store-capture.md"),
            "observations": observations,
            "unknowns": [
                "Country-specific active users, installs, revenue, retention, conversion, and market share are unavailable from these store pages.",
                "Review text was not used as statistical evidence and no issue percentage was computed.",
            ],
            "limitations": [
                "Google Play and Apple App Store values are global or store-locale observations, not EG/SA market facts.",
                "Header/detail review-count differences are retained exactly as displayed.",
            ],
        },
    )


def main() -> None:
    build_payment_context()
    build_marketplace_context()
    build_app_store_context()
    print(json.dumps({"status": "PASS", "message": "Public payment, marketplace, and app-store artifacts rebuilt deterministically."}, ensure_ascii=False))


if __name__ == "__main__":
    main()
