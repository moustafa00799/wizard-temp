"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Overview = {
  workspace: { id: string; name: string; mode: string };
  scenarios: Array<{ id: string; label: string; description: string; status: string; blueprintId?: string; updatedAt?: string }>;
  counts: Record<string, number>;
  governance: Record<string, string | boolean>;
  tests: { databaseRegressionAssertions: number; migrationCount: number; foreignKeys: string; canonicalBlueprintMutation: boolean; secretMaterialStored: boolean };
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

type ScenarioResult = {
  scenario: { id: string; label: string; description: string };
  status: string;
  blueprintId: string;
  contextId: string;
  recommendationId: string;
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
  approvalsPending: "موافقات معلقة",
  auditEvents: "أحداث التدقيق",
};

function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "slate" }) {
  const styles = tone === "green"
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : tone === "amber"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
      : "border-slate-500/30 bg-slate-500/10 text-slate-300";
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>{children}</span>;
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <h3 className="mb-3 text-sm font-bold text-white">{title}</h3>
      <div className="space-y-2 text-sm leading-7 text-slate-300">
        {items.map((item, index) => <p key={`${title}-${index}`} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">{item}</p>)}
      </div>
    </section>
  );
}

export default function StagingPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selected, setSelected] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
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
    // The timer defers the initial API bootstrap until after the first paint.
  }, []);

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
              مساحة اختبار تحاكي رحلة العميل من brief وWizard إلى CDKS وBlueprint وStrategy Recommendation، مع بيانات منقحة واختبارات حوكمة مفعلة.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => void loadOverview()} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">تحديث الحالة</button>
            <Link href="/wizard" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-500">فتح Wizard</Link>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}
        {loading && <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center text-slate-300">جارٍ تهيئة قاعدة Staging وتشغيل seed المنقح...</div>}

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
                    <StatusPill tone={scenario.status === "completed" ? "green" : "slate"}>{scenario.status === "completed" ? "تم التشغيل" : "جاهز"}</StatusPill>
                  </div>
                  <button disabled={running !== null} onClick={() => void runScenario(scenario.id)} className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-50">
                    {running === scenario.id ? "جارٍ التشغيل..." : "تشغيل سيناريو العميل"}
                  </button>
                  {scenario.blueprintId && <p className="mt-3 truncate text-xs text-slate-500">Blueprint: {scenario.blueprintId}</p>}
                </article>
              ))}
            </section>

            <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5"><p className="text-xs text-emerald-200">Canonical Blueprint</p><p className="mt-2 text-lg font-bold text-white">غير قابل للتغيير</p></div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5"><p className="text-xs text-emerald-200">الأسرار</p><p className="mt-2 text-lg font-bold text-white">لا توجد أسرار مخزنة</p></div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5"><p className="text-xs text-amber-200">الاتصالات</p><p className="mt-2 text-lg font-bold text-white">Read-only فقط</p></div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5"><p className="text-xs text-amber-200">Global validation</p><p className="mt-2 text-lg font-bold text-white">false</p></div>
            </section>

            {selected && (
              <section className="space-y-5 rounded-3xl border border-violet-300/20 bg-slate-950/70 p-5 sm:p-7">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-violet-300">آخر تشغيل</p>
                    <h2 className="mt-2 text-2xl font-black text-white">{selected.scenario.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{selected.scenario.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill>advisory_only</StatusPill>
                    <StatusPill>Human approval required</StatusPill>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-slate-400">التموضع الاستراتيجي</p><p className="mt-2 text-sm leading-7 text-white">{selected.recommendation.strategicPositioning}</p></div>
                  <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-slate-400">الفرضية الأساسية</p><p className="mt-2 text-sm leading-7 text-white">{selected.recommendation.primaryHypothesis}</p></div>
                  <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-slate-400">النطاق</p><p className="mt-2 text-sm font-bold text-white">{selected.recommendation.market} / {selected.recommendation.industry} / {selected.recommendation.currency}</p><p className="mt-1 text-xs text-slate-400">Blueprint: {selected.blueprintId}</p></div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Section title="زوايا الرسائل" items={selected.recommendation.messageAngles} />
                  <Section title="فرضيات الجمهور" items={selected.recommendation.audienceHypotheses} />
                  <Section title="أدوار القنوات" items={selected.recommendation.channelRoles} />
                  <Section title="التجارب المقترحة" items={selected.recommendation.experimentIdeas} />
                  <Section title="التحققات المطلوبة قبل الاعتماد" items={selected.recommendation.requiredValidations} />
                  <Section title="القيود والمجهولات" items={selected.recommendation.limitations} />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="mb-3 text-sm font-bold text-white">Evidence References</h3>
                  <div className="flex flex-wrap gap-2">{selected.recommendation.evidenceRefs.map((reference) => <span key={reference} className="rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-300">{reference}</span>)}</div>
                </div>

                <div className="grid gap-3 border-t border-white/10 pt-5 text-sm md:grid-cols-5">
                  {[
                    ["generation_mode", selected.governance.generationMode],
                    ["external_actions", String(selected.governance.externalActionsAllowed)],
                    ["budget_spend", String(selected.governance.budgetSpendAllowed)],
                    ["approval", String(selected.governance.requiresHumanApproval)],
                    ["blueprint_unchanged", String(selected.governance.canonicalBlueprintUnchanged)],
                  ].map(([key, value]) => <div key={key}><p className="text-xs text-slate-500">{key}</p><p className="mt-1 font-bold text-slate-200">{value}</p></div>)}
                </div>
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
