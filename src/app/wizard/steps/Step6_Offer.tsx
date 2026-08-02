"use client";

import { useWizardStore } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import MultiSelectChips from "@/components/wizard/MultiSelectChips";

const offerTypes = [
  { value: "discount", label: "خصم" },
  { value: "bundle", label: "باقة" },
  { value: "consultation", label: "استشارة" },
  { value: "free_trial", label: "تجربة مجانية" },
  { value: "guarantee", label: "ضمان" },
  { value: "free_shipping", label: "شحن مجاني" },
  { value: "special_price", label: "سعر خاص" },
  { value: "limited_time", label: "مدة محدودة" },
  { value: "no_clear_offer", label: "لا يوجد عرض واضح" },
];

const objectionsList = [
  { label: "السعر", value: "price" },
  { label: "عدم الثقة", value: "trust" },
  { label: "لم أقتنع بالقيمة", value: "value_unclear" },
  { label: "تجربة سابقة سيئة", value: "bad_past_experience" },
  { label: "الخوف من النتيجة", value: "fear_of_outcome" },
  { label: "الوقت", value: "time" },
  { label: "صعوبة التنفيذ", value: "complexity" },
  { label: "المقارنة مع المنافسين", value: "competitor_comparison" },
  { label: "لا توجد اعتراضات واضحة", value: "none" },
];

const persuasionAngles = [
  { value: "price", label: "السعر" },
  { value: "value", label: "القيمة" },
  { value: "trust", label: "الثقة" },
  { value: "speed", label: "السرعة" },
  { value: "result", label: "النتيجة" },
  { value: "specialization", label: "التخصص" },
  { value: "scarcity", label: "الندرة" },
  { value: "social_proof", label: "الشهادات / testimonials" },
  { value: "guarantee", label: "الضمان" },
];

export default function Step6_Offer() {
  const { offer_type, core_message, objections, persuasion_angle, setField, toggleArrayField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">العرض والرسائل</h2>
        <p className="text-slate-400">حدد عرضك ورسالتك الإعلانية</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما نوع العرض الذي تقدمه؟</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {offerTypes.map((o) => (
            <button
              key={o.value}
              onClick={() => setField("offer_type", o.value as any)}
              className={`p-3 rounded-xl border-2 text-right transition-all text-sm ${
                offer_type === o.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الجملة الأساسية التي تريد أن يفهمها العميل فورًا؟</label>
        <Textarea
          value={core_message}
          onChange={(e) => setField("core_message", e.target.value)}
          placeholder="اكتب الرسالة كما ستظهر في الإعلان أو الهيدر"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
        />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما أكثر الاعتراضات التي تمنع العميل من الشراء؟</label>
        <MultiSelectChips options={objectionsList} selected={objections} onToggle={(v) => toggleArrayField("objections", v)} />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الزاوية الإقناعية الأقوى؟</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {persuasionAngles.map((a) => (
            <button
              key={a.value}
              onClick={() => setField("persuasion_angle", a.value as any)}
              className={`p-3 rounded-xl border-2 text-right transition-all text-sm ${
                persuasion_angle === a.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}