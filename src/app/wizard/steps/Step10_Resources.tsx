"use client";

import { useWizardStore } from "@/lib/store";
import MultiSelectChips from "@/components/wizard/MultiSelectChips";

const creativeAssetsList = [
  { label: "صور", value: "images" },
  { label: "فيديو", value: "video" },
  { label: "UGC", value: "ugc" },
  { label: "شهادات عملاء", value: "testimonials" },
  { label: "لوجو", value: "logo" },
  { label: "كتالوج", value: "catalog" },
  { label: "عروض جاهزة", value: "offers" },
  { label: "لا يوجد محتوى جاهز", value: "none" },
];

const contentCapacities = [
  { value: "easy", label: "نعم بسهولة" },
  { value: "slow", label: "نعم لكن ببطء" },
  { value: "hard", label: "بصعوبة" },
  { value: "no", label: "لا" },
];

const constraintsList = [
  { label: "وقت", value: "time" },
  { label: "ميزانية", value: "budget" },
  { label: "فريق", value: "team" },
  { label: "موافقات", value: "approvals" },
  { label: "محتوى", value: "content" },
  { label: "قانوني", value: "legal" },
  { label: "تقني", value: "technical" },
  { label: "سياسة منصة", value: "platform_policy" },
  { label: "خدمة العملاء", value: "customer_service" },
  { label: "الرد السريع", value: "response_time" },
];

const responseSpeeds = [
  { value: "instant", label: "فوري" },
  { value: "within_hour", label: "خلال ساعة" },
  { value: "within_day", label: "خلال يوم" },
  { value: "slower", label: "أبطأ من ذلك" },
  { value: "unknown", label: "غير معروف" },
];

export default function Step10_Resources() {
  const { creative_assets, content_capacity, constraints, response_speed, toggleArrayField, setField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">الموارد والقيود</h2>
        <p className="text-slate-400">حدد مواردك والقيود الموجودة</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الأصول المتاحة للإعلانات؟</label>
        <MultiSelectChips options={creativeAssetsList} selected={creative_assets} onToggle={(v) => toggleArrayField("creative_assets", v)} />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">هل يمكن إنتاج محتوى جديد للحملة؟</label>
        <div className="grid grid-cols-2 gap-3">
          {contentCapacities.map((c) => (
            <button
              key={c.value}
              onClick={() => setField("content_capacity", c.value as any)}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                content_capacity === c.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما القيود الموجودة؟</label>
        <MultiSelectChips options={constraintsList} selected={constraints} onToggle={(v) => toggleArrayField("constraints", v)} />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">كم سرعة الرد المتاحة على الاستفسارات؟</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {responseSpeeds.map((s) => (
            <button
              key={s.value}
              onClick={() => setField("response_speed", s.value as any)}
              className={`p-3 rounded-xl border-2 text-right transition-all text-sm ${
                response_speed === s.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}