import type { AppLocale } from "./i18n";
import { getOptionLabel } from "./i18n";

const DISPLAY_LABELS: Record<string, string> = {
  ready_with_fixes: "جاهز مع إصلاحات",
  ready: "جاهز",
  review: "يحتاج مراجعة",
  blocked: "متوقف مؤقتًا",
  good: "جيدة",
  medium: "متوسطة",
  high: "مرتفعة",
  low: "منخفضة",
  partial: "جزئي",
  complete: "مكتمل",
  pass: "مستوفٍ",
  fail: "غير مستوفٍ",
  warning: "تحذير",
  missing: "ناقص",
  available: "متاح",
  unavailable: "غير متاح حاليًا",
  present: "متوفر",
  check_manually: "يحتاج مراجعة يدوية",
  testing: "اختبار",
  optimization: "تحسين",
  scaling: "توسيع",
  maintenance: "استمرارية",
  ecommerce: "التجارة الإلكترونية",
  education: "التعليم",
  local_service: "الخدمات المحلية",
  sales: "المبيعات",
  leads: "العملاء المحتملون",
  awareness: "الوعي بالعلامة التجارية",
  website: "الموقع الإلكتروني",
  store: "المتجر الإلكتروني",
  website_purchase: "شراء من الموقع",
  form: "نموذج تواصل",
  online: "عبر الإنترنت",
  meta: "Meta",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
  linkedin: "LinkedIn",
  blueprint_only: "Blueprint فقط",
  education_funnel: "مسار تعليمي",
  solution_funnel: "مسار الحل",
  consumer_product_meta: "مسار منتج استهلاكي — Meta",
  consumer_product_tiktok_ads: "مسار منتج استهلاكي — TikTok",
  problem_aware: "مدرك للمشكلة",
  social_proof: "الدليل الاجتماعي",
  image: "صورة",
  video: "فيديو",
  carousel: "إعلان دوّار",
  short_video: "فيديو قصير",
  qualified_lead_rate: "معدل العملاء المحتملين المؤهلين",
  result: "النتائج",
  trust: "الثقة",
  urgency: "الإلحاح",
};

const DISPLAY_LABELS_EN: Record<string, string> = {
  ready_with_fixes: "Ready with fixes", ready: "Ready", review: "Needs review", blocked: "Temporarily blocked",
  good: "Good", medium: "Medium", high: "High", low: "Low", partial: "Partial", complete: "Complete",
  pass: "Passed", fail: "Not passed", warning: "Warning", missing: "Missing", available: "Available", unavailable: "Currently unavailable", present: "Present", check_manually: "Needs manual review",
  testing: "Testing", optimization: "Optimization", scaling: "Scaling", maintenance: "Maintenance", ecommerce: "E-commerce", education: "Education", local_service: "Local services",
  sales: "Sales", leads: "Leads", awareness: "Brand awareness", website: "Website", store: "Online store", website_purchase: "Website purchase", form: "Contact form", online: "Online", meta: "Meta", google_ads: "Google Ads", tiktok_ads: "TikTok Ads", linkedin: "LinkedIn", blueprint_only: "Blueprint only",
  education_funnel: "Education funnel", solution_funnel: "Solution funnel", consumer_product_meta: "Consumer product — Meta", consumer_product_tiktok_ads: "Consumer product — TikTok", problem_aware: "Problem-aware", social_proof: "Social proof", image: "Image", video: "Video", carousel: "Carousel", short_video: "Short video", qualified_lead_rate: "Qualified lead rate", result: "Outcome", trust: "Trust", urgency: "Urgency",
};

