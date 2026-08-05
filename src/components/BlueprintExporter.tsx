"use client";

import { useState } from "react";
import type { BlueprintData, ProReadyJSON } from "@/lib/blueprint-types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ═══════════════════════════════════════════════════════════════════
   1.  Types & Labels
   ═══════════════════════════════════════════════════════════════════ */

interface BlueprintExporterProps {
  blueprint: BlueprintData;
  businessType?: string;
  wizardData?: Record<string, unknown>;
}

const PDF_SECTION_LABELS: Record<string, string> = {
  executive_summary: "الملخص التنفيذي",
  strategy_summary: "ملخص الاستراتيجية",
  recommended_funnel: "الفانل الموصى به",
  campaign_structure: "هيكل الحملة",
  audience_structure: "هيكل الجمهور",
  audience_analysis: "تحليل الجمهور",
  budget_split: "توزيع الميزانية",
  budget_management: "إدارة الميزانية",
  creative_angles: "زوايا الإعلانات",
  creative_strategy: "استراتيجية الإبداع",
  tracking_checklist: "قائمة التتبع",
  tracking_assessment: "تقييم التتبع",
  risk_flags: "المخاطر والتحذيرات",
  first_14_days_plan: "خطة أول 14 يوم",
  launch_plan: "خطة الإطلاق",
  pre_launch_fixes: "ما يجب إصلاحه قبل الإطلاق",
  testing: "اختبار A/B",
  benchmarks: "معايير الأداء",
  market_context: "سياق السوق",
  platform_guides: "أدلة المنصات",
  compliance: "الامتثال القانوني",
  offer_strategy: "استراتيجية العرض",
  monitoring: "المراقبة بعد الإطلاق",
};

const PDF_SECTION_ICONS: Record<string, string> = {
  executive_summary: "📊",
  strategy_summary: "🎯",
  recommended_funnel: "🔄",
  campaign_structure: "🏗️",
  audience_structure: "👥",
  audience_analysis: "🔍",
  budget_split: "💰",
  budget_management: "📈",
  creative_angles: "🎨",
  creative_strategy: "✨",
  tracking_checklist: "📋",
  tracking_assessment: "🔧",
  risk_flags: "⚠️",
  first_14_days_plan: "📅",
  launch_plan: "🚀",
  pre_launch_fixes: "🔧",
  testing: "🧪",
  benchmarks: "📏",
  market_context: "🌍",
  platform_guides: "📱",
  compliance: "⚖️",
  offer_strategy: "🎁",
  monitoring: "📡",
};

const PDF_SECTION_COLORS: Record<string, string> = {
  executive_summary: "#16a34a",
  strategy_summary: "#7c3aed",
  recommended_funnel: "#0891b2",
  campaign_structure: "#2563eb",
  audience_structure: "#16a34a",
  audience_analysis: "#059669",
  budget_split: "#d97706",
  budget_management: "#b45309",
  creative_angles: "#db2777",
  creative_strategy: "#be185d",
  tracking_checklist: "#0284c7",
  tracking_assessment: "#0369a1",
  risk_flags: "#dc2626",
  first_14_days_plan: "#7c3aed",
  launch_plan: "#4f46e5",
  pre_launch_fixes: "#ea580c",
  testing: "#8b5cf6",
  benchmarks: "#0d9488",
  market_context: "#6366f1",
  platform_guides: "#4338ca",
  compliance: "#475569",
  offer_strategy: "#c2410c",
  monitoring: "#0891b2",
};

const PDF_SECTION_ORDER = [
  "executive_summary",
  "strategy_summary",
  "recommended_funnel",
  "campaign_structure",
  "audience_structure",
  "audience_analysis",
  "budget_split",
  "budget_management",
  "creative_angles",
  "creative_strategy",
  "tracking_checklist",
  "tracking_assessment",
  "risk_flags",
  "first_14_days_plan",
  "launch_plan",
  "pre_launch_fixes",
  "testing",
  "benchmarks",
  "market_context",
  "platform_guides",
  "compliance",
  "offer_strategy",
  "monitoring",
];

