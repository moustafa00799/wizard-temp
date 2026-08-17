# AI Context for CDKS / wizard-temp

**إصدار السياق:** 2.0.0
**التاريخ:** 2026-08-17
**الغرض:** توفير نظرة عامة سريعة ودقيقة عن المشروع لمساعدي الذكاء الاصطناعي (مثل Qwen) لفهم البنية دون الحاجة لقراءة المئات من الملفات.

---

## 1. بنية المشروع (Project Structure)

- **التطبيق الرئيسي**: Next.js (App Router) + TypeScript.
- **المسار الجذري للكود**: `src/`
- **ملف الدخول للـ API**: `src/app/api/generate/route.ts` (الإصدارات المختلفة موجودة في مجلدات فرعية مثل `v4/`).

---

## 2. العقود الأساسية (Core Contracts)

**المصدر:** `src/lib/contracts/`

- **`wizard-input.ts`**: يحتوي على `CanonicalWizardInput` (41 حقلاً) وهي المدخلات الموحدة التي يجمعها الـ Wizard من المستخدم.
- **`canonical-blueprint.ts`**: يحتوي على `CanonicalBlueprintSchema` (Zod) وهو المخطط النهائي الذي يجب أن تطابقه جميع مخرجات النظام. تم تحديثه ليتطابق مع محرك CDKS (يتضمن `executive_summary`, `strategy`, `execution`, `governance`... إلخ).

---

## 3. نظام CDKS الجديد (المنطق الأساسي)

**المصدر:** `src/lib/policies/` و `src/lib/orchestrator/`

- **السياسات (Policies)**: وحدات قرار مستقلة، كل منها مسؤولة عن جانب واحد من الخطة.
  - **`objectivePolicy.ts`**: تحدد الهدف (`sales`, `leads`, `messages`, `app_installs`, `awareness`) وتعطي الأولوية المطلقة لمدخلات المستخدم.
  - **`funnelPolicy.ts`**: تحدد مسار التحويل (`trust_funnel`, `education_funnel`, `solution_funnel`, `lead_gen_call`, `direct_conversion`) بناءً على الهدف ونوع النشاط.
  - **`channelPolicy.ts`**: تحدد القنوات (`meta`, `google_ads`, `tiktok_ads`, `linkedin`) مع درجة لكل قناة.
  - **`launchReadinessPolicy.ts`**: تحدد جاهزية الإطلاق (`ready`, `ready_with_fixes`, `not_ready`) بناءً على التتبع والأصول الإبداعية والقدرات.
- **المحرك (Orchestrator)**:
  - **`cdks-engine.ts`**: يستدعي جميع السياسات الأربع، ويجمع النتائج، ويُخرج كائن Blueprint كامل، ويمرر التحقق من `CanonicalBlueprintSchema`. اجتاز اختبار `10/10` على الحالات الذهبية.

---

## 4. القواعد القديمة (Legacy - سيتم ترحيلها)

**المصدر:** `src/lib/rules/legacy-v1/`

- تحتوي على ملفات `strategyRules.js`, `budgetRules.js`, `riskRules.js`... إلخ.
- تم ترحيل `SS-001` إلى `SS-005` و `BS-001` إلى `BS-005` و `RF-001`, `RF-003`, `RF-004` جزئياً إلى السياسات الجديدة.
- **الهدف النهائي**: حذف هذا المجلد بالكامل بعد ترحيل `BS-001..BS-005` و `RF-001, RF-003, RF-004` إلى سياسات جديدة.

---

## 5. واجهة المستخدم (UI)

**المصدر:** `src/app/wizard/` و `src/app/blueprint/`

- **`Step12_Review.tsx`**: الخطوة الأخيرة في الـ Wizard والتي ترسل البيانات إلى الـ API (`/api/generate/v4` حالياً) وتخزن النتيجة في `sessionStorage`.
- **`blueprint/page.tsx`**: صفحة عرض الـ Blueprint النهائي. تقرأ البيانات من `sessionStorage`.

---

## 6. الاختبارات والتحقق (Testing & Verification)

**المصدر:** `scripts/`

- **`semantic-runner.ts`**: يحتوي على الحالات الذهبية (GD-001 إلى GD-010) ويقارن مخرجات `CDKSEngine` مع القيم المتوقعة. (نتيجة التشغيل: `10/10 PASS` ✅).
- **`test-cdks.js`**: سكربت سريع لاختبار المحرك بمدخلات نموذجية.

---

## 7. أوامر التشغيل الأساسية

- **لتشغيل التطبيق محلياً**: `npm run dev`
- **للبناء للإنتاج**: `npm run build`
- **لتشغيل التقييم الدلالي**: `npm run semantic-eval`
- **لتشغيل اختبار المحرك**: `tsx scripts/test-cdks.js`

---

## 8. التوجهات للمهام القادمة

1. دمج CDKS مع API (إنشاء `v5/route.ts`).
2. ترحيل قواعد الميزانية (`budgetPolicy.ts`).
3. ترحيل قواعد المخاطر (`riskPolicy.ts`).
4. حذف مجلد `legacy-v1`.
5. كتابة اختبارات وحدة (Unit Tests) باستخدام Vitest.

---

**ملاحظة للمساعد:** هذا السياق شامل وكافٍ للتعامل مع مهام التطوير المتعلقة بـ CDKS دون الحاجة لقراءة الملفات الكاملة. عند الحاجة إلى ملف محدد، استخدم `@file` للإشارة إليه مباشرة.