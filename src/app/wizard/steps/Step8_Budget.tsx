"use client";

import { useWizardStore } from "@/lib/store";
import { Input } from "@/components/ui/input";

const budgetBands = [
  { value: "under_100", label: "أقل من 100 يوميًا" },
  { value: "100_300", label: "100–300 يوميًا" },
  { value: "300_1000", label: "300–1000 يوميًا" },
  { value: "1000_5000", label: "1000–5000 يوميًا" },
  { value: "above_5000", label: "أكثر من ذلك" },
  { value: "unknown", label: "غير محدد بعد" },
];

const budgetFlexibilities = [
  { value: "fixed", label: "ثابتة جدًا" },
  { value: "slightly_flexible", label: "مرنة قليلًا" },
  { value: "flexible", label: "مرنة" },
  { value: "scale_if_positive", label: "أستطيع التوسع إذا ظهرت نتائج" },
];

export default function Step8_Budget() {
  const { budget_band, budget_flexibility, average_order_value, profit_margin, max_cac, setField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">الميزانية والاقتصاد</h2>
        <p className="text-slate-400">حدد ميزانيتك والأرقام الاقتصادية</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما نطاق الميزانية المتاح؟</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {budgetBands.map((b) => (
            <button
              key={b.value}
              onClick={() => setField("budget_band", b.value as any)}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                budget_band === b.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">هل الميزانية ثابتة أم مرنة؟</label>
        <div className="grid grid-cols-2 gap-3">
          {budgetFlexibilities.map((f) => (
            <button
              key={f.value}
              onClick={() => setField("budget_flexibility", f.value as any)}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                budget_flexibility === f.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">متوسط قيمة الصفقة</label>
          <Input
            type="number"
            value={average_order_value || ""}
            onChange={(e) => setField("average_order_value", e.target.value ? Number(e.target.value) : null)}
            placeholder="مثال: 500"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">هامش الربح (%)</label>
          <Input
            type="number"
            value={profit_margin || ""}
            onChange={(e) => setField("profit_margin", e.target.value ? Number(e.target.value) : null)}
            placeholder="مثال: 30"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">أقصى تكلفة اكتساب</label>
          <Input
            type="number"
            value={max_cac || ""}
            onChange={(e) => setField("max_cac", e.target.value ? Number(e.target.value) : null)}
            placeholder="CPA / CPL"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>
    </div>
  );
}