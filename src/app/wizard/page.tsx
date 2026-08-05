"use client";

import { useEffect, useCallback, useState } from "react";
import { useWizardStore } from "@/lib/store";
import { getDummyData, getCurrentProfileName } from "@/lib/dev-autofill";
import Step0_Start from "./steps/Step0_Start";
import Step1_Business from "./steps/Step1_Business";
import Step2_Value from "./steps/Step2_Value";
import Step3_Objective from "./steps/Step3_Objective";
import Step4_Readiness from "./steps/Step4_Readiness";
import Step5_Audience from "./steps/Step5_Audience";
import Step6_Offer from "./steps/Step6_Offer";
import Step7_Channels from "./steps/Step7_Channels";
import Step8_Budget from "./steps/Step8_Budget";
import Step9_Tracking from "./steps/Step9_Tracking";
import Step10_Resources from "./steps/Step10_Resources";
import Step11_Priority from "./steps/Step11_Priority";
import Step12_Review from "./steps/Step12_Review";

const TOTAL_STEPS = 13;

const STEP_TITLES = [
  "بداية سريعة",
  "تعريف النشاط",
  "المشكلة والقيمة",
  "الهدف التجاري",
  "جاهزية المشروع",
  "الجمهور",
  "العرض والرسائل",
  "القناة والتحويل",
  "الميزانية والاقتصاد",
  "التتبع والقياس",
  "الموارد والقيود",
  "الأولوية والمخاطرة",
  "المراجعة النهائية",
];

interface ToastProps {
  message: string;
  visible: boolean;
}

function DevToast({ message, visible }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-green-900 border border-green-600 text-green-300 text-sm px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 whitespace-nowrap">
        <span>✅</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function WizardPage() {
  const { currentStep, setStep, setField } = useWizardStore();
  const [toast, setToast] = useState<string | null>(null);

  // FIX E: Always start at step 0
  useEffect(() => {
    setStep(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    setStep(Math.min(currentStep + 1, TOTAL_STEPS - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, setStep]);

  const goBack = useCallback(() => {
    setStep(Math.max(currentStep - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, setStep]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      setStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setStep]
  );

  // Ctrl+Shift+D → auto-fill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        const filled = getDummyData();
        const profileName = getCurrentProfileName();
        (Object.keys(filled) as (keyof typeof filled)[]).forEach((key) => {
          setField(key, filled[key] as any);
        });
        setStep(12);
        showToast(`Dummy data loaded — ${profileName}`);
        console.info(`[DEV] Auto-fill applied: ${profileName}`, filled);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setField, setStep, showToast]);

  const progress = Math.round(((currentStep + 1) / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-violet-400 text-sm font-semibold">
              Campaign Diagnosis Wizard
            </span>
            <span className="text-gray-500 text-xs">
              {currentStep + 1} / {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {STEP_TITLES[currentStep]}
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-gray-600 text-xs mt-1 font-mono">
              [DEV] Ctrl+Shift+D → ملء تلقائي للحقول الـ 37 (3 سيناريوهات تدور)
            </p>
          )}
        </div>
      </header>
{process.env.NODE_ENV === "development" && (
  <button
    onClick={() => {
      const filled = getDummyData();
      const profileName = getCurrentProfileName();
      (Object.keys(filled) as (keyof typeof filled)[]).forEach((key) => {
        setField(key, filled[key] as any);
      });
      setStep(12);
      showToast(`تم ملء البيانات — ${profileName}`);
    }}
    className="text-xs bg-violet-900/50 border border-violet-700 text-violet-300 px-3 py-1 rounded-lg hover:bg-violet-800/50 transition-colors"
  >
    🧪 ملء تلقائي
  </button>
)}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex gap-1 justify-center mb-8 flex-wrap">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === currentStep
                  ? "bg-violet-500 w-4"
                  : i < currentStep
                  ? "bg-violet-800"
                  : "bg-gray-700"
              }`}
              aria-label={`الخطوة ${i + 1}: ${STEP_TITLES[i]}`}
            />
          ))}
        </div>

        {currentStep === 0 && <Step0_Start onNext={goNext} />}
        {currentStep === 1 && <Step1_Business onNext={goNext} onBack={goBack} />}
        {currentStep === 2 && <Step2_Value onNext={goNext} onBack={goBack} />}
        {currentStep === 3 && <Step3_Objective onNext={goNext} onBack={goBack} />}
        {currentStep === 4 && <Step4_Readiness onNext={goNext} onBack={goBack} />}
        {currentStep === 5 && <Step5_Audience onNext={goNext} onBack={goBack} />}
        {currentStep === 6 && <Step6_Offer onNext={goNext} onBack={goBack} />}
        {currentStep === 7 && <Step7_Channels onNext={goNext} onBack={goBack} />}
        {currentStep === 8 && <Step8_Budget onNext={goNext} onBack={goBack} />}
        {currentStep === 9 && <Step9_Tracking onNext={goNext} onBack={goBack} />}
        {currentStep === 10 && <Step10_Resources onNext={goNext} onBack={goBack} />}
        {currentStep === 11 && <Step11_Priority onNext={goNext} onBack={goBack} />}
        {currentStep === 12 && (
          <Step12_Review onBack={goBack} onGoToStep={goToStep} />
        )}
        <DevToast message={toast ?? ""} visible={toast !== null} />
      </main>
    </div>
  );
}