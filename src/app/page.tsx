"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-blue-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Campaign Engine
        </h1>
        <p className="text-xl text-slate-400 mb-8 leading-relaxed">
          منصة ذكية لبناء وإدارة الاستراتيجيات الإعلانية. أجب على الأسئلة واحصل على خطة حملة كاملة في دقائق.
        </p>
        <Link
          href="/wizard"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-500 transition-colors"
        >
          ابدأ الآن
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <p className="text-sm text-slate-600 mt-4">مجاني • لا يحتاج بطاقة ائتمان</p>
      </motion.div>
    </main>
  );
}