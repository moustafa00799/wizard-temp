"use client";

import { useWizardStore } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import MultiSelectChips from "@/components/wizard/MultiSelectChips";

const awarenessLevels = [
  { value: "unaware", label: "لا يعرف المشكلة أصلًا" },
  { value: "problem_aware", label: "يعرف المشكلة لكنه لا يعرف الحل" },
  { value: "solution_aware", label: "يعرف الحل لكنه لا يعرفنا" },
  { value: "brand_aware", label: "يعرفنا لكنه لم يشترِ بعد" },
  { value: "purchase_ready", label: "جاهز للشراء الآن" },
];

const audienceSegmentsList = [
  { label: "مبتدئ", value: "beginner" },
  { label: "متوسط", value: "mid" },
  { label: "متقدم", value: "advanced" },
  { label: "High Intent", value: "high_intent" },
  { label: "زوار الموقع", value: "website_visitors" },
  { label: "متفاعلون", value: "engagers" },
  { label: "عملاء سابقون", value: "existing_customers" },
  { label: "جمهور مشابه", value: "lookalike" },
  { label: "جمهور بارد", value: "cold_audience" },
];

const geoScopes = [
  { value: "single_city", label: "مدينة واحدة" },
  { value: "multiple_cities", label: "عدة مدن" },
  { value: "country", label: "دولة كاملة" },
  { value: "multiple_countries", label: "عدة دول" },
  { value: "local_radius", label: "محلي حول فرع" },
  { value: "geo_custom", label: "استهداف حسب نطاق معين" },
];

export default function Step5_Audience() {
  const { ideal_customer, awareness_level, audience_segments, geo_scope, target_locations, setField, toggleArrayField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">الجمهور</h2>
        <p className="text-slate-400">ساعدنا في فهم جمهورك المستهدف</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">من هو العميل المثالي الذي تريد استهدافه؟</label>
        <Textarea
          value={ideal_customer}
          onChange={(e) => setField("ideal_customer", e.target.value)}
          placeholder="العمر، النوع، الاهتمامات، الوظيفة، الموقع، السلوك"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
        />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">هذا الجمهور يعرف الحل بالفعل؟</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {awarenessLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setField("awareness_level", level.value as any)}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                awareness_level === level.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">هل توجد شرائح مختلفة داخل الجمهور؟</label>
        <MultiSelectChips options={audienceSegmentsList} selected={audience_segments} onToggle={(v) => toggleArrayField("audience_segments", v)} />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">أين تريد الاستهداف؟</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {geoScopes.map((geo) => (
            <button
              key={geo.value}
              onClick={() => setField("geo_scope", geo.value as any)}
              className={`p-3 rounded-xl border-2 text-right transition-all text-sm ${
                geo_scope === geo.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {geo.label}
            </button>
          ))}
        </div>
      </div>
      {geo_scope && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <label className="block text-lg font-semibold text-slate-200">اكتب المواقع المستهدفة</label>
          <Textarea
            value={target_locations.join(", ")}
            onChange={(e) => setField("target_locations", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="مثال: القاهرة، الجيزة، الرياض"
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      )}
    </div>
  );
}