/* ═══════════════════════════════════════════════════════════════════
   2.  Helpers
   ═══════════════════════════════════════════════════════════════════ */

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderValueHTML(val: unknown, color: string): string {
  if (val === null || val === undefined) return '<span style="color:#94a3b8;">—</span>';
  if (typeof val === "string") return `<span style="color:#334155;">${escapeHtml(val)}</span>`;
  if (typeof val === "number" || typeof val === "boolean") return `<span style="color:#334155;">${String(val)}</span>`;

  if (Array.isArray(val)) {
    if (val.length === 0) return '<span style="color:#94a3b8;">—</span>';
    const items = val.map((item) => {
      if (typeof item === "string") {
        return `<li style="margin-bottom:4px;padding-right:14px;position:relative;color:#334155;font-size:12px;line-height:1.6;">
          <span style="position:absolute;right:0;color:${color};font-weight:bold;">•</span>
          ${escapeHtml(item)}
        </li>`;
      }
      return `<li style="margin-bottom:6px;padding:10px;background:#f8fafc;border-radius:8px;border-right:3px solid ${color};">
        ${renderValueHTML(item, color)}
      </li>`;
    }).join("");
    return `<ul style="margin:0;padding:0;list-style:none;">${items}</ul>`;
  }

  const obj = val as Record<string, unknown>;
  const entries = Object.entries(obj).filter(([k]) => k !== "_meta");
  if (entries.length === 0) return '<span style="color:#94a3b8;">—</span>';

  // Simple key-value table
  const rows = entries.map(([k, v]) => {
    const displayKey = k.replace(/_/g, " ");
    const valueHtml = typeof v === "object" && v !== null
      ? renderValueHTML(v, color)
      : renderValueHTML(v, color);
    return `<tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:6px 8px 6px 0;color:#64748b;font-size:11px;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(displayKey)}</td>
      <td style="padding:6px 0;color:#334155;font-size:12px;line-height:1.5;vertical-align:top;">${valueHtml}</td>
    </tr>`;
  }).join("");

  return `<table style="width:100%;border-collapse:collapse;margin-top:4px;">${rows}</table>`;
}

function buildSectionHTML(key: string, val: unknown): string {
  if (val === null || val === undefined) return "";
  const label = PDF_SECTION_LABELS[key] ?? key;
  const color = PDF_SECTION_COLORS[key] ?? "#7c3aed";
  const icon = PDF_SECTION_ICONS[key] ?? "📋";

  return `
    <div style="margin-bottom:18px;background:#ffffff;border-radius:12px;padding:18px 20px;border-right:4px solid ${color};box-shadow:0 1px 3px rgba(0,0,0,0.04);page-break-inside:avoid;">
      <h2 style="margin:0 0 12px 0;color:${color};font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
        <span style="font-size:18px;">${icon}</span>
        <span>${label}</span>
      </h2>
      <div style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;">${renderValueHTML(val, color)}</div>
    </div>
  `;
}
/* ═══════════════════════════════════════════════════════════════════
   3.  buildProReadyJSON  (unchanged logic)
   ═══════════════════════════════════════════════════════════════════ */

