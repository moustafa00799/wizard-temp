"use client";

import { useWizardStore } from "@/lib/store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, Target, Users, DollarSign, Megaphone, ClipboardCheck, AlertTriangle, Calendar, Wrench } from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function BlueprintPage() {
  const { blueprint } = useWizardStore();
  const router = useRouter();

  useEffect(() => {
    if (!blueprint) router.push("/wizard");
  }, [blueprint, router]);

  if (!blueprint) return null;

  return (
    <main className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">خطة الحملة الإعلانية</h1>
          <p className="text-slate-400">استراتيجيتك المخصصة جاهزة!</p>
        </motion.div>
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.div variants={item} className="col-span-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">الملخص التنفيذي</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <span className="text-3xl font-bold text-blue-400">{blueprint.executive_summary.readiness_score}</span>
                <p className="text-sm text-slate-400 mt-1">درجة الجاهزية</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <span className="text-3xl font-bold text-red-400">{blueprint.executive_summary.risk_score}</span>
                <p className="text-sm text-slate-400 mt-1">درجة المخاطرة</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <span className="text-lg font-bold text-green-400">{blueprint.executive_summary.launch_recommendation}</span>
                <p className="text-sm text-slate-400 mt-1">توصية الإطلاق</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <span className="text-lg font-bold text-yellow-400">{blueprint.executive_summary.estimated_launch_date}</span>
                <p className="text-sm text-slate-400 mt-1">تاريخ الإطلاق المتوقع</p>
              </div>
            </div>
          </motion.div>
          <motion.div variants={item} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4"><Target className="w-5 h-5 text-green-500" /><h3 className="font-bold text-white">الاستراتيجية</h3></div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300"><span className="text-slate-500">الهدف:</span> {blueprint.strategy_summary.recommended_objective}</p>
              <p className="text-slate-300"><span className="text-slate-500">القنوات:</span> {blueprint.strategy_summary.recommended_channels.join(", ")}</p>
              <p className="text-slate-300"><span className="text-slate-500">نوع الـ Funnel:</span> {blueprint.strategy_summary.funnel_type}</p>
              <p className="text-slate-300"><span className="text-slate-500">الثقة:</span> {blueprint.strategy_summary.confidence_score}%</p>
            </div>
          </motion.div>
          <motion.div variants={item} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4"><DollarSign className="w-5 h-5 text-yellow-500" /><h3 className="font-bold text-white">الميزانية</h3></div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300"><span className="text-slate-500">يوميًا:</span> ${blueprint.budget_split.daily_budget.recommended}</p>
              <p className="text-slate-300"><span className="text-slate-500">ميزانية الاختبار:</span> {blueprint.budget_split.test_budget.percentage}%</p>
              <p className="text-slate-300"><span className="text-slate-500">هدف CAC:</span> ${blueprint.budget_split.cac_target}</p>
            </div>
          </motion.div>
          <motion.div variants={item} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4"><Users className="w-5 h-5 text-purple-500" /><h3 className="font-bold text-white">الجمهور</h3></div>
            <p className="text-sm text-slate-300">{blueprint.audience_structure.primary_audience.description}</p>
          </motion.div>
          <motion.div variants={item} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4"><Megaphone className="w-5 h-5 text-pink-500" /><h3 className="font-bold text-white">الإبداع</h3></div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300"><span className="text-slate-500">Hook:</span> {blueprint.creative_angles.primary_angle.hook}</p>
              <p className="text-slate-300"><span className="text-slate-500">CTA:</span> {blueprint.creative_angles.primary_angle.cta}</p>
            </div>
          </motion.div>
          <motion.div variants={item} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4"><ClipboardCheck className="w-5 h-5 text-cyan-500" /><h3 className="font-bold text-white">التتبع</h3></div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300"><span className="text-slate-500">الحالة:</span> {blueprint.tracking_checklist.setup_status.overall}</p>
              <p className="text-slate-300"><span className="text-slate-500">الدرجة:</span> {blueprint.tracking_checklist.setup_status.score}/100</p>
            </div>
          </motion.div>
          <motion.div variants={item} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4"><AlertTriangle className="w-5 h-5 text-red-500" /><h3 className="font-bold text-white">المخاطر</h3></div>
            <div className="space-y-2">
              {blueprint.risk_flags.critical.length > 0 && (
                <div className="text-sm"><span className="text-red-400 font-bold">حرجة:</span><ul className="list-disc list-inside text-slate-400">{blueprint.risk_flags.critical.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
              )}
              {blueprint.risk_flags.warnings.length > 0 && (
                <div className="text-sm"><span className="text-yellow-400 font-bold">تحذيرات:</span><ul className="list-disc list-inside text-slate-400">{blueprint.risk_flags.warnings.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
              )}
            </div>
          </motion.div>
          <motion.div variants={item} className="col-span-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4"><Calendar className="w-5 h-5 text-orange-500" /><h3 className="font-bold text-white">خطة أول 14 يومًا</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-2">الأسبوع الأول</h4>
                <ul className="space-y-1">{blueprint.first_14_days_plan.week_1.map((d, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500">{d.day}</span>{d.task}</li>
                ))}</ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-2">الأسبوع الثاني</h4>
                <ul className="space-y-1">{blueprint.first_14_days_plan.week_2.map((d, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500">{d.day}</span>{d.task}</li>
                ))}</ul>
              </div>
            </div>
          </motion.div>
          <motion.div variants={item} className="col-span-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4"><Wrench className="w-5 h-5 text-indigo-500" /><h3 className="font-bold text-white">ما يجب إصلاحه قبل الإطلاق</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h4 className="text-red-400 font-bold text-sm mb-2">يجب إصلاحه</h4>
                <ul className="list-disc list-inside text-sm text-slate-400">{blueprint.pre_launch_fixes.must_fix.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <h4 className="text-yellow-400 font-bold text-sm mb-2">يُنصح بإصلاحه</h4>
                <ul className="list-disc list-inside text-sm text-slate-400">{blueprint.pre_launch_fixes.should_fix.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <h4 className="text-green-400 font-bold text-sm mb-2">للتحسين</h4>
                <ul className="list-disc list-inside text-sm text-slate-400">{blueprint.pre_launch_fixes.nice_to_have.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}