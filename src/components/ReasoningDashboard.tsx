"use client";

import { useMemo, useState, type ReactNode } from "react";
import { formatLocaleNumber, localizeText, localeDirection, type AppLocale } from "../lib/i18n";

type ReasoningContract = {
  contract_version?: string;
  reasoning_id?: string;
  blueprint_id?: string;
  generated_at?: string;
  locale?: AppLocale;
  purpose?: string;
  status?: "not_requested" | "pending" | "completed" | "failed";
  authority?: string;
  model?: string;
  summary?: string;
  claims?: Array<{
    id: string;
    statement: string;
    claim_type: string;
    status: string;
    confidence: number;
    evidence_refs: string[];
    decision_refs: string[];
    uncertainty_refs: string[];
    limitations: string[];
  }>;
  evidence?: Array<{
    id: string;
    kind: string;
    path: string;
    source_ref: string;
    authority: string;
    user_confirmed: boolean;
    relevance: string;
    excerpt?: string;
    limitations: string[];
  }>;
  uncertainties?: Array<{
    id: string;
    statement: string;
    category: string;
    severity: string;
    affects: string[];
    resolution: string;
  }>;
  decision_impacts?: Array<{
    decision_ref: string;
    impact: string;
    rationale: string;
    preserved_authority: string;
    changed: false;
  }>;
  decision_explanations?: Array<{
    decision_ref: string;
    what_decided: string;
    why_this_fits: string;
    expected_effect: string;
    tradeoffs: string[];
    risks: string[];
    what_would_change_it: string[];
    next_validation_step: string;
    evidence_refs: string[];
    uncertainty_refs: string[];
  }>;
  limitations?: string[];
  grounding?: {
    evidence_coverage_percent: number;
    supported_claim_count: number;
    qualified_claim_count: number;
    unsupported_claim_count: number;
    evidence_only_mode: boolean;
  };
  safety?: {
    status: "safe" | "rejected";
    can_mutate_cdks: false;
    can_change_blueprint: false;
    can_authorize_launch: false;
    can_spend_budget: false;
    external_actions_allowed: false;
    budget_spend_allowed: false;
    readiness_override_attempted: false;
    blocked_actions: string[];
  };
  provenance?: {
    provider?: string;
    model?: string;
    mode?: string;
    fallback_used?: boolean;
    failureCategory?: string;
    failureStatus?: string;
  };
  failure?: { code: string; message: string; retryable: boolean };
};

type TabKey = "overview" | "decisions" | "claims" | "evidence" | "limits";

const tabLabels: Record<TabKey, [string, string]> = {
  overview: ["نظرة العميل", "Client summary"],
  decisions: ["شرح القرارات", "Decision explanations"],
  claims: ["الاستنتاجات", "Claims"],
  evidence: ["مصادر التفسير", "Evidence"],
  limits: ["الحدود والسلامة", "Limits and safety"],
};

const statusLabels: Record<string, [string, string]> = {
  not_requested: ["غير مطلوب", "Not requested"],
  pending: ["قيد المعالجة", "In progress"],
  completed: ["مكتمل", "Completed"],
  failed: ["غير متاح حاليًا", "Unavailable"],
};

const claimStatusLabels: Record<string, [string, string]> = {
  supported: ["مدعوم", "Supported"],
  qualified: ["استنتاج مؤهل", "Qualified inference"],
  unsupported: ["غير مسند", "Unsupported"],
  rejected: ["مرفوض", "Rejected"],
};

const claimTypeLabels: Record<string, [string, string]> = {
  evidence_based: ["مبني على دليل", "Evidence-based"],
  qualified_inference: ["استنتاج مؤهل", "Qualified inference"],
  assumption: ["افتراض", "Assumption"],
  recommendation: ["توصية", "Recommendation"],
  unsupported: ["غير مسند", "Unsupported"],
};

const severityLabels: Record<string, [string, string]> = {
  low: ["منخفض", "Low"],
  medium: ["متوسط", "Medium"],
  high: ["مرتفع", "High"],
};

const authorityLabels: Record<string, [string, string]> = {
  WIZARD_INPUT: ["مدخلات العميل", "Client input"],
  DECISION_POLICY: ["سياسة القرار", "Decision policy"],
  READINESS_POLICY: ["سياسة الجاهزية", "Readiness policy"],
  RULE_ENGINE: ["محرك القواعد", "Rules Engine"],
  AI_STRATEGY_BUILDER: ["Strategy Builder", "Strategy Builder"],
  DEFAULT_ASSUMPTION: ["افتراض افتراضي", "Default assumption"],
  HUMAN_APPROVAL: ["اعتماد بشري", "Human approval"],
};

