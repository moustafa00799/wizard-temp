"use client";

import React from "react";
import { useWizardStore } from "@/lib/store";

function useWizardLocale() {
  const locale = useWizardStore((state) => state.data.locale === "en" ? "en" : "ar");
  return { locale, direction: locale === "ar" ? "rtl" as const : "ltr" as const };
}

// ── QuestionCard ──────────────────────────────────────────────────────────────
interface QuestionCardProps {
  label: string;
  children: React.ReactNode;
}
export function QuestionCard({ label, children }: QuestionCardProps) {
  const { direction } = useWizardLocale();
  return (
    <div className="mb-8">
      <p className={`text-white text-lg font-semibold mb-4 leading-relaxed ${direction === "rtl" ? "text-right" : "text-left"}`}>
        {label}
      </p>
      {children}
    </div>
  );
}

// ── SingleSelect ──────────────────────────────────────────────────────────────
interface Option {
  label: string;
  value: string;
}
interface SingleSelectProps {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
}
export function SingleSelect({ options, value, onChange }: SingleSelectProps) {
  return (
    <div className="grid gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-full text-right px-4 py-3 rounded-xl border transition-all duration-200 text-sm font-medium
            ${
              value === opt.value
                ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30"
                : "bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700/60 hover:border-gray-600"
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── MultiSelectChips ──────────────────────────────────────────────────────────
interface MultiSelectChipsProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
}
export function MultiSelectChips({
  options,
  value,
  onChange,
}: MultiSelectChipsProps) {
  const { direction } = useWizardLocale();
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };
  return (
    <div className={`flex flex-wrap gap-2 ${direction === "rtl" ? "justify-end" : "justify-start"}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => toggle(opt.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200
            ${
              value.includes(opt.value)
                ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-900/30"
                : "bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-700/60 hover:border-gray-600 hover:text-gray-200"
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── TextArea ──────────────────────────────────────────────────────────────────
interface TextAreaProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}
export function TextArea({
  placeholder,
  value,
  onChange,
  rows = 4,
}: TextAreaProps) {
  const { direction } = useWizardLocale();
  return (
    <textarea
      dir={direction}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
    />
  );
}

// ── NumberInput ───────────────────────────────────────────────────────────────
interface NumberInputProps {
  placeholder?: string;
  value: number | null;
  onChange: (value: number | null) => void;
}
export function NumberInput({ placeholder, value, onChange }: NumberInputProps) {
  const { direction } = useWizardLocale();
  return (
    <input
      type="number"
      dir={direction}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? null : parseFloat(v));
      }}
      className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
    />
  );
}

// ── TextListInput ─────────────────────────────────────────────────────────────
interface TextListInputProps {
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
}
export function TextListInput({
  placeholder,
  value,
  onChange,
}: TextListInputProps) {
  const { direction } = useWizardLocale();
  const raw = value.join(direction === "rtl" ? "، " : ", ");
  return (
    <input
      type="text"
      dir={direction}
      placeholder={placeholder}
      value={raw}
      onChange={(e) => {
        const parts = e.target.value
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean);
        onChange(parts);
      }}
      className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
    />
  );
}

// ── StepNav ───────────────────────────────────────────────────────────────────
interface StepNavProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  canGoBack?: boolean;
  isLast?: boolean;
}
export function StepNav({
  onBack,
  onNext,
  nextLabel,
  canGoBack = true,
  isLast = false,
}: StepNavProps) {
  const { locale, direction } = useWizardLocale();
  const resolvedNextLabel = nextLabel ?? (locale === "ar" ? "التالي" : "Next");
  const backLabel = locale === "ar" ? "السابق" : "Back";
  return (
    <div className="flex justify-between items-center mt-8 gap-4">
      {canGoBack && onBack ? (
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          {direction === "rtl" ? "←" : "→"} {backLabel}
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg
          ${
            isLast
              ? "bg-green-600 hover:bg-green-500 text-white shadow-green-900/30"
              : "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/30"
          }`}
      >
        {resolvedNextLabel} {direction === "rtl" ? "→" : "←"}
      </button>
    </div>
  );
}
