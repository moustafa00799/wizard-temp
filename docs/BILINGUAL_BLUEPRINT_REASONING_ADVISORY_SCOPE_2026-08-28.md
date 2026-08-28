# دفعة دعم اللغتين وشرح Blueprint والوحدات الاستشارية

## نطاق الدفعة

تضيف هذه الدفعة طبقة عرض عربية/إنجليزية وتجربة قراءة منظمة فوق العقود الموجودة، وتعمّق تفسير AI Reasoning، وتعرّف وحدات AI استشارية مستقبلية في صورة عقود ومخرجات mock حتمية. لم تُغيّر الدفعة سلطة CDKS أو Canonical Blueprint، ولم تضف أي تكامل كتابة مع Meta أو Google أو TikTok أو أي مزود إعلاني.

> **قاعدة السلطة:** CDKS وRules Engine وCanonical Blueprint تقرر. AI يشرح ويقترح فقط. الاعتماد البشري لا يعني الإطلاق أو النشر أو الإنفاق.

## 1. العربية والإنجليزية

أصبح `locale: "ar" | "en"` جزءًا من `DataModel` ومسودة Wizard، مع default عربي يحافظ على توافق المسودات القديمة. ينتقل التفضيل عبر `buildWizardGenerationPayload` إلى عقد Blueprint الموجود أصلًا، وتحافظ عملية autofill على اختيار العميل بدل إعادته إلى العربية.

أنشئت طبقة `src/lib/i18n.ts` و`src/lib/i18n-options.ts`، وتضم اتجاه الصفحة، locale tags، تنسيق الأرقام والتاريخ، قاموس الواجهة، وقاموس قيم الخيارات التسويقية والصناعية. أصبحت خطوات Wizard من البداية حتى المراجعة تستخدم القاموس في العناوين والخيارات والأزرار، مع `dir="rtl"` للعربية و`dir="ltr"` للإنجليزية.

لم تُترجم النصوص الحرة التي يكتبها العميل، ولم تُترجم القيم canonical داخليًا؛ الترجمة تخص العرض فقط. هذا يمنع خلط لغة العميل مع مفاتيح Rules Engine أو قيم Canonical Blueprint.

## 2. إعادة تنظيم Blueprint

أصبح Blueprint يميز بين ثلاثة أوضاع عرض:

| الوضع | الغرض | ما يظهر |
| --- | --- | --- |
| Executive | فهم النتيجة بسرعة | ملخص العميل، الهدف، السوق/المواقع، القنوات، الجاهزية والمخاطرة، الاستراتيجية، المسار، وما قبل الإطلاق |
| Review | المراجعة والاعتماد | دورة الحياة، ملاحظات المراجع، شرح AI، وBlueprint التفصيلي |
| Technical | المراجعة المتقدمة | التفاصيل التشغيلية والتشخيصية و26 قسمًا ضمن 6 محاور |

يحافظ العرض التفصيلي على renderers الحالية وعددها `26/26`، لكنه أضيف إليه بحث client-side في عناوين الأقسام ومفاتيح العرض. البحث لا يدّعي البحث داخل بيانات العميل الخام أو سجلات التشخيص.

تم إبقاء Knowledge Context read-only ومطابقًا تلقائيًا من الخادم. لا يوجد اختيار سياق من العميل، ولا تتحول الحزم المقيدة إلى Market Validation عام.

## 3. قاموس Blueprint الآمن

تم توسيع `blueprint-display.ts` ليقبل locale اختياريًا مع الحفاظ على التصديرات القديمة. يشمل ذلك:

- labels وحالات عربية/إنجليزية.
- field labels مثل `industry_average_cvr` و`weekly_projection`.
- صياغة مصادر داخلية بصورة `CDKS rules` أو `قواعد CDKS` بدل عرض RF IDs.
- استمرار حجب نصوص `function` و`jsxDEV` و`TURBOPACK` وملفات Next الداخلية.
- بقاء `unavailable` مختصرًا في value display، مع إبقاء السبب التفصيلي في `displayUnavailableReason`.

لا تُملأ قيم CPC أو CPA أو CVR أو ROAS أو saturation أو competitor performance دون دليل مطابق وموثق؛ القيمة تظل `unavailable` مع سببها.

## 4. AI Reasoning العميق

أضيف الحقل الاختياري `decision_explanations` إلى عقد `AIReasoningContract`، دون تغيير رقم العقد `1.0` أو مصدر العقد `3.0`، لأنه امتداد backward-compatible. لكل قرار يمكن أن يحمل الحقل:

- `what_decided`: ما القرار الذي صدر.
- `why_this_fits`: لماذا يلائم المدخلات والسياسة.
- `expected_effect`: أثر متوقع بصياغة مشروطة، وليس وعدًا أو benchmark.
- `tradeoffs`: المفاضلات.
- `risks`: المخاطر.
- `what_would_change_it`: ما البيانات أو التأكيد الذي قد يغير التفسير.
- `next_validation_step`: خطوة تحقق قابلة للمراجعة البشرية.
- `evidence_refs` و`uncertainty_refs`: مراجع إلزامية تمنع الشرح غير المسند.

