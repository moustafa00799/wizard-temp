"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  selected?: boolean;
  onClick: () => void;
}

export default function QuestionCard({ icon: Icon, label, description, selected, onClick }: QuestionCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative w-full p-5 rounded-xl border-2 text-right transition-all duration-200 flex flex-col items-start gap-3",
        selected ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10" : "border-slate-800 bg-slate-900/50 hover:border-slate-600"
      )}
    >
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", selected ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400")}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className={cn("font-bold text-lg", selected ? "text-blue-400" : "text-slate-200")}>{label}</h3>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {selected && (
        <div className="absolute top-3 left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </motion.button>
  );
}