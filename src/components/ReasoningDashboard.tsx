"use client";

import { useMemo, useState } from "react";

type ReasoningContract = {
  contract_version?: string;
  reasoning_id?: string;
  blueprint_id?: string;
  generated_at?: string;
  locale?: "ar" | "en";
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

type TabKey = "overview" | "claims" | "evidence" | "limits";

const tabLabels: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "نظرة عامة" },
  { key: "claims", label: "الـ Claims" },
  { key: "evidence", label: "الأدلة" },
  { key: "limits", label: "القيود والسلامة" },
];

const statusLabels: Record<string, string> = {
  not_requested: "غير مطلوب",
  pending: "قيد المعالجة",
  completed: "مكتمل",
  failed: "فشل محكوم",
};

const claimStatusLabels: Record<string, string> = {
  supported: "مدعوم",
  qualified: "استنتاج مؤهل",
  unsupported: "غير مسند",
  rejected: "مرفوض",
};

const claimTypeLabels: Record<string, string> = {
  evidence_based: "مبني على دليل",
  qualified_inference: "استنتاج مؤهل",
  assumption: "افتراض",
  recommendation: "توصية",
  unsupported: "غير مسند",
};

const severityLabels: Record<string, string> = {
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
};

const authorityLabels: Record<string, string> = {
  WIZARD_INPUT: "مدخلات العميل",
  DECISION_POLICY: "سياسة القرار",
  READINESS_POLICY: "سياسة الجاهزية",
  RULE_ENGINE: "محرك القواعد",
  AI_STRATEGY_BUILDER: "Strategy Builder",
  DEFAULT_ASSUMPTION: "افتراض افتراضي",
  HUMAN_APPROVAL: "اعتماد بشري",
};

function percent(value: number | undefined): string {
  return `${Math.round(Number.isFinite(value) ? Number(value) : 0)}%`;
}

