"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

type Overview = {
  workspace: { id: string; name: string; mode: string };
  scenarios: Array<{ id: string; label: string; description: string; status: string; blueprintId?: string; updatedAt?: string }>;
  counts: Record<string, number>;
  governance: Record<string, string | boolean>;
  tests: { databaseRegressionAssertions: number; migrationCount: number; foreignKeys: string; canonicalBlueprintMutation: boolean; secretMaterialStored: boolean };
  randomizedSuite: { testRunId: string; seed: number; variantsPerCase: number; totalRuns: number; status: string; summary: Record<string, unknown>; createdAt: string } | null;
};

type Recommendation = {
  strategicPositioning: string;
  primaryHypothesis: string;
  messageAngles: string[];
  audienceHypotheses: string[];
  channelRoles: string[];
  experimentIdeas: string[];
  requiredValidations: string[];
  evidenceRefs: string[];
  limitations: string[];
  market: string;
  industry: string;
  currency: string;
};

type WizardSummary = {
  businessType: string;
  primaryObjective: string;
  targetLocations: string[];
  conversionDestination: string;
  adChannels: string[];
  trackingStatus: string;
  finalConfirmedInputs: boolean;
};

type BlueprintAuthority = {
  objective: string;
  funnel: string;
  channels: string[];
  readiness: { value?: string; authority?: string; rule_id?: string; confidence?: number; uncertainty?: string[] };
};

type SuiteResult = {
  suite: string;
  status: string;
  seed: number;
  variantsPerCase: number;
  corpusCount: number;
  totalRuns: number;
  testRunId: string;
  summary: { pass: number; fail: number; uniqueDecisionDigests: number; canonicalBlueprintMutation: boolean; externalActions: boolean; budgetSpend: boolean };
};

type ScenarioResult = {
  scenario: { id: string; label: string; description: string };
  status: string;
  blueprintId: string;
  contextId: string;
  recommendationId: string;
  wizardSummary: WizardSummary;
  blueprintAuthority: BlueprintAuthority;
  recommendation: Recommendation;
  governance: { generationMode: string; externalActionsAllowed: boolean; budgetSpendAllowed: boolean; requiresHumanApproval: boolean; canonicalBlueprintUnchanged: boolean };
  note: string;
};

const LABELS: Record<string, string> = {
  workspaces: "مساحات العمل",
  briefs: "ملفات العميل",
  blueprints: "Blueprints",
  snapshots: "Knowledge Snapshots",
  evidencePackages: "حزم الأدلة",
  contexts: "السياقات الاستراتيجية",
  recommendations: "التوصيات",
  stagingTestRuns: "تشغيلات الاختبار",
  approvalsPending: "موافقات معلقة",
  auditEvents: "أحداث التدقيق",
};

const VALUE_LABELS: Record<string, string> = {
  sales: "المبيعات",
  leads: "العملاء المحتملون",
  trust_funnel: "مسار بناء الثقة",
  solution_funnel: "مسار الحل",
  education_funnel: "مسار التثقيف",
  direct_conversion: "التحويل المباشر",
  lead_gen_call: "توليد العملاء/الاتصال",
  website: "الموقع الإلكتروني",
  form: "نموذج تسجيل",
  partial: "جزئي",
  complete: "مكتمل",
  review: "يحتاج مراجعة",
  ready: "جاهز",
  blocked: "متوقف",
  ready_with_fixes: "جاهز مع إصلاحات",
};

function displayValue(value: string): string {
  return VALUE_LABELS[value] ?? value.replaceAll("_", " ");
}

function formatDate(value?: string): string {
  if (!value) return "لا يوجد تشغيل محفوظ";
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}

function StatusPill({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "amber" | "slate" | "violet" | "rose" }) {
  const styles = tone === "green"
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : tone === "amber"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
      : tone === "violet"
        ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
        : tone === "rose"
          ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
          : "border-slate-500/30 bg-slate-500/10 text-slate-300";
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>{children}</span>;
}