const impactLabels: Record<string, [string, string]> = {
  supports: ["يدعم القرار", "Supports the decision"],
  clarifies: ["يوضح القرار", "Clarifies the decision"],
  challenges: ["يتحدى القرار", "Challenges the decision"],
  no_change: ["لا يغير القرار", "Does not change the decision"],
};

const evidenceKindLabels: Record<string, [string, string]> = {
  wizard_input: ["مدخلات Wizard", "Wizard input"],
  cdks_decision: ["قرار CDKS", "CDKS decision"],
  rule_output: ["مخرج قاعدة", "Rule output"],
  blueprint_field: ["حقل Blueprint", "Blueprint field"],
  warning: ["تحذير", "Warning"],
  provenance: ["سجل مصدر", "Provenance"],
  ai_strategy: ["اقتراح Strategy Builder", "Strategy Builder suggestion"],
  assumption: ["افتراض", "Assumption"],
};

function text(locale: AppLocale, pair: [string, string]): string {
  return locale === "ar" ? pair[0] : pair[1];
}

function percent(value: number | undefined, locale: AppLocale): string {
  const numeric = Number.isFinite(value) ? Number(value) : 0;
  return `${formatLocaleNumber(Math.round(numeric), locale)}%`;
}

function count(value: number, locale: AppLocale): string {
  return formatLocaleNumber(value, locale);
}

