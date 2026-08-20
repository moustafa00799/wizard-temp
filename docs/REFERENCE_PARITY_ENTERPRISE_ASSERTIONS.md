# Reference Parity Enterprise Assertions

## الغرض

تضيف هذه الدفعة اختبارًا حتميًا مستقلًا للتكافؤ الدلالي والاتساقي للأقسام المرجعية الستة والعشرين في Campaign Blueprint. الاختبار يعمل على دورة `/api/generate/v5` الفعلية باستخدام fixtures محلية وcontrolled mock reasoning، ولا يستدعي Groq أو Mistral أو Gemini.

> **AI يقترح، CDKS يقرر، والإنسان يعتمد.** لا يملك الاختبار أي مسار للنشر أو الإنفاق، ويعامل Blueprint كوثيقة قرار فقط.

## أمر التشغيل

```bash
npm run test:reference-parity:enterprise
```

ويُحفظ التقرير الآلي في:

```text
tests/results/reference-parity-enterprise.json
```

## نطاق assertion matrix

| المجموعة | الأقسام المغطاة | أمثلة على التحقق |
|---|---|---|
| الاستراتيجية والقمع | `executive_summary`, `strategy_summary`, `recommended_funnel` | نطاق readiness/risk، وجود evidence، ترتيب مراحل القمع، مجموع نسب القمع |
| الهيكل والجمهور | `campaign_structure`, `audience_structure`, `audience_analysis` | تطابق عدد الحملات والقنوات، عدم تكرار المعرفات، حدود حجم الجمهور، اتساق overlap وfrequency |
| الإبداع والتتبع | `creative_strategy`, `creative_angles`, `tracking_assessment`, `tracking_checklist` | عدم ادعاء جاهزية assets غير الموجودة، وجود CTA، اتساق الأحداث وحالة التتبع |
| الإطلاق والجاهزية | `launch_plan`, `first_14_days_plan`, `pre_launch_fixes` | مجموع أيام milestones، صحة critical path، counters، readiness blockers، manual checks |
| الميزانية | `budget_split`, `budget_management` | مجموع channel allocation، حدود daily budget، pacing الشهري، reconciliation للـburn rate |
| القياس والتجارب | `monitoring`, `testing`, `benchmarks` | KPIs قابلة للقياس، شروط A/B test، ميزانية الاختبار، عدم عرض benchmark سوقي غير موثق |
| السوق والمنصات | `market_context`, `platform_guides` | عدم اختلاق CPC أو saturation، حصر الأدلة في القنوات المختارة، وجود best practices |
| الامتثال والتدقيق | `compliance`, `technical_audit` | عدّ المتطلبات الإلزامية، privacy actions، عدّ manual checks، حالات unavailable للأدوات الخارجية |
| الحوكمة والعرض التشخيصي | `risk_flags`, `flags`, `debug` | فصل critical عن warnings، صحة telemetry، عدم وجود أسرار أو raw prompts |
| العرض المشترك | جميع الأقسام الـ26 | provenance uniqueness، timestamps، مصادر القرار، blueprint-only safety، تغطية الفروع واللغات والعملات |

## قواعد التكافؤ المشتركة

يتحقق الاختبار من أن كل عقدة قرار تحتوي، حيث ينطبق ذلك، على `confidence` ضمن المجال `[0,1]`، و`reasoning` غير فارغ، و`rule_id` غير فارغ. كما يتحقق من أن القيم المشتقة لا تتناقض مع بعضها، مثل مجموع نسب الميزانية والقمع، وعدّ عناصر قوائم التحقق، وتراكُم burn rate.

تُرفض الأرقام السوقية غير الموثقة. عند غياب مصدر يمكن التحقق منه، يجب أن تكون benchmark وCPC وmarket saturation في حالة `unavailable` أو بقيم `null` مع تفسير واضح، بدل عرضها كحقائق سوقية.

يتحقق الاختبار من أن `provenance_trail` يحتوي على معرفات قرار فريدة ومصدر كل قرار ووقت إنشائه. كما يتحقق من أن envelope يستخدم `generation_mode=blueprint_only` وأن `external_actions_allowed` و`budget_spend_allowed` يساويان `false`، ولا يسمح للطبقة الذكية بإصدار حالة اعتماد نهائية.

## مصفوفة التشغيل

يشغل الاختبار **10 fixtures** ويثبت وجود:

| البعد | التغطية المطلوبة |
|---|---|
| الفروع الأساسية | `local_service`, `ecommerce`, `app`, `b2b` |
| اللغات | `ar`, `en` |
| العملات | `EGP`, `SAR`, `USD` |
| مزود AI حي | 0؛ الاختبار محلي deterministic |

## نتيجة الدفعة الحالية

النتيجة الحالية المسجلة في `tests/results/reference-parity-enterprise.json` هي:

```text
10/10 fixtures passed
260/260 section checks passed
26/26 semantic assertion groups passed
0 live AI calls
Blueprint-only safety: passed
```

## UI coverage

يتضمن التقرير فحصًا منفصلًا لسطح عرض صفحة Blueprint. طبقة البيانات والـassertions الدلالية تغطي الأقسام الـ26، بينما صفحة Blueprint الحالية تملك renderers مباشرة لـ11 قسمًا فقط. لذلك يسجل التقرير UI coverage كحالة `partial` مع قائمة الأقسام الخمسة عشر التي تحتاج renderers أو display adapters مباشرة.

هذا الفصل متعمد حتى لا يتم إعلان تكافؤ UI غير موجود فعليًا. إغلاق هذه القائمة هو الدفعة التالية اللازمة لإعلان Enterprise parity الكامل عبر جميع الأبعاد السبعة: structural، semantic، consistency، provenance، safety، UI، وregression.
