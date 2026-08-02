"use client";

import { useWizardStore } from "@/lib/store";
import QuestionCard from "@/components/wizard/QuestionCard";
import MultiSelectChips from "@/components/wizard/MultiSelectChips";
import { Target, Users, MessageCircle, Eye, Download, RotateCcw, Calendar, Phone } from "lucide-react";

const objectives = [
  { value: "sales", label: "مبيعات", icon: Target },
  { value: "leads", label: "Leads", icon: Users },
  { value: "messages", label: "رسائل", icon: MessageCircle },
  { value: "traffic", label: "زيارات", icon: Eye },
  { value: "app_installs", label: "تثبيت تطبيق", icon: Download },
  { value: "awareness", label: "وعي", icon: Eye },
  { value: "retargeting", label: "إعادة استهداف", icon: RotateCcw },
  { value: "booking", label: "حجز موعد / استشارة", icon: Calendar },
  { value: "calls", label: "مكالمات", icon: Phone },
];

const secondaryObjectives = [
  { label: "جمع بيانات عملاء", value: "lead_capture" },
  { label: "رفع الوعي", value: "brand_awareness" },
  { label: "اختبار جمهور", value: "audience_testing" },
  { label: "اختبار رسائل", value: "message_testing" },
  { label: "بناء جمهور دافئ", value: "warm_audience" },
  { label: "زيادة الطلب الموسمي", value: "seasonal_demand" },
  { label: "تقليل تكلفة الاكتساب", value: "reduce_cac" },
];

const kpis = [
  { label: "عدد المبيعات", value: "sales_count" },
  { label: "تكلفة الاكتساب", value: "cac" },
  { label: "عدد الرسائل", value: "message_count" },
  { label: "عدد العملاء المحتملين", value: "lead_count" },
  { label: "عدد المكالمات", value: "call_count" },
  { label: "عدد التثبيتات", value: "install_count" },
  { label: "العائد على الإنفاق الإعلاني", value: "roas" },
  { label: "معدل التحويل", value: "conversion_rate" },
];

export default function Step3_Objective() {
  const { primary_objective, secondary_objectives, north_star_kpi, setField, toggleArrayField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">الهدف التجاري</h2>
        <p className="text-slate-400">حدد أهداف حملتك الإعلانية</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الهدف الأساسي للحملة؟</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {objectives.map((obj) => (
            <QuestionCard
              key={obj.value}
              icon={obj.icon}
              label={obj.label}
              selected={primary_objective === obj.value}
              onClick={() => setField("primary_objective", obj.value as any)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الأهداف الثانوية المهمة أيضًا؟</label>
        <MultiSelectChips
          options={secondaryObjectives}
          selected={secondary_objectives}
          onToggle={(value) => toggleArrayField("secondary_objectives", value)}
        />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما أهم مؤشر نجاح بالنسبة لك؟</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <button
              key={kpi.value}
              onClick={() => setField("north_star_kpi", kpi.value as any)}
              className={`p-3 rounded-xl border-2 text-right transition-all text-sm ${
                north_star_kpi === kpi.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {kpi.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}