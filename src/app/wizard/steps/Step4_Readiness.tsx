"use client";

import { useWizardStore } from "@/lib/store";
import MultiSelectChips from "@/components/wizard/MultiSelectChips";
import { Textarea } from "@/components/ui/textarea";

const assets = [
  { label: "موقع", value: "website" },
  { label: "Landing Page", value: "landing_page" },
  { label: "متجر إلكتروني", value: "store" },
  { label: "واتساب بزنس", value: "whatsapp_business" },
  { label: "CRM", value: "crm" },
  { label: "صفحة فيسبوك", value: "facebook_page" },
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
  { label: "Google Analytics", value: "ga4" },
  { label: "Pixel", value: "pixel" },
  { label: "CAPI", value: "capi" },
  { label: "كتالوج منتجات", value: "catalog" },
  { label: "لا يوجد شيء جاهز", value: "nothing_ready" },
];

const campaignStatuses = [
  { value: "successful", label: "نعم، ونجحت" },
  { value: "weak", label: "نعم، لكنها ضعيفة" },
  { value: "unclear", label: "نعم، لكن بدون نتائج واضحة" },
  { value: "none", label: "لا، أول مرة" },
];

export default function Step4_Readiness() {
  const { existing_assets, previous_campaigns_status, past_performance_notes, toggleArrayField, setField } = useWizardStore();
  const hasPreviousCampaigns = ["successful", "weak", "unclear"].includes(previous_campaigns_status || "");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">جاهزية المشروع</h2>
        <p className="text-slate-400">ما الأصول والقنوات الموجودة لديك الآن؟</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الأصول أو القنوات الموجودة الآن؟</label>
        <MultiSelectChips options={assets} selected={existing_assets} onToggle={(v) => toggleArrayField("existing_assets", v)} />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">هل سبق تشغيل حملات من قبل؟</label>
        <div className="grid grid-cols-2 gap-3">
          {campaignStatuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setField("previous_campaigns_status", s.value as any)}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                previous_campaigns_status === s.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {hasPreviousCampaigns && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <label className="block text-lg font-semibold text-slate-200">اذكر أي أرقام أو ملاحظات من الحملات السابقة</label>
          <Textarea
            value={past_performance_notes}
            onChange={(e) => setField("past_performance_notes", e.target.value)}
            placeholder="ميزانية، CPL، CPA، ROAS، CTR، أو أي ملاحظات مهمة"
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
          />
        </div>
      )}
    </div>
  );
}