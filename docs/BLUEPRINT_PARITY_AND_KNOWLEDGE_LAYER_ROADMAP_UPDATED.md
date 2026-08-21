# خطة التكافؤ المحدثة والانتقال إلى Knowledge Layer وMarket Intelligence

## 1. القرار المختصر

نعم، كان ملف **خطة تكافؤ Blueprint مع المراجع** هو المسار الصحيح للمرحلة السابقة، وكان من الضروري إكمال جوهره قبل الانتقال إلى بناء Knowledge Layer. لكن وفق حالة المشروع الحالية، فإن الجزء الخاص بتكافؤ الـBlueprint قد اكتمل عمليًا، ولم يعد من الصحيح التعامل مع الملف كقائمة مهام مفتوحة من 8 أقسام مفقودة و16 قسمًا جزئيًا.

الوضع الحالي هو:

> **Blueprint parity مكتمل، بينما Market Intelligence وKnowledge Layer يمثلان المرحلة الجديدة التالية.**

لذلك لا نعيد تنفيذ renderers أو schemas أو assertions التي أُنجزت، ولا نضيف نسخًا legacy مكررة من الحقول. نحتفظ بملف التكافؤ كمرجع تاريخي ومعيار regression، ونبدأ فوقه طبقة الأدلة والمعرفة بطريقة additive وغير كاسرة.

## 2. حالة ملف التكافؤ: ما تم تنفيذه

النسخة الأصلية من الملف كانت تسجل baseline قديمًا: 6 أقسام كاملة، و12 جزئية، و8 مفقودة. هذا baseline لم يعد يعكس الحالة الحالية.

| بند الخطة الأصلي | حالته الحالية | الملاحظة |
|---|---|---|
| تصحيح خريطة Coverage Gate والـwrappers | مكتمل | تم توحيد المسارات وnormalization، بما في ذلك wrappers التي كانت تسبب false missing |
| `audience_analysis` | مكتمل | أصبح قسمًا canonical غنيًا مع المخرجات المرجعية الأساسية |
| `creative_strategy` | مكتمل | أُضيفت البنية الصريحة للصيغ والتحديث والدليل الاجتماعي والحالة التشغيلية |
| `tracking_assessment` | مكتمل | أُضيف التقييم التشخيصي منفصلًا عن checklist |
| `monitoring` | مكتمل | تم توحيد المسار وإثراؤه ضمن monitoring plan |
| `benchmarks` | مكتمل من ناحية العقد والحوكمة | عند غياب مصدر موثق يعرض `unavailable`؛ لا توجد أرقام سوقية مختلقة |
| `platform_guides` | مكتمل من ناحية parity | يعرض إرشادات القنوات ضمن القرار canonical، وسيُثْرى لاحقًا بمصادر المنصات الرسمية |
| `first_14_days_plan` | مكتمل | يعتمد على `execution.launch_plan.detailed_timeline` بدل نسخة مكررة |
| `pre_launch_fixes` | مكتمل | يعتمد على `execution.launch_plan.pre_launch_checklist` مع counters وحالة الجاهزية |
| `recommended_funnel` | مكتمل | أضيفت stages وKPIs ونسب الميزانية |
| `launch_plan` | مكتمل | تم توحيد timeline وpre-launch checklist والـmetadata اللازمة |
| `budget_management` و`budget_split` | مكتملان في parity الحالي | تم استكمال الأوراق والوحدات والاتساق مع العملة |
| `testing` | مكتمل في parity الحالي | بقي Blueprint-only؛ لا تنفيذ تلقائي للاختبارات أو الإنفاق |
| `market_context` | مكتمل كعقد آمن، وليس Market Intelligence حيًا | seasonality أولية، وcompetitor/market metrics غير المتاحة تبقى `unavailable` |
| `compliance` | مكتمل كحزمة Blueprint وحوكمة | لا يُعد ذلك بديلًا عن استشارة قانونية أو مصدر تنظيمي محدث لكل سوق |
| `technical_audit` | مكتمل | أضيفت حقول page speed وSSL certificate وdomain authority مع حالات عدم التوفر |
| `offer_strategy` | مكتمل | أصبح له مخرجات منظمة وmetadata موحدة |
| `tracking_checklist` | مكتمل | تم إصلاح الاتساق بين حالة overall والعناصر والـcounters |
| `debug` وtelemetry | مكتمل | أضيفت `scores_breakdown` وحقول التتبع والتشخيص الآمن |
| renderers للأقسام المرجعية | مكتمل | التغطية الحالية 26/26 renderer |
| assertions وsemantic parity | مكتمل | Enterprise assertions الحالية 260/260، والاختبارات الدلالية 10/10 |

