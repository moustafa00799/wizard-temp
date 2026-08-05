/**
 * BlueprintPDFExporter.ts — v2.1 (Fixed for html2canvas visibility)
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure client-side PDF generation for Arabic RTL campaign blueprints.
 * Uses jspdf + html2canvas — zero server involvement, zero @react-pdf/renderer.
 *
 * v2 fixes:
 *   • Replaced formatValue (string-based) with renderValueToHTML (HTML-based)
 *   • Arrays of objects → visual cards (phases, segments) or tables (allocation)
 *   • Nested objects → recursive indented blocks, never [object Object]
 *   • Known shapes (phases, segments, allocation) get dedicated renderers
 *   • Plain string arrays → bullet list with styled border
 *
 * v2.1 fixes:
 *   • Container uses opacity:0 instead of visibility:hidden + off-screen
 *   • Added onclone to ensure html2canvas renders the clone visible
 */

import type { BlueprintData } from "@/lib/blueprint-types";
import { SECTION_LABELS, SECTION_ICONS, SECTION_COLORS, SECTION_ORDER } from "@/lib/blueprint-types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PDFExportOptions {
  blueprint: BlueprintData | Record<string, unknown>;
  businessType?: string;
  onProgress?: (stage: string) => void;
}

// ─── Known shape detectors ────────────────────────────────────────────────────

function isPhase(obj: unknown): obj is { name: string; duration?: number; budget_percent?: number } {
  return typeof obj === "object" && obj !== null && "name" in obj && "duration" in obj;
}

function isSegment(obj: unknown): obj is { name: string; description?: string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    !("duration" in obj) &&
    !("channel" in obj)
  );
}

function isAllocation(obj: unknown): obj is { channel: string; amount: number; percent: number; objective?: string } {
  return typeof obj === "object" && obj !== null && "channel" in obj && "amount" in obj;
}

// ─── Safe HTML escape ─────────────────────────────────────────────────────────

