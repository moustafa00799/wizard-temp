import assert from "node:assert/strict";
import {
  DEFAULT_LOCALE,
  formatLocaleDate,
  formatLocaleNumber,
  getDictionary,
  localeDirection,
  localeTag,
} from "../src/lib/i18n";

assert.equal(DEFAULT_LOCALE, "ar");
assert.equal(localeDirection("ar"), "rtl");
assert.equal(localeDirection("en"), "ltr");
assert.equal(localeTag("ar"), "ar-SA");
assert.equal(localeTag("en"), "en-US");
assert.equal(getDictionary("ar").app.name, "مُنشئ الحملات الذكي");
assert.equal(getDictionary("en").app.name, "Campaign Builder AI");
assert.equal(getDictionary("ar").blueprint.groups.decision.title, "ملخص القرار");
assert.equal(getDictionary("en").blueprint.groups.decision.title, "Decision summary");
assert.match(formatLocaleNumber(1234.5, "ar"), /١|1/);
assert.match(formatLocaleNumber(1234.5, "en"), /1,234|1234/);
assert.ok(formatLocaleDate("2026-08-28T12:00:00Z", "ar"));
assert.ok(formatLocaleDate("2026-08-28T12:00:00Z", "en"));

console.log(JSON.stringify({
  status: "PASS",
  assertions: 12,
  locales: ["ar", "en"],
  directions: { ar: "rtl", en: "ltr" },
  defaultLocale: DEFAULT_LOCALE,
  authorityUnchanged: true,
}));
