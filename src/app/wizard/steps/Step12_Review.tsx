"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore, DataModel } from "@/lib/store";

// FIX B: Required fields the backend will reject if missing
const REQUIRED_FIELDS: { key: keyof DataModel; label: string; step: number }[] =
  [
    { key: "business_type", label: "نوع النشاط", step: 1 },
    { key: "offer_description", label: "وصف العرض", step: 1 },
    { key: "primary_objective", label: "الهدف الأساسي", step: 3 },
    { key: "awareness_level", label: "مستوى الوعي", step: 5 },
    { key: "core_message", label: "الرسالة الأساسية", step: 6 },
  ];

interface SummaryRow {
  label: string;
  value: string;
}

function buildSummary(data: DataModel): SummaryRow[] {
  const label = (v: string | null | undefined) => v ?? "—";
  const arr = (v: string[]) => (v.length ? v.join("، ") : "—");

  return [
    { label: "المسار", value: label(data.build_mode) },
    { label: "نوع النشاط", value: label(data.business_type) },
    { label: "وصف العرض", value: label(data.offer_description) },
    { label: "طريقة البيع", value: label(data.sales_motion) },
    { label: "مشكلة العميل", value: label(data.customer_problem) },
    { label: "الميزة التنافسية", value: label(data.usp) },
    { label: "الهدف الأساسي", value: label(data.primary_objective) },
    { label: "مؤشر النجاح", value: label(data.north_star_kpi) },
    { label: "الأصول الموجودة", value: arr(data.existing_assets) },
    { label: "الجمهور المثالي", value: label(data.ideal_customer) },
    { label: "مستوى الوعي", value: label(data.awareness_level) },
    { label: "النطاق الجغرافي", value: label(data.geo_scope) },
    { label: "نوع العرض", value: label(data.offer_type) },
    { label: "الرسالة الأساسية", value: label(data.core_message) },
    { label: "القنوات الإعلانية", value: arr(data.ad_channels) },
    { label: "وجهة التحويل", value: label(data.conversion_destination) },
    { label: "الميزانية اليومية", value: label(data.budget_band) },
    { label: "مرونة الميزانية", value: label(data.budget_flexibility) },
    { label: "متوسط قيمة الطلب", value: data.average_order_value ? String(data.average_order_value) : "—" },
    { label: "حالة التتبع", value: label(data.tracking_status) },
    { label: "القيود", value: arr(data.constraints) },
    { label: "الأولوية الأولى", value: label(data.top_priority) },
    { label: "مستوى المخاطرة", value: label(data.risk_tolerance) },
  ];
}

export default function Step12_Review({ onBack, onGoToStep }: { onBack: () => void; onGoToStep: (step: number) => void }) {
  const { data } = useWizardStore();
  // FIX D: resetWizard is NOT called here — it's called on the blueprint page
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<typeof REQUIRED_FIELDS>([]);

  const summary = buildSummary(data);

  const handleSubmit = async () => {
    setError(null);

    // FIX B: Validate required fields before sending
    const missing = REQUIRED_FIELDS.filter((f) => {
      const val = data[f.key];
      if (val === null || val === undefined) return true;
      if (typeof val === "string" && val.trim() === "") return true;
      return false;
    });

    if (missing.length > 0) {
      setMissingFields(missing);
      return;
    }
    setMissingFields([]);

    // FIX B: Build payload with safe fallbacks — backend never receives null for any field
    const payload = {
      build_mode: data.build_mode ?? "new_campaign",
      business_type: data.business_type!, // validated above
      offer_description: data.offer_description?.trim() || "",
      sales_motion: data.sales_motion ?? "multi_channel",
      customer_problem: data.customer_problem?.trim() || "",
      key_value_drivers: data.key_value_drivers ?? [],
      usp: data.usp?.trim() || "",
      primary_objective: data.primary_objective!, // validated above
      secondary_objectives: data.secondary_objectives ?? [],
      north_star_kpi: data.north_star_kpi ?? "sales_count",
      existing_assets: data.existing_assets ?? [],
      previous_campaigns_status: data.previous_campaigns_status ?? "none",
      past_performance_notes: data.past_performance_notes?.trim() || "",
      ideal_customer: data.ideal_customer?.trim() || "",
      awareness_level: data.awareness_level!, // validated above
      audience_segments: data.audience_segments ?? [],
      geo_scope: data.geo_scope ?? "country",
      target_locations: data.target_locations ?? [],
      offer_type: data.offer_type ?? "no_clear_offer",
      core_message: data.core_message?.trim() || "", // validated above (non-empty)
      objections: data.objections ?? [],
      persuasion_angle: data.persuasion_angle ?? "value",
      conversion_destination: data.conversion_destination ?? "website",
      ad_channels: data.ad_channels ?? [],
      campaign_direction: data.campaign_direction ?? "unknown",
      budget_band: data.budget_band ?? "unknown",
      budget_flexibility: data.budget_flexibility ?? "flexible",
      average_order_value: data.average_order_value ?? 0,
      profit_margin: data.profit_margin ?? 0,
      max_cac: data.max_cac ?? 0,
      tracking_status: data.tracking_status ?? "unknown",
      tracking_tools: data.tracking_tools ?? [],
      key_events: data.key_events ?? [],
      conversion_model: data.conversion_model ?? "unknown",
      creative_assets: data.creative_assets ?? [],
      content_capacity: data.content_capacity ?? "slow",
      constraints: data.constraints ?? [],
      response_speed: data.response_speed ?? "unknown",
      top_priority: data.top_priority ?? "increase_demand",
      risk_tolerance: data.risk_tolerance ?? "medium",
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:3000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

            if (!res.ok || json.success === false) {
        const backendErrors = json.errors ?? [json.message ?? json.error ?? "خطأ من الخادم"];
        const errorText = Array.isArray(backendErrors) ? backendErrors.join("، ") : backendErrors;
        throw new Error(errorText);
      }

      // Store blueprint in sessionStorage so blueprint page can read it
      sessionStorage.setItem("wizard_blueprint", JSON.stringify(json.blueprint ?? json));
      router.push("/blueprint");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl">
      <h2 className="text-xl font-bold text-white mb-6">مراجعة البيانات</h2>

      {/* Missing fields warning */}
      {missingFields.length > 0 && (
        <div className="mb-6 p-4 bg-red-900/40 border border-red-700 rounded-xl">
          <p className="text-red-300 font-semibold mb-3">
            ⚠️ يرجى إكمال الحقول الإلزامية التالية:
          </p>
          <ul className="space-y-2">
            {missingFields.map((f) => (
              <li key={f.key} className="flex items-center justify-between">
                <span className="text-red-200 text-sm">{f.label}</span>
                <button
                  onClick={() => onGoToStep(f.step)}
                  className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors"
                >
                  اذهب للخطوة {f.step}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error from backend */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/40 border border-red-700 rounded-xl">
          <p className="text-red-300 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Summary table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden mb-8">
        <div className="divide-y divide-gray-700/50">
          {summary.map((row) => (
            <div
              key={row.label}
              className="flex justify-between items-start px-4 py-3 hover:bg-gray-700/20 transition-colors"
            >
              <span className="text-gray-400 text-sm min-w-[120px]">{row.label}</span>
              <span className="text-gray-200 text-sm text-right max-w-[60%] break-words">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          ← السابق
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg
            ${isSubmitting
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-500 text-white shadow-green-900/30"
            }`}
        >
          {isSubmitting ? "جارٍ الإرسال..." : "✓ تأكيد وإرسال"}
        </button>
      </div>
    </div>
  );
}