const FIELD_LABELS: Record<string, string> = {
  ad_impact: "الأثر المحتمل على الإعلانات",
  benchmarks: "المؤشرات المرجعية",
  message: "الرسالة",
  check_items: "عناصر المراجعة",
  reason: "السبب",
  required: "إلزامي",
  recommendations: "التوصيات",
  get_metrics: "المقاييس المطلوبة",
  speed_score: "درجة السرعة",
  tools: "الأدوات",
  impact_on_ads: "الأثر على الإعلانات",
  monthly_pacing: "توزيع الإنفاق الشهري",
  daily_targets: "الأهداف اليومية",
  weekly_projection: "التوقع الأسبوعي للإنفاق",
  reallocation_trigger: "محفز إعادة التوزيع",
  emergency_pause: "الإيقاف الطارئ",
  projected_spend: "الإنفاق المتوقع",
  cumulative: "الإجمالي التراكمي",
  cpc_expectation: "توقع CPC",
  competition_level: "مستوى المنافسة",
  estimated_cpc_range: "نطاق CPC التقديري",
  market_saturation: "تشبع السوق",
  ad_spend_recommendation: "توصية الإنفاق الإعلاني",
  content_differentiation: "تمييز المحتوى",
  industry_average_cvr: "متوسط CVR للقطاع",
  industry_average_ctr: "متوسط CTR للقطاع",
  target_cpa: "CPA المستهدف",
  performance_targets: "أهداف الأداء",
  current_month: "الشهر الحالي",
  budget_adjustment: "تعديل الميزانية",
  creative_direction: "التوجيه الإبداعي",
  primary_kpi: "مؤشر الأداء الأساسي",
  success_metric: "مؤشر النجاح",
  asset_ready: "جاهزية الأصل الإعلاني",
  social_proof_score: "درجة الدليل الاجتماعي",
  refresh_interval_days: "فترة التحديث الكاملة",
  test_new_creative_every: "اختبار فكرة جديدة كل",
  gaps: "الفجوات",
  present_tools: "الأدوات الموجودة",
  missing_tools: "الأدوات الناقصة",
  required_events: "الأحداث المطلوبة",
  setup_steps: "خطوات الإعداد",
  monthly_budget: "الميزانية الشهرية",
  daily_target: "الهدف اليومي",
  burn_rate_alerts: "تنبيهات معدل الإنفاق",
  pacing_recommendation: "توصية توزيع الإنفاق",
  check_frequency: "تكرار الفحص",
  primary_kpis: "مؤشرات الأداء الأساسية",
  reporting_dashboard: "لوحة التقارير",
  alert_thresholds: "حدود التنبيه",
};

const FIELD_LABELS_EN: Record<string, string> = {
  ad_impact: "Potential ad impact", benchmarks: "Reference metrics", message: "Message", check_items: "Review items", reason: "Reason", required: "Required", recommendations: "Recommendations", get_metrics: "Required metrics", speed_score: "Speed score", tools: "Tools", impact_on_ads: "Impact on ads", monthly_pacing: "Monthly spend pacing", daily_targets: "Daily targets", weekly_projection: "Weekly spend projection", reallocation_trigger: "Reallocation trigger", emergency_pause: "Emergency pause", projected_spend: "Projected spend", cumulative: "Cumulative total", cpc_expectation: "CPC expectation", competition_level: "Competition level", estimated_cpc_range: "Estimated CPC range", market_saturation: "Market saturation", ad_spend_recommendation: "Ad spend recommendation", content_differentiation: "Content differentiation", industry_average_cvr: "Industry average CVR", industry_average_ctr: "Industry average CTR", target_cpa: "Target CPA", performance_targets: "Performance targets", current_month: "Current month", budget_adjustment: "Budget adjustment", creative_direction: "Creative direction", primary_kpi: "Primary KPI", success_metric: "Success metric", asset_ready: "Creative asset readiness", social_proof_score: "Social proof score", refresh_interval_days: "Full refresh interval", test_new_creative_every: "Test a new creative every", gaps: "Gaps", present_tools: "Available tools", missing_tools: "Missing tools", required_events: "Required events", setup_steps: "Setup steps", monthly_budget: "Monthly budget", daily_target: "Daily target", burn_rate_alerts: "Spend-rate alerts", pacing_recommendation: "Pacing recommendation", check_frequency: "Check frequency", primary_kpis: "Primary KPIs", reporting_dashboard: "Reporting dashboard", alert_thresholds: "Alert thresholds",
};

export function unwrap(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, "value")) {
    return (value as { value: unknown }).value;
  }
  return value;
}

