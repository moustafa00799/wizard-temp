export const DISPLAY_LABELS: Record<string, string> = {
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

export function displayUnavailableReason(value: unknown, fallback = "لا توجد بيانات موثوقة كافية حاليًا."): string {
  const unwrapped = unwrap(value);
  if (typeof unwrapped !== "string" || !unwrapped.trim()) return fallback;
  const normalized = unwrapped.trim().toLowerCase();
  if (normalized.includes("no verified market benchmark source")) return "لا يوجد مصدر سوقي موثوق يطابق السوق والصناعة والعملة والهدف.";
  if (normalized.includes("cpc expectation requires a verified market source")) return "تقدير CPC يتطلب مصدرًا سوقيًا موثوقًا ومطابقًا للنطاق.";
  if (normalized.includes("no verified competitor or market-saturation source")) return "لا يوجد مصدر موثوق كافٍ لتقدير المنافسة أو تشبع السوق.";
  if (normalized.includes("do not infer competitive spend or cpc")) return "لا يتم تخمين الإنفاق التنافسي أو CPC دون مصدر موثوق.";
  if (normalized.includes("requires a verified market source")) return "هذه القيمة تتطلب مصدرًا سوقيًا موثوقًا قبل استخدامها.";
  return unwrapped.replace(/^unavailable:\s*/i, "").trim() || fallback;
}

export function displayValue(value: unknown, fallback = "غير محدد"): string {
  const unwrapped = unwrap(value);
  if (unwrapped === null || unwrapped === undefined || unwrapped === "") return fallback;
  if (typeof unwrapped === "function") return fallback;
  if (typeof unwrapped === "string") {
    const normalized = unwrapped.trim();
    if (!normalized || isUnsafeDisplayText(normalized)) return fallback;
    if (normalized === "unavailable" || normalized.toLowerCase().startsWith("unavailable:")) return "غير متاح حاليًا";
    return DISPLAY_LABELS[normalized] ?? normalized;
  }
  if (typeof unwrapped === "number") return String(unwrapped);
  if (typeof unwrapped === "boolean") return unwrapped ? "نعم" : "لا";
  if (Array.isArray(unwrapped)) return unwrapped.map((item) => displayValue(item, "")).filter(Boolean).join("، ") || fallback;
  if (typeof unwrapped === "object") {
    const record = unwrapped as Record<string, unknown>;
    if (typeof record.name === "string" && !isUnsafeDisplayText(record.name)) return DISPLAY_LABELS[record.name] ?? record.name;
    if (typeof record.label === "string" && !isUnsafeDisplayText(record.label)) return DISPLAY_LABELS[record.label] ?? record.label;
    if (typeof record.description === "string" && !isUnsafeDisplayText(record.description)) return record.description;
    if (typeof record.type === "string" && !isUnsafeDisplayText(record.type)) return DISPLAY_LABELS[record.type] ?? record.type;
  }
  return fallback;
}

export function displayStatus(value: unknown): string {
  const unwrapped = unwrap(value);
  if (typeof unwrapped === "string" && DISPLAY_LABELS[unwrapped]) return DISPLAY_LABELS[unwrapped];
  return displayValue(unwrapped, "غير متاح حاليًا");
}

export function displayFieldLabel(label: string): string {
  if (FIELD_LABELS[label]) return FIELD_LABELS[label];
  if (DISPLAY_LABELS[label]) return DISPLAY_LABELS[label];
  return label.replace(/_/g, " ");
}

export function displaySource(value: unknown): string {
  const unwrapped = unwrap(value);
  if (typeof unwrapped === "string" && /^RF-\d+$/i.test(unwrapped)) return "قواعد CDKS";
  if (typeof unwrapped === "string" && /^(CDKS|FUN|CH|BS|LR)-/i.test(unwrapped)) return "قواعد CDKS";
  if (isUnavailableValue(unwrapped)) return displayUnavailableReason(unwrapped);
  return displayValue(unwrapped, "غير معروف");
}
