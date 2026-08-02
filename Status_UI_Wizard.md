# حالة مشروع Campaign Engine - واجهة المعالج التفاعلي (Wizard UI Phase 4)

**التاريخ:** 2026-08-02 08:19 +03:00  
**المستخدم:** moustafa00799  
**المستودع:** https://github.com/moustafa00799/wizard-ui

---

## 1. نظرة عامة على المشروع

المشروع عبارة عن منصة ذكية لبناء وإدارة الاستراتيجيات الإعلانية. يبدأ بتشخيص نشاط العميل من خلال Wizard تفاعلي (13 خطوة)، ثم يحلل البيانات باستخدام قواعد تسويقية (Rules Engine) ليُخرج Campaign Blueprint شامل.

### المكونات:
| الجزء | الوصف | الحالة |
|-------|-------|--------|
| Backend (campaign-engine) | Node.js + Express + 40 قاعدة تحليلية | ✅ شغال على localhost:3000 |
| Frontend (wizard-ui) | Next.js 16 + React 18 + Wizard UI | ✅ شغال على localhost:3001 |
| API Endpoint | POST /api/generate | ✅ متصل |

---

## 2. التخطيط المعمول به (13 خطوة تفاعلية)

| الخطوة | الاسم | المحتوى |
|--------|-------|---------|
| Step 0 | بداية سريعة | build_mode (5 أوضاع) |
| Step 1 | تعريف النشاط | business_type, offer_description, sales_motion |
| Step 2 | المشكلة والقيمة | customer_problem, key_value_drivers, usp |
| Step 3 | الهدف التجاري | primary_objective, secondary_objectives, north_star_kpi |
| Step 4 | جاهزية المشروع | existing_assets, previous_campaigns_status, past_performance_notes |
| Step 5 | الجمهور | ideal_customer, awareness_level, audience_segments, geo_scope, target_locations |
| Step 6 | العرض والرسائل | offer_type, core_message, objections, persuasion_angle |
| Step 7 | القناة والتحويل | conversion_destination, ad_channels, campaign_direction |
| Step 8 | الميزانية والاقتصاد | budget_band, budget_flexibility, average_order_value, profit_margin, max_cac |
| Step 9 | التتبع والقياس | tracking_status, tracking_tools, key_events, conversion_model |
| Step 10 | الموارد والقيود | creative_assets, content_capacity, constraints, response_speed |
| Step 11 | الأولوية والمخاطرة | top_priority, risk_tolerance |
| Step 12 | المراجعة النهائية | ملخص + إرسال API + عرض Blueprint |

---

## 3. الأدوات واللغات البرمجية المستخدمة

| التقنية | الاستخدام | الإصدار |
|---------|-----------|---------|
| **Next.js** | Framework للـ Frontend | 16.2.12 (Turbopack) |
| **React** | UI Library | 18+ |
| **TypeScript** | Typing | 5+ |
| **Tailwind CSS** | Styling | 4+ |
| **Zustand** | State Management | 5+ |
| **Framer Motion** | Animations | 11+ |
| **Lucide React** | Icons | 0.400+ |
| **Axios** | HTTP Client | 1.7+ |
| **Zod** | Validation | 3.23+ |
| **shadcn/ui** | UI Components | - |

---

## 4. الهيكل العام للملفات

wizard-ui/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # RTL + Dark Theme
│   │   ├── page.tsx                # Landing Page
│   │   ├── globals.css             # Dark theme variables
│   │   ├── wizard/
│   │   │   ├── page.tsx            # Wizard Container (13 steps)
│   │   │   └── steps/
│   │   │       ├── Step0_Start.tsx
│   │   │       ├── Step1_Business.tsx
│   │   │       ├── Step2_Value.tsx
│   │   │       ├── Step3_Objective.tsx
│   │   │       ├── Step4_Readiness.tsx
│   │   │       ├── Step5_Audience.tsx
│   │   │       ├── Step6_Offer.tsx
│   │   │       ├── Step7_Channel.tsx
│   │   │       ├── Step8_Budget.tsx
│   │   │       ├── Step9_Tracking.tsx
│   │   │       ├── Step10_Resources.tsx
│   │   │       ├── Step11_Priority.tsx
│   │   │       └── Step12_Review.tsx
│   │   └── blueprint/
│   │       └── page.tsx            # Bento Grid Results
│   ├── components/
│   │   └── wizard/
│   │       ├── Stepper.tsx         # Progress bar
│   │       ├── QuestionCard.tsx    # Single select cards
│   │       └── MultiSelectChips.tsx # Multi select chips
│   ├── lib/
│   │   ├── store.ts                # Zustand Store + Readiness Score
│   │   └── schema.ts               # Zod Validation
│   └── types/
│       └── wizard.ts               # TypeScript Interfaces
├── next.config.ts
└── package.json
plain