function shortId(value: string | undefined): string {
  if (!value) return "—";
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function statusClass(status: string | undefined): string {
  if (status === "completed" || status === "supported" || status === "safe") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "failed" || status === "rejected" || status === "unsupported") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function MetricCard({ label, value, hint, tone = "slate" }: { label: string; value: string; hint: string; tone?: "slate" | "emerald" | "amber" | "rose" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  };
  return <div className={`rounded-2xl border p-4 ${tones[tone]}`}><p className="text-xs font-medium opacity-70">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs opacity-70">{hint}</p></div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">{message}</div>;
}

function TechnicalDetails({ reasoning, locale }: { reasoning: ReasoningContract; locale: AppLocale }) {
  return <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
    <summary className="cursor-pointer font-semibold text-slate-700">{localizeText(locale, "تفاصيل تقنية للمراجع فقط", "Technical details for reviewers")}</summary>
    <div className="mt-3 grid gap-2 sm:grid-cols-2" dir="ltr">
      <p>reasoning_id: {shortId(reasoning.reasoning_id)}</p>
      <p>blueprint_id: {shortId(reasoning.blueprint_id)}</p>
      <p>contract: {reasoning.contract_version ?? "1.0"}</p>
      <p>provider: {reasoning.provenance?.provider ?? "controlled"}</p>
      <p>model: {reasoning.model ?? reasoning.provenance?.model ?? "controlled"}</p>
      <p>failure_code: {reasoning.failure?.code ?? "—"}</p>
    </div>
  </details>;
}

export default function ReasoningDashboard({ reasoning }: { reasoning?: ReasoningContract | null }) {
  const locale: AppLocale = reasoning?.locale === "en" ? "en" : "ar";
  const [tab, setTab] = useState<TabKey>("overview");
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<string[]>([]);

  const claims = useMemo(() => reasoning?.claims ?? [], [reasoning?.claims]);
  const evidence = reasoning?.evidence ?? [];
  const uncertainties = reasoning?.uncertainties ?? [];
  const impacts = reasoning?.decision_impacts ?? [];
  const explanations = reasoning?.decision_explanations ?? [];
  const limitations = reasoning?.limitations ?? [];
  const grounding = reasoning?.grounding;
  const safety = reasoning?.safety;
  const selectedClaim = claims.find((claim) => claim.id === selectedClaimId) ?? claims[0];
  const claimCounts = useMemo(() => ({
    supported: grounding?.supported_claim_count ?? claims.filter((claim) => claim.status === "supported").length,
    qualified: grounding?.qualified_claim_count ?? claims.filter((claim) => claim.status === "qualified").length,
    unsupported: grounding?.unsupported_claim_count ?? claims.filter((claim) => ["unsupported", "rejected"].includes(claim.status)).length,
  }), [claims, grounding]);

  if (!reasoning || reasoning.status === "not_requested") {
    return <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" dir={localeDirection(locale)} lang={locale} aria-label={localizeText(locale, "تفسير AI", "AI explanation")}>
      <div className="border-b border-slate-200 bg-gradient-to-l from-slate-900 to-slate-700 px-6 py-5 text-white"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{localizeText(locale, "تفسير AI الاستشاري", "Advisory AI explanation")}</p><h2 className="mt-2 text-xl font-bold">{localizeText(locale, "لا يوجد تفسير AI لهذا Blueprint", "No AI explanation was requested")}</h2></div>
      <div className="p-6"><EmptyState message={localizeText(locale, "تم بناء Blueprint بواسطة CDKS وRules Engine فقط. يمكنك تشغيل AI الاستشاري اختياريًا من Wizard في تجربة توليد جديدة.", "This Blueprint was built by CDKS and the Rules Engine only. You can enable optional advisory AI in the Wizard for a new generation.")} /></div>
    </section>;
  }

  const status = reasoning.status ?? "pending";
  const isFailed = status === "failed";
  const safetyStatus = safety?.status ?? (isFailed ? "rejected" : "safe");

  if (isFailed) {
    return <section className="mt-6 overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm" dir={localeDirection(locale)} lang={locale} aria-label={localizeText(locale, "حالة تفسير AI", "AI explanation status")}>
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-5"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{localizeText(locale, "تفسير AI الاستشاري", "Advisory AI explanation")}</p><Badge className={statusClass(status)}>{text(locale, statusLabels[status] ?? [status, status])}</Badge></div><h2 className="mt-3 text-xl font-bold text-amber-950">{localizeText(locale, "التفسير غير متاح حاليًا", "The explanation is currently unavailable")}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-amber-900">{localizeText(locale, "لم يمر مخرج AI بالتحقق المطلوب. تظل قرارات CDKS وBlueprint كما هي، ولم يتم تغييرها أو تنفيذ أي إجراء خارجي.", "The AI output did not pass the required validation. CDKS and Blueprint decisions remain unchanged, and no external action was executed.")}</p></div>
      <div className="p-6"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{localizeText(locale, "يمكنك متابعة المراجعة من الملخص والـBlueprint التفصيلي. لا تعرض هذه الحالة أرقامًا صفرية على أنها أداء أو تغطية سوقية.", "You can continue with the client summary and detailed Blueprint. This state does not display zero values as performance or market coverage.")}</div><TechnicalDetails reasoning={reasoning} locale={locale} /></div>
    </section>;
  }

  return <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" dir={localeDirection(locale)} lang={locale} aria-label={localizeText(locale, "تفسير AI الاستشاري", "Advisory AI explanation")}>
    <div className="border-b border-slate-200 bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-start"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">{localizeText(locale, "تفسير AI الاستشاري", "Advisory AI explanation")}</p><Badge className={statusClass(status)}>{text(locale, statusLabels[status] ?? [status, status])}</Badge><Badge className={statusClass(safetyStatus)}>{safetyStatus === "safe" ? localizeText(locale, "اقتراح آمن", "Safe advisory") : localizeText(locale, "مرفوض مغلقًا", "Rejected closed")}</Badge></div><h2 className="mt-3 text-2xl font-bold">{localizeText(locale, "كيف وصل النظام إلى هذه التوصيات؟", "How did the system reach these recommendations?")}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">{localizeText(locale, "يشرح هذا القسم منطق القرارات ومفاضلاتها وحدودها. AI يفسر ويقترح فقط؛ تظل CDKS والسياسات والاعتماد البشري هي السلطة.", "This section explains decision logic, tradeoffs, and limits. AI only explains and suggests; CDKS, policies, and human approval remain authoritative.")}</p></div></div></div>
    <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label={localizeText(locale, "تغطية الأدلة", "Evidence coverage")} value={percent(grounding?.evidence_coverage_percent, locale)} hint={localizeText(locale, "نسبة الادعاءات المرتبطة بمراجع", "Claims linked to references")} tone={Number(grounding?.evidence_coverage_percent ?? 0) >= 75 ? "emerald" : "amber"} /><MetricCard label={localizeText(locale, "استنتاجات مدعومة", "Supported claims")} value={count(claimCounts.supported, locale)} hint={localizeText(locale, "مرتبطة بأدلة", "Grounded in evidence")} tone="emerald" /><MetricCard label={localizeText(locale, "استنتاجات مؤهلة", "Qualified inferences")} value={count(claimCounts.qualified, locale)} hint={localizeText(locale, "تحتاج قراءة حدودها", "Read their limits")} tone="amber" /><MetricCard label={localizeText(locale, "غير مسندة / مرفوضة", "Unsupported / rejected")} value={count(claimCounts.unsupported, locale)} hint={localizeText(locale, "لا تستخدم كحقيقة", "Do not treat as fact")} tone={claimCounts.unsupported > 0 ? "rose" : "slate"} /></div>
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 py-3" role="tablist" aria-label={localizeText(locale, "أقسام تفسير AI", "AI explanation sections")}>{(Object.keys(tabLabels) as TabKey[]).map((key) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === key ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{text(locale, tabLabels[key])}</button>)}</div>
    <div className="p-5 md:p-6">
      {tab === "overview" && <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"><div><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-slate-900">{localizeText(locale, "ملخص التفسير", "Explanation summary")}</h3><Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">{reasoning.purpose ?? "explain"}</Badge></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-8 text-slate-700">{reasoning.summary || localizeText(locale, "لا يوجد ملخص متاح.", "No summary is available.")}</div><div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5"><p className="text-sm font-bold text-indigo-950">{localizeText(locale, "الخلاصة العملية", "Practical takeaway")}</p><p className="mt-2 text-sm leading-7 text-indigo-900">{localizeText(locale, "استخدم الشرح لفهم القرار وما يجب التحقق منه، وليس لتوقع نتيجة أو تجاوز بوابة الجاهزية.", "Use the explanation to understand the decision and what to validate, not to predict an outcome or bypass readiness.")}</p></div></div><div className="rounded-2xl border border-slate-200 p-5"><h3 className="text-lg font-bold text-slate-900">{localizeText(locale, "حالة السلطة", "Authority status")}</h3><div className="mt-4 space-y-3"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{localizeText(locale, "CDKS يقرر، وAI يشرح ويقترح فقط.", "CDKS decides; AI only explains and suggests.")}</div><div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{localizeText(locale, "الأثر المتوقع صياغة مشروطة وليس وعدًا بالأداء.", "Expected effect is qualified language, not a performance promise.")}</div>{impacts.length > 0 && <div className="mt-3 space-y-2"><p className="text-xs font-bold text-slate-500">{localizeText(locale, "أثر الشرح على القرارات", "Explanation impact on decisions")}</p>{impacts.slice(0, 4).map((impact) => <div key={impact.decision_ref} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-700">{text(locale, impactLabels[impact.impact] ?? [impact.impact, impact.impact])}</span><span className="font-mono text-[10px] text-slate-400">changed=false</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{impact.rationale}</p></div>)}</div>}</div></div></div>}
      {tab === "decisions" && <div><div className="mb-4"><h3 className="text-lg font-bold text-slate-900">{localizeText(locale, "شرح القرارات", "Decision explanations")}</h3><p className="mt-1 text-sm text-slate-500">{localizeText(locale, "شرح مهني يوضح لماذا يلائم القرار المدخلات، وما المفاضلات والمخاطر وخطوة التحقق التالية.", "A professional explanation of fit, tradeoffs, risks, and the next validation step.")}</p></div>{explanations.length === 0 ? <EmptyState message={localizeText(locale, "لا توجد شروحات قرار تفصيلية لهذا المخرج.", "No detailed decision explanations are available for this output.")} /> : <div className="space-y-4">{explanations.map((item) => <article key={item.decision_ref} className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5"><h4 className="text-base font-bold text-indigo-950">{item.what_decided}</h4><div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-700">{localizeText(locale, "لماذا يناسب؟", "Why it fits")}</p><p className="mt-1 text-sm leading-7 text-slate-700">{item.why_this_fits}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-700">{localizeText(locale, "الأثر المتوقع — بصياغة مشروطة", "Expected effect — qualified")}</p><p className="mt-1 text-sm leading-7 text-slate-700">{item.expected_effect}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-amber-700">{localizeText(locale, "المفاضلات", "Tradeoffs")}</p><ul className="mt-1 list-disc space-y-1 ps-5 text-sm leading-6 text-slate-700">{item.tradeoffs.map((value) => <li key={value}>{value}</li>)}</ul></div><div><p className="text-xs font-bold uppercase tracking-wide text-rose-700">{localizeText(locale, "المخاطر", "Risks")}</p><ul className="mt-1 list-disc space-y-1 ps-5 text-sm leading-6 text-slate-700">{item.risks.map((value) => <li key={value}>{value}</li>)}</ul></div><div><p className="text-xs font-bold uppercase tracking-wide text-amber-700">{localizeText(locale, "ما الذي قد يغيره؟", "What would change it")}</p><ul className="mt-1 list-disc space-y-1 ps-5 text-sm leading-6 text-slate-700">{item.what_would_change_it.map((value) => <li key={value}>{value}</li>)}</ul></div><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{localizeText(locale, "خطوة التحقق التالية", "Next validation step")}</p><p className="mt-1 text-sm leading-7 text-slate-700">{item.next_validation_step}</p></div></div></article>)}</div>}</div>}
      {tab === "claims" && <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"><div className="space-y-3"><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900">{localizeText(locale, "الاستنتاجات", "Claims")}</h3><span className="text-xs text-slate-500">{count(claims.length, locale)} {localizeText(locale, "عناصر", "items")}</span></div>{claims.length === 0 ? <EmptyState message={localizeText(locale, "لا توجد claims متاحة.", "No claims are available.")} /> : claims.map((claim) => <button key={claim.id} type="button" onClick={() => setSelectedClaimId(claim.id)} className={`w-full rounded-2xl border p-4 ${selectedClaim?.id === claim.id ? "border-indigo-300 bg-indigo-50/70 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-200"}`}><div className="flex items-center justify-between gap-2"><Badge className={statusClass(claim.status)}>{text(locale, claimStatusLabels[claim.status] ?? [claim.status, claim.status])}</Badge><span className="text-xs text-slate-500">{text(locale, claimTypeLabels[claim.claim_type] ?? [claim.claim_type, claim.claim_type])}</span></div><p className="mt-3 text-start text-sm font-medium leading-6 text-slate-800">{claim.statement}</p></button>)}</div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h3 className="text-lg font-bold text-slate-900">{localizeText(locale, "تفاصيل الاستنتاج", "Claim details")}</h3>{!selectedClaim ? <div className="mt-4"><EmptyState message={localizeText(locale, "اختر استنتاجًا لعرض حدوده.", "Select a claim to view its limits.")} /></div> : <div className="mt-4 space-y-4"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm leading-7 text-slate-800">{selectedClaim.statement}</p><div className="mt-3 flex flex-wrap gap-2"><Badge className={statusClass(selectedClaim.status)}>{text(locale, claimStatusLabels[selectedClaim.status] ?? [selectedClaim.status, selectedClaim.status])}</Badge><Badge className="border-slate-200 bg-slate-50 text-slate-700">{localizeText(locale, "الثقة", "Confidence")} {percent(selectedClaim.confidence * 100, locale)}</Badge></div></div><div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{localizeText(locale, "حدود الاستنتاج", "Claim limits")}</p>{selectedClaim.limitations.length ? <div className="space-y-2">{selectedClaim.limitations.map((item) => <p key={item} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{item}</p>)}</div> : <p className="text-sm text-slate-500">{localizeText(locale, "لا توجد قيود خاصة بهذا الاستنتاج.", "No specific limits are recorded for this claim.")}</p>}</div></div>}</div></div>}
      {tab === "evidence" && <div><div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">{localizeText(locale, "مصادر التفسير", "Explanation evidence")}</h3><p className="mt-1 text-sm text-slate-500">{localizeText(locale, "تظهر هنا طبيعة الدليل وسلطته دون كشف المعرفات التقنية للمستخدم النهائي.", "Evidence type and authority are shown without exposing technical identifiers to the client.")}</p></div><Badge className="border-slate-200 bg-slate-50 text-slate-700">{count(evidence.length, locale)} {localizeText(locale, "أدلة", "items")}</Badge></div>{evidence.length === 0 ? <EmptyState message={localizeText(locale, "لا توجد أدلة مسجلة.", "No evidence is recorded.")} /> : <div className="grid gap-3 md:grid-cols-2">{evidence.map((item) => { const isOpen = expandedEvidence.includes(item.id); return <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4"><button type="button" className="w-full text-start" onClick={() => setExpandedEvidence((current) => isOpen ? current.filter((id) => id !== item.id) : [...current, item.id])}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{text(locale, evidenceKindLabels[item.kind] ?? [item.kind, item.kind])}</p><p className="mt-1 text-xs text-slate-500">{text(locale, authorityLabels[item.authority] ?? [item.authority, item.authority])}</p></div><span className="text-slate-400">{isOpen ? "−" : "+"}</span></div><div className="mt-3 flex flex-wrap gap-2"><Badge className={item.user_confirmed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{item.user_confirmed ? localizeText(locale, "مؤكد", "Confirmed") : localizeText(locale, "غير مؤكد", "Unconfirmed")}</Badge><Badge className="border-slate-200 bg-slate-50 text-slate-700">{item.relevance}</Badge></div></button>{isOpen && <div className="mt-4 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">{item.excerpt && <p className="rounded-lg bg-slate-50 p-3">{item.excerpt}</p>}{item.limitations.length > 0 && <div className="mt-3 space-y-1">{item.limitations.map((limit) => <p key={limit} className="text-xs text-amber-700">{localizeText(locale, "قيد: ", "Limit: ")}{limit}</p>)}</div>}</div>}</div>; })}</div>}</div>}
      {tab === "limits" && <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-5"><h3 className="text-lg font-bold text-slate-900">{localizeText(locale, "الافتراضات وعدم اليقين", "Assumptions and uncertainty")}</h3><div className="mt-4 space-y-3">{uncertainties.length === 0 ? <EmptyState message={localizeText(locale, "لا توجد حالات عدم يقين مسجلة.", "No uncertainty is recorded.")} /> : uncertainties.map((item) => <div key={item.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center justify-between gap-2"><span className="font-semibold text-amber-950">{text(locale, severityLabels[item.severity] ?? [item.severity, item.severity])}</span><Badge className="border-amber-200 bg-white/60 text-amber-800">{text(locale, severityLabels[item.severity] ?? [item.severity, item.severity])}</Badge></div><p className="mt-2 text-sm font-semibold leading-6 text-amber-950">{item.statement}</p><p className="mt-2 text-xs leading-5 text-amber-800">{localizeText(locale, "خطوة المعالجة: ", "Resolution: ")}{item.resolution}</p></div>)}</div></div><div className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-slate-900">{localizeText(locale, "حواجز السلامة", "Safety guardrails")}</h3><Badge className={statusClass(safetyStatus)}>{safetyStatus === "safe" ? "SAFE" : "REJECTED"}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-500">{localizeText(locale, "لا يستطيع AI تغيير CDKS أو Blueprint أو اعتماد الإطلاق أو إنفاق الميزانية.", "AI cannot change CDKS or the Blueprint, authorize launch, or spend budget.")}</p><div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{localizeText(locale, "جميع حدود التنفيذ الخارجي مقفلة.", "All external execution boundaries are locked.")}</div>{(safety?.blocked_actions?.length ?? 0) > 0 && <details className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3"><summary className="cursor-pointer text-xs font-bold text-rose-800">{localizeText(locale, "الإجراءات المحظورة", "Blocked actions")}</summary><div className="mt-2 space-y-1">{safety?.blocked_actions.map((action) => <p key={action} className="text-sm text-rose-900">{action}</p>)}</div></details>}</div><div className="rounded-2xl border border-slate-200 p-5 lg:col-span-2"><h3 className="text-lg font-bold text-slate-900">{localizeText(locale, "قيود العرض", "Display limits")}</h3>{limitations.length === 0 ? <p className="mt-3 text-sm text-slate-500">{localizeText(locale, "لا توجد قيود عامة مسجلة.", "No general limitations are recorded.")}</p> : <div className="mt-3 grid gap-2 md:grid-cols-2">{limitations.map((item) => <p key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item}</p>)}</div>}</div></div>}
    </div>
    <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between"><span>{localizeText(locale, "AI يقترح ويشرح فقط · CDKS يقرر · الإنسان يعتمد", "AI explains and suggests only · CDKS decides · Human approves")}</span><span>{reasoning.generated_at ? new Date(reasoning.generated_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-US") : localizeText(locale, "وقت التوليد غير متاح", "Generation time unavailable")}</span></div>
    <div className="px-5 pb-5 md:px-6"><TechnicalDetails reasoning={reasoning} locale={locale} /></div>
  </section>;
}
