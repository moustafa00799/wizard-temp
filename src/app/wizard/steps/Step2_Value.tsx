"use client";

import { useWizardStore } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import MultiSelectChips from "@/components/wizard/MultiSelectChips";

const valueDrivers = [
  { label: "السعر", value: "price" },
  { label: "الجودة", value: "quality" },
  { label: "السرعة", value: "speed" },
  { label: "الثقة", value: "trust" },
  { label: "الضمان", value: "warranty" },
  { label: "النتائج", value: "results" },
  { label: "التخصص", value: "specialization" },
  { label: "سهولة الطلب", value: "easy_order" },
  { label: "خدمة ما بعد البيع", value: "after_sales" },
  { label: "سمعة العلامة", value: "brand_reputation" },
];

export default function Step2_Value() {
  const { customer_problem, key_value_drivers, usp, toggleArrayField, setField } = useWizardStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">المشكلة والقيمة</h2>
        <p className="text-slate-400">ساعدنا في فهم القيمة التي تقدمها</p>
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما المشكلة التي يحلها هذا النشاط؟</label>
        <Textarea
          value={customer_problem}
          onChange={(e) => setField("customer_problem", e.target.value)}
          placeholder="صف الألم الحقيقي الذي يشعر به العميل"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
        />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">ما الأسباب الأقوى التي تجعل العميل يختارك؟</label>
        <MultiSelectChips
          options={valueDrivers}
          selected={key_value_drivers}
          onToggle={(value) => toggleArrayField("key_value_drivers", value)}
        />
      </div>
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-200">اذكر الفرق الحقيقي بينك وبين المنافسين</label>
        <Textarea
          value={usp}
          onChange={(e) => setField("usp", e.target.value)}
          placeholder="ميزة، دليل، تجربة، عرض، أو سرعة تنفيذ"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
        />
      </div>
    </div>
  );
}