---

## 5. المشاكل المكتشفة والحلول المقترحة

### المشكلة 1: الـ Wizard يفتح على Step 12 (آخر خطوة)
**السبب:** `localStorage` (Zustand persist) كان يحفظ `currentStep` و`completedSteps`.
**الحل المقترح:** إزالة `currentStep` و`completedSteps` من `partialize` في `store.ts`، وإضافة `useEffect(() => setStep(0), [])` في `wizard/page.tsx`.

### المشكلة 2: Backend يرجّع أخطاء Validation
**السبب:** 
- الحقول الفاضية (مثل `business_type`, `primary_objective`)
- `geo_custom` غير مقبول في الـ Backend (يقبل: single_city, multiple_cities, country, multiple_countries, local_radius)
- `core_message` فارغ
**الحل المقترح:** 
- Validation قوي في `Step12_Review.tsx` يفحص 20+ حقل قبل الإرسال
- إزالة `geo_custom` من خيارات `Step5_Audience.tsx`
- Fallback values في الـ Payload (مثل `"غير محدد"` للنصوص و`0` للأرقام)

### المشكلة 3: صفحة Blueprint فارغة (undefined errors)
**السبب:** `resetWizard()` كان يُستدعى قبل `router.push("/blueprint")`، فالـ `blueprint` يُمسح قبل ما الصفحة تفتح.
**الحل المقترح:** إزالة `resetWizard()` من `handleSubmit` في `Step12_Review.tsx`، وإضافته بدلاً من ذلك في زر "إنشاء استراتيجية جديدة" في `blueprint/page.tsx`.

### المشكلة 4: localStorage يحفظ الاختيارات السابقة
**السبب:** Zustand persist يحفظ كل البيانات.
**الحل المقترح:** إما:
- إزالة `persist` بالكامل من `store.ts` (يبدأ فاضي كل مرة)
- أو تعديل `partialize` ليحفظ بيانات النماذج فقط (بدون `currentStep`)

### المشكلة 5: Port Conflict (3000 مستخدم)
**السبب:** الـ Backend يستخدم `localhost:3000` والـ Frontend نفس الـ Port.
**الحل المقترح:** تشغيل الـ Frontend على port مختلف: `npm run dev -- --port 3001`

### المشكلة 6: صعوبة اختبار الـ Wizard (تعبئة 13 خطوة كل مرة)
**الحل المقترح:** إنشاء `dev-autofill.ts` script يملّى كل الحقول ببيانات عشوائية صحيحة بزر مخفي أو اختصار كيبورد (للـ Dev Mode فقط).

---

## 6. حالة الـ GitHub Repo

| البيان | القيمة |
|--------|--------|
| المستودع | https://github.com/moustafa00799/wizard-ui |
| الفرع | main |
| الحالة | ✅ متصل ويعمل Push/Pull |
| المشاكل | لا يوجد |

---

## 7. الخطوات المتبقية المقترحة

- [ ] إضافة `dev-autofill.ts` لتسريع الاختبار
- [ ] تحسين صفحة Blueprint لعرض المزيد من التفاصيل (Campaign Structure, Ad Sets)
- [ ] إضافة Export to PDF/JSON للـ Blueprint
- [ ] ربط API حقيقي لـ Meta/Google Ads لاحقاً
- [ ] إضافة اختبارات (Tests) للـ Wizard Steps

---
*تم إنشاء هذا الملف تلقائياً بناءً على سياق المحادثة.*