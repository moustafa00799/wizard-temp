"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/local/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_code: accessCode }),
      });
      const payload = await response.json().catch(() => null) as { status?: string; error?: string } | null;
      if (!response.ok || payload?.status !== "success") throw new Error(payload?.error || "تعذر تسجيل الدخول إلى Local Staging.");
      setAccessCode("");
      router.push("/wizard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر تسجيل الدخول.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white" dir="rtl">
      <section className="mx-auto max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl shadow-black/30">
        <div className="mb-8">
          <p className="mb-3 text-sm font-bold tracking-wide text-violet-300">CDKS · LOCAL STAGING</p>
          <h1 className="text-3xl font-black">تسجيل الدخول إلى بيئة الاختبار</h1>
          <p className="mt-3 leading-7 text-slate-300">استخدم Access Code الموجود في ملف البيئة المحلي. لا يتم إرسال الكود إلى أي مزود خارجي ولا يظهر في السجلات.</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-200">Local Access Code</span>
            <input
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              type="password"
              autoComplete="current-password"
              minLength={12}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
              placeholder="أدخل الكود المحلي"
            />
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm leading-6 text-red-200">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-violet-600 px-5 py-3 font-bold transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60">
            {busy ? "جارٍ التحقق…" : "دخول إلى Local Staging"}
          </button>
        </form>
        <div className="mt-7 rounded-2xl border border-amber-900/60 bg-amber-950/30 p-4 text-sm leading-6 text-amber-100">
          هذه البيئة للاختبار الشخصي فقط. `approved` يسمح بالمراجعة والتجهيز والتصدير، ولا يسمح بالنشر أو الإنفاق أو الكتابة لدى Meta أو Google أو TikTok.
        </div>
      </section>
    </main>
  );
}