function buildProReadyJSON(
  blueprint: BlueprintData,
  wizardData?: Record<string, unknown>
): ProReadyJSON {
  const bp = blueprint;
  const wz = wizardData ?? {};

  const strategy = bp.strategy_summary;
  const budget = bp.budget_split;
  const audience = bp.audience_structure;
  const creative = bp.creative_angles;
  const tracking = bp.tracking_checklist;
  const riskFlags = bp.risk_flags;
  const plan14 = bp.first_14_days_plan;
  const preLaunch = bp.pre_launch_fixes;
  const exec = bp.executive_summary;

  const dailyBudget = budget?.daily_budget?.value?.recommended ?? 0;
  const totalBudget = dailyBudget * 14;
  const currency = "SAR";

  const channelAlloc = budget?.channel_allocation?.value ?? {};
  const campaignAllocation = Object.entries(channelAlloc).map(
    ([channel, percent]) => ({
      channel,
      amount: Math.round(totalBudget * ((percent as number) / 100)),
      percent: percent as number,
      objective: strategy?.recommended_objective?.value ?? "awareness",
    })
  );

  const week1Tasks =
    plan14?.week_1?.slice(0, 3).map((t, i) => ({
      day: i + 1,
      action: t.task,
      owner: t.owner,
      priority: t.priority as "high" | "medium" | "low",
    })) ?? [];

  const week2Tasks =
    plan14?.week_1?.slice(3).map((t, i) => ({
      day: i + 4,
      action: t.task,
      owner: t.owner,
      priority: t.priority as "high" | "medium" | "low",
    })) ?? [];

  const week3Tasks =
    plan14?.week_2?.map((t, i) => ({
      day: i + 8,
      action: t.task,
      owner: t.owner,
      priority: t.priority as "high" | "medium" | "low",
    })) ?? [];

  return {
    _meta: {
      version: "1.0.0",
      exported_at: new Date().toISOString(),
      exported_by: "Campaign Engine Builder",
      format: "pro-ready-v1",
    },
    campaign_info: {
      campaign_name: `${bp.blueprint_id ?? "campaign"}_pro`,
      business_type: (wz.business_type as string) ?? "unknown",
      industry_vertical: (wz.business_type as string) ?? "unknown",
      created_at: bp.generated_at ?? new Date().toISOString(),
      strategist: "Campaign Engine Builder",
      client_name: (wz.business_type as string) ?? "unknown",
      version: bp.version ?? "1.0.0",
      tags: [(wz.business_type as string) ?? "general", bp.version ?? "v1"],
    },
    objective_hierarchy: {
      primary_objective: strategy?.recommended_objective?.value ?? "awareness",
      secondary_objectives: (wz.secondary_objectives as string[]) ?? [],
      north_star_kpi: (wz.north_star_kpi as string) ?? "sales_count",
      success_metrics: ["roas", "cac", "conversion_rate", "ctr"],
      funnel_stage: strategy?.funnel_type?.value ?? "website_funnel",
      conversion_destination: (wz.conversion_destination as string) ?? "website",
    },
    audience_matrix: {
      core_segments: audience?.segments ?? [],
      exclusions: audience?.exclusions ?? [],
      lookalike_plan: audience?.lookalike?.recommended
        ? ["pixel_based_1%", "pixel_based_3%"]
        : [],
      custom_audiences: [],
      geo_targeting: (wz.target_locations as string[]) ?? [],
      language: "ar",
      audience_size_estimate: audience?.primary_audience?.size_estimate ?? "unknown",
    },
    budget_breakdown: {
      total_budget: totalBudget,
      currency,
      daily_cap: dailyBudget,
      duration_days: 14,
      campaign_allocation: campaignAllocation,
      day_7_projection: Math.round(totalBudget * 0.5),
      day_14_projection: totalBudget,
      cac_target: budget?.cac_target?.value ?? 0,
      roas_target: 3.0,
      break_even_roas: 1.5,
      budget_flexibility: budget?.daily_budget?.value?.flexible ? "flexible" : "fixed",
    },
    creative_specs: {
      angles: [
        creative?.primary_angle?.hook ?? "",
        ...(creative?.alternative_angles?.map((a) => a.hook) ?? []),
      ].filter(Boolean),
      primary_hook: creative?.primary_angle?.hook ?? "",
      formats: creative?.formats?.map((f) => f.type) ?? ["image"],
      copy_framework: "AIDA",
      headline_variants: [creative?.primary_angle?.hook ?? ""],
      cta_variants: [creative?.primary_angle?.cta ?? "ابدأ الآن"],
      visual_guidelines: ["Brand colors", "High contrast", "Clear product shot"],
      content_capacity: (wz.content_capacity as string) ?? "slow",
    },
    tracking_config: {
      pixel_status: tracking?.setup_status?.overall ?? "unknown",
      conversion_events: tracking?.required_events ?? [],
      utm_parameters: {
        source: "paid_social",
        medium: "cpc",
        campaign: bp.blueprint_id ?? "default",
      },
      attribution_window: "7d_click_1d_view",
      key_metrics: ["impressions", "clicks", "conversions", "roas", "cac"],
      reporting_dashboard: "meta_ads_manager",
      alert_thresholds: {
        cac: budget?.cac_target?.value ? budget.cac_target.value * 1.5 : 100,
        roas: 1.0,
      },
    },
    launch_sequence: {
      phase: exec?.launch_recommendation === "ready" ? "immediate" : "prepared",
      day_1_3: week1Tasks,
      day_4_7: week2Tasks,
      day_8_14: week3Tasks,
      checkpoints: ["Tracking verified", "Creatives approved", "Budget confirmed"],
      go_no_go_criteria: [
        "Pixel firing correctly",
        "At least 3 creatives ready",
        "Daily budget >= 80 SAR",
      ],
    },
    optimization_rules: {
      kill_conditions: [
        "CPA > 2x target for 3 consecutive days",
        "CTR < 0.5% after 3 days",
        "No conversions after 5 days with > 3k impressions",
      ],
      scale_conditions: [
        "ROAS > 3x for 2 consecutive days",
        "CPA < 0.8x target for 3 days",
        "CTR > 2% sustained",
      ],
      a_b_test_plan: ["Creative hook A/B", "Audience segment A/B", "CTA variant A/B"],
      budget_reallocation_rules: [
        "Reallocate 20% from lowest performer to highest daily",
        "Pause ad sets with < 1% CTR after 48h",
      ],
      creative_refresh_cycle: "Every 7 days",
      audience_expansion_rules: [
        "Expand lookalike from 1% to 3% after 5 conversions",
        "Add interest stacking after CPA stabilizes",
      ],
    },
    risk_register: {
      high_risks:
        riskFlags?.critical?.map((r) => ({
          risk: r.message,
          impact: r.impact ?? "high",
          probability: "high",
          mitigation: r.action,
        })) ?? [],
      medium_risks:
        riskFlags?.warnings?.map((r) => ({
          risk: r.message,
          impact: r.impact ?? "medium",
          probability: "medium",
          mitigation: r.action,
        })) ?? [],
      low_risks: [],
      mitigations: [
        "Daily monitoring checklist",
        "Auto-pause rules configured",
        "Weekly performance review",
      ],
      pre_launch_requirements: preLaunch?.must_fix?.map((f) => f.item) ?? [],
      contingency_plan:
        "If primary channel underperforms, reallocate budget to secondary channel within 24h.",
    },
    raw_blueprint: bp as unknown as Record<string, unknown>,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   4.  JSON exporters
   ═══════════════════════════════════════════════════════════════════ */

function exportJSON(blueprint: BlueprintData, businessType?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `campaign-blueprint-${businessType ?? "general"}-${timestamp}.json`;
  const blob = new Blob(
    [
      JSON.stringify(
        { exported_at: new Date().toISOString(), business_type: businessType ?? "unknown", blueprint },
        null,
        2
      ),
    ],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportProReadyJSON(
  blueprint: BlueprintData,
  businessType?: string,
  wizardData?: Record<string, unknown>
) {
  const proReady = buildProReadyJSON(blueprint, wizardData);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `pro-ready-${businessType ?? "general"}-${timestamp}.json`;
  const blob = new Blob([JSON.stringify(proReady, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
/* ═══════════════════════════════════════════════════════════════════
   5.  PDF generator  (jsPDF + html2canvas)
   ═══════════════════════════════════════════════════════════════════ */

async function generatePDF(blueprint: BlueprintData, businessType?: string) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.direction = "rtl";
  container.style.background = "#f1f5f9";
  container.style.fontFamily = "'Segoe UI', 'Tahoma', Arial, sans-serif";
  document.body.appendChild(container);

  const exec = blueprint.executive_summary;
  const today = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dailyBudget = blueprint.budget_split?.daily_budget?.value?.recommended ?? 0;
  const totalBudget = dailyBudget * 14;

  /* ── readiness / risk / launch colors ── */
  const readinessColor =
    exec?.readiness_level === "strong" ? "#16a34a" : exec?.readiness_level === "moderate" ? "#d97706" : "#dc2626";
  const riskColor =
    exec?.risk_level === "low" ? "#16a34a" : exec?.risk_level === "medium" ? "#d97706" : "#dc2626";
  const launchAr =
    exec?.launch_recommendation === "ready"
      ? "جاهز للإطلاق ✅"
      : exec?.launch_recommendation === "ready_with_fixes"
      ? "جاهز بعد الإصلاحات ⚡"
      : "غير جاهز للإطلاق ❌";
  const launchColor =
    exec?.launch_recommendation === "ready" ? "#16a34a" : exec?.launch_recommendation === "ready_with_fixes" ? "#d97706" : "#dc2626";

  /* ── Cover page ── */
  const coverHTML = `
    <div style="width:794px;height:1123px;background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 50%,#ddd6fe 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;box-sizing:border-box;padding:60px;text-align:center;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
      <div style="position:absolute;top:-120px;right:-120px;width:380px;height:380px;border-radius:50%;background:rgba(124,58,237,0.06);"></div>
      <div style="position:absolute;bottom:-80px;left:-80px;width:280px;height:280px;border-radius:50%;background:rgba(124,58,237,0.04);"></div>
      
      <div style="background:#7c3aed;color:#fff;padding:8px 28px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:1px;margin-bottom:32px;z-index:1;">📋 CAMPAIGN BLUEPRINT</div>
      
      <h1 style="margin:0 0 8px 0;color:#5b21b6;font-size:38px;font-weight:800;line-height:1.2;z-index:1;">الخطة الإعلانية<br/>الشاملة</h1>
      <p style="margin:0 0 40px 0;color:#7c3aed;font-size:20px;font-weight:700;z-index:1;">${businessType ?? "عام"}</p>
      
      <div style="display:flex;gap:32px;flex-wrap:wrap;justify-content:center;z-index:1;margin-bottom:28px;">
        <div style="text-align:center;"><div style="font-size:10px;color:#8b5cf6;font-weight:700;margin-bottom:4px;">تاريخ الإعداد</div><div style="font-size:15px;color:#5b21b6;font-weight:800;">${today}</div></div>
        <div style="text-align:center;"><div style="font-size:10px;color:#8b5cf6;font-weight:700;margin-bottom:4px;">مدة الحملة</div><div style="font-size:15px;color:#5b21b6;font-weight:800;">14 يوم</div></div>
        ${totalBudget > 0 ? `<div style="text-align:center;"><div style="font-size:10px;color:#8b5cf6;font-weight:700;margin-bottom:4px;">الميزانية</div><div style="font-size:15px;color:#5b21b6;font-weight:800;">${totalBudget.toLocaleString("ar-SA")} ر.س</div></div>` : ""}
      </div>

      ${exec ? `
      <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;background:rgba(255,255,255,0.7);padding:18px 24px;border-radius:14px;border:1px solid rgba(124,58,237,0.12);backdrop-filter:blur(4px);z-index:1;max-width:680px;">
        <div style="text-align:center;min-width:90px;"><div style="font-size:9px;color:#8b5cf6;font-weight:700;margin-bottom:4px;">جاهزية الإطلاق</div><div style="font-size:18px;font-weight:800;color:${readinessColor};">${exec.readiness_score}<span style="font-size:11px;color:#8b5cf6;">/100</span></div></div>
        <div style="text-align:center;min-width:90px;"><div style="font-size:9px;color:#8b5cf6;font-weight:700;margin-bottom:4px;">مستوى المخاطر</div><div style="font-size:18px;font-weight:800;color:${riskColor};">${exec.risk_score}<span style="font-size:11px;color:#8b5cf6;">/100</span></div></div>
        <div style="text-align:center;min-width:90px;"><div style="font-size:9px;color:#8b5cf6;font-weight:700;margin-bottom:4px;">التوصية</div><div style="font-size:13px;font-weight:800;color:${launchColor};line-height:1.3;">${launchAr}</div></div>
        <div style="text-align:center;min-width:90px;"><div style="font-size:9px;color:#8b5cf6;font-weight:700;margin-bottom:4px;">تاريخ الإطلاق المتوقع</div><div style="font-size:13px;font-weight:800;color:#5b21b6;">${exec.estimated_launch_date}</div></div>
      </div>
      ` : ""}

      <div style="position:absolute;bottom:36px;font-size:10px;color:#a78bfa;z-index:1;">تم إعدادها بواسطة Campaign Engine Builder</div>
    </div>
  `;

  /* ── TOC page ── */
  const tocSections = PDF_SECTION_ORDER.filter((k) => (blueprint as Record<string, unknown>)[k] != null);
  const tocHTML = `
    <div style="width:794px;min-height:1123px;background:#fff;padding:50px 50px 40px;box-sizing:border-box;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
      <h2 style="margin:0 0 28px 0;color:#5b21b6;font-size:24px;font-weight:800;padding-bottom:12px;border-bottom:3px solid #7c3aed;">📑 محتويات الخطة</h2>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${tocSections.map((key, idx) => {
          const label = PDF_SECTION_LABELS[key] ?? key;
          const icon = PDF_SECTION_ICONS[key] ?? "📋";
          return `
            <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f8fafc;border-radius:10px;border-right:3px solid #ddd6fe;">
              <div style="font-size:12px;font-weight:800;color:#a78bfa;background:#ede9fe;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${String(idx + 1).padStart(2, "0")}</div>
              <div style="font-size:16px;flex-shrink:0;">${icon}</div>
              <div style="font-size:13px;font-weight:700;color:#5b21b6;flex:1;text-align:right;">${label}</div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  /* ── Content pages ── */
  let contentHTML = "";
  for (const key of PDF_SECTION_ORDER) {
    const val = (blueprint as Record<string, unknown>)[key];
    if (val !== null && val !== undefined) {
      contentHTML += buildSectionHTML(key, val);
    }
  }

  /* ── Footer page ── */
  const footerHTML = `
    <div style="width:794px;height:1123px;background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
      <div style="font-size:48px;margin-bottom:20px;">🚀</div>
      <h2 style="margin:0 0 12px 0;color:#5b21b6;font-size:28px;font-weight:800;">مستعد للإطلاق؟</h2>
      <p style="margin:0 0 30px 0;color:#7c3aed;font-size:14px;max-width:500px;line-height:1.8;">تم إعداد هذه الخطة الإعلانية بناءً على بيانات نشاطك التجاري. راجع جميع الأقسام ونفّذ نقاط الإصلاح قبل الإطلاق.</p>
      <div style="background:rgba(255,255,255,0.8);padding:20px 32px;border-radius:14px;border:1px solid rgba(124,58,237,0.15);">
        <p style="margin:0;color:#5b21b6;font-size:12px;font-weight:700;">مولّدة تلقائياً بواسطة Campaign Engine AI</p>
        <p style="margin:6px 0 0 0;color:#8b5cf6;font-size:11px;">${today}</p>
      </div>
    </div>
  `;

  /* ── Assemble ── */
  container.innerHTML = coverHTML + tocHTML + contentHTML + footerHTML;

  /* ── Capture & slice into A4 pages ── */
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f1f5f9",
    logging: false,
    windowWidth: 794,
  });

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const pageHeightPx = 1123 * 2; // A4 height at scale 2
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = 297;

  let heightLeft = imgHeight;
  let position = 0;
  let pageCount = 0;

  while (heightLeft > 0) {
    const sliceH = Math.min(pageHeightPx, heightLeft);
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = imgWidth;
    sliceCanvas.height = sliceH;
    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(canvas, 0, position, imgWidth, sliceH, 0, 0, imgWidth, sliceH);

    const imgData = sliceCanvas.toDataURL("image/png");
    if (pageCount > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    
    heightLeft -= pageHeightPx;
    position += pageHeightPx;
    pageCount++;
  }

  const filename = `campaign-blueprint-${businessType ?? "general"}-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
  document.body.removeChild(container);
}
/* ═══════════════════════════════════════════════════════════════════
   6.  React Component
   ═══════════════════════════════════════════════════════════════════ */

export function BlueprintExporter({
  blueprint,
  businessType,
  wizardData,
}: BlueprintExporterProps) {
  const [jsonDone, setJsonDone] = useState(false);
  const [proDone, setProDone] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleJSON = () => {
    exportJSON(blueprint, businessType);
    setJsonDone(true);
    setTimeout(() => setJsonDone(false), 2000);
  };

  const handleProJSON = () => {
    exportProReadyJSON(blueprint, businessType, wizardData);
    setProDone(true);
    setTimeout(() => setProDone(false), 2000);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      await generatePDF(blueprint, businessType);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("حدث خطأ أثناء إنشاء PDF. يرجى المحاولة مرة أخرى.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="flex gap-3 flex-wrap justify-center" dir="rtl">
      <button
        onClick={handleJSON}
        disabled={pdfLoading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
          ${jsonDone ? "bg-green-900/40 border-green-700 text-green-400" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-white"}`}
      >
        {jsonDone ? "✓ تم التنزيل" : "📥 تنزيل JSON"}
      </button>

      <button
        onClick={handleProJSON}
        disabled={pdfLoading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
          ${proDone ? "bg-green-900/40 border-green-700 text-green-400" : "bg-indigo-900/40 border-indigo-700 text-indigo-300 hover:bg-indigo-800/40 hover:border-indigo-600 hover:text-indigo-200"}`}
      >
        {proDone ? "✓ تم التنزيل" : "📦 Pro-Ready JSON"}
      </button>

      <button
        onClick={handlePDF}
        disabled={pdfLoading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
          ${pdfLoading ? "bg-violet-900/20 border-violet-800 text-violet-400 cursor-wait" : "bg-violet-900/40 border-violet-700 text-violet-300 hover:bg-violet-800/40 hover:border-violet-600 hover:text-violet-200"}`}
      >
        {pdfLoading ? "⏳ جارٍ إنشاء PDF..." : "📄 تنزيل PDF"}
      </button>
    </div>
  );
}