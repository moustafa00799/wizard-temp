"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import { BlueprintExporter } from "@/components/BlueprintExporter";
import {
  type BlueprintData,
  type ExecutiveSummary,
  SECTION_LABELS,
  SECTION_ICONS,
  SECTION_COLORS,
  SECTION_ORDER,
} from "@/lib/blueprint-types";

// ─── renderValue: handles the rich nested shapes from blueprint-engine ─────────

function renderValue(val: unknown): React.ReactNode {
  if (val === null || val === undefined) return <span className="text-gray-500">—</span>;

  if (typeof val === "string") {
    return <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{val}</p>;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return <p className="text-gray-300 text-sm">{String(val)}</p>;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-gray-500">—</span>;
    return (
      <ul className="space-y-1.5">
        {val.map((item, i) => (
          <li key={i} className="text-gray-300 text-sm flex gap-2">
            <span className="text-violet-400 flex-shrink-0 mt-0.5">•</span>
            <span className="flex-1">
              {typeof item === "string"
                ? item
                : renderValue(item)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (entries.length === 0) return <span className="text-gray-500">—</span>;

    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => {
          const isComplex = Array.isArray(v) || (typeof v === "object" && v !== null);
          return (
            <div key={k} className={isComplex ? "space-y-1" : "flex gap-2 items-start"}>
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide flex-shrink-0">
                {k.replace(/_/g, " ")}
                {isComplex ? "" : ":"}
              </span>
              {isComplex
                ? <div className="pr-3 border-r border-gray-700">{renderValue(v)}</div>
                : <span className="text-gray-300 text-sm">{String(v ?? "—")}</span>}
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="text-gray-300 text-sm">{String(val)}</span>;
}

// ─── Executive Summary card ────────────────────────────────────────────────────

function ExecutiveSummaryCard({ summary }: { summary: ExecutiveSummary }) {
  const readinessColor =
    summary.readiness_level === "strong" ? "text-green-400" :
    summary.readiness_level === "moderate" ? "text-yellow-400" : "text-red-400";

  const riskColor =
    summary.risk_level === "low" ? "text-green-400" :
    summary.risk_level === "medium" ? "text-yellow-400" : "text-red-400";

  const launchAr =
    summary.launch_recommendation === "ready"            ? "جاهز للإطلاق ✅" :
    summary.launch_recommendation === "ready_with_fixes" ? "جاهز بعد الإصلاحات ⚡" :
                                                           "غير جاهز للإطلاق ❌";

  const launchColor =
    summary.launch_recommendation === "ready"            ? "text-green-400" :
    summary.launch_recommendation === "ready_with_fixes" ? "text-yellow-400" : "text-red-400";

  return (
    <div className="bg-gray-800/40 border border-gray-700/60 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700/60 flex items-center gap-3">
        <span className="text-xl">📊</span>
        <h2 className="text-white font-semibold text-base">الملخص التنفيذي</h2>
      </div>
      <div className="px-5 py-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">جاهزية الإطلاق</p>
          <p className={`text-2xl font-bold ${readinessColor}`}>{summary.readiness_score}</p>
          <p className={`text-xs mt-0.5 ${readinessColor}`}>/100</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">مستوى المخاطر</p>
          <p className={`text-2xl font-bold ${riskColor}`}>{summary.risk_score}</p>
          <p className={`text-xs mt-0.5 ${riskColor}`}>/100</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">التوصية</p>
          <p className={`text-sm font-bold ${launchColor} leading-tight`}>{launchAr}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">تاريخ الإطلاق المتوقع</p>
          <p className="text-sm font-bold text-gray-200">{summary.estimated_launch_date}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BlueprintPage() {
  const router = useRouter();
  const { resetWizard, data } = useWizardStore();
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wizard_blueprint");
      if (!raw) {
        setLoadError("لم يتم العثور على بيانات الخطة. يرجى إعادة تعبئة الاستبيان.");
        return;
      }
      const parsed = JSON.parse(raw) as BlueprintData;
      setBlueprint(parsed ?? null);
    } catch {
      setLoadError("حدث خطأ في قراءة بيانات الخطة.");
    }
  }, []);

  const handleNewStrategy = () => {
    sessionStorage.removeItem("wizard_blueprint");
    resetWizard();
    router.push("/wizard");
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-6">😕</p>
          <p className="text-red-400 text-lg mb-6">{loadError}</p>
          <button
            onClick={handleNewStrategy}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors"
          >
            ابدأ استراتيجية جديدة
          </button>
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">جارٍ تحميل الخطة...</p>
        </div>
      </div>
    );
  }

  const bp = blueprint as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-violet-400 font-bold text-lg">الخطة الإعلانية</h1>
          <button
            onClick={handleNewStrategy}
            className="px-4 py-2 text-sm border border-gray-700 text-gray-400 rounded-xl hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            + استراتيجية جديدة
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Export buttons */}
        <div className="bg-gray-800/40 border border-gray-700/60 rounded-2xl p-5">
          <p className="text-gray-400 text-sm text-center mb-4">احفظ خطتك الإعلانية</p>
          <BlueprintExporter
            blueprint={blueprint}
            businessType={data.business_type ?? undefined}
            wizardData={data as unknown as Record<string, unknown>}
          />
        </div>

        {/* Success banner */}
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 text-center">
          <p className="text-green-400 font-semibold text-lg">✓ تم بناء الخطة بنجاح</p>
          <p className="text-gray-400 text-sm mt-1">
            فيما يلي كامل التوصيات والخطوات بناءً على بياناتك
          </p>
        </div>

        {/* Executive Summary — special card, rendered before the loop */}
        {blueprint.executive_summary && (
          <ExecutiveSummaryCard summary={blueprint.executive_summary as ExecutiveSummary} />
        )}

        {/* Main sections loop — executive_summary excluded from SECTION_ORDER */}
        {SECTION_ORDER.map((key) => {
          const val = bp[key];
          const colors = SECTION_COLORS[key] ?? { border: "#6b7280" };
          return (
            <section
              key={key}
              className="bg-gray-800/40 border border-gray-700/60 rounded-2xl overflow-hidden"
              style={{ borderRightColor: colors.border, borderRightWidth: "3px" }}
            >
              <div className="px-5 py-4 border-b border-gray-700/60 flex items-center gap-3">
                <span className="text-xl">{SECTION_ICONS[key] ?? "📋"}</span>
                <h2 className="text-white font-semibold text-base">
                  {SECTION_LABELS[key] ?? key}
                </h2>
              </div>
              <div className="px-5 py-4">{renderValue(val)}</div>
            </section>
          );
        })}

        {/* Extra keys not in SECTION_ORDER and not internal fields */}
        {Object.keys(bp)
          .filter(
            (k) =>
              !SECTION_ORDER.includes(k) &&
              k !== "executive_summary" &&
              !["blueprint_id", "version", "rule_engine_version", "generated_at", "flags", "debug"].includes(k) &&
              bp[k] !== null
          )
          .map((key) => (
            <section
              key={key}
              className="bg-gray-800/40 border border-gray-700/60 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-700/60">
                <h2 className="text-white font-semibold text-base capitalize">
                  {key.replace(/_/g, " ")}
                </h2>
              </div>
              <div className="px-5 py-4">{renderValue(bp[key])}</div>
            </section>
          ))}

        {/* Bottom CTA */}
        <div className="pb-8 text-center">
          <button
            onClick={handleNewStrategy}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-violet-900/30"
          >
            🔁 ابدأ استراتيجية جديدة
          </button>
        </div>
      </main>
    </div>
  );
}