function Section({ title, items, emptyLabel = "لا توجد عناصر مسجلة." }: { title: string; items: string[]; emptyLabel?: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <h3 className="mb-3 text-sm font-bold text-white">{title}</h3>
      <div className="space-y-2 text-sm leading-7 text-slate-300">
        {items.length > 0 ? items.map((item, index) => <p key={`${title}-${index}`} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">{item}</p>) : <p className="text-slate-500">{emptyLabel}</p>}
      </div>
    </section>
  );
}

function KeyValue({ label, value, tone = "normal" }: { label: string; value: ReactNode; tone?: "normal" | "positive" | "warning" }) {
  const valueClass = tone === "positive" ? "text-emerald-300" : tone === "warning" ? "text-amber-200" : "text-white";
  return <div className="rounded-xl bg-white/5 p-4"><p className="text-xs text-slate-400">{label}</p><p className={`mt-2 text-sm font-bold ${valueClass}`}>{value}</p></div>;
}

function FlowStep({ number, title, description, active = false }: { number: string; title: string; description: string; active?: boolean }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${active ? "border-violet-400/40 bg-violet-400/10" : "border-white/10 bg-white/[0.03]"}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-black text-violet-200">{number}</span>
      <div><p className="text-sm font-bold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{description}</p></div>
    </div>
  );
}

export default function StagingPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selected, setSelected] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [suiteRunning, setSuiteRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<SuiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staging", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "تعذر تحميل بيئة الاختبار.");
      setOverview(data as Overview);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل بيئة الاختبار.");
    } finally {
      setLoading(false);
    }
  }

  async function runSuite() {
    setSuiteRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/staging", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "run-suite", seed: 20260824, variantsPerCase: 3 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "تعذر تشغيل الاختبار الجماعي.");
      setSuiteResult(data as SuiteResult);
      await loadOverview();
    } catch (suiteError) {
      setError(suiteError instanceof Error ? suiteError.message : "تعذر تشغيل الاختبار الجماعي.");
    } finally {
      setSuiteRunning(false);
    }
  }

  async function runScenario(id: string) {
    setRunning(id);
    setError(null);
    try {
      const response = await fetch("/api/staging", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "تعذر تشغيل السيناريو.");
      setSelected(data as ScenarioResult);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "تعذر تشغيل السيناريو.");
    } finally {
      setRunning(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadOverview(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const latestSuite = overview?.randomizedSuite;
  const suiteIsPassed = latestSuite?.status === "completed" || suiteResult?.status === "PASS";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e1b4b_0%,#0f172a_42%,#020617_100%)] px-4 py-8 text-right text-slate-100 sm:px-8" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusPill>بيئة شخصية</StatusPill>
              <StatusPill>قاعدة فعلية محلية</StatusPill>
              <StatusPill tone="amber">لا نشر ولا إنفاق</StatusPill>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Personal Staging</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              مساحة اختبار تحاكي رحلة العميل من Wizard إلى CDKS وBlueprint ثم Strategy Recommendation، مع بيانات منقحة واختبارات حوكمة مفعلة.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void loadOverview()} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition active:scale-[.98] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">تحديث الحالة</button>
            <button type="button" onClick={() => void runSuite()} disabled={suiteRunning} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition active:scale-[.98] hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">{suiteRunning ? "جارٍ اختبار 30 حالة..." : "تشغيل 30 اختبارًا"}</button>
            <Link href="/wizard" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition active:scale-[.98] hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">فتح Wizard</Link>
          </div>
        </header>

        {error && <div role="alert" className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}
        {loading && <div role="status" className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center text-slate-300">جارٍ تهيئة قاعدة Staging وتشغيل seed المنقح...</div>}

        {overview && (
          <>
            <section className="mb-7 rounded-2xl border border-indigo-300/20 bg-indigo-400/10 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Workspace</p>
                  <h2 className="mt-1 text-xl font-bold text-white">{overview.workspace.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">جميع السجلات منقحة ومخصصة للاختبار الشخصي فقط.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill>Blueprint-only</StatusPill>
                  <StatusPill>Foreign keys: {overview.tests.foreignKeys}</StatusPill>
                  <StatusPill tone="slate">Migrations: {overview.tests.migrationCount}</StatusPill>
                </div>
              </div>
            </section>

            <section aria-label="مسار النتيجة" className="mb-7 rounded-2xl border border-violet-300/20 bg-violet-400/[0.06] p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-widest text-violet-300">كيف تُقرأ هذه الصفحة؟</p><h2 className="mt-1 text-xl font-bold text-white">من إجابات العميل إلى التوصية القابلة للمراجعة</h2></div>
                <p className="text-xs text-slate-400">النتيجة ليست حملة منشورة ولا أمرًا تنفيذيًا.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <FlowStep number="1" title="Wizard / Brief" description="إجابات العميل وبيانات النشاط والسوق والأصول والتتبع." />
                <FlowStep number="2" title="CDKS + Canonical Blueprint" description="القواعد والسياسات تحول المدخلات إلى قرارات هيكلية محفوظة." active />
                <FlowStep number="3" title="Strategy Recommendation" description="تفسير استشاري مبني على النطاق والأدلة، يحتاج اعتمادًا بشريًا." />
              </div>
            </section>

            <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
              {Object.entries(overview.counts).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs leading-5 text-slate-400">{LABELS[key] ?? key}</p>
                  <p className="mt-2 text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </section>

            <section className="mb-8 grid gap-4 lg:grid-cols-3">
              {overview.scenarios.map((scenario) => (
                <article key={scenario.id} className={`rounded-2xl border p-5 transition ${selected?.scenario.id === scenario.id ? "border-violet-400/60 bg-violet-400/10" : "border-white/10 bg-slate-900/70"}`}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-white">{scenario.label}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{scenario.description}</p>
                    </div>
                    <StatusPill tone={scenario.status === "completed" ? "green" : "slate"}>{scenario.status === "completed" ? "تم التشغيل" : "لم يُشغّل بعد"}</StatusPill>
                  </div>
                  <button type="button" disabled={running !== null} onClick={() => void runScenario(scenario.id)} className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition active:scale-[.99] hover:bg-white/15 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
                    {running === scenario.id ? "جارٍ التشغيل..." : "عرض نتيجة سيناريو العميل"}
                  </button>
                  {scenario.updatedAt && <p className="mt-3 text-xs text-slate-500">آخر seed: {formatDate(scenario.updatedAt)}</p>}
                  {scenario.blueprintId && <p className="mt-1 truncate text-xs text-slate-500">Blueprint: {scenario.blueprintId}</p>}
                </article>
              ))}
            </section>

            <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className={`rounded-2xl border p-5 ${suiteIsPassed ? "border-emerald-400/20 bg-emerald-400/5" : "border-amber-400/20 bg-amber-400/5"}`}>
                <p className={`text-xs ${suiteIsPassed ? "text-emerald-200" : "text-amber-200"}`}>Randomized Suite</p>
                <p className="mt-2 text-lg font-bold text-white">{latestSuite ? `${latestSuite.totalRuns} تشغيل — ${suiteIsPassed ? "نجح" : "راجع النتيجة"}` : "لم يُشغّل بعد"}</p>
                <p className="mt-1 text-xs text-slate-400">{latestSuite ? `seed ${latestSuite.seed} · آخر تشغيل ${formatDate(latestSuite.createdAt)}` : "10 حالات × 3 variants — اضغط تشغيل 30 اختبارًا"}</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5"><p className="text-xs text-emerald-200">Canonical Blueprint</p><p className="mt-2 text-lg font-bold text-white">غير قابل للتغيير</p><p className="mt-1 text-xs text-slate-400">المخرجات المقترحة لا تستبدل المصدر القانوني.</p></div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5"><p className="text-xs text-emerald-200">الأسرار</p><p className="mt-2 text-lg font-bold text-white">لا توجد أسرار مخزنة</p><p className="mt-1 text-xs text-slate-400">بيانات السيناريو منقحة ومخصصة للاختبار.</p></div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5"><p className="text-xs text-amber-200">الاتصالات</p><p className="mt-2 text-lg font-bold text-white">Read-only فقط</p><p className="mt-1 text-xs text-slate-400">لا إنشاء أو تعديل أو نشر للحملات.</p></div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5"><p className="text-xs text-amber-200">التحقق السوقي</p><p className="mt-2 text-lg font-bold text-white">غير مفعّل عالميًا</p><p className="mt-1 text-xs leading-5 text-slate-400">النطاقات الحالية اتجاهية ومحددة بسوق/صناعة، وليست benchmark عامًا.</p></div>
            </section>

            {suiteResult && (
              <section className="mb-8 rounded-3xl border border-emerald-300/20 bg-emerald-400/5 p-5 sm:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-300">آخر نتيجة تشغيل</p><h2 className="mt-2 text-2xl font-black text-white">{suiteResult.status === "PASS" ? "نجح اختبار الحالات العشر" : "تحتاج مجموعة الاختبار إلى مراجعة"}</h2><p className="mt-2 text-sm leading-6 text-slate-300">تم تشغيل {suiteResult.totalRuns} variant قابل لإعادة الإنتاج باستخدام seed ثابت، دون تعديل Blueprint أو إجراء خارجي.</p></div>
                  <StatusPill tone={suiteResult.status === "PASS" ? "green" : "rose"}>{suiteResult.summary.pass}/{suiteResult.totalRuns} PASS</StatusPill>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
                  {[['corpus', String(suiteResult.corpusCount)], ['variants/case', String(suiteResult.variantsPerCase)], ['seed', String(suiteResult.seed)], ['unique decisions', String(suiteResult.summary.uniqueDecisionDigests)], ['blueprint mutation', String(suiteResult.summary.canonicalBlueprintMutation)]].map(([key, value]) => <div key={key} className="rounded-xl bg-black/15 p-3"><p className="text-xs text-slate-400">{key}</p><p className="mt-1 font-bold text-white">{value}</p></div>)}
                </div>
              </section>
            )}

            {selected && (
              <section className="space-y-5 rounded-3xl border border-violet-300/20 bg-slate-950/70 p-5 sm:p-7">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Client Preview — آخر تشغيل</p>
                    <h2 className="mt-2 text-2xl font-black text-white">{selected.scenario.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{selected.scenario.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="violet">توصية استشارية</StatusPill>
                    <StatusPill tone="amber">اعتماد بشري مطلوب</StatusPill>
                  </div>
                </div>

                <section className="rounded-2xl border border-violet-300/20 bg-violet-400/[0.06] p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-300">قراءة النتيجة</p><h3 className="mt-1 text-lg font-bold text-white">هذه ليست طبقة واحدة</h3></div><p className="text-xs text-slate-400">كل مرحلة محفوظة ويمكن تتبعها.</p></div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs font-bold text-slate-300">1 — Wizard / Brief</p><p className="mt-2 text-sm leading-6 text-slate-400">ما أدخله العميل أو ما يمثله السيناريو المنقح.</p><div className="mt-3 space-y-1 text-xs text-slate-300"><p>النشاط: {displayValue(selected.wizardSummary.businessType)}</p><p>الهدف: {displayValue(selected.wizardSummary.primaryObjective)}</p><p>السوق: {selected.wizardSummary.targetLocations.join("، ")}</p><p>التحويل: {displayValue(selected.wizardSummary.conversionDestination)}</p><p>التتبع: {displayValue(selected.wizardSummary.trackingStatus)}</p></div></div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs font-bold text-slate-300">2 — CDKS / Blueprint</p><p className="mt-2 text-sm leading-6 text-slate-400">قرارات القواعد والسياسات، وهي السلطة الهيكلية للناتج.</p><div className="mt-3 space-y-1 text-xs text-slate-300"><p>الهدف: {displayValue(selected.blueprintAuthority.objective)}</p><p>المسار: {displayValue(selected.blueprintAuthority.funnel)}</p><p>القنوات: {selected.blueprintAuthority.channels.map(displayValue).join("، ") || "غير محددة"}</p><p>الجاهزية: {displayValue(selected.blueprintAuthority.readiness.value ?? "غير محددة")}</p></div></div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs font-bold text-slate-300">3 — Strategy Recommendation</p><p className="mt-2 text-sm leading-6 text-slate-400">تفسير واقتراحات مخصصة، لا تعدل الـCanonical Blueprint ولا تطلق حملة.</p><div className="mt-3 space-y-1 text-xs text-slate-300"><p>الحالة: توصية للمراجعة والاعتماد</p><p>السياق: {selected.recommendation.market} / {selected.recommendation.industry}</p><p>المعرّف: {selected.recommendationId}</p></div></div>
                  </div>
                </section>

                <div className="grid gap-4 md:grid-cols-3">
                  <KeyValue label="التموضع الاستراتيجي" value={selected.recommendation.strategicPositioning} />
                  <KeyValue label="الفرضية الأساسية" value={selected.recommendation.primaryHypothesis} />
                  <KeyValue label="النطاق" value={<><span>{selected.recommendation.market} / {selected.recommendation.industry} / {selected.recommendation.currency}</span><span className="mt-1 block text-xs font-normal text-slate-400">Blueprint: {selected.blueprintId}</span></>} />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Section title="زوايا الرسائل" items={selected.recommendation.messageAngles} />
                  <Section title="فرضيات الجمهور" items={selected.recommendation.audienceHypotheses} />
                  <Section title="أدوار القنوات" items={selected.recommendation.channelRoles} />
                  <Section title="التجارب المقترحة" items={selected.recommendation.experimentIdeas} />
                  <Section title="التحققات المطلوبة قبل الاعتماد" items={selected.recommendation.requiredValidations} />
                  <Section title="القيود والمجهولات" items={selected.recommendation.limitations} />
                </div>

                <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <summary className="cursor-pointer list-none text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">عرض الأدلة والنطاق والقيود التفصيلية</summary>
                  <div className="mt-4 space-y-4">
                    <div><h3 className="mb-3 text-sm font-bold text-white">Evidence References</h3><p className="mb-3 text-xs leading-5 text-slate-400">هذه معرفات أدلة داخلية للحزمة المنقحة، وليست روابط لمصادر خارجية مباشرة. لا يتم تقديم مصدر غير موثق على أنه رسمي.</p><div className="flex flex-wrap gap-2">{selected.recommendation.evidenceRefs.map((reference) => <span key={reference} title={reference} className="rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-300">{reference}</span>)}</div></div>
                    <div><h3 className="mb-3 text-sm font-bold text-white">ملخص النطاق</h3><p className="text-sm leading-7 text-slate-300">النتيجة مخصصة لـ{selected.recommendation.market} و{selected.recommendation.industry} فقط. لا تعني تفعيل Market Validation عالميًا، ولا تسمح باستخدام مؤشرات CPC أو CPA أو CVR أو ROAS أو saturation دون مصدر مستقل موثق.</p></div>
                  </div>
                </details>

                <details className="rounded-2xl border border-slate-500/20 bg-slate-900/40 p-5">
                  <summary className="cursor-pointer list-none text-sm font-bold text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">تفاصيل المطور والحوكمة</summary>
                  <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 text-sm md:grid-cols-5">
                    {[
                      ["generation_mode", selected.governance.generationMode],
                      ["external_actions", String(selected.governance.externalActionsAllowed)],
                      ["budget_spend", String(selected.governance.budgetSpendAllowed)],
                      ["approval", String(selected.governance.requiresHumanApproval)],
                      ["blueprint_unchanged", String(selected.governance.canonicalBlueprintUnchanged)],
                    ].map(([key, value]) => <div key={key}><p className="text-xs text-slate-500">{key}</p><p className="mt-1 font-bold text-slate-200">{value}</p></div>)}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2"><KeyValue label="Context ID" value={selected.contextId} /><KeyValue label="Recommendation ID" value={selected.recommendationId} /></div>
                </details>

                <p className="rounded-xl bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">{selected.note}</p>
              </section>
            )}

            <footer className="mt-8 border-t border-white/10 pt-5 text-xs leading-6 text-slate-500">
              هذه البيئة ليست إنتاجية ولا متصلة بحسابات إعلانية. جميع السيناريوهات منقحة، وكل تشغيل محفوظ داخل قاعدة Personal Staging مع audit event، بينما صلاحيات الكتابة الخارجية مغلقة.
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
