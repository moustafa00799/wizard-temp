"use client";

import { useWizardStore } from "@/lib/store";
import QuestionCard from "@/components/wizard/QuestionCard";
import { Rocket, RefreshCw, Stethoscope, GitBranch, FlaskConical } from "lucide-react";

const buildModes = [
  { value: "new_campaign", label: "حملة جديدة من الصفر", icon: Rocket, description: "ابنِ حملتك الإعلانية من الصفر" },
  { value: "optimize_existing", label: "تحسين حملة موجودة", icon: RefreshCw, description: "حسّن أداء حملاتك الحالية" },
  { value: "diagnose_business", label: "تشخيص نشاط قبل الإطلاق", icon: Stethoscope, description: "تأكد من جاهزية نشاطك" },
  { value: "restructure_account", label: "إعادة هيكلة الحساب الإعلاني", icon: GitBranch, description: "نظم حساباتك الإعلانية" },
  { value: "test_plan", label: "بناء خطة اختبار أولية", icon: FlaskConical, description: "اختبر استراتيجيات مختلفة" },
];

export default function Step0_Start() {
  const { build_mode, setField } = useWizardStore();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">ما الذي تريد أن يبنيه النظام لك؟</h2>
        <p className="text-slate-400">اختر نقطة البداية المناسبة لنشاطك</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buildModes.map((mode) => (
          <QuestionCard
            key={mode.value}
            icon={mode.icon}
            label={mode.label}
            description={mode.description}
            selected={build_mode === mode.value}
            onClick={() => setField("build_mode", mode.value as any)}
          />
        ))}
      </div>
    </div>
  );
}