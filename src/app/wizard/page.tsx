"use client";

import { useEffect, useCallback } from "react";
import { useWizardStore } from "@/lib/store";
import { generateAutoFillData } from "@/lib/dev-autofill";

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

export default function WizardPage() {
  const { currentStep, setStep, setField, data } = useWizardStore();

  // FIX E: Always start at step 0, regardless of what's in localStorage
  useEffect(() => {
    setStep(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // FIX F: Ctrl+Shift+D triggers autofill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        const filled = generateAutoFillData();
        // Apply every field from the autofill data into the store
        (Object.keys(filled) as (keyof typeof filled)[]).forEach((key) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setField(key, filled[key] as any);
        });
        // Jump to review
        setStep(12);
        console.info("[DEV] Autofill applied, jumped to review step.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setField, setStep]);

  const goNext = useCallback(() => {
    setStep(Math.min(currentStep + 1, TOTAL_STEPS - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, setStep]);

  const goBack = useCallback(() => {
    setStep(Math.max(currentStep - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, setStep]);

  const goToStep = useCallback(
    (step: number) => {
      setStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setStep]
  );

  const progress = Math.round(((currentStep + 1) / TOTAL_STEPS) * 100);

  return (
    <div
      className="min-h-screen bg-gray-950 text-white"
      dir="rtl"
    >
      {/* Header */}
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
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {STEP_TITLES[currentStep]}
          </p>

          {/* Dev hint */}
          {process.env.NODE_ENV === "development" && (
            <p className="text-gray-600 text-xs mt-1">
              [DEV] Ctrl+Shift+D → ملء تلقائي + انتقال للمراجعة
            </p>
          )}
        </div>
      </header>

      {/* Step content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step indicator dots */}
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
      </main>
    </div>
  );
}
