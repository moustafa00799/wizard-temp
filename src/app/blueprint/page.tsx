"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import { BlueprintExporter } from "@/components/BlueprintExporter";

// FIX C: All blueprint fields typed as optional to force safe access
interface Blueprint {
  strategy_summary?: string;
  recommended_funnel?: string | string[];
  campaign_structure?: string | Record<string, unknown>;
  audience_structure?: string | Record<string, unknown>;
  budget_split?: string | Record<string, unknown>;
  creative_angles?: string | string[];
  tracking_checklist?: string | string[];
  risk_flags?: string | string[];
  first_14_days_plan?: string | string[];
  pre_launch_fixes?: string | string[];
  [key: string]: unknown;
}

// FIX C: Render any value safely — object, array, string, or null
function renderValue(val: unknown): React.ReactNode {
  if (val === null || val === undefined) return <span className="text-gray-500">—</span>;
  if (typeof val === "string") return <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{val}</p>;
  if (typeof val === "number" || typeof val === "boolean") return <p className="text-gray-300 text-sm">{String(val)}</p>;
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-gray-500">—</span>;
    return (
      <ul className="space-y-1">
        {val.map((item, i) => (
          <li key={i} className="text-gray-300 text-sm flex gap-2">
            <span className="text-violet-400 flex-shrink-0">•</span>
            <span>{typeof item === "string" ? item : JSON.stringify(item, null, 2)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof val === "object") {
    return (
      <pre className="text-gray-300 text-xs bg-gray-900/50 rounded-lg p-3 overflow-auto">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  }
  return <span className="text-gray-300 text-sm">{String(val)}</span>;
}

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

const SECTION_ICONS: Record<string, string> = {
  strategy_summary: "🎯",
  recommended_funnel: "🔄",
  campaign_structure: "🏗️",
  audience_structure: "👥",
  budget_split: "💰",
  creative_angles: "🎨",
  tracking_checklist: "📊",
  risk_flags: "⚠️",
  first_14_days_plan: "📅",
  pre_launch_fixes: "🔧",
};

const SECTION_ORDER = Object.keys(SECTION_LABELS);

export default function BlueprintPage() {
  const router = useRouter();
  // FIX D: resetWizard lives HERE, triggered only on "New Strategy"
  const { resetWizard, data } = useWizardStore();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // FIX C: Safe read from sessionStorage
    try {
      const raw = sessionStorage.getItem("wizard_blueprint");
      if (!raw) {
        setLoadError("لم يتم العثور على بيانات الخطة. يرجى إعادة تعبئة الاستبيان.");
        return;
      }
      const parsed = JSON.parse(raw);
      setBlueprint(parsed ?? null);
    } catch {
      setLoadError("حدث خطأ في قراءة بيانات الخطة.");
    }
  }, []);

  // FIX D: resetWizard called ONLY here on "New Strategy"
  const handleNewStrategy = () => {
    sessionStorage.removeItem("wizard_blueprint");
    resetWizard();
    router.push("/wizard");
  };

  // FIX C: Null/error state handled gracefully
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

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Header */}
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
        {/* Success banner */}
                {/* ── TASK 3: Export buttons ── */}
        <div className="bg-gray-800/40 border border-gray-700/60 rounded-2xl p-5">
          <p className="text-gray-400 text-sm text-center mb-4">
            احفظ خطتك الإعلانية
          </p>
          <BlueprintExporter
            blueprint={blueprint}
            businessType={data.business_type ?? undefined}
          />
        </div>
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 text-center">
          <p className="text-green-400 font-semibold text-lg">✓ تم بناء الخطة بنجاح</p>
          <p className="text-gray-400 text-sm mt-1">
            فيما يلي كامل التوصيات والخطوات بناءً على بياناتك
          </p>
        </div>

        {/* Render ordered sections */}
        {SECTION_ORDER.map((key) => {
          // FIX C: Safe access with optional chaining
          const val = blueprint?.[key];
          return (
            <section
              key={key}
              className="bg-gray-800/40 border border-gray-700/60 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-700/60 flex items-center gap-3">
                <span className="text-xl">{SECTION_ICONS[key] ?? "📋"}</span>
                <h2 className="text-white font-semibold text-base">
                  {SECTION_LABELS[key] ?? key}
                </h2>
              </div>
              <div className="px-5 py-4">
                {renderValue(val)}
              </div>
            </section>
          );
        })}

        {/* Any extra keys the backend returned that we don't know about */}
        {Object.keys(blueprint ?? {})
          .filter((k) => !SECTION_ORDER.includes(k))
          .map((key) => (
            <section
              key={key}
              className="bg-gray-800/40 border border-gray-700/60 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-700/60">
                <h2 className="text-white font-semibold text-base capitalize">{key}</h2>
              </div>
              <div className="px-5 py-4">
                {/* FIX C: safe access */}
                {renderValue(blueprint?.[key])}
              </div>
            </section>
          ))}

                {/* Bottom CTAs */}
        <div className="pb-8 space-y-4">
          {/* Export again at bottom */}
                    <div className="text-center">
            <button
              onClick={handleNewStrategy}
              className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-violet-900/30"
            >
              🔁 ابدأ استراتيجية جديدة
            </button>
          </div></div>
      </main>
    </div>
  );
}