function isUnsafeDisplayText(value: string): boolean {
  return /^function(?:\s+[A-Za-z_$][\w$]*)?\s*\(/i.test(value) || value.includes("jsxDEV") || value.includes("TURBOPACK") || value.includes("node_modules/next");
}

export function isUnavailableValue(value: unknown): boolean {
  const unwrapped = unwrap(value);
  return typeof unwrapped === "string" && (unwrapped === "unavailable" || unwrapped.trim().toLowerCase().startsWith("unavailable:"));
}

export function displayUnavailableReason(value: unknown, fallback = "لا توجد بيانات موثوقة كافية حاليًا.", locale: AppLocale = "ar"): string {
  const unwrapped = unwrap(value);
  const safeFallback = locale === "en" && fallback === "لا توجد بيانات موثوقة كافية حاليًا." ? "There is not enough reliable data at this time." : fallback;
  if (typeof unwrapped !== "string" || !unwrapped.trim()) return safeFallback;
  const normalized = unwrapped.trim().toLowerCase();
  if (normalized.includes("no verified market benchmark source")) return locale === "en" ? "No verified market source matches the market, industry, currency, and objective." : "لا يوجد مصدر سوقي موثوق يطابق السوق والصناعة والعملة والهدف.";
  if (normalized.includes("cpc expectation requires a verified market source")) return locale === "en" ? "A CPC estimate requires a verified source that matches this scope." : "تقدير CPC يتطلب مصدرًا سوقيًا موثوقًا ومطابقًا للنطاق.";
  if (normalized.includes("no verified competitor or market-saturation source")) return locale === "en" ? "There is not enough verified evidence to estimate competition or saturation." : "لا يوجد مصدر موثوق كافٍ لتقدير المنافسة أو تشبع السوق.";
  if (normalized.includes("do not infer competitive spend or cpc")) return locale === "en" ? "Competitive spend or CPC is not inferred without reliable evidence." : "لا يتم تخمين الإنفاق التنافسي أو CPC دون مصدر موثوق.";
  if (normalized.includes("requires a verified market source")) return locale === "en" ? "This value requires a verified market source before use." : "هذه القيمة تتطلب مصدرًا سوقيًا موثوقًا قبل استخدامها.";
  return unwrapped.replace(/^unavailable:\s*/i, "").trim() || safeFallback;
}

export function displayValue(value: unknown, fallback = "غير محدد", locale: AppLocale = "ar"): string {
  const unwrapped = unwrap(value);
  const safeFallback = locale === "en" && fallback === "غير محدد" ? "Not specified" : fallback;
  if (unwrapped === null || unwrapped === undefined || unwrapped === "") return safeFallback;
  if (typeof unwrapped === "function") return safeFallback;
  if (typeof unwrapped === "string") {
    const normalized = unwrapped.trim();
    if (!normalized || isUnsafeDisplayText(normalized)) return safeFallback;
    if (normalized === "unavailable" || normalized.toLowerCase().startsWith("unavailable:")) return locale === "en" ? "Currently unavailable" : "غير متاح حاليًا";
    return (locale === "en" ? DISPLAY_LABELS_EN[normalized] : DISPLAY_LABELS[normalized]) ?? getOptionLabel(locale, normalized, normalized);
  }
  if (typeof unwrapped === "number") return String(unwrapped);
  if (typeof unwrapped === "boolean") return unwrapped ? (locale === "ar" ? "نعم" : "Yes") : (locale === "ar" ? "لا" : "No");
  if (Array.isArray(unwrapped)) return unwrapped.map((item) => displayValue(item, "", locale)).filter(Boolean).join(locale === "ar" ? "، " : ", ") || safeFallback;
  if (typeof unwrapped === "object") {
    const record = unwrapped as Record<string, unknown>;
    if (typeof record.name === "string" && !isUnsafeDisplayText(record.name)) return (locale === "en" ? DISPLAY_LABELS_EN[record.name] : DISPLAY_LABELS[record.name]) ?? getOptionLabel(locale, record.name, record.name);
    if (typeof record.label === "string" && !isUnsafeDisplayText(record.label)) return (locale === "en" ? DISPLAY_LABELS_EN[record.label] : DISPLAY_LABELS[record.label]) ?? getOptionLabel(locale, record.label, record.label);
    if (typeof record.description === "string" && !isUnsafeDisplayText(record.description)) return record.description;
    if (typeof record.type === "string" && !isUnsafeDisplayText(record.type)) return (locale === "en" ? DISPLAY_LABELS_EN[record.type] : DISPLAY_LABELS[record.type]) ?? getOptionLabel(locale, record.type, record.type);
  }
  return safeFallback;
}

export function displayStatus(value: unknown, locale: AppLocale = "ar"): string {
  const unwrapped = unwrap(value);
  if (typeof unwrapped === "string") return (locale === "en" ? DISPLAY_LABELS_EN[unwrapped] : DISPLAY_LABELS[unwrapped]) ?? displayValue(unwrapped, locale === "en" ? "Currently unavailable" : "غير متاح حاليًا", locale);
  return displayValue(unwrapped, locale === "en" ? "Currently unavailable" : "غير متاح حاليًا", locale);
}

export function displayFieldLabel(label: string, locale: AppLocale = "ar"): string {
  if (locale === "en" && FIELD_LABELS_EN[label]) return FIELD_LABELS_EN[label];
  if (FIELD_LABELS[label]) return FIELD_LABELS[label];
  if (locale === "en" && DISPLAY_LABELS_EN[label]) return DISPLAY_LABELS_EN[label];
  if (DISPLAY_LABELS[label]) return DISPLAY_LABELS[label];
  return label.replace(/_/g, " ");
}

export function displaySource(value: unknown, locale: AppLocale = "ar"): string {
  const unwrapped = unwrap(value);
  if (typeof unwrapped === "string" && /^RF-\d+$/i.test(unwrapped)) return locale === "en" ? "CDKS rules" : "قواعد CDKS";
  if (typeof unwrapped === "string" && /^(CDKS|FUN|CH|BS|LR)-/i.test(unwrapped)) return locale === "en" ? "CDKS rules" : "قواعد CDKS";
  if (isUnavailableValue(unwrapped)) return displayUnavailableReason(unwrapped, locale === "en" ? "No reliable evidence." : "لا توجد بيانات موثوقة كافية حاليًا.", locale);
  return displayValue(unwrapped, locale === "en" ? "Unknown" : "غير معروف", locale);
}
