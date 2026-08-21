const fs = require('node:fs');

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) throw new Error('Usage: node analyze-attached-campaign-html.cjs <input.html> <output.json>');
const html = fs.readFileSync(input, 'utf8');
const decode = (value) => value
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();
const terms = /ai|reasoning|strategy|cdks|decision|claim|evidence|provenance|model|provider|rule|قرار|استدلال|استراتيجية|دليل|ادعاء|مصدر|نموذج|مزو.?د/i;
const headings = [];
for (const match of html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
  const value = decode(match[2]);
  if (value) headings.push(value);
}
const buttons = [];
for (const match of html.matchAll(/<(button|[^>]+role=["']button["'])\b[^>]*>([\s\S]*?)<\/(?:button|[^>]+)>/gi)) {
  const value = decode(match[2]);
  if (value) buttons.push(value);
}
const matchingLeafNodes = [];
for (const match of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>([^<>]{1,500})<\/\1>/gi)) {
  const value = decode(match[3]);
  if (value && terms.test(value)) matchingLeafNodes.push({ tag: match[1], text: value });
}
const statusValues = [...new Set((decode(html).match(/\b(?:not_requested|completed|failed|supported|qualified|unsupported|ready|review|blocked|unavailable|check_manually|blueprint_only|AI_STRATEGY_BUILDER|AI_REASONING)\b/gi) || []).map((value) => value.toLowerCase()))];
const result = { source: input, title: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [,''])[1].trim(), headings: [...new Set(headings)], buttons: [...new Set(buttons)], statusValues, matchingLeafNodes: matchingLeafNodes.slice(0, 2000) };
fs.writeFileSync(output, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ headings: result.headings.length, buttons: result.buttons.length, matchingLeafNodes: result.matchingLeafNodes.length, statusValues: result.statusValues, output }, null, 2));
