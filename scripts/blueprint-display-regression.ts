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
assert.equal(displayStatus("draft"), "مسودة");
assert.equal(displayStatus("approved"), "معتمد بشريًا");
assert.equal(displayStatus("rejected"), "مرفوض ويحتاج مراجعة");
assert.equal(displayStatus("locked"), "مقفل");
assert.equal(displayFieldLabel("weekly_projection"), "التوقع الأسبوعي للإنفاق");
assert.equal(displayFieldLabel("industry_average_cvr"), "متوسط CVR للقطاع");
assert.equal(displaySource("RF-019"), "قواعد CDKS");
assert.equal(displayUnavailableReason("unavailable: no verified competitor or market-saturation source was supplied"), "لا يوجد مصدر موثوق كافٍ لتقدير المنافسة أو تشبع السوق.");
assert.equal(isUnavailableValue("unavailable: reason"), true);
assert.equal(isUnavailableValue("available"), false);
assert.equal(displayValue("education_funnel", "Not specified", "en"), "Education funnel");
assert.equal(displayValue("qualified_lead_rate", "Not specified", "en"), "Qualified lead rate");
assert.equal(displayValue("unavailable: no verified market benchmark source was supplied", "Not specified", "en"), "Currently unavailable");
assert.equal(displayValue("function StatusPill({ status }) { return status; }", "Not specified", "en"), "Not specified");
assert.equal(displayStatus("check_manually", "en"), "Needs manual review");
assert.equal(displayStatus("unavailable", "en"), "Currently unavailable");
assert.equal(displayStatus("draft", "en"), "Draft");
assert.equal(displayStatus("approved", "en"), "Human-approved");
assert.equal(displayStatus("rejected", "en"), "Rejected — needs review");
assert.equal(displayStatus("locked", "en"), "Locked");
assert.equal(displayFieldLabel("weekly_projection", "en"), "Weekly spend projection");
assert.equal(displaySource("RF-019", "en"), "CDKS rules");
assert.equal(displayUnavailableReason("unavailable: no verified competitor or market-saturation source was supplied", "Not specified", "en"), "There is not enough verified evidence to estimate competition or saturation.");

console.log(JSON.stringify({
  status: "PASS",
  assertions: 31,
  unsafeRendererSource: "blocked",
  unavailableValues: "simplified",
  internalRuleIds: "redacted_for_client_view",
}));