يطبق validator فحصًا للمراجع المجهولة ويفرض وجود evidence أو uncertainty في كل شرح. كما يحتفظ `changed: false` وحواجز safety جميعها في حالة الرفض أو النجاح.

تم تحديث prompt وprovider JSON schema ليطلبا الشرح المنظم بدل عبارة مختصرة فقط. وما زال live AI مقيدًا بسياسة `sanitized_wizard_only` ومراجع الأدلة المسموح بها وfallback الموجودين سابقًا.

أعيد بناء `ReasoningDashboard` ليعرض ملخصًا مهنيًا للعميل، وتبويبًا مستقلًا لشرح القرارات، ويطوي IDs والمزود والنموذج داخل تفاصيل تقنية للمراجعين. عند الفشل لا تعرض الواجهة نسبة أو أرقامًا صفرية على أنها أداء؛ يظهر سبب آمن وتظل التفاصيل التقنية مطوية.

## 5. الوحدات الاستشارية المقيدة

أضيفت عقود وmock harness فقط، دون ربطها بمسار توليد Blueprint أو مزود حي:

| الوحدة | مخرجها | القيد |
| --- | --- | --- |
| Creative Planner | hooks، copy، scripts/frames، visual direction، CTA كمسودات | لا claims أداء غير مسندة ولا نشر أو توليد أصل خارجي |
| Evidence Synthesizer | facts وحالة evidence package | evidence-only؛ الفجوات تبقى unavailable |
| Compliance/QA | findings وremediation | مراجعة بشرية؛ لا اعتماد تلقائي |
| Rule Candidate Evaluator | مرشح قاعدة وتقييم offline | `offline_fixture_only`، لا تعديل للـCanonical Rules |

كل مخرج يحمل `scope` و`data_policy` و`provenance` و`unavailable_categories` و`warnings` و`AdvisorySafety`. الحقول الحاكمة ثابتة: `can_mutate_cdks=false`، `can_change_blueprint=false`، `can_publish=false`، `can_spend_budget=false`، و`human_review_required=true`.

## 6. الإصلاحات المضمّنة من الدفعة السابقة

تم الإبقاء على إصلاح lifecycle الذي يعتمد على `session.userId` لفحص دور المراجع بدل الثقة في `actor_user_id` القادم من العميل، مع رفض mismatch عند إرساله. يثبت HTTP regression نجاح omission ورفض actor المختلف.

## 7. الاختبارات

نجحت الاختبارات التالية محليًا قبل التسليم:

| الاختبار | النتيجة |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS؛ Next.js 16.2.12 |
| `test:i18n` | PASS؛ 12 assertion |
| `test:blueprint:display` | PASS؛ 23 assertion؛ اللغتان وحجب renderer |
| `test:ai:reasoning:contract` | PASS؛ 12 assertion |
| `test:ai:reasoning:builder` | PASS؛ 27 assertion |
| `test:ai:reasoning:live` | PASS؛ 16 assertion؛ externalRequests=0 |
| `test:ai:advisory:capabilities` | PASS؛ 53 assertion؛ 4 capabilities و2 locales |
| provider schema وCDKS debug | PASS |
| lifecycle وHTTP lifecycle | PASS؛ 42 assertion في HTTP |
| measurement contract | PASS؛ 18 assertion |
| workspace isolation | PASS؛ 18 assertion |
| security وlocal auth | PASS |
| deployment readiness وpersonal staging | PASS |
| randomized wizard | PASS؛ 10 fixtures × 3 variants = 30 |
| autofill fixtures وwizard review consent | PASS |
| knowledge strategy context | PASS؛ globalMarketValidated=false |

أضيف regression الوحدات الاستشارية إلى `.github/workflows/cdks-regression.yml`، كما أضيف اختبار i18n الموجود سابقًا إلى البوابة.

## 8. حدود معروفة

`npm run lint` الكامل ما زال يتأثر بدين قديم في صفحة Blueprint الكبيرة، خصوصًا استخدام `any` وبعض قاعدة React effect في مكونات legacy. لم تُستخدم هذه الملاحظة لتجاوز typecheck أو build أو regressions. الملفات الجديدة والعقود والاختبارات اجتازت typecheck، بينما يحتاج lint الشامل إلى refactor مستقل حتى لا يختلط مع تغيير السلوك.

لا توجد في هذه الدفعة Market Validation عامة جديدة، ولا مصادر سوقية حية، ولا تكاملات provider write، ولا fine-tuning، ولا image/video generation. الوحدات الأربعة الاستشارية mocks وعقود offline فقط إلى أن تُعتمد سياسة تشغيل منفصلة.
