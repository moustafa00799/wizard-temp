"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MultiSelectChipsProps {
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}

export default function MultiSelectChips({ options, selected, onToggle }: MultiSelectChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(option.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
              isSelected ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
            )}
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}