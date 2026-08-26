from __future__ import annotations

import csv
import hashlib
import json
import os
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import openpyxl

INPUT_ROOT = Path(os.environ.get("CDKS_EASY_ORDERS_INPUT_ROOT", ".local/private-research/easy-orders/inputs"))
OUTPUT_ROOT = Path(os.environ.get("CDKS_EASY_ORDERS_OUTPUT_ROOT", ".local/private-research/easy-orders/2026-08-27"))
OUTPUT_PATH = Path(os.environ.get("CDKS_EASY_ORDERS_NORMALIZED", str(OUTPUT_ROOT / "normalized-readonly-evidence.json")))
ORDERS_FILE = Path(os.environ.get("CDKS_EASY_ORDERS_ORDERS_FILE", str(INPUT_ROOT / "1787786902282136094-orders-2026-08-26.xlsx")))
PRODUCTS_FILE = INPUT_ROOT / "products-export-2026-08-26.json"
CATEGORIES_FILE = INPUT_ROOT / "categories.csv"
REVIEWS_FILE = INPUT_ROOT / "reviews.csv"
CAPTURED_AT = os.environ.get("CDKS_EASY_ORDERS_CAPTURED_AT", "2026-08-27T00:00:00.000Z")

# These are owner-provided aggregate outcome rates. They are not assigned to
# individual order IDs because the export has no row-level delivery/payment state.
OWNER_DELIVERED_COLLECTED_RATE = Decimal("0.65")
OWNER_RETURNED_RATE = Decimal("0.12")
OWNER_UNRESOLVED_RATE = Decimal("0.23")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def nonempty(value: Any) -> bool:
    return value is not None and str(value).strip() not in {"", "[]", "{}", "null", "None"}


def decimal_value(value: Any) -> Decimal | None:
    if not nonempty(value):
        return None
    try:
        return Decimal(str(value).strip().replace(",", ""))
    except InvalidOperation:
        return None


def parse_date(value: Any) -> datetime | None:
    if not nonempty(value):
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    for fmt in (
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y",
    ):
        try:
            return datetime.strptime(text[:26], fmt)
        except ValueError:
            pass
    return None


def date_range(values: list[Any]) -> dict[str, str] | None:
    parsed = [value for value in (parse_date(item) for item in values) if value]
    if not parsed:
        return None
    return {"min": min(parsed).isoformat(), "max": max(parsed).isoformat()}


def file_descriptor(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Missing Easy Orders input: {path}")
    return {"file": path.name, "sha256": sha256(path), "sizeBytes": path.stat().st_size}


def read_orders() -> tuple[dict[str, Any], dict[str, Any]]:
    workbook = openpyxl.load_workbook(ORDERS_FILE, read_only=True, data_only=True)
    if not workbook.worksheets:
        raise ValueError("Orders workbook has no worksheets")
    worksheet = workbook.worksheets[0]
    values = list(worksheet.iter_rows(values_only=True))
    headers = [str(value).strip() if value is not None else "" for value in (values[0] if values else [])]
    rows = [list(row) for row in values[1:]]
    index = {name: position for position, name in enumerate(headers)}

    def get(row: list[Any], name: str) -> Any:
        position = index.get(name)
        return row[position] if position is not None and position < len(row) else None

    def distinct(name: str) -> int:
        return len({str(get(row, name)).strip() for row in rows if nonempty(get(row, name))})

    def counts(name: str) -> dict[str, int]:
        return dict(Counter(str(get(row, name)).strip() for row in rows if nonempty(get(row, name))))

    def sum_decimal(name: str) -> str:
        total = Decimal("0")
        for row in rows:
            value = decimal_value(get(row, name))
            if value is not None:
                total += value
        return str(total)

    order_ids = [str(get(row, "ID")).strip() for row in rows if nonempty(get(row, "ID"))]
    long_order_ids = [str(get(row, "Order ID")).strip() for row in rows if nonempty(get(row, "Order ID"))]
    created = [get(row, "CreatedAt") for row in rows]
    utm_source_count = sum(1 for row in rows if nonempty(get(row, "Utm Source")))
    utm_campaign_count = sum(1 for row in rows if nonempty(get(row, "Utm Campaign")))
    sensitive_columns = [
        name for name in headers
        if any(token in name.lower().replace("_", "") for token in ("fullname", "phone", "altphone", "address", "note", "email", "customer"))
    ]

    order_summary = {
        "entity": "orders",
        "file": ORDERS_FILE.name,
        "sheet": worksheet.title,
        "columns": headers,
        "rowCount": len(rows),
        "uniqueOrderIdCount": len(set(order_ids)),
        "duplicateOrderIdCount": len(order_ids) - len(set(order_ids)),
        "uniqueLongOrderIdCount": len(set(long_order_ids)),
        "uniqueProductNameCount": distinct("Product Name"),
        "uniqueSkuCount": distinct("SKU"),
        "uniqueCityCount": distinct("City"),
        "createdAtRange": date_range(created),
        "statusCounts": counts("Status"),
        "paymentMethodCounts": counts("Payment Method"),
        "paymentStatusCounts": counts("Payment Status"),
        "totalsEgp": {
            "recordedOrderValue": sum_decimal("Total Cost"),
            "productCost": sum_decimal("Product Cost"),
            "shippingCost": sum_decimal("Shipping Cost"),
            "couponDiscount": sum_decimal("Coupon Discount"),
        },
        "lineItemFieldPresence": {
            "productName": sum(1 for row in rows if nonempty(get(row, "Product Name"))),
            "variant": sum(1 for row in rows if nonempty(get(row, "Variant"))),
            "sku": sum(1 for row in rows if nonempty(get(row, "SKU"))),
            "quantity": sum(1 for row in rows if nonempty(get(row, "Quantity"))),
            "itemPrice": sum(1 for row in rows if nonempty(get(row, "Item Price"))),
        },
        "attribution": {
            "utmSourcePresentCount": utm_source_count,
            "utmCampaignPresentCount": utm_campaign_count,
            "funnelIdPresentCount": sum(1 for row in rows if nonempty(get(row, "Funnel ID"))),
            "referralCodePresentCount": sum(1 for row in rows if nonempty(get(row, "Referral Code"))),
            "clickIdFieldsPresent": False,
        },
        "sensitiveColumnsDetected": sensitive_columns,
        "unsupportedOrMissing": {
            "currencyColumn": False,
            "refundColumn": False,
            "rowLevelDeliveryOrCollectionColumn": False,
            "rowLevelPaymentStatusValues": False,
            "rowLevelAdClickId": False,
        },
        "ownerReportedOutcomeRates": {
            "deliveredCollected": str(OWNER_DELIVERED_COLLECTED_RATE),
            "returned": str(OWNER_RETURNED_RATE),
            "unresolvedOrNotAccepted": str(OWNER_UNRESOLVED_RATE),
            "basis": "owner_statement_2026-08-27",
            "rowLevelAssignment": False,
        },
        "privacy": {
            "rawRowsOmitted": True,
            "customerIdentityOmitted": True,
            "freeTextOmitted": True,
            "paymentReferencesOmitted": True,
        },
    }
    if order_summary["rowCount"] != order_summary["uniqueOrderIdCount"]:
        raise ValueError("Order IDs are not unique; stop before merge")
    if OWNER_DELIVERED_COLLECTED_RATE + OWNER_RETURNED_RATE + OWNER_UNRESOLVED_RATE != Decimal("1.00"):
        raise ValueError("Owner outcome rates must sum to 1.00")
    return order_summary, {"headers": headers}


def read_products() -> dict[str, Any]:
    data = json.loads(PRODUCTS_FILE.read_text(encoding="utf-8"))
    products = data if isinstance(data, list) else data.get("products", [])
    product_ids = [str(item.get("id")) for item in products if isinstance(item, dict) and nonempty(item.get("id"))]

    def collection(value: Any) -> list[Any]:
        if isinstance(value, list):
            return value
        if isinstance(value, dict):
            return [value]
        return []

    with_categories = sum(1 for item in products if isinstance(item, dict) and collection(item.get("categories")))
    with_parsed_categories = sum(1 for item in products if isinstance(item, dict) and collection(item.get("parsed_categories")))
    with_sku = sum(1 for item in products if isinstance(item, dict) and nonempty(item.get("sku")))
    variants = sum(len(collection(item.get("variants"))) for item in products if isinstance(item, dict))
    variations = sum(len(collection(item.get("variations"))) for item in products if isinstance(item, dict))
    return {
        "entity": "products",
        "file": PRODUCTS_FILE.name,
        "productCount": len(products),
        "uniqueProductIdCount": len(set(product_ids)),
        "duplicateProductIdCount": len(product_ids) - len(set(product_ids)),
        "productsWithOriginalCategorySignal": with_categories,
        "productsWithParsedCategorySignal": with_parsed_categories,
        "productsWithoutCategorySignal": len(products) - with_categories,
        "skuPresentCount": with_sku,
        "variantCount": variants,
        "variationCount": variations,
        "taxonomy": {
            "originalPreserved": True,
            "proposedClassification": "not_generated_in_this_pass",
            "reviewStatus": "review_required",
            "reason": "Owner reported that many product categories are inaccurate; no source category is overwritten.",
        },
        "productNamesAndDescriptionsOmitted": True,
    }


def read_categories() -> dict[str, Any]:
    with CATEGORIES_FILE.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    top_ids = {row.get("id") for row in rows if nonempty(row.get("id"))}
    child_ids = {row.get("children.id") for row in rows if nonempty(row.get("children.id"))}
    top_id_occurrences = [row.get("id") for row in rows if nonempty(row.get("id"))]
    child_id_occurrences = [row.get("children.id") for row in rows if nonempty(row.get("children.id"))]
    return {
        "entity": "categories",
        "file": CATEGORIES_FILE.name,
        "rowCount": len(rows),
        "topLevelCategoryIdCount": len(top_ids),
        "childCategoryIdCount": len(child_ids),
        "duplicateTopLevelIdCount": len(top_id_occurrences) - len(top_ids),
        "duplicateChildIdCount": len(child_id_occurrences) - len(child_ids),
        "categoryNamesOmitted": True,
        "taxonomyReviewRequired": True,
    }


def read_reviews() -> dict[str, Any]:
    with REVIEWS_FILE.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    review_ids = {row.get("id") for row in rows if nonempty(row.get("id"))}
    product_ids = {row.get("product_id") for row in rows if nonempty(row.get("product_id"))}
    ratings = Counter(row.get("rating") for row in rows if nonempty(row.get("rating")))
    accepted = Counter(row.get("is_accepted") for row in rows if nonempty(row.get("is_accepted")))
    return {
        "entity": "reviews",
        "file": REVIEWS_FILE.name,
        "rowCount": len(rows),
        "uniqueReviewIdCount": len(review_ids),
        "uniqueProductIdCount": len(product_ids),
        "ratingCounts": dict(ratings),
        "acceptedCounts": dict(accepted),
        "commentsPresentCount": sum(1 for row in rows if nonempty(row.get("comment"))),
        "customerNamesPresentCount": sum(1 for row in rows if nonempty(row.get("user_name"))),
        "reviewTextOmitted": True,
        "customerIdentityOmitted": True,
    }


for required in (ORDERS_FILE, PRODUCTS_FILE, CATEGORIES_FILE, REVIEWS_FILE):
    if not required.exists():
        raise FileNotFoundError(f"Missing Easy Orders input: {required}")

orders, _ = read_orders()
products = read_products()
categories = read_categories()
reviews = read_reviews()

normalized = {
    "contractVersion": "1.0",
    "provider": "easy_orders",
    "authorizationScope": "user_provided_export",
    "generatedAt": CAPTURED_AT,
    "market": "EG",
    "industry": "ecommerce_general",
    "locale": "ar",
    "currency": "EGP",
    "scopeStatus": "market_currency_confirmed_industry_taxonomy_review_required",
    "marketValidated": False,
    "orders": orders,
    "products": products,
    "categories": categories,
    "reviews": reviews,
    "sources": [
        file_descriptor(ORDERS_FILE),
        file_descriptor(PRODUCTS_FILE),
        file_descriptor(CATEGORIES_FILE),
        file_descriptor(REVIEWS_FILE),
    ],
    "limitations": [
        "The export has no row-level delivery, collection, payment, refund, or return status.",
        "The 65% delivered-and-collected and 12% returned rates are owner-provided aggregate statements and are not assigned to order IDs.",
        "Recorded Total Cost is not realized revenue until row-level payment/delivery/refund linkage is available.",
        "Product taxonomy is retained as supplied and requires review; no original category is overwritten.",
        "UTM source/campaign coverage is partial and no click ID field was populated in the export.",
        "No currency column was present; EGP is used only because the owner explicitly confirmed the store currency.",
    ],
    "privacy": {
        "rawRowsOmitted": True,
        "rawProviderPayloadsOmitted": True,
        "customerNamesPhonesAddressesOmitted": True,
        "reviewTextAndProductTextOmitted": True,
        "credentialsOmitted": True,
    },
}
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH.write_text(json.dumps(normalized, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({
    "output": str(OUTPUT_PATH),
    "sha256": sha256(OUTPUT_PATH),
    "market": normalized["market"],
    "currency": normalized["currency"],
    "orders": {"rowCount": orders["rowCount"], "uniqueOrderIdCount": orders["uniqueOrderIdCount"], "statusCounts": orders["statusCounts"]},
    "ownerReportedOutcomeRates": orders["ownerReportedOutcomeRates"],
    "products": {"count": products["productCount"], "withoutCategorySignal": products["productsWithoutCategorySignal"]},
    "categories": {"rowCount": categories["rowCount"]},
    "reviews": {"rowCount": reviews["rowCount"], "uniqueProductIdCount": reviews["uniqueProductIdCount"]},
    "rawRowsOmitted": True,
}, ensure_ascii=False, indent=2))