function shortId(value: string | undefined): string {
  if (!value) return "غير متاح";
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function statusClass(status: string | undefined): string {
  if (status === "completed" || status === "supported" || status === "safe") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "failed" || status === "rejected" || status === "unsupported") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function MetricCard({ label, value, hint, tone = "slate" }: { label: string; value: string; hint: string; tone?: "slate" | "emerald" | "amber" | "rose" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs opacity-70">{hint}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">{message}</div>;
}

export default function ReasoningDashboard({ reasoning }: { reasoning?: ReasoningContract | null }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<string[]>([]);

  const claims = reasoning?.claims ?? [];
  const evidence = reasoning?.evidence ?? [];
  const uncertainties = reasoning?.uncertainties ?? [];
  const impacts = reasoning?.decision_impacts ?? [];
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
    return (
      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" dir="rtl" aria-label="AI Reasoning Dashboard">
        <div className="border-b border-slate-200 bg-gradient-to-l from-slate-900 to-slate-700 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">AI Reasoning Dashboard v1</p>
          <h2 className="mt-2 text-xl font-bold">لوحة تفسير القرارات</h2>
        </div>
        <div className="p-6"><EmptyState message="لم يتم طلب AI Reasoning لهذا الـ Blueprint. يمكنك تفعيله من إعدادات التوليد في المرحلة القادمة." /></div>
      </section>
    );
  }

  const status = reasoning.status ?? "pending";
  const isFailed = status === "failed";
  const safetyStatus = safety?.status ?? (isFailed ? "rejected" : "safe");

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" dir="rtl" aria-label="AI Reasoning Dashboard">
      <div className="border-b border-slate-200 bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">AI Reasoning Dashboard v1</p>
              <Badge className={statusClass(status)}>{statusLabels[status] ?? status}</Badge>
              <Badge className={statusClass(safetyStatus)}>{safetyStatus === "safe" ? "اقتراح آمن" : "مرفوض مغلقًا"}</Badge>
            </div>
            <h2 className="mt-3 text-2xl font-bold">كيف وصل النظام إلى هذه التوصيات؟</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">تعرض هذه اللوحة الأدلة والادعاءات والافتراضات والقيود التي قدمها AI Reasoning. القرارات النهائية تظل محفوظة لطبقات CDKS والسياسات والاعتماد البشري.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-xs text-slate-300" dir="ltr">
            <p>reasoning_id: {shortId(reasoning.reasoning_id)}</p>
            <p className="mt-1">blueprint_id: {shortId(reasoning.blueprint_id)}</p>
            <p className="mt-1">contract: {reasoning.contract_version ?? "1.0"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="تغطية الأدلة" value={percent(grounding?.evidence_coverage_percent)} hint="Evidence coverage" tone={Number(grounding?.evidence_coverage_percent ?? 0) >= 75 ? "emerald" : "amber"} />
        <MetricCard label="Claims مدعومة" value={String(claimCounts.supported)} hint="Supported claims" tone="emerald" />
        <MetricCard label="Claims مؤهلة" value={String(claimCounts.qualified)} hint="Qualified inferences" tone="amber" />
        <MetricCard label="Claims غير مسندة" value={String(claimCounts.unsupported)} hint="Unsupported / rejected" tone={claimCounts.unsupported > 0 ? "rose" : "slate"} />
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 py-3" role="tablist" aria-label="أقسام reasoning">
        {tabLabels.map((item) => (
          <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === item.key ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-6">
        {tab === "overview" && (
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-slate-900">ملخص الاستدلال</h3><Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">{reasoning.purpose ?? "explain"}</Badge></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-8 text-slate-700">{reasoning.summary || (isFailed ? reasoning.failure?.message : "لا يوجد ملخص متاح.")}</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-500">المزوّد / النموذج</p><p className="mt-2 font-semibold text-slate-900">{reasoning.provenance?.provider ?? "Mock Provider"} · {reasoning.model ?? reasoning.provenance?.model ?? "controlled"}</p></div>
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-500">وضع الأدلة</p><p className="mt-2 font-semibold text-slate-900">{grounding?.evidence_only_mode ? "Evidence-only mode" : "Grounded reasoning"}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-lg font-bold text-slate-900">أثر الاستدلال على القرارات</h3>
              <div className="mt-4 space-y-3">
                {impacts.length === 0 ? <EmptyState message="لا توجد آثار قرار مسجلة." /> : impacts.map((impact) => (
                  <div key={impact.decision_ref} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs text-slate-500">{impact.decision_ref}</span><Badge className="border-slate-200 bg-slate-50 text-slate-700">{impact.impact}</Badge></div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{impact.rationale}</p>
                    <p className="mt-2 text-xs text-slate-500">السلطة المحفوظة: {authorityLabels[impact.preserved_authority] ?? impact.preserved_authority} · changed=false</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "claims" && (
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900">الادعاءات</h3><span className="text-xs text-slate-500">{claims.length} عناصر</span></div>
              {claims.length === 0 ? <EmptyState message="لا توجد claims متاحة." /> : claims.map((claim) => (
                <button key={claim.id} type="button" onClick={() => setSelectedClaimId(claim.id)} className={`w-full rounded-2xl border p-4 text-right transition ${selectedClaim?.id === claim.id ? "border-indigo-300 bg-indigo-50/70 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-200"}`}>
                  <div className="flex items-center justify-between gap-2"><Badge className={statusClass(claim.status)}>{claimStatusLabels[claim.status] ?? claim.status}</Badge><span className="font-mono text-xs text-slate-400">{claim.id}</span></div>
                  <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-800">{claim.statement}</p>
                  <p className="mt-2 text-xs text-slate-500">الثقة: {percent(claim.confidence * 100)} · {claimTypeLabels[claim.claim_type] ?? claim.claim_type}</p>
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-bold text-slate-900">تفاصيل الـ Claim</h3>
              {!selectedClaim ? <div className="mt-4"><EmptyState message="اختر claim لعرض الأدلة والقيود المرتبطة بها." /></div> : <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm leading-7 text-slate-800">{selectedClaim.statement}</p><div className="mt-3 flex flex-wrap gap-2"><Badge className={statusClass(selectedClaim.status)}>{claimStatusLabels[selectedClaim.status] ?? selectedClaim.status}</Badge><Badge className="border-slate-200 bg-slate-50 text-slate-700">confidence {percent(selectedClaim.confidence * 100)}</Badge></div></div>
                <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Evidence refs</p><div className="flex flex-wrap gap-2">{selectedClaim.evidence_refs.length ? selectedClaim.evidence_refs.map((ref) => <span key={ref} className="rounded-lg bg-indigo-50 px-2.5 py-1.5 font-mono text-xs text-indigo-700">{ref}</span>) : <span className="text-sm text-slate-500">لا توجد أدلة مرتبطة</span>}</div></div>
                <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">القيود المرتبطة</p>{selectedClaim.limitations.length ? <div className="space-y-2">{selectedClaim.limitations.map((item) => <p key={item} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{item}</p>)}</div> : <p className="text-sm text-slate-500">لا توجد قيود خاصة بهذه الـ claim.</p>}</div>
              </div>}
            </div>
          </div>
        )}

        {tab === "evidence" && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">سجل الأدلة</h3><p className="mt-1 text-sm text-slate-500">كل دليل مرتبط بمصدر وسلطة ودرجة تأكيد.</p></div><Badge className="border-slate-200 bg-slate-50 text-slate-700">{evidence.length} أدلة</Badge></div>
            {evidence.length === 0 ? <EmptyState message="لا توجد أدلة مسجلة." /> : <div className="grid gap-3 md:grid-cols-2">{evidence.map((item) => { const isOpen = expandedEvidence.includes(item.id); return <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4"><button type="button" className="w-full text-right" onClick={() => setExpandedEvidence((current) => isOpen ? current.filter((id) => id !== item.id) : [...current, item.id])}><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-indigo-600">{item.id}</p><p className="mt-1 text-sm font-semibold text-slate-900">{item.path}</p></div><span className="text-slate-400">{isOpen ? "−" : "+"}</span></div><div className="mt-3 flex flex-wrap gap-2"><Badge className="border-slate-200 bg-slate-50 text-slate-700">{item.kind}</Badge><Badge className="border-slate-200 bg-slate-50 text-slate-700">{authorityLabels[item.authority] ?? item.authority}</Badge><Badge className={item.user_confirmed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{item.user_confirmed ? "مؤكد" : "غير مؤكد"}</Badge></div></button>{isOpen && <div className="mt-4 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600"><p><span className="font-semibold text-slate-800">المصدر:</span> {item.source_ref}</p>{item.excerpt && <p className="mt-2 rounded-lg bg-slate-50 p-3">{item.excerpt}</p>}{item.limitations.length > 0 && <div className="mt-3 space-y-1">{item.limitations.map((limit) => <p key={limit} className="text-xs text-amber-700">قيد: {limit}</p>)}</div>}</div>}</div>; })}</div>}
          </div>
        )}

        {tab === "limits" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5"><h3 className="text-lg font-bold text-slate-900">الافتراضات وعدم اليقين</h3><div className="mt-4 space-y-3">{uncertainties.length === 0 ? <EmptyState message="لا توجد حالات عدم يقين مسجلة." /> : uncertainties.map((item) => <div key={item.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs text-amber-700">{item.id}</span><Badge className="border-amber-200 bg-white/60 text-amber-800">{severityLabels[item.severity] ?? item.severity}</Badge></div><p className="mt-2 text-sm font-semibold leading-6 text-amber-950">{item.statement}</p><p className="mt-2 text-xs leading-5 text-amber-800">المعالجة المقترحة: {item.resolution}</p></div>)}</div></div>
            <div className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-slate-900">حواجز السلامة</h3><Badge className={statusClass(safetyStatus)}>{safetyStatus === "safe" ? "SAFE" : "REJECTED"}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-500">هذه الحواجز تمنع reasoning من تغيير قرارات النظام أو تنفيذ أي إجراء خارجي.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{["can_mutate_cdks", "can_change_blueprint", "can_authorize_launch", "can_spend_budget", "external_actions_allowed", "budget_spend_allowed", "readiness_override_attempted"].map((key) => <div key={key} className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs"><span className="font-mono text-emerald-900">{key}</span><strong className="text-emerald-700">false</strong></div>)}</div>{(safety?.blocked_actions?.length ?? 0) > 0 && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-xs font-bold text-rose-800">إجراءات محظورة</p><div className="mt-2 space-y-1">{safety?.blocked_actions.map((action) => <p key={action} className="text-sm text-rose-900">{action}</p>)}</div></div>}</div>
            <div className="rounded-2xl border border-slate-200 p-5 lg:col-span-2"><h3 className="text-lg font-bold text-slate-900">قيود العرض</h3>{limitations.length === 0 ? <p className="mt-3 text-sm text-slate-500">لا توجد قيود عامة مسجلة.</p> : <div className="mt-3 grid gap-2 md:grid-cols-2">{limitations.map((item) => <p key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item}</p>)}</div>}</div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
        <span>AI يقترح ويشرح فقط · CDKS يقرر · الإنسان يعتمد</span>
        <span>{reasoning.generated_at ? new Date(reasoning.generated_at).toLocaleString(reasoning.locale === "en" ? "en-US" : "ar-EG") : "وقت التوليد غير متاح"}</span>
      </div>
    </section>
  );
}
