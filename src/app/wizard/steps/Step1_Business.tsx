"use client";

import { useWizardStore } from "@/lib/store";
import QuestionCard from "@/components/wizard/QuestionCard";
import { Textarea } from "@/components/ui/textarea";
import { Store, Truck, Smartphone, Building2, GraduationCap, Briefcase, HelpCircle, ShoppingBag } from "lucide-react";

const businessTypes = [
  { value: "local_service", label: "خدمة محلية", icon: Store },
  { value: "ecommerce", label: "متجر إلكتروني", icon: ShoppingBag },
  { value: "consumer_product", label: "منتج استهلاكي", icon: Truck },
  { value: "app", label: "تطبيق", icon: Smartphone },
  { value: "b2b", label: "B2B", icon: Building2 },
  { value: "education", label: "تعليم / كورس", icon: GraduationCap },
  { value: "agency_service", label: "وكالة / خدمة احترافية", icon: Briefcase },
  { value: "other", label: "نشاط آخر", icon: HelpCircle },
];

const salesMotions = [
  { value: "website_purchase", label: "شراء مباشر من الموقع" },
  { value: "whatsapp", label: "عبر واتساب" },
  { value: "call", label: "عبر مكالمة" },
  { value: "form", label: "عبر فورم" },
  { value: "messages", label: "عبر الرسائل" },
  { value: "sales_team", label: "من خلال مندوب / فريق مبيعات" },
  { value: "multi_channel", label: "أكثر من قناة" },
];

export default function Step1_Business() {
  const { business_type, offer_description, sales_motion, setField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">تعريف النشاط</h2>
        <p className="text-slate-400">ساعدنا في فهم نشاطك التجاري</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما نوع النشاط؟</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {businessTypes.map((type) => (
            <QuestionCard
              key={type.value}
              icon={type.icon}
              label={type.label}
              selected={business_type === type.value}
              onClick={() => setField("business_type", type.value as any)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">صف المنتج أو الخدمة باختصار</label>
        <Textarea
          value={offer_description}
          onChange={(e) => setField("offer_description", e.target.value)}
          placeholder="اكتب ماذا تقدم، لمن، وبأي شكل يتم البيع"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
        />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">كيف تتم عملية البيع غالبًا؟</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {salesMotions.map((motion) => (
            <button
              key={motion.value}
              onClick={() => setField("sales_motion", motion.value as any)}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                sales_motion === motion.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {motion.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}