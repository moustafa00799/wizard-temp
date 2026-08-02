"use client";
import { useWizardStore } from "@/lib/store";
import {
  QuestionCard,
  SingleSelect,
  MultiSelectChips,
  StepNav,
} from "@/components/WizardComponents";

const trackingStatuses = [
  { label: "جاهز بالكامل", value: "ready" },
  { label: "جزء منه جاهز", value: "partial" },
  { label: "غير متأكد", value: "unknown" },
  { label: "غير موجود", value: "missing" },
  { label: "فيه مشاكل معروفة", value: "issues" },
];

const trackingTools = [
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

const keyEvents = [
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
  { label: "Online فقط", value: "online" },
  { label: "Offline فقط", value: "offline" },
  { label: "الاثنين معًا", value: "both" },
  { label: "غير متأكد", value: "unknown" },
];

export default function Step9_Tracking({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data, setField } = useWizardStore();

  return (
    <div>
      <QuestionCard label="ما حالة التتبع الآن؟">
        <SingleSelect
          options={trackingStatuses}
          value={data.tracking_status}
          onChange={(v) => setField("tracking_status", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما الأدوات الموجودة؟">
        <MultiSelectChips
          options={trackingTools}
          value={data.tracking_tools}
          onChange={(v) => setField("tracking_tools", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما الأحداث التي تريد تتبعها؟">
        <MultiSelectChips
          options={keyEvents}
          value={data.key_events}
          onChange={(v) => setField("key_events", v)}
        />
      </QuestionCard>

      <QuestionCard label="هل التحويل يحدث أونلاين أم أوفلاين؟">
        <SingleSelect
          options={conversionModels}
          value={data.conversion_model}
          onChange={(v) => setField("conversion_model", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
