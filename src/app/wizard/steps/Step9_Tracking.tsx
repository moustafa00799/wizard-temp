"use client";

import { useWizardStore } from "@/lib/store";
import MultiSelectChips from "@/components/wizard/MultiSelectChips";

const trackingStatuses = [
  { value: "ready", label: "جاهز بالكامل" },
  { value: "partial", label: "جزء منه جاهز" },
  { value: "unknown", label: "غير متأكد" },
  { value: "missing", label: "غير موجود" },
  { value: "issues", label: "فيه مشاكل معروفة" },
];

const trackingToolsList = [
  { label: "Pixel", value: "pixel" },
  { label: "CAPI", value: "capi" },
  { label: "GA4", value: "ga4" },
  { label: "GTM", value: "gtm" },
  { label: "SDK", value: "sdk" },
  { label: "CRM", value: "crm" },
  { label: "Offline conversion tracking", value: "offline_tracking" },
  { label: "UTM tracking", value: "utm" },
  { label: "لا يوجد شيء", value: "none" },
];

const keyEventsList = [
  { label: "Page View", value: "page_view" },
  { label: "View Content", value: "view_content" },
  { label: "Add to Cart", value: "add_to_cart" },
  { label: "Initiate Checkout", value: "initiate_checkout" },
  { label: "Purchase", value: "purchase" },
  { label: "Lead", value: "lead" },
  { label: "Complete Registration", value: "complete_registration" },
  { label: "Submit Form", value: "submit_form" },
  { label: "Call", value: "call" },
  { label: "WhatsApp Click", value: "whatsapp_click" },
  { label: "App Install", value: "app_install" },
  { label: "App Event", value: "app_event" },
  { label: "Offline Sale", value: "offline_sale" },
];

const conversionModels = [
  { value: "online", label: "Online فقط" },
  { value: "offline", label: "Offline فقط" },
  { value: "both", label: "الاثنين معًا" },
  { value: "unknown", label: "غير متأكد" },
];

export default function Step9_Tracking() {
  const { tracking_status, tracking_tools, key_events, conversion_model, setField, toggleArrayField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">التتبع والقياس</h2>
        <p className="text-slate-400">حدد أدوات التتبع والأحداث المهمة</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما حالة التتبع الآن؟</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {trackingStatuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setField("tracking_status", s.value as any)}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                tracking_status === s.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الأدوات الموجودة؟</label>
        <MultiSelectChips options={trackingToolsList} selected={tracking_tools} onToggle={(v) => toggleArrayField("tracking_tools", v)} />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الأحداث التي تريد تتبعها؟</label>
        <MultiSelectChips options={keyEventsList} selected={key_events} onToggle={(v) => toggleArrayField("key_events", v)} />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">هل التحويل يحدث أونلاين أم أوفلاين؟</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {conversionModels.map((m) => (
            <button
              key={m.value}
              onClick={() => setField("conversion_model", m.value as any)}
              className={`p-3 rounded-xl border-2 text-right transition-all text-sm ${
                conversion_model === m.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}