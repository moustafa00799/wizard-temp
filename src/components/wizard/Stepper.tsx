"use client";

import { STEPS } from "@/types/wizard";
import { useWizardStore } from "@/lib/store";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function Stepper() {
  const { currentStep, completedSteps, goToStep } = useWizardStore();

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
        <motion.div
          className="absolute top-1/2 right-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const isClickable = isCompleted || isCurrent || completedSteps.includes(index - 1);
          return (
            <button
              key={step.id}
              onClick={() => isClickable && goToStep(index)}
              disabled={!isClickable}
              className="relative z-10 flex flex-col items-center gap-2 group"
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isCurrent ? "bg-blue-500 border-blue-500 text-white" :
                  isCompleted ? "bg-green-500 border-green-500 text-white" :
                  "bg-slate-900 border-slate-700 text-slate-500"
                } ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
              >
                {isCompleted && !isCurrent ? <Check className="w-5 h-5" /> :
                  <span className="text-sm font-bold">{index + 1}</span>}
              </motion.div>
              <span className={`text-xs font-medium hidden sm:block ${
                isCurrent ? "text-blue-400" : isCompleted ? "text-green-400" : "text-slate-600"
              }`}>{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}