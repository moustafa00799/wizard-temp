"use client";

import { useWizardStore, calculateReadinessScore, getReadinessLevel } from "@/lib/store";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function Step12_Review() {
  const state = useWizardStore();
  const { setSubmitting, setBlueprint, resetWizard } = useWizardStore();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const readinessScore = calculateReadinessScore(state);
  const readinessLevel = getReadinessLevel(readinessScore);

  const summaryData = [
    { label: "وضع البناء", value: state.build_mode },
    { label: "نوع النشاط", value: state.business_type },
    { label: "الهدف الأساسي", value: state.primary_objective },
    { label: "الجمهور", value: state.ideal_customer?.slice(0, 50) + "..." },
    { label: "القناة", value: state.ad_channels.join(", ") },
    { label: "الميزانية", value: state.budget_band },
    { label: "حالة التتبع", value: state.tracking_status },
    { label: "القيود", value: state.constraints.join(", ") || "لا يوجد" },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        build_mode: state.build_mode,
        business_type: state.business_type,
        offer_description: state.offer_description,
        sales_motion: state.sales_motion,
        customer_problem: state.customer_problem,
        key_value_drivers: state.key_value_drivers,
        usp: state.usp,
        primary_objective: state.primary_objective,
        secondary_objectives: state.secondary_objectives,
        north_star_kpi: state.north_star_kpi,
        existing_assets: state.existing_assets,
        previous_campaigns_status: state.previous_campaigns_status,
        past_performance_notes: state.past_performance_notes,
        ideal_customer: state.ideal_customer,
        awareness_level: state.awareness_level,
        audience_segments: state.audience_segments,
        geo_scope: state.geo_scope,
        target_locations: state.target_locations,
        offer_type: state.offer_type,
        core_message: state.core_message,
        objections: state.objections,
        persuasion_angle: state.persuasion_angle,
        conversion_destination: state.conversion_destination,
        ad_channels: state.ad_channels,
        campaign_direction: state.campaign_direction,
        budget_band: state.budget_band,
        budget_flexibility: state.budget_flexibility,
        average_order_value: state.average_order_value,
        profit_margin: state.profit_margin,
        max_cac: state.max_cac,
        tracking_status: state.tracking_status,
        tracking_tools: state.tracking_tools,
        key_events: state.key_events,
        conversion_model: state.conversion_model,
        creative_assets: state.creative_assets,
        content_capacity: state.content_capacity,
        constraints: state.constraints,
        response_speed: state.response_speed,
        top_priority: state.top_priority,
        risk_tolerance: state.risk_tolerance,
      };
      const response = await axios.post("http://localhost:3000/api/generate", payload);
      setBlueprint(response.data);
      resetWizard();
      router.push("/blueprint");
    } catch (err: any) {
      setError(err.response?.data?.message || "حدث خطأ أثناء إنشاء الاستراتيجية. تأكد من تشغيل الخادم.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">المراجعة النهائية</h2>
        <p className="text-slate-400">راجع بياناتك قبل إنشاء الاستراتيجية</p>
      </div>
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-slate-200">درجة الجاهزية</span>
          <span className={`text-2xl font-bold ${readinessLevel.color}`}>{readinessScore}%</span>
        </div>
        <Progress value={readinessScore} className="h-3" />
        <p className="text-sm text-slate-400 mt-2">المستوى: {readinessLevel.label}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaryData.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-800/30 rounded-lg p-4 border border-slate-800"
          >
            <span className="text-sm text-slate-500 block mb-1">{item.label}</span>
            <span className="text-slate-200 font-medium">{item.value || "—"}</span>
          </motion.div>
        ))}
      </div>
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={state.isSubmitting}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-bold"
      >
        {state.isSubmitting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> جاري إنشاء الاستراتيجية...</>
        ) : (
          <><Send className="w-5 h-5" /> تأكيد وإنشاء الاستراتيجية</>
        )}
      </button>
    </div>
  );
}