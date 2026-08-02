"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useWizardStore } from "@/lib/store";
import Stepper from "@/components/wizard/Stepper";
import Step0_Start from "./steps/Step0_Start";
import Step1_Business from "./steps/Step1_Business";
import Step2_Value from "./steps/Step2_Value";
import Step3_Objective from "./steps/Step3_Objective";
import Step4_Readiness from "./steps/Step4_Readiness";
import Step5_Audience from "./steps/Step5_Audience";
import Step6_Offer from "./steps/Step6_Offer";
import Step7_Channel from "./steps/Step7_Channel";
import Step8_Budget from "./steps/Step8_Budget";
import Step9_Tracking from "./steps/Step9_Tracking";
import Step10_Resources from "./steps/Step10_Resources";
import Step11_Priority from "./steps/Step11_Priority";
import Step12_Review from "./steps/Step12_Review";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const steps = [
  Step0_Start, Step1_Business, Step2_Value, Step3_Objective,
  Step4_Readiness, Step5_Audience, Step6_Offer, Step7_Channel,
  Step8_Budget, Step9_Tracking, Step10_Resources, Step11_Priority, Step12_Review,
];

export default function WizardPage() {
  const { currentStep, nextStep, prevStep, isSubmitting } = useWizardStore();
  const CurrentStepComponent = steps[currentStep];

  return (
    <main className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-500" />
            معالج الحملات الإعلانية
          </h1>
          <p className="text-slate-400">أجب على الأسئلة التالية لبناء استراتيجيتك الإعلانية</p>
        </div>
        <Stepper />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8"
          >
            <CurrentStepComponent />
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0 || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            السابق
          </button>
          {currentStep < 12 && (
            <button
              onClick={nextStep}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              التالي
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}