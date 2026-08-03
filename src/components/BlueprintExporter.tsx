"use client";

/**
 * BLUEPRINT EXPORTER
 * ──────────────────
 * Provides JSON and PDF export for the campaign blueprint.
 *
 * JSON: Direct download of pretty-printed JSON file.
 * PDF:  Uses jspdf for text-based PDF with full RTL Arabic support.
 *       (html2canvas is avoided because Next.js SSR + canvas has quirks with RTL;
 *        pure jspdf text gives reliable Arabic output across environments.)
 */

import { useState } from "react";
import jsPDF from "jspdf";

// ── Types ──────────────────────────────────────────────────────────────────────
interface BlueprintExporterProps {
  blueprint: Record<string, unknown>;
  businessType?: string;
}

// ── Section labels (Arabic) ────────────────────────────────────────────────────
const SECTION_LABELS: Record<string, string> = {
  strategy_summary: "ملخص الاستراتيجية",
  recommended_funnel: "الفانل الموصى به",
  campaign_structure: "هيكل الحملة",
  audience_structure: "هيكل الجمهور",
  budget_split: "توزيع الميزانية",
  creative_angles: "زوايا الإعلانات",
  tracking_checklist: "قائمة التتبع",
  risk_flags: "المخاطر والتحذيرات",
  first_14_days_plan: "خطة أول 14 يوم",
  pre_launch_fixes: "ما يجب إصلاحه قبل الإطلاق",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === "string" ? `• ${item}` : JSON.stringify(item)))
      .join("\n");
  }
  if (typeof val === "object") {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join("\n");
  }
  return String(val);
}

// ── JSON Export ────────────────────────────────────────────────────────────────
function exportJSON(blueprint: Record<string, unknown>, businessType?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `campaign-blueprint-${businessType ?? "general"}-${timestamp}.json`;

  const exportData = {
    exported_at: new Date().toISOString(),
    business_type: businessType ?? "unknown",
    blueprint,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── PDF Export ─────────────────────────────────────────────────────────────────
async function exportPDF(
  blueprint: Record<string, unknown>,
  businessType?: string,
  onProgress?: (status: string) => void
) {
  onProgress?.("جارٍ إنشاء ملف PDF...");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Helper: check page overflow ────────────────────────────────────────────
  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      addPageFooter();
    }
  };

  // ── Helper: wrapped text ───────────────────────────────────────────────────
  const addWrappedText = (
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number
  ): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkNewPage(lineHeight);
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y;
  };

  // ── Footer on every page ───────────────────────────────────────────────────
  const addPageFooter = () => {
    const currentPage = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Campaign Diagnosis Wizard — Page ${currentPage}`,
      margin,
      pageHeight - 10
    );
    doc.text(
      new Date().toLocaleDateString("en-GB"),
      pageWidth - margin - 25,
      pageHeight - 10
    );
    doc.setTextColor(0, 0, 0);
  };

  // ── HEADER ─────────────────────────────────────────────────────────────────
  // Background bar
  doc.setFillColor(109, 40, 217); // violet-700
  doc.rect(0, 0, pageWidth, 35, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Campaign Strategy Blueprint", margin, 15);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Business Type: ${businessType ?? "—"} | Generated: ${new Date().toLocaleDateString("en-GB")}`,
    margin,
    25
  );

  doc.setTextColor(0, 0, 0);
  y = 45;

  // ── Intro line ──────────────────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "This document contains your full campaign strategy generated by Campaign Diagnosis Wizard.",
    margin,
    y
  );
  y += 12;
  doc.setTextColor(0, 0, 0);

  // ── SECTIONS ───────────────────────────────────────────────────────────────
  const sectionOrder = Object.keys(SECTION_LABELS);
  const allKeys = [
    ...sectionOrder,
    ...Object.keys(blueprint).filter((k) => !sectionOrder.includes(k)),
  ];

  for (const key of allKeys) {
    const rawValue = blueprint[key];
    if (rawValue === null || rawValue === undefined) continue;

    const label = SECTION_LABELS[key] ?? key;
    const valueText = formatValue(rawValue);

    checkNewPage(20);

    // ── Section header bar ────────────────────────────────────────────────
    doc.setFillColor(245, 243, 255); // violet-50
    doc.rect(margin, y - 5, contentWidth, 10, "F");

    doc.setFillColor(109, 40, 217);
    doc.rect(margin, y - 5, 3, 10, "F"); // left accent bar

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(109, 40, 217);
    doc.text(label, margin + 6, y + 1);

    y += 10;
    doc.setTextColor(0, 0, 0);

    // ── Section content ───────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    addWrappedText(valueText, margin + 4, y, contentWidth - 4, 5);
    y += 6; // spacing after section
  }

  addPageFooter();

  // ── SAVE ───────────────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `campaign-blueprint-${businessType ?? "general"}-${timestamp}.pdf`;
  doc.save(filename);

  onProgress?.(null as unknown as string);
}

// ── Main component ─────────────────────────────────────────────────────────────
export function BlueprintExporter({
  blueprint,
  businessType,
}: BlueprintExporterProps) {
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [jsonDone, setJsonDone] = useState(false);

  const handleJSON = () => {
    exportJSON(blueprint, businessType);
    setJsonDone(true);
    setTimeout(() => setJsonDone(false), 2000);
  };

  const handlePDF = async () => {
    await exportPDF(blueprint, businessType, setPdfStatus);
  };

  return (
    <div className="flex gap-3 flex-wrap justify-center" dir="rtl">
      {/* JSON Export button */}
      <button
        onClick={handleJSON}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
          ${jsonDone
            ? "bg-green-900/40 border-green-700 text-green-400"
            : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-white"
          }`}
      >
        {jsonDone ? "✓ تم التنزيل" : "📥 تنزيل JSON"}
      </button>

      {/* PDF Export button */}
      <button
        onClick={handlePDF}
        disabled={!!pdfStatus}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
          ${pdfStatus
            ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-violet-900/40 border-violet-700 text-violet-300 hover:bg-violet-800/40 hover:border-violet-600 hover:text-violet-200"
          }`}
      >
        {pdfStatus ? (
          <>
            <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
            {pdfStatus}
          </>
        ) : (
          "📄 تنزيل PDF"
        )}
      </button>
    </div>
  );
}