function esc(s: unknown): string {
  return String(s ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Dedicated renderers for known shapes ─────────────────────────────────────

function renderPhases(
  phases: { name: string; duration?: number; budget_percent?: number }[]
): string {
  return `<div class="phases-list">` +
    phases.map((p, i) => `
      <div class="phase-card">
        <div class="phase-num">${i + 1}</div>
        <div class="phase-info">
          <div class="phase-name">${esc(p.name)}</div>
          <div class="phase-meta">
            ${p.duration != null ? `<span class="meta-tag">⏱ ${esc(p.duration)} أيام</span>` : ""}
            ${p.budget_percent != null ? `<span class="meta-tag">💰 ${esc(p.budget_percent)}% من الميزانية</span>` : ""}
          </div>
        </div>
      </div>`).join("") +
  `</div>`;
}

function renderSegments(segments: { name: string; description?: string }[]): string {
  return `<div class="segments-grid">` +
    segments.map((s) => `
      <div class="segment-card">
        <div class="segment-name">👥 ${esc(s.name)}</div>
        ${s.description ? `<div class="segment-desc">${esc(s.description)}</div>` : ""}
      </div>`).join("") +
  `</div>`;
}

function renderAllocation(
  items: { channel: string; amount: number; percent: number; objective?: string }[]
): string {
  return `
    <table class="alloc-table">
      <thead>
        <tr><th>القناة</th><th>النسبة</th><th>المبلغ</th><th>الهدف</th></tr>
      </thead>
      <tbody>` +
    items.map((a) => `
        <tr>
          <td class="td-channel">${esc(a.channel)}</td>
          <td class="td-num">${esc(a.percent)}%</td>
          <td class="td-num">${esc(a.amount)}</td>
          <td class="td-obj">${esc(a.objective ?? "—")}</td>
        </tr>`).join("") +
  `</tbody></table>`;
}

// ─── Core recursive HTML renderer ─────────────────────────────────────────────

function renderValueToHTML(val: unknown, depth = 0): string {
  if (val === null || val === undefined) return `<span class="empty-val">—</span>`;

  if (typeof val === "string") {
    const lines = val.split("\n").filter((l) => l.trim());
    if (lines.length <= 1) return `<span class="text-val">${esc(val)}</span>`;
    return lines.map((l) => `<div class="text-line">${esc(l)}</div>`).join("");
  }

  if (typeof val === "number" || typeof val === "boolean") {
    return `<span class="text-val">${esc(String(val))}</span>`;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return `<span class="empty-val">—</span>`;

    if (val.every(isPhase)) {
      return renderPhases(val as { name: string; duration?: number; budget_percent?: number }[]);
    }
    if (val.every(isAllocation)) {
      return renderAllocation(
        val as { channel: string; amount: number; percent: number; objective?: string }[]
      );
    }
    if (val.every(isSegment)) {
      return renderSegments(val as { name: string; description?: string }[]);
    }
    if (val.every((i) => typeof i === "string")) {
      return `<ul class="bullet-list">` +
        (val as string[]).map((s) => `<li class="bullet-item">${esc(s)}</li>`).join("") +
      `</ul>`;
    }

    // Mixed / generic array
    return val.map((item, idx) => {
      if (item === null || item === undefined) return "";
      if (typeof item !== "object") {
        return `<div class="bullet-item">• ${esc(String(item))}</div>`;
      }
      const inner = renderObjectToHTML(item as Record<string, unknown>, depth + 1);
      return `<div class="nested-obj${idx > 0 ? " nested-obj--sep" : ""}">${inner}</div>`;
    }).join("");
  }

  if (typeof val === "object") {
    return renderObjectToHTML(val as Record<string, unknown>, depth);
  }

  return `<span class="text-val">${esc(String(val))}</span>`;
}

function renderObjectToHTML(obj: Record<string, unknown>, depth = 0): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return `<span class="empty-val">—</span>`;

  return entries.map(([k, v]) => {
    const label = SECTION_LABELS[k] ?? formatKey(k);
    const isComplex = Array.isArray(v) || (typeof v === "object" && v !== null);

    if (isComplex) {
      return `
        <div class="obj-row obj-row--complex">
          <div class="obj-key">${esc(label)}</div>
          <div class="obj-val-block">${renderValueToHTML(v, depth + 1)}</div>
        </div>`;
    }
    return `
      <div class="obj-row">
        <span class="obj-key-inline">${esc(label)}:</span>
        <span class="obj-val-inline">${esc(String(v ?? "—"))}</span>
      </div>`;
  }).join("");
}

function formatKey(key: string): string {
  return key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
}

// ─── Renderer CSS ─────────────────────────────────────────────────────────────

const RENDERER_CSS = `
  .phases-list { display:flex; flex-direction:column; gap:8px; }
  .phase-card {
    display:flex; align-items:flex-start; gap:12px;
    background:#f5f3ff; border-radius:8px; padding:10px 14px;
    border:1px solid #e9d5ff;
  }
  .phase-num {
    width:28px; height:28px; border-radius:50%;
    background:#7c3aed; color:white;
    display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:700; flex-shrink:0;
  }
  .phase-info { flex:1; }
  .phase-name { font-size:14px; font-weight:700; color:#1f2937; margin-bottom:4px; }
  .phase-meta { display:flex; gap:8px; flex-wrap:wrap; }
  .meta-tag {
    font-size:11px; color:#6d28d9; background:white;
    border:1px solid #ddd6fe; border-radius:20px; padding:2px 10px;
  }

  .segments-grid { display:flex; flex-direction:column; gap:8px; }
  .segment-card { background:#f0fdf4; border-radius:8px; padding:10px 14px; border:1px solid #bbf7d0; }
  .segment-name { font-size:13px; font-weight:700; color:#166534; margin-bottom:3px; }
  .segment-desc { font-size:12px; color:#374151; line-height:1.5; }

  .alloc-table { width:100%; border-collapse:collapse; font-size:12px; text-align:right; direction:rtl; }
  .alloc-table th {
    background:#fef3c7; color:#92400e;
    padding:8px 10px; font-weight:700; font-size:11px;
    border-bottom:2px solid #fde68a;
  }
  .alloc-table td { padding:7px 10px; border-bottom:1px solid #f3f4f6; color:#374151; }
  .alloc-table tr:last-child td { border-bottom:none; }
  .alloc-table tr:nth-child(even) td { background:#fffbeb; }
  .td-channel { font-weight:600; }
  .td-num { font-weight:600; color:#1f2937; }
  .td-obj { color:#6b7280; font-size:11px; }

  .bullet-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:4px; }
  .bullet-item {
    font-size:13px; color:#374151; line-height:1.6;
    padding:4px 12px; border-right:3px solid #d1d5db; margin-right:4px;
  }

  .obj-row { margin-bottom:5px; }
  .obj-row--complex { margin-bottom:10px; }
  .obj-key { font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px; }
  .obj-val-block { padding-right:8px; border-right:2px solid #e5e7eb; }
  .obj-key-inline { font-size:12px; font-weight:700; color:#374151; margin-left:6px; }
  .obj-val-inline { font-size:12px; color:#6b7280; }

  .nested-obj { background:#f9fafb; border-radius:6px; padding:8px 12px; margin-bottom:6px; }
  .nested-obj--sep { border-top:1px solid #e5e7eb; margin-top:6px; }

  .empty-val { color:#9ca3af; font-style:italic; font-size:12px; }
  .text-val { font-size:13px; color:#374151; line-height:1.6; }
  .text-line { font-size:13px; color:#374151; line-height:1.7; padding:2px 0; }
`;

// ─── HTML template ─────────────────────────────────────────────────────────────

function buildPDFHTML(
  blueprint: BlueprintData | Record<string, unknown>,
  businessType: string
): string {
  const date = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = SECTION_ORDER.map((key) => {
    const val = (blueprint as Record<string, unknown>)[key];
    if (val === null || val === undefined) return "";

    const label  = SECTION_LABELS[key] ?? key;
    const icon   = SECTION_ICONS[key]  ?? "📋";
    const colors = SECTION_COLORS[key] ?? {
      bg: "#f9fafb", border: "#6b7280", text: "#374151", light: "#f3f4f6",
    };

    return `
      <div class="section" style="border-right:4px solid ${colors.border}; background:${colors.bg};">
        <div class="section-header" style="background:${colors.light};">
          <span class="section-icon">${icon}</span>
          <span class="section-title" style="color:${colors.text};">${label}</span>
        </div>
        <div class="section-body">${renderValueToHTML(val)}</div>
      </div>`;
  }).join("");

  const extraKeys = Object.keys(blueprint as Record<string, unknown>).filter(
    (k) => !SECTION_ORDER.includes(k) && (blueprint as Record<string, unknown>)[k] != null
  );
  const extraSections = extraKeys.map((key) => {
    const val = (blueprint as Record<string, unknown>)[key];
    return `
      <div class="section" style="border-right:4px solid #6b7280; background:#f9fafb;">
        <div class="section-header" style="background:#f3f4f6;">
          <span class="section-icon">📌</span>
          <span class="section-title" style="color:#374151;">${formatKey(key)}</span>
        </div>
        <div class="section-body">${renderValueToHTML(val)}</div>
      </div>`;
  }).join("");

  const tocItems = SECTION_ORDER
    .filter((k) => (blueprint as Record<string, unknown>)[k] != null)
    .map((k) => `
      <div class="toc-item">
        <span class="toc-icon">${SECTION_ICONS[k] ?? "📌"}</span>
        <span>${SECTION_LABELS[k] ?? k}</span>
      </div>`).join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body {
      font-family:'Cairo','Tahoma','Arial Unicode MS',Arial,sans-serif;
      direction:rtl; text-align:right; background:#ffffff; color:#1f2937; width:794px;
    }
    .cover {
      background:linear-gradient(135deg,#4c1d95 0%,#7c3aed 50%,#6d28d9 100%);
      color:white; padding:60px 50px; min-height:270px;
      display:flex; flex-direction:column; justify-content:center;
    }
    .cover-eyebrow { font-size:12px; font-weight:600; letter-spacing:0.12em; color:#c4b5fd; margin-bottom:14px; }
    .cover-title { font-size:32px; font-weight:800; line-height:1.3; margin-bottom:10px; }
    .cover-subtitle { font-size:15px; color:#ddd6fe; margin-bottom:28px; }
    .cover-meta { display:flex; gap:16px; flex-wrap:wrap; }
    .cover-meta-item { background:rgba(255,255,255,0.15); border-radius:8px; padding:7px 14px; font-size:12px; color:#ede9fe; }
    .cover-badge {
      margin-top:22px; display:inline-flex; align-items:center; gap:8px;
      background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3);
      border-radius:20px; padding:5px 14px; font-size:12px; color:white; width:fit-content;
    }
    .toc { padding:36px 50px; background:#faf9ff; border-bottom:1px solid #e5e7eb; }
    .toc-title { font-size:17px; font-weight:700; color:#4c1d95; margin-bottom:18px; padding-bottom:10px; border-bottom:2px solid #e9d5ff; }
    .toc-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .toc-item { display:flex; align-items:center; gap:10px; padding:8px 12px; background:white; border-radius:8px; border:1px solid #e9d5ff; font-size:12px; color:#374151; }
    .toc-icon { font-size:15px; flex-shrink:0; }
    .sections-container { padding:28px 50px; display:flex; flex-direction:column; gap:18px; }
    .section { border-radius:10px; overflow:hidden; border-right-width:4px; border-right-style:solid; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
    .section-header { display:flex; align-items:center; gap:10px; padding:11px 16px; }
    .section-icon { font-size:17px; flex-shrink:0; }
    .section-title { font-size:14px; font-weight:700; }
    .section-body { padding:14px 16px; background:white; }
    .footer { padding:22px 50px; background:#f9fafb; border-top:1px solid #e5e7eb; text-align:center; }
    .footer-text { font-size:10px; color:#9ca3af; line-height:1.6; }
    .footer-brand { font-size:12px; color:#7c3aed; font-weight:600; margin-top:5px; }
    ${RENDERER_CSS}
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-eyebrow">CAMPAIGN ENGINE AI — خطة إعلانية شاملة</div>
    <div class="cover-title">الخطة الإعلانية${businessType ? `<br>لـ ${esc(businessType)}` : " المتكاملة"}</div>
    <div class="cover-subtitle">استراتيجية مبنية على بيانات دقيقة وتحليل ذكي</div>
    <div class="cover-meta">
      <div class="cover-meta-item">📅 ${date}</div>
      ${businessType ? `<div class="cover-meta-item">🏢 ${esc(businessType)}</div>` : ""}
      <div class="cover-meta-item">🤖 مولّد تلقائياً</div>
    </div>
    <div class="cover-badge">✓ جاهز للتنفيذ</div>
  </div>

  <div class="toc">
    <div class="toc-title">📋 محتويات الخطة</div>
    <div class="toc-grid">${tocItems}</div>
  </div>

  <div class="sections-container">
    ${sections}
    ${extraSections}
  </div>

  <div class="footer">
    <div class="footer-text">
      هذه الخطة مولّدة تلقائياً بواسطة Campaign Engine AI بناءً على البيانات التي أدخلتها.<br>
      يُنصح بمراجعة الأرقام والتوصيات مع متخصص قبل الإطلاق.
    </div>
    <div class="footer-brand">⚡ Campaign Engine Builder</div>
  </div>
</body>
</html>`;
}

// ─── Main export function ──────────────────────────────────────────────────────

export async function exportBlueprintToPDF(options: PDFExportOptions): Promise<void> {
  const { blueprint, businessType = "general", onProgress } = options;

  onProgress?.("جارٍ تحضير المستند...");

  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const container = document.createElement("div");
  
  // ✅ FIX v2.1: opacity:0 + pointer-events:none بدلاً من visibility:hidden + off-screen
  // السبب: html2canvas لا يرسم عناصر visibility:hidden أو خارج الشاشة بشكل موثوق
  container.style.cssText =
    "position:fixed;top:0;left:0;width:794px;opacity:0;pointer-events:none;z-index:-1;background:white;";
  container.innerHTML = buildPDFHTML(blueprint, businessType);
  document.body.appendChild(container);

  onProgress?.("جارٍ تحميل الخطوط...");
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 1200)); // انتظر 1.2 ثانية لضمان render

  try {
    onProgress?.("جارٍ رسم الصفحات...");

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 794,
      // ✅ FIX v2.1: onclone يجعل النسخة مرئية قبل التقاط الصورة
      onclone: (clonedDoc) => {
        const cloned = clonedDoc.body.querySelector("div[style*='opacity: 0']") as HTMLElement;
        if (cloned) {
          cloned.style.opacity = "1";
          cloned.style.position = "absolute";
        }
      },
    });

    onProgress?.("جارٍ بناء ملف PDF...");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

    const PAGE_W_MM = 210;
    const PAGE_H_MM = 297;
    const imgW = PAGE_W_MM;
    const imgH = (canvas.height * imgW) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.93);

    let yOffset = 0;
    let page    = 0;

    while (yOffset < imgH) {
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, -yOffset, imgW, imgH, undefined, "FAST");
      yOffset += PAGE_H_MM;
      page++;
    }

    pdf.save(`campaign-blueprint-${businessType}-${new Date().toISOString().slice(0, 10)}.pdf`);
    onProgress?.("✓ تم التصدير بنجاح");
  } finally {
    document.body.removeChild(container);
  }
}