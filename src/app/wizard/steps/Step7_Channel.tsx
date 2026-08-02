"use client";

import { useWizardStore } from "@/lib/store";
import MultiSelectChips from "@/components/wizard/MultiSelectChips";

const conversionDestinations = [
  { value: "website", label: "موقع" },
  { value: "store", label: "متجر" },
  { value: "whatsapp", label: "واتساب" },
  { value: "messenger", label: "ماسنجر" },
  { value: "call", label: "مكالمة" },
  { value: "form", label: "فورم" },
  { value: "app", label: "تطبيق" },
  { value: "booking", label: "حجز موعد" },
];

const adChannelsList = [
  { label: "Meta", value: "meta" },
  { label: "Google Ads", value: "google_ads" },
  { label: "TikTok Ads", value: "tiktok_ads" },
  { label: "Snapchat Ads", value: "snapchat_ads" },
  { label: "YouTube", value: "youtube" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "X", value: "x" },
  { label: "أكثر من قناة", value: "multi_channel" },
];

const campaignDirections = [
  { value: "prospecting", label: "Prospecting" },
  { value: "retargeting", label: "Retargeting" },
  { value: "mixed", label: "Mixed" },
  { value: "lead_generation", label: "Lead Generation" },
  { value: "conversion", label: "Conversion" },
  { value: "awareness", label: "Awareness" },
  { value: "testing", label: "Testing" },
  { value: "unknown", label: "لا أعرف" },
];

export default function Step7_Channel() {
  const { conversion_destination, ad_channels, campaign_direction, setField, toggleArrayField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">القناة والتحويل</h2>
        <p className="text-slate-400">حدد وجهة التحويل والقنوات الإعلانية</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">أين تريد أن تتم النتيجة النهائية؟</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {conversionDestinations.map((d) => (
            <button
              key={d.value}
              onClick={() => setField("conversion_destination", d.value as any)}
              className={`p-3 rounded-xl border-2 text-right transition-all text-sm ${
                conversion_destination === d.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما القنوات التي تريد استخدامها؟</label>
        <MultiSelectChips options={adChannelsList} selected={ad_channels} onToggle={(v) => toggleArrayField("ad_channels", v)} />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الأقرب لهدفك؟</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {campaignDirections.map((d) => (
            <button
              key={d.value}
              onClick={() => setField("campaign_direction", d.value as any)}
              className={`p-3 rounded-xl border-2 text-right transition-all text-sm ${
                campaign_direction === d.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}