## 3. الأدلة الحالية على اكتمال مرحلة التكافؤ

النتائج المسجلة في حالة المشروع الحالية هي:

| بوابة التحقق | النتيجة |
|---|---:|
| TypeScript | PASS |
| Production build | PASS |
| Reference Coverage Gate | 26/26 full، و0 partial، و0 missing |
| Golden HTTP v5 | 10/10 PASS |
| Semantic regression | 10/10 PASS |
| Enterprise assertions | 260/260 PASS |
| Wizard real flow | PASS، مع 14 قسمًا غنيًا |
| Fixtures v3 | PASS |
| UI renderers | 26/26 |
| AI governance audit | 0 أقسام Canonical متأثرة بطبقتي AI |

هذه النتائج تعني أن النظام يحقق **التكافؤ الدلالي والهيكلي مع المراجع** ضمن نطاق البيانات والقواعد المتاحة. لكنها لا تعني أن النظام أصبح تلقائيًا مصدرًا لحقيقة السوق أو أن كل benchmark وCPC وsaturation أصبح موثقًا؛ هذه هي وظيفة المرحلة الجديدة.

## 4. ما الذي لا ينبغي إعادة تنفيذه من الملف؟

لا ينبغي إعادة إنشاء الأقسام الثمانية التي كانت مفقودة، ولا إضافة aliases مكررة لمجرد أن ملفًا قديمًا يستخدم أسماء مختلفة، ولا إعادة بناء الـ15 renderer، ولا إعادة تشغيل دورة parity من الصفر كأن baseline القديم ما زال قائمًا.

كما لا ينبغي تحويل النجاح في Coverage Gate إلى ادعاء بأن Blueprint أصبح Market-Validated. التغيير المطلوب الآن ليس إضافة حقول سوقية عشوائية إلى الأقسام الـ26، بل إضافة طبقة أدلة يمكن ربطها بالأقسام دون تغيير سلطة CDKS.

ويُعامل اقتراح `CanonicalBlueprint v3.1` الوارد في الملف كخيار تصميمي مستقبلي، وليس كعائق حالي. لا نرفع إصدار العقد إلا إذا أضفنا حقولًا جديدة فعلية مثل `evidence_package` أو `evidence_status` إلى الـenvelope أو الـcanonical contract، وبعد إضافة migration وregression tests.

## 5. المخطط التنفيذي المحدث

### المرحلة 0: إغلاق parity كخط أساس ثابت

نثبت الحالة الحالية باعتبارها baseline رسميًا، ونحتفظ بتقارير Coverage Gate وEnterprise assertions وAI audit. نضيف اختبارًا يمنع أي تغيير لاحق في الأقسام الـ26 من خفض التغطية أو كسر blueprint-only.

**مخرج المرحلة:** parity baseline ثابت، لا يُعاد بناؤه إلا عند تغيير عقد مقصود.

### المرحلة 1: Knowledge Contract

نضيف العقود التالية بصورة additive:

| العقد | الغرض |
|---|---|
| `IndustryProfile` | وصف الصناعة وسلوك الشراء والـKPIs والامتثال والقنوات |
| `SourceRecord` | تعريف المصدر والناشر والرابط والنطاق والترخيص والتحديث |
| `Claim` | تمثيل fact أو inference أو hypothesis مع الأدلة والحالة |
| `MarketEvidenceSnapshot` | لقطة سوقية مؤرخة لسوق وصناعة ولغة وعملة محددة |
| `EvidencePackage` | الحزمة التي تُمرر إلى CDKS وطبقتي AI |

يجب أن تفرق العقود بين `fact` و`inference` و`directional_hypothesis` و`recommendation`، وأن تمنع الرقم السوقي غير المرتبط بمصدر أو حالة `unavailable`.

**مخرج المرحلة:** Zod schemas، fixtures مجهلة، واختبارات parse ورفض claims غير المسندة.

### المرحلة 2: Source Registry وKnowledge Store

ننشئ سجلًا للمصادر يحدد المصدر المسموح واستخدامه ونطاقه وfreshness policy وقيوده. يكون التخزين منظمًا للبيانات الرقمية، وتُحفظ الوثائق والـraw payloads بصورة versioned، ويمكن إضافة pgvector أو خدمة vector search للبحث الدلالي دون جعلها مصدر الحقيقة الوحيد.

**مخرج المرحلة:** schema/database migrations، source registry، versioning، retention policy، وربط كل evidence بـ`source_id` و`observed_at`.

### المرحلة 3: Industry Profiles ذات الأولوية

لا نبدأ بكل الصناعات. نختار صناعتين أو ثلاثًا للدفعة الأولى داخل مصر والخليج، ثم نبني profiles للفروع الأربعة: `local_service` و`ecommerce` و`app` و`b2b` حسب أولوية الاختبار.

كل profile يحتوي على دورة الشراء، الشرائح، الاعتراضات، العرض، القنوات، KPIs، احتياجات التتبع، القيود التنظيمية، المصطلحات، والمعلومات العامة القابلة للمصدر.

**مخرج المرحلة:** ملفات JSON أو سجلات DB versioned، مع industry matching و`unmatched` عند غياب التطابق بدل التخمين.

### المرحلة 4: Market Evidence Snapshot وGrounding Gates

قبل توصيل APIs الحية، ننشئ snapshot تجريبيًا موثقًا مبنيًا على fixtures ومصادر عامة معروفة. ثم نضيف البوابات الثلاث:

| البوابة | وظيفتها |
|---|---|
| Grounding Gate | يمنع claim خارجيًا لا يملك evidence مناسبة |
| Citation Gate | يفرض source IDs لكل claim مهم أو يضعه directional/unavailable |
| Freshness Gate | يرفض أو يخفض الثقة في snapshot المتقادم |

تضاف أيضًا Contradiction Gate عند وجود مصدرين متعارضين، بحيث لا يختار AI قيمة من تلقاء نفسه؛ بل يظهر التعارض ويخفض الحالة أو يطلب معالجة حتمية.

**مخرج المرحلة:** Evidence Package قابل لإعادة الإنتاج، مع حالات `fresh` و`stale` و`expired` و`missing`.

### المرحلة 5: Official Connectors

بعد تثبيت العقود والبوابات، نضيف connectors بالترتيب الآمن:

| الأولوية | المصدر | الاستخدام |
|---:|---|---|
| 1 | وثائق سياسات المنصات الرسمية | التتبع، المتطلبات الإبداعية، الامتثال |
| 2 | Meta Ad Library | ملاحظات الإعلانات والرسائل والأنماط العامة، لا إثبات الأداء المالي |
| 3 | Google Ads Keyword Planning | أفكار الكلمات والمؤشرات التاريخية/التنبؤية ضمن نطاقها |
| 4 | TikTok Creative Center | الاتجاهات والأمثلة الإبداعية وTop Ads ضمن شروط الاستخدام |
| 5 | مصادر حكومية وإحصائية ومرخصة | مؤشرات السكان والاقتصاد والقطاع |

كل connector يحتاج caching وrate limiting وretry policy وraw snapshot وnormalization وsource metadata. لا نستخدم scraping يخالف شروط المصدر، ولا نعتبر ظهور إعلان دليلًا على ROAS أو المبيعات.

**مخرج المرحلة:** ingestion jobs قابلة لإعادة التشغيل، مع سجل فشل وتاريخ تحديث ونسخة payload.

### المرحلة 6: Evidence-aware CDKS

نعدل CDKS ليستقبل `EvidencePackage` كمدخل منفصل عن `WizardInput`. يمكن للأدلة أن تثري market context وcreative guidance وplatform guidance والرسائل والاختبارات والتحفظات، لكنها لا تتجاوز قواعد الهدف أو readiness أو compliance أو blueprint-only.

كل قرار يحافظ على:

```text
rule_id
authority = CDKS
source_ids عند استخدام evidence خارجية
evidence_status
confidence
reasoning
```

**مخرج المرحلة:** Canonical Blueprint مستمر في العمل حتى عند غياب الأدلة، لكن مع `unavailable` أو `limited_external_evidence` الواضحة.

### المرحلة 7: Grounded Strategy Builder وReasoning with citations

يستقبل Strategy Builder حزمة الأدلة ويقترح فقط. لا يكتب في `data.blueprint` ولا يغير قرارات CDKS. يضيف Reasoning تفسيرًا يميز بين قرار القاعدة، evidence-backed claim، inference، والفرضية الاتجاهية.

**مخرج المرحلة:** `data.strategy` و`data.reasoning` يحملان provenance وsource IDs وlimitations، مع استمرار اختبارات عدم التأثير على الأقسام الـ26.

### المرحلة 8: Evaluation وDrift

نضيف اختبارات لاختبار:

- freshness compliance؛
- citation coverage؛
- industry relevance؛
- contradiction handling؛
- unsupported numeric claims؛
- source scope violations؛
- ثبات canonical decisions عند تبديل AI؛
- تراجع التغطية أو تغير profile أو connector.

**مخرج المرحلة:** تقرير دوري يوضح جودة المعرفة، وليس فقط نجاح schema أو HTTP.

### المرحلة 9: Client UX

نوسع صفحة Blueprint لعرض الحالات التالية بصورة مفهومة:

| الحالة | معناها |
|---|---|
| `system_validated` | اجتاز العقد والـquality gates الداخلية |
| `evidence_backed` | claim مدعوم بمصدر مؤرخ مناسب |
| `directional_hypothesis` | اتجاه مقترح يحتاج اختبارًا، وليس حقيقة سوقية |
| `stale` | الدليل موجود لكنه تجاوز freshness policy |
| `unavailable` | لا توجد بيانات موثوقة كافية ولم يتم اختلاق بديل |
| `rejected` | فشل claim أو المخرج في بوابة حوكمة |

**مخرج المرحلة:** Blueprint موثق تلقائيًا دون إلزام العميل بمراجعة يدوية روتينية، مع إبقاء التفاصيل قابلة للفتح عند الحاجة.

## 6. ترتيب التنفيذ الفعلي من الآن

الترتيب العملي بعد إغلاق parity هو:

```text
1. تثبيت parity baseline واختبار عدم التراجع
2. Knowledge Contracts
3. Source Registry وEvidence Package
4. Industry Profiles محدودة الأولوية
5. Grounding/Citation/Freshness Gates
6. Evidence snapshot مجهّل قابل للاختبار
7. أول connector رسمي منخفض المخاطر
8. Evidence-aware CDKS
9. Grounded Strategy وReasoning citations
10. Evaluation وdrift
11. Client UX لحالات الثقة
12. connectors إضافية حسب الحاجة
```

## 7. شروط الجاهزية للمرحلة الجديدة

نحن جاهزون للبدء في المرحلة الجديدة من ناحية parity والبنية الحالية، بشرط عدم تفسير الجاهزية على أنها امتلاك بيانات سوقية حية. قبل أول تنفيذ، يلزم تحديد الصناعات ذات الأولوية والأسواق الأولى وسياسة freshness، ثم يمكن بناء العقود والـmock evidence دون أي مزود AI حي.

لا يلزم تشغيل Groq أو Mistral أو Gemini لتنفيذ Knowledge Contract أو Source Registry أو بوابات التحقق. ولا يلزم Fine-tuning. تشغيل connectors الحية يأتي بعد تثبيت العقد والاختبارات، ويحتاج فقط إلى الصلاحيات الخارجية الخاصة بالمصدر المعني.

## 8. قرار الجاهزية النهائي

**نعم، يجب إكمال جوهر الملف، وقد تم إكماله بالفعل فيما يخص تكافؤ الـBlueprint.** المتبقي ليس سد أقسام Canonical مفقودة، بل نقل هذه الأقسام المكتملة إلى مرحلة أكثر ذكاءً عبر ربطها بأدلة سوقية وصناعية موثقة.

وعليه فإن نقطة البداية التالية الصحيحة هي:

> **بناء Knowledge Contracts وEvidence Package وSource Registry، مع إبقاء الـBlueprint الحالي baseline غير قابل للكسر.**

ولا نعلن أن النظام أصبح Market-Validated إلا بعد تفعيل مصادر رسمية، وتسجيل snapshots، واجتياز Grounding/Citation/Freshness/Evaluation Gates.

## 9. العلاقة بين الملف وهذه الوثيقة

ملف `خطةتكافؤBlueprintمعالمراجع.md` يظل مرجعًا مهمًا للتكافؤ والـregression. أما هذه الوثيقة فهي خطة الانتقال المحدثة بعد اكتمال parity. يجب تحديث الملف القديم فقط بإضافة إحالة إلى هذه الوثيقة ونتائج baseline الجديدة، لا إعادة كتابة تاريخه أو حذف مسار التغييرات السابق.
