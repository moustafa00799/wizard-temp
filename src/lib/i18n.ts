export type AppLocale = "ar" | "en";
export const DEFAULT_LOCALE: AppLocale = "ar";

export const LOCALE_OPTIONS: { value: AppLocale; label: string; nativeLabel: string; dir: "rtl" | "ltr" }[] = [
  { value: "ar", label: "العربية", nativeLabel: "العربية", dir: "rtl" },
  { value: "en", label: "English", nativeLabel: "English", dir: "ltr" },
];

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "ar" || value === "en";
}

export function localeDirection(locale: AppLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function localeTag(locale: AppLocale): string {
  return locale === "ar" ? "ar-SA" : "en-US";
}

type Dictionary = {
  app: {
    name: string;
    language: string;
    chooseLanguage: string;
    optional: string;
    back: string;
    next: string;
    previous: string;
    save: string;
    loading: string;
    notAvailable: string;
    notSpecified: string;
    needsReview: string;
    notApplicable: string;
  };
  wizard: {
    step: string;
    start: string;
    business: string;
    value: string;
    objective: string;
    readiness: string;
    audience: string;
    offer: string;
    channels: string;
    budget: string;
    tracking: string;
    resources: string;
    priority: string;
    review: string;
    autoFill: string;
    aiQuestion: string;
    aiDescription: string;
    aiEnabled: string;
    aiDisabled: string;
    createBlueprint: string;
  };
  blueprint: {
    detailed: string;
    advancedReview: string;
    groups: {
      decision: { title: string; description: string };
      execution: { title: string; description: string };
      measurement: { title: string; description: string };
      market: { title: string; description: string };
      readiness: { title: string; description: string };
      technical: { title: string; description: string };
    };
    sections: Record<string, string>;
    fields: Record<string, string>;
    statuses: Record<string, string>;
    sources: Record<string, string>;
    knowledgeAuto: string;
    knowledgeReadOnly: string;
    technicalDetails: string;
    clientSummary: string;
    reviewSummary: string;
    nextStep: string;
  };
  ai: {
    advisoryTitle: string;
    reasoningTitle: string;
    failedClosed: string;
    failureExplanation: string;
    governance: string;
    noBlueprintImpact: string;
    showTechnicalDetails: string;
    hideTechnicalDetails: string;
    retry: string;
  };
};

const ar: Dictionary = {
  app: {
    name: "مُنشئ الحملات الذكي",
    language: "اللغة",
    chooseLanguage: "اختر لغة الواجهة والنتائج",
    optional: "اختياري",
    back: "السابق",
    next: "التالي",
    previous: "السابق",
    save: "حفظ",
    loading: "جاري التحميل…",
    notAvailable: "غير متاح حاليًا",
    notSpecified: "يحتاج تحديدًا",
    needsReview: "يحتاج مراجعة",
    notApplicable: "غير منطبق",
  },
  wizard: {
    step: "الخطوة",
    start: "بداية سريعة",
    business: "تعريف النشاط",
    value: "المشكلة والقيمة",
    objective: "الهدف التجاري",
    readiness: "جاهزية المشروع",
    audience: "الجمهور",
    offer: "العرض والرسائل",
    channels: "القناة والتحويل",
    budget: "الميزانية والاقتصاد",
    tracking: "التتبع والقياس",
    resources: "الموارد والقيود",
    priority: "الأولوية والمخاطرة",
    review: "المراجعة النهائية",
    autoFill: "ملء تلقائي",
    aiQuestion: "هل تريد استخدام AI الاستشاري؟",
    aiDescription: "اختياري تمامًا. عند تشغيله، سيحلل نسخة منقحة من إجاباتك ليقترح زوايا ورسائل ويفسر بعض قرارات Blueprint. قرارات CDKS تظل هي الأساس، ولا يستطيع AI نشر حملة أو إنفاق ميزانية.",
    aiEnabled: "تم اختيار AI الاستشاري. سيتم إرسال البيانات المنقحة فقط، ويتحقق الخادم من جاهزية المزود قبل تنفيذ أي طلب.",
    aiDisabled: "AI الاستشاري متوقف. سيُنشئ النظام Blueprint باستخدام Wizard وCDKS وRules Engine فقط.",
    createBlueprint: "إنشاء Blueprint",
  },
  blueprint: {
    detailed: "Blueprint التفصيلي",
    advancedReview: "للمراجعة المتقدمة",
    groups: {
      decision: { title: "ملخص القرار", description: "ماذا فهم النظام؟ وما الاتجاه الاستراتيجي المقترح؟" },
      execution: { title: "خطة التنفيذ", description: "الجمهور، الرسائل، الإبداع، والعرض المقترح." },
      measurement: { title: "الميزانية والقياس", description: "التتبع، الاختبارات، المراقبة، وما يمكن قياسه بأمان." },
      market: { title: "السوق والمنصات", description: "السياق المتاح للقطاع وإرشادات القنوات وحدود الأدلة." },
      readiness: { title: "الجاهزية والمخاطر", description: "ما الذي يحتاج مراجعة قبل الاعتماد أو أي إطلاق مستقبلي؟" },
      technical: { title: "التفاصيل التقنية", description: "التدقيق والتتبع التشخيصي للمراجع أو المطور فقط." },
    },
    sections: {
      executive_summary: "الملخص التنفيذي",
      strategy_summary: "ملخص الاستراتيجية",
      recommended_funnel: "المسار التسويقي المقترح",
      campaign_structure: "هيكل الحملات",
      audience_structure: "هيكل الجمهور",
      audience_analysis: "تحليل الجمهور",
      budget_split: "توزيع الميزانية",
      creative_strategy: "استراتيجية المحتوى والإبداع",
      creative_angles: "الزوايا الإبداعية",
      tracking_assessment: "تقييم التتبع والقياس",
      tracking_checklist: "قائمة تجهيز التتبع",
      launch_plan: "خطة الإطلاق",
      first_14_days_plan: "خطة أول 14 يومًا",
      pre_launch_fixes: "إصلاحات ما قبل الإطلاق",
      offer_strategy: "استراتيجية العرض",
      monitoring: "المراقبة والتحسين",
      budget_management: "إدارة الميزانية",
      testing: "خطة الاختبارات",
      benchmarks: "المؤشرات المرجعية",
      market_context: "سياق السوق",
      platform_guides: "إرشادات المنصات",
      compliance: "الامتثال",
      technical_audit: "التدقيق التقني",
      risk_flags: "تحذيرات المخاطر",
      flags: "حالة النظام",
      debug: "التفاصيل التقنية",
    },
    fields: {
      industry_average_cvr: "متوسط CVR للقطاع",
      industry_average_ctr: "متوسط CTR للقطاع",
      target_cpa: "CPA المستهدف",
      weekly_projection: "التوقع الأسبوعي للإنفاق",
      daily_targets: "الأهداف اليومية",
      monthly_pacing: "وتيرة الإنفاق الشهرية",
    },
    statuses: {
      unavailable: "غير متاح حاليًا",
      check_manually: "يحتاج مراجعة يدوية",
      ready: "جاهز مبدئيًا",
      review: "يحتاج مراجعة",
      blocked: "متوقف حتى استكمال المتطلبات",
      safe: "آمن ضمن الحوكمة",
      completed: "اكتمل",
      failed: "لم تكتمل المراجعة",
      not_requested: "غير مشغّل",
    },
    sources: { "RF-019": "قواعد CDKS", "RF-018": "مدخلات Wizard", "cdks-policy": "سياسة CDKS" },
    knowledgeAuto: "يحدد النظام السياق المعرفي تلقائيًا من نطاق Wizard والأدلة المسموح بها.",
    knowledgeReadOnly: "يظهر السياق المستخدم كمرجع للقراءة فقط، ولا يغير قرارات CDKS أو حالة Market Validation.",
    technicalDetails: "التفاصيل التقنية",
    clientSummary: "ملخص للعميل",
    reviewSummary: "تفاصيل المراجعة",
    nextStep: "الخطوة التالية",
  },
  ai: {
    advisoryTitle: "التفسير الاستشاري",
    reasoningTitle: "تفسير AI والحوكمة",
    failedClosed: "لم تكتمل المراجعة الاستشارية",
    failureExplanation: "لم تطابق مخرجات AI العقد المطلوب، لذلك لم يعتمدها النظام. تم الاحتفاظ بتوصيات CDKS وRules Engine دون تغيير.",
    governance: "AI يقترح ويشرح فقط؛ لا يغير Blueprint ولا ينشر ولا ينفق.",
    noBlueprintImpact: "لم يؤثر AI في قرارات CDKS أو Canonical Blueprint.",
    showTechnicalDetails: "عرض التفاصيل التقنية",
    hideTechnicalDetails: "إخفاء التفاصيل التقنية",
    retry: "إعادة المحاولة",
  },
};

const en: Dictionary = {
  app: {
    name: "Campaign Builder AI",
    language: "Language",
    chooseLanguage: "Choose the interface and output language",
    optional: "Optional",
    back: "Back",
    next: "Next",
    previous: "Back",
    save: "Save",
    loading: "Loading…",
    notAvailable: "Currently unavailable",
    notSpecified: "Needs specification",
    needsReview: "Needs review",
    notApplicable: "Not applicable",
  },
  wizard: {
    step: "Step",
    start: "Quick start",
    business: "Business definition",
    value: "Problem and value",
    objective: "Business objective",
    readiness: "Business readiness",
    audience: "Audience",
    offer: "Offer and messaging",
    channels: "Channels and conversion",
    budget: "Budget and economics",
    tracking: "Tracking and measurement",
    resources: "Resources and constraints",
    priority: "Priority and risk",
    review: "Final review",
    autoFill: "Autofill",
    aiQuestion: "Would you like to use advisory AI?",
    aiDescription: "Completely optional. When enabled, it analyzes a sanitized copy of your answers to suggest angles and messages and explain selected Blueprint decisions. CDKS remains authoritative, and AI cannot publish a campaign or spend budget.",
    aiEnabled: "Advisory AI is enabled. Only sanitized data is sent, and the server verifies provider readiness before making a request.",
    aiDisabled: "Advisory AI is off. The system will create the Blueprint using Wizard, CDKS, and the Rules Engine only.",
    createBlueprint: "Create Blueprint",
  },
  blueprint: {
    detailed: "Detailed Blueprint",
    advancedReview: "Advanced review",
    groups: {
      decision: { title: "Decision summary", description: "What did the system understand, and what direction does it recommend?" },
      execution: { title: "Execution plan", description: "Audience, messaging, creative, and offer recommendations." },
      measurement: { title: "Budget and measurement", description: "Tracking, tests, monitoring, and what can be measured safely." },
      market: { title: "Market and platforms", description: "Available sector context, channel guidance, and evidence limits." },
      readiness: { title: "Readiness and risks", description: "What needs review before approval or any future launch?" },
      technical: { title: "Technical details", description: "Diagnostics and audit details for reviewers or developers." },
    },
    sections: {
      executive_summary: "Executive summary",
      strategy_summary: "Strategy summary",
      recommended_funnel: "Recommended marketing funnel",
      campaign_structure: "Campaign structure",
      audience_structure: "Target audience structure",
      audience_analysis: "Audience analysis",
      budget_split: "Suggested budget allocation",
      creative_strategy: "Creative and content strategy",
      creative_angles: "Creative angles",
      tracking_assessment: "Tracking and measurement assessment",
      tracking_checklist: "Tracking setup checklist",
      launch_plan: "Launch plan",
      first_14_days_plan: "First 14 days plan",
      pre_launch_fixes: "Pre-launch fixes",
      offer_strategy: "Offer strategy",
      monitoring: "Monitoring and optimization",
      budget_management: "Budget management",
      testing: "Testing plan",
      benchmarks: "Reference metrics",
      market_context: "Market context",
      platform_guides: "Platform guidance",
      compliance: "Compliance",
      technical_audit: "Technical audit",
      risk_flags: "Risk warnings",
      flags: "System status",
      debug: "Technical details",
    },
    fields: {
      industry_average_cvr: "Industry average CVR",
      industry_average_ctr: "Industry average CTR",
      target_cpa: "Target CPA",
      weekly_projection: "Weekly spend projection",
      daily_targets: "Daily targets",
      monthly_pacing: "Monthly spend pacing",
    },
    statuses: {
      unavailable: "Currently unavailable",
      check_manually: "Needs manual review",
      ready: "Conditionally ready",
      review: "Needs review",
      blocked: "Blocked until requirements are completed",
      safe: "Safe under governance",
      completed: "Completed",
      failed: "Review not completed",
      not_requested: "Not enabled",
    },
    sources: { "RF-019": "CDKS rules", "RF-018": "Wizard input", "cdks-policy": "CDKS policy" },
    knowledgeAuto: "The system automatically matches a Knowledge Context from the Wizard scope and allowlisted evidence.",
    knowledgeReadOnly: "The selected context is read-only provenance; it does not change CDKS decisions or Market Validation.",
    technicalDetails: "Technical details",
    clientSummary: "Client summary",
    reviewSummary: "Review details",
    nextStep: "Next step",
  },
  ai: {
    advisoryTitle: "Advisory explanation",
    reasoningTitle: "AI reasoning and governance",
    failedClosed: "Advisory review was not completed",
    failureExplanation: "The AI output did not match the required contract, so it was not accepted. CDKS and Rules Engine recommendations were kept unchanged.",
    governance: "AI suggests and explains only; it cannot change the Blueprint, publish, or spend.",
    noBlueprintImpact: "AI did not affect CDKS decisions or the Canonical Blueprint.",
    showTechnicalDetails: "Show technical details",
    hideTechnicalDetails: "Hide technical details",
    retry: "Retry",
  },
};

export const dictionaries: Record<AppLocale, Dictionary> = { ar, en };
export type AppDictionary = Dictionary;

export function getDictionary(locale: AppLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function formatLocaleNumber(value: number, locale: AppLocale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(localeTag(locale), options).format(value);
}

export function formatLocaleDate(value: string | number | Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export { getOptionLabel } from "./i18n-options";

export function localizeText(locale: AppLocale, arabic: string, english: string): string {
  return locale === "en" ? english : arabic;
}
