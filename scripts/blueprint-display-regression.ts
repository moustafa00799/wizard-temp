import assert from "node:assert/strict";
import {
  displayFieldLabel,
  displaySource,
  displayStatus,
  displayUnavailableReason,
  displayValue,
  isUnavailableValue,
} from "../src/lib/blueprint-display";

assert.equal(displayValue("education_funnel"), "مسار تعليمي");
assert.equal(displayValue("qualified_lead_rate"), "معدل العملاء المحتملين المؤهلين");
assert.equal(displayValue("unavailable: no verified market benchmark source was supplied"), "غير متاح حاليًا");
assert.equal(displayValue("function StatusPill({ status }) { return status; }"), "غير محدد");
assert.equal(displayValue("const x = jsxDEV('div')"), "غير محدد");
assert.equal(displayValue(() => "unsafe"), "غير محدد");
assert.equal(displayStatus("check_manually"), "يحتاج مراجعة يدوية");
assert.equal(displayStatus("unavailable"), "غير متاح حاليًا");
assert.equal(displayFieldLabel("weekly_projection"), "التوقع الأسبوعي للإنفاق");
assert.equal(displayFieldLabel("industry_average_cvr"), "متوسط CVR للقطاع");
assert.equal(displaySource("RF-019"), "قواعد CDKS");
assert.equal(displayUnavailableReason("unavailable: no verified competitor or market-saturation source was supplied"), "لا يوجد مصدر موثوق كافٍ لتقدير المنافسة أو تشبع السوق.");
assert.equal(isUnavailableValue("unavailable: reason"), true);
assert.equal(isUnavailableValue("available"), false);

console.log(JSON.stringify({
  status: "PASS",
  assertions: 14,
  unsafeRendererSource: "blocked",
  unavailableValues: "simplified",
  internalRuleIds: "redacted_for_client_view",
}));
