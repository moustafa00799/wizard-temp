"use client";

import { useWizardStore } from "@/lib/store";

const topPriorities = [
  { value: "increase_demand", label: "زيادة الطلب" },
  { value: "reduce_cost", label: "تقليل التكلفة" },
  { value: "lead_quality", label: "تحسين جودة العملاء" },
  { value: "conversion_rate", label: "رفع معدل التحويل" },
  { value: "awareness", label: "بناء الوعي" },
  { value: "tracking_fix", label: "إصلاح التتبع" },
  { value: "account_structure", label: "تنظيم الحساب الإعلاني" },
];

const riskTolerances = [
  { value: "very_low", label: "منخفض جدًا" },
  { value: "medium", label: "متوسط" },
  { value: "high_if_return", label: "مرتفع إذا كان العائد جيد" },
  { value: "result_first", label: "لا يهم طالما النتائج قوية" },
];

export default function Step11_Priority() {
  const { top_priority, risk_tolerance, setField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">الأولوية والمخاطرة</h2>
        <p className="text-slate-400">حدد أولوياتك ومستوى المخاطرة المقبول</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">لو لم نحل كل شيء، فما الأولوية الأولى؟</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topPriorities.map((p) => (
            <button
              key={p.value}
              onClick={() => setField("top_priority", p.value as any)}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                top_priority === p.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما مستوى المخاطرة الذي تقبله في الاختبار؟</label>
        <div className="grid grid-cols-2 gap-3">
          {riskTolerances.map((r) => (
            <button
              key={r.value}
              onClick={() => setField("risk_tolerance", r.value as any)}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                risk_tolerance === r.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}