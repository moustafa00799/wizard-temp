"use client";

import React from "react";

// ── QuestionCard ──────────────────────────────────────────────────────────────
interface QuestionCardProps {
  label: string;
  children: React.ReactNode;
}
export function QuestionCard({ label, children }: QuestionCardProps) {
  return (
    <div className="mb-8">
      <p className="text-white text-lg font-semibold mb-4 text-right leading-relaxed">
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
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2 justify-end">
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
  return (
    <textarea
      dir="rtl"
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
  return (
    <input
      type="number"
      dir="rtl"
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
  const raw = value.join("، ");
  return (
    <input
      type="text"
      dir="rtl"
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
  nextLabel = "التالي",
  canGoBack = true,
  isLast = false,
}: StepNavProps) {
  return (
    <div className="flex justify-between items-center mt-8 gap-4">
      {canGoBack && onBack ? (
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          ← السابق
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
        {nextLabel} →
      </button>
    </div>
  );
}
