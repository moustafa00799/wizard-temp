# وثيقة نقل سياق مشروع Campaign Builder AI / CDKS

**الإصدار:** 2.0.0
**الغرض:** نقل السياق الكامل للمحادثة الحالية إلى محادثة جديدة دون فقد القرارات أو حالة التنفيذ أو القيود المعمارية.
**نقطة التكامل:** مستودع `wizard-temp`
**حالة الوثيقة:** مرجع تسليم قبل بدء مرحلة Knowledge Layer وMarket Intelligence
**تاريخ التحديث:** 2026-08-21

---

## 1. طريقة استخدام هذه الوثيقة في المحادثة الجديدة

يجب إرفاق هذه الوثيقة أو نسخ قسم **تعليمات بدء المحادثة الجديدة** إلى أول رسالة في المحادثة الجديدة. على المساعد الجديد اعتبارها مصدر السياق التنفيذي الحالي، مع التحقق من المستودع قبل تنفيذ أي تغيير. لا يجوز الرجوع إلى baselines قديمة باعتبارها الحالة الحالية، خصوصًا baseline الذي كان يعرض 8 أقسام مفقودة و16 قسمًا جزئيًا؛ هذا baseline تم تجاوزه بعد الإصلاحات اللاحقة.

الخطوة الأولى في المحادثة الجديدة هي قراءة هذه الوثيقة، ثم قراءة `docs/KNOWLEDGE_LAYER_IMPLEMENTATION_REQUIREMENTS.md` و`docs/BLUEPRINT_PARITY_AND_KNOWLEDGE_LAYER_ROADMAP_UPDATED.md` و`docs/ai-context.md`، ثم فحص `git status` وقراءة الملفات التنفيذية الأساسية قبل بدء المرحلة الأولى.

---

## 2. الرؤية والهدف النهائي

المشروع عبارة عن منصة Enterprise لبناء وإدارة الاستراتيجيات الإعلانية. تبدأ المنصة بتشخيص نشاط العميل من خلال Wizard تفاعلي، ثم تحلل المدخلات بواسطة CDKS وقواعد تسويقية deterministic، وتحوّلها إلى استراتيجية إعلانية وCampaign Blueprint غني.

يجب أن يتضمن الـBlueprint، بحسب الفرع والسوق واللغة والعملة، هيكل الحملات، الأهداف، الـfunnel، الجمهور، الميزانية، الرسائل والزوايا الإبداعية، التتبع، القياس، خطة الإطلاق، التحذيرات، الامتثال، والتوصيات. المطلوب ليس نسخ ملفات المراجع حرفيًا، بل تحقيق تكافؤ دلالي قابل للإثبات أو تجاوزه.

المبدأ الحاكم هو:

> **AI يقترح، CDKS يقرر، الإنسان يعتمد عند الإجراء الخارجي؛ ولا نشر حملات ولا إنفاق ميزانية في مرحلة Blueprint-only.**

المرحلة الجديدة تهدف إلى جعل القرارات مرتبطة بالصناعة والسوق ومصادر خارجية موثقة، من خلال Knowledge Layer وMarket Intelligence، دون منح AI سلطة تجاوز CDKS.

---

## 3. قرارات المنتج الثابتة

| القرار | القيمة المعتمدة |
|---|---|
| المستودع الأساسي | `wizard-temp` |
| الفروع | `local_service`, `ecommerce`, `app`, `b2b` |
| الأسواق | مصر والخليج، مع دعم دول/مناطق محددة مثل مصر والسعودية والإمارات عند توفر البيانات |
| اللغات | العربية والإنجليزية حسب تفضيل المستخدم النهائي |
| العملات | `EGP`, `SAR`, `USD` |
| المرحلة الحالية | Blueprint-only |
| النشر التلقائي | ممنوع حاليًا |
| إنفاق الميزانية | ممنوع حاليًا |
| الموافقة البشرية | لا تُطلب للمراجعة الروتينية لكل claim؛ تبقى مطلوبة عند تنفيذ إجراء خارجي مثل النشر أو الإنفاق |
| نماذج AI | Cloud Only، لا نماذج محلية |
| Fine-tuning | مؤجل، وليس أولوية حالية |
| Gemini | benchmark على fixtures مجهلة فقط، وليس مصدرًا لبيانات إنتاجية |
| سياسة الخصوصية | لا API keys أو كلمات مرور في المحادثة أو Git، وبيانات AI وفق سياسة anonymized fixtures عند الاختبارات |
| أولوية الجودة | Semantic/Strategy Reasoning قوي مع حوكمة deterministic وتتبّع provenance |

---

## 4. ما تم التخطيط له خلال المحادثة

تمت مناقشة وبناء خطة متدرجة بدل القفز مباشرة إلى تدريب النماذج أو ربط كل منصات الإعلان.

### 4.1 الأساس الأول: بناء CDKS

كان الهدف الأول إنشاء محرك قرار يحول `CanonicalWizardInput` الغني إلى Blueprint منظم، بدل إخراج JSON مختصر أو ترك القرار الكامل لمزود AI.

تم الاتفاق على فصل المسؤوليات إلى:

1. **Wizard/Input Contract:** يمثل بيانات العميل الأساسية، وعددها 41 حقلًا canonical.
2. **CDKS/Rules:** يقرر الهدف، الـfunnel، القنوات، الجاهزية، الميزانية، المخاطر، والتفاصيل التنفيذية.
3. **Canonical Blueprint:** المخرج الرسمي الذي يعتمد عليه النظام.
4. **AI Strategy Builder:** اقتراحات استراتيجية منفصلة لا تكتب في canonical blueprint.
5. **AI Reasoning:** تفسير grounded لقرارات CDKS، منفصل عن القرار نفسه.
6. **Provenance/Telemetry:** تتبع المصدر والقاعدة والنتيجة والزمن والتحقق.
7. **Quality Gates:** اختبارات schema وsemantic وreference parity وUI وحواجز السلامة.

### 4.2 تكافؤ ملفات المراجع

تم اعتماد ملفي ecommerce وlocal_service كمرجعين دلاليين، أحدهما غني من 49 صفحة والآخر من 13 صفحة. الخطة لم تكن نسخ المسارات القديمة، بل:

- اكتشاف الحقول والأوراق المرجعية leaf-by-leaf؛
- فصل فجوة التوليد عن فجوة mapping أو wrapper؛
- إضافة حقول canonical صريحة عند الحاجة؛
- الحفاظ على branch awareness؛
- منع `undefined` أو «غير محدد» عندما توجد قيمة canonical؛
- استخدام `not_applicable` أو `unavailable` مع سبب؛
- إثبات التكافؤ باختبارات structural وsemantic وprovenance وUI.

### 4.3 الاعتمادية الأولية لمزودي AI

تمت مناقشة اختيار أكثر من مزود لتوزيع المخاطر والتكلفة والحدود:

- Groq كمزود Strategy رئيسي؛
- Mistral كـfallback؛
- Gemini كـbenchmark على fixtures مجهلة؛
- provenance يتضمن provider/model/version وtimeout وحالة fallback؛
- التعامل مع RPD وTPD وTPM وRPM و429 وschema rejection؛
- عدم تشغيل اختبار كبير دفعة واحدة حتى لا تنتهي الحصص اليومية أو تتكرر rate limits.

### 4.4 الانتقال من AI غير المحكوم إلى AI محكوم

تم الاتفاق على أن AI لا يكتب في قرارات CDKS مباشرة. أي تطبيق مستقبلي لاقتراح AI يجب أن يمر بهذه الدورة:

```text
AI proposal
  → human approval عند الحاجة لتغيير مدخل أو إجراء
  → confirmed input/change request
  → CDKS re-run
  → new canonical Blueprint
```

في الوضع الحالي لا يوجد نشر أو إنفاق حتى مع وجود موافقة؛ النظام ينتج Blueprint فقط.

### 4.5 المرحلة الجديدة: Knowledge Layer وMarket Intelligence

تم الاتفاق على أن CDKS الحالي قوي من ناحية الحتمية والتغطية، لكنه لا يملك وحده معرفة سوقية حية أو موثقة لكل صناعة. لذلك نضيف:

1. `Knowledge Contract`.
2. `Source Registry`.
3. `Industry Profiles`.
4. `Official Connectors`.
5. `Market Evidence Snapshot` و`Evidence Package`.
6. `Evidence-aware CDKS`.
7. `Grounded Strategy Builder`.
8. `Reasoning with citations`.
9. `Evaluation, drift, and Client UX`.

---

## 5. الحالة المعمارية الحالية

### 5.1 تدفق النظام الحالي

```text
CanonicalWizardInput (41 fields)
        ↓
CDKS Engine + deterministic policies
        ↓
CanonicalBlueprint (26 sections)
        ├── Strategy Builder opt-in → data.strategy only
        └── Reasoning Builder opt-in → data.reasoning only
        ↓
Blueprint UI / PDF / telemetry
```

### 5.2 الـenvelope الفعلي v5

```ts
data = {
  contract_version,
  blueprint_id,
  generation_mode,
  decisions: { objective, funnel, channels },
  readiness,
  strategy: BlueprintStrategyTrace,
  reasoning: BlueprintReasoningTrace,
  blueprint: CanonicalBlueprint,
  warnings,
  provenance,
  validation
}
```

### 5.3 أقسام CanonicalBlueprint الحالية

```text
blueprint = {
  executive_summary,
  raw_input_summary,
  strategy: {
    recommended_objective,
    recommended_channels,
    funnel_type,
    recommended_funnel,
    confidence_score,
    estimated_timeline
  },
  execution: {
    audience_analysis,
    creative_strategy,
    tracking_assessment,
    campaign_structure,
    audience_structure,
    budget_split,
    creative_angles,
    tracking_checklist,
    launch_plan,
    offer_strategy
  },
  governance: {
    risk_flags,
    monitoring_plan: {
      post_launch_plan,
      budget_management,
      testing_plan: {
        ab_test_plan,
        benchmarks,
        market_context,
        platform_guides,
        compliance,
        technical_audit
      }
    }
  },
  provenance_trail,
  telemetry,
  flags
}
```

### 5.4 حدود السلطة

| الطبقة | السلطة |
|---|---|
| CDKS policies | مصدر القرار canonical |
| Canonical Blueprint | المخرج الرسمي المعتمد للنظام |
| AI Strategy Builder | اقتراح رسائل، فرضيات جمهور، زوايا وتجارب؛ لا يعدل canonical |
| AI Reasoning | تفسير grounded للقرار؛ لا يعدل canonical |
| Market Evidence | سياق موثق يثري القرار وفق قواعد محددة؛ لا يتجاوز readiness أو compliance |
| الإنسان | يعتمد أو يراجع عند تغيير مدخل أو تنفيذ إجراء خارجي |

---

## 6. ما تم تنفيذه بالفعل

### 6.1 محرك CDKS والعقود

تم إنشاء/تطوير محرك `src/lib/orchestrator/cdks-engine.ts` ليشغل السياسات ويجمع النتائج ويُنتج Blueprint غنيًا ومتوافقًا مع العقد. وتم تطوير `src/lib/contracts/canonical-blueprint.ts` ليغطي الأقسام الحالية والـmetadata وحالات عدم التوفر.

تم تثبيت منطق deterministic للهدف والـfunnel والقنوات والجاهزية، مع مخرجات branch-aware وقيود blueprint-only.

### 6.2 تكافؤ الـBlueprint

تم تحويل الأقسام التي كانت ناقصة أو جزئية إلى مخرجات canonical صريحة، بما في ذلك:

- `audience_analysis`؛
- `creative_strategy`؛
- `tracking_assessment`؛
- `recommended_funnel`؛
- `launch_plan`؛
- `monitoring`؛
- `benchmarks`؛
- `platform_guides`؛
- `budget_management`؛
- `testing`؛
- `market_context`؛
- `compliance`؛
- `technical_audit`؛
- `offer_strategy`؛
- `budget_split`؛
- `tracking_checklist`؛
- `debug/telemetry`.

لم تتم إضافة نسخ مكررة غير موثقة لمسارات legacy؛ تم إصلاح mapping والـwrapper normalization، واستخدام canonical path مع aliases عرضية عند الحاجة.

### 6.3 الواجهة

تم إنشاء renderers للأقسام الـ26 وربطها بصفحة `src/app/blueprint/page.tsx` من خلال adapter للـdisplay model. أصبحت الأقسام الغنية قابلة للعرض في الواجهة بدل ظهورها كحقول فارغة أو «غير محدد» عندما تكون البيانات موجودة.

تم ربط Reasoning Dashboard بالبيانات الحقيقية من دورة Wizard v5 بدل الاعتماد على fixture بصري فقط.

### 6.4 طبقتا AI

تم تنفيذ وتدقيق:

- `src/lib/ai-strategy-builder.ts`؛
- `src/lib/ai-reasoning-builder.ts`؛
- `src/app/api/generate/v5/route.ts`؛
- `src/lib/contracts/blueprint-contract-v3.ts`؛
- اختبارات Strategy Gate وReasoning Builder وAI Layer Impact Audit.

النتيجة المعمارية المثبتة:

- Strategy Builder يعمل عند opt-in صريح ويكتب في `data.strategy` فقط.
- Reasoning Builder يعمل عند opt-in صريح ويكتب في `data.reasoning` فقط.
- لا يوجد قسم canonical يتغير عند تفعيل طبقتي AI.
- عند محاولة التجاوز يحدث fail-closed.
- طبقتا AI لا تمنحان readiness أو compliance أو benchmark غير موثق سلطة جديدة.

### 6.5 Provider Observability وSafe Benchmarking

تمت إضافة مراقبة للمزودين تشمل provider/model/version وtimeout وتصنيف الأخطاء والحالة المختصرة للنتائج، مع اختبارات controlled/mock وفواصل محافظة للاختبارات الحية.

تم توثيق أن:

- Groq قد يواجه schema rejection أو rate limit؛
- Mistral استخدم كـfallback ونجح في مسار 429؛
- Gemini احتاج تحديث النموذج بسبب رسالة أن `gemini-2.5-flash` غير متاح للمستخدمين الجدد، وتم الانتقال إلى `gemini-3.6-flash` وفق حالة المشروع الحالية؛
- الاختبارات الحية الأولية لا تساوي اعتمادًا إنتاجيًا ولا تسمح بإرسال بيانات حساسة.

### 6.6 ملفات ووثائق وتقارير تم إنشاؤها

| الملف | الغرض |
|---|---|
| `docs/REFERENCE_PARITY_MANIFEST.md` | توثيق manifest التكافؤ |
| `docs/reference-parity-manifest.json` | manifest مولد للأقسام والأوراق والـassertions |
| `docs/REFERENCE_PARITY_ENTERPRISE_ASSERTIONS.md` | توثيق assertion matrix Enterprise |
| `QUALITY_REFERENCE_COVERAGE_GATE.md` | آخر تقرير Coverage Gate |
| `tests/results/AI_LAYER_IMPACT_AUDIT_REPORT.md` | إثبات عدم تأثير طبقتي AI على canonical |
| `tests/results/external-ai-trust-sources.md` | مصادر trust وMarket Intelligence الخارجية |
| `docs/KNOWLEDGE_LAYER_IMPLEMENTATION_REQUIREMENTS.md` | متطلبات Knowledge Layer ومصادر البيانات |
| `docs/BLUEPRINT_PARITY_AND_KNOWLEDGE_LAYER_ROADMAP_UPDATED.md` | الخطة المحدثة بعد اكتمال parity |
| `docs/CDKS_CONVERSATION_HANDOFF_TO_KNOWLEDGE_LAYER.md` | هذه الوثيقة لنقل المحادثة |

### 6.7 الحالة الرسمية الحالية للاختبارات

| الاختبار أو البوابة | النتيجة الحالية |
|---|---:|
| TypeScript | PASS |
| Production build | PASS |
| Reference Coverage Gate | 26/26 full، 0 partial، 0 missing |
| Golden HTTP v5 | 10/10 PASS |
| Semantic regression | 10/10 PASS |
| Enterprise assertions | 260/260 PASS |
| Wizard real flow | PASS، 14 قسمًا غنيًا |
| Fixtures v3 | PASS |
| UI coverage | 26/26 renderers |
| AI governance audit | 0 canonical sections impacted |

### 6.8 آخر commits المرفوعة

وفق سجل المشروع الموثق في هذه المحادثة، آخر مجموعات التغييرات المرفوعة إلى GitHub هي:

1. `ca02df9` — `feat: render all blueprint sections in UI`
2. `2809cf3` — `test: add enterprise reference parity assertions`
3. `e9d15da` — `feat: close remaining reference parity gaps`
4. `de44cdf` — `feat: add reference parity manifest and semantic P0 coverage`

يجب على المحادثة الجديدة التحقق من `git log` الفعلي قبل البناء على هذه القائمة، لأن المستودع قد يحتوي على commit جديد خاص بوثيقة التسليم الحالية.

---

## 7. ما لم يُنفذ بعد

### 7.1 Knowledge Layer غير المنفذ بعد

هذه العناصر تم تصميمها ووصفها، لكنها ليست جزءًا مكتملًا من النظام الحالي حتى يبدأ تنفيذها:

| العنصر | الحالة |
|---|---|
| `IndustryProfile` contract | مخطط، غير مدمج بعد في العقد التنفيذي |
| `SourceRecord` contract | مخطط، غير مدمج بعد |
| `Claim` contract | مخطط، غير مدمج بعد |
| `MarketEvidenceSnapshot` | مخطط، غير مدمج بعد |
| `EvidencePackage` | مخطط معماري، غير مدمج بعد |
| Source Registry | غير منفذ |
| PostgreSQL/structured knowledge store | غير منفذ |
| Object/document archive | غير منفذ |
| pgvector أو Vector Search | غير منفذ |
| Industry Profiles فعلية | لم تُحسم الصناعات الأولى ولم تُبن profiles مكتملة |
| Official connectors | غير منفذة في المشروع الحالي |
| Freshness Gate | غير منفذ كطبقة سوقية مستقلة |
| Citation Gate | غير منفذ كحاجز claims مستقل |
| Grounding Gate | غير منفذ كحاجز evidence مستقل |
| Contradiction handling | غير منفذ |
| Evidence-aware CDKS | غير منفذ |
| Grounded Strategy Builder | لم يُربط بعد بـEvidence Package؛ الحالي يعمل على مدخلات CDKS فقط |
| Reasoning with source citations | Reasoning موجود، لكن source-backed claims من Knowledge Layer لم تُدمج بعد |
| Market Intelligence حي | غير متوفر حاليًا؛ benchmarks وcompetitor metrics غير الموثقة تبقى `unavailable` |
| Drift monitoring | غير منفذ |
| Client evidence UX | يوجد Blueprint UI وReasoning Dashboard، لكن طبقات `evidence_backed` و`directional_hypothesis` و`stale` تحتاج توسعة Knowledge Layer |

### 7.2 عناصر ليست blockers للمرحلة الجديدة

ليست هناك حاجة لإعادة بناء parity أو إعادة إنشاء renderers أو تشغيل مزودي AI أحياء قبل بدء Knowledge Contracts. كما لا يلزم Fine-tuning. ولا يجب إضافة benchmarks سوقية لمجرد جعل الواجهة أكثر امتلاءً.

---

## 8. المشكلات التي واجهت المشروع والحلول

### 8.1 فقدان العمق الدلالي

**المشكلة:** محاولة حشر استراتيجية كبيرة في طلب واحد تؤدي إلى مخرجات مختصرة أو سطحية.
**الحل:** فصل CDKS عن Strategy Builder وعن Reasoning، وبناء canonical blueprint غني، ثم استخدام AI كطبقة اقتراح/تفسير لا كمصدر الحقيقة الوحيد.

### 8.2 أزمة Data Contract

**المشكلة:** عدم تطابق عدد الحقول أو المسؤوليات بين payload قديم وCanonicalWizardInput، وظهور بيانات غير واضحة.
**الحل:** تثبيت canonical contracts، تصنيف الحقول حسب المسؤولية، وإجراء schema/semantic regression قبل اعتبار المسار مكتملًا.

### 8.3 False Missing في Coverage Gate

**المشكلة:** كانت بعض الأقسام تبدو missing لأن المرجع يستخدم مسارًا أو wrapper مختلفًا عن canonical الحالي.
**الحل:** إصلاح `REFERENCE_SECTION_MAP` وwrapper normalization، وعدم إضافة بيانات مكررة. بعد ذلك أصبحت النتيجة 26/26 full.

### 8.4 الحقول الفارغة و«غير محدد»

**المشكلة:** الواجهة أو adapter لا يقرأ القيمة canonical الموجودة أو يستخدم fallback غير صحيح.
**الحل:** توحيد display adapter، إضافة renderers، وإجراء UI coverage وreal-flow tests للتأكد من عرض المخرجات الغنية.

### 8.5 Groq Structured Output/schema rejection

**المشكلة:** قيود wire schema، خصوصًا قيود مثل `maxItems`، سببت rejection من المزود رغم أن Zod المحلي يستطيع التحقق من العقد.
**الحل:** تبسيط wire schema، الإبقاء على canonical Zod validation محليًا، ثم اختبار EX-001 بعد الإصلاح.

### 8.6 Rate limit و429

**المشكلة:** Groq أظهر rate limit في EX-002، وقد تنتهي الاختبارات الكبيرة من الحصة أو تتوقف العملية بخطأ runtime على Windows.
**الحل:** تصنيف 429، تطبيق fallback إلى Mistral، التسجيل الآمن، تقليل عدد الحالات، فواصل محافظة، وعدم اعتبار rate limit فشلًا في منطق CDKS نفسه.

### 8.7 نموذج Gemini غير المتاح

**المشكلة:** `gemini-2.5-flash` أعاد رسالة أن النموذج غير متاح للمستخدمين الجدد.
**الحل:** التحقق من رسالة المزود وتحديث model identifier إلى `gemini-3.6-flash` في البيئة المعتمدة، دون وضع مفتاح حقيقي في Git أو المحادثة.

### 8.8 عدم تطابق Literal Types في TypeScript

**المشكلة:** مخرجات المحرك لا تتوافق مع Zod literal unions.
**الحل:** استخدام `as const` وتثبيت القيم literal ومراجعة العقد بعد كل تغيير.

### 8.9 Benchmarks غير موثقة

**المشكلة:** من السهل عرض CPC أو CVR أو saturation كأنها حقائق سوقية دون مصدر مباشر.
**الحل:** سياسة fail-closed: `status: unavailable` مع سبب عند غياب مصدر موثوق، وعدم تحويل seasonality الأولية أو خبرة عامة إلى benchmark رقمي.

### 8.10 الخلط بين بناء معرفة وتدريب نموذج

**المشكلة:** افتراض أن Fine-tuning سيحل مشكلة حداثة السوق أو صحة البيانات.
**الحل:** البدء بـKnowledge Layer وSource Registry وEvidence Package. Fine-tuning مؤجل، وقد يُدرس مستقبلًا فقط إذا ظهرت مشكلة خاصة بأسلوب الصياغة أو مهمة متكررة بعد توفر corpus مرخص ومقاس.

### 8.11 أخطاء التخطيط والمعلومات القديمة

**المشكلة:** بعض الوثائق القديمة ذكرت نماذج أو مراحل لم تعد تعكس الحالة الحالية.
**الحل:** اعتماد هذه الوثيقة و`docs/BLUEPRINT_PARITY_AND_KNOWLEDGE_LAYER_ROADMAP_UPDATED.md` كمرجعين محدثين، مع اعتبار الوثائق القديمة تاريخًا للتطور لا قائمة مهام حالية.

---

## 9. التكوين الحالي لمزودي AI

التكوين التشغيلي الحالي كما ورد في حالة المشروع:

| الوظيفة | المزود/النموذج | الحالة |
|---|---|---|
| Strategy Builder | Groq: `openai/gpt-oss-120b` | رئيسي، non-production، structured JSON |
| Strategy fallback | Mistral: `mistral-small-latest` | fallback، timeout تقريبي 30 ثانية |
| Benchmark | Gemini: `gemini-3.6-flash` | benchmark على fixtures مجهلة فقط |

المتغيرات النموذجية:

```env
AI_STRATEGY_PROVIDER=groq
AI_STRATEGY_FALLBACK_PROVIDER=mistral
AI_BENCHMARK_PROVIDER=gemini
AI_PROVIDER_MODE=nonprod
AI_BENCHMARK_ENABLED=true
AI_DATA_POLICY=anonymized_fixtures_only
MISTRAL_AI_TIMEOUT_MS=30000
MISTRAL_STRATEGY_MODEL=mistral-small-latest
```

يجب وضع المفاتيح الفعلية محليًا في `.env.local` أو Secret Manager، ويجب التأكد من وجود `.env.local` في `.gitignore`. لا يُرفع `.env.local` إلى GitHub.

---

## 10. البنية المستهدفة للمرحلة الجديدة

### 10.1 المكونات

```text
Wizard Input
  ↓
Industry Resolver
  ↓
Source Registry
  ↓
Ingestion / Connectors
  ↓
Raw Snapshots + Document Store
  ↓
Normalization + Claims
  ↓
Market Evidence Snapshot
  ↓
Evidence Package / Retrieval
  ↓
Evidence-aware CDKS
  ├── Canonical Blueprint decisions
  ├── readiness/compliance guards
  └── provenance/evidence links
  ↓
Strategy Builder (proposal only)
  ↓
Reasoning Builder (explanation + citations)
  ↓
Grounding/Citation/Freshness/Contradiction Gates
  ↓
Client Blueprint UX
```

### 10.2 التخزين المقترح

لا نضع كل البيانات في vector database. المقترح هو:

| الطبقة | ما تخزنه |
|---|---|
| Structured database، ويفضل PostgreSQL عند الإنتاج | Industry Profiles، Source Records، facts، claims، snapshots، evidence links، evaluation runs |
| Object/document storage | payloads الأصلية، النصوص المستخرجة، وثائق السياسات، الأرشيف |
| pgvector أو Vector Search | chunks النصية والبحث الدلالي مع `source_id` و`version_id` |
| Cache | نتائج APIs وsnapshots لتقليل الطلبات واحترام rate limits |
| Observability store | job status، latency، connector errors، freshness، gate results |

### 10.3 العقود المطلوبة

#### `SourceRecord`

```ts
{
  sourceId: string,
  publisher: string,
  sourceUrl: string,
  sourceType: "official_api" | "official_document" | "public_library" | "client_data" | "licensed_report",
  jurisdiction?: string,
  market?: string,
  industry?: string,
  language?: "ar" | "en",
  licenseStatus: "approved" | "restricted" | "unknown",
  observedAt: string,
  freshnessPolicy: "daily" | "weekly" | "monthly" | "on_demand",
  limitations: string[],
  version: string
}
```

#### `Claim`

```ts
{
  claimId: string,
  text: string,
  type: "fact" | "inference" | "directional_hypothesis" | "recommendation",
  evidenceIds: string[],
  market: string,
  industry: string,
  confidence: number,
  status: "evidence_backed" | "directional" | "unavailable" | "rejected",
  createdAt: string,
  validUntil?: string
}
```

#### `MarketEvidenceSnapshot`

```ts
{
  snapshotId: string,
  market: "EG" | "SA" | "AE" | "GCC",
  industry: string,
  currency: "EGP" | "SAR" | "USD",
  capturedAt: string,
  freshnessStatus: "fresh" | "stale" | "expired" | "missing",
  facts: MarketFact[],
  competitorObservations: CompetitorObservation[],
  keywordSignals: KeywordSignal[],
  seasonalitySignals: SeasonalitySignal[],
  unknowns: string[],
  contradictions: string[],
  sourceIds: string[],
  confidence: number
}
```

### 10.4 البوابات

| البوابة | وظيفتها |
|---|---|
| Grounding Gate | تمنع claim خارجيًا لا تدعمه evidence مناسبة |
| Citation Gate | تفرض source IDs للـclaims المهمة |
| Freshness Gate | تمنع استخدام snapshot منتهي أو تخفض حالته |
| Contradiction Gate | تكشف تعارض المصادر ولا تسمح لـAI باختيار قيمة اعتباطية |
| Industry Relevance Gate | تتأكد من مطابقة الدليل للصناعة والسوق واللغة |
| Canonical Safety Gate | تمنع تغيير قرارات CDKS أو readiness أو blueprint-only |

---

## 11. خارطة الطريق التفصيلية التي يجب تنفيذها من الآن

### المرحلة 0: تثبيت baseline

نحتفظ بنتائج parity الحالية، ونضيف اختبار عدم تراجع يمنع خفض `26/26 full` أو كسر envelope v5 أو السماح بإجراءات خارجية.

**مخرج المرحلة:** baseline رسمي قابل للمقارنة.

### المرحلة 1: Knowledge Contracts

إنشاء schemas وtypes وfixtures لـ`IndustryProfile` و`SourceRecord` و`Claim` و`MarketEvidenceSnapshot` و`EvidencePackage`. يجب أن تكون الإضافة additive، مع عدم كسر fixtures v3/v5 الحالية.

**اختبارات القبول:** parse، رفض رقم بلا مصدر، حالات `unavailable` و`not_applicable`، ودعم الأسواق والعملات واللغتين.

### المرحلة 2: Source Registry وstructured store

إنشاء جداول أو طبقة repository تحفظ المصدر والنطاق والترخيص والتحديث والنسخة والقيود. يبدأ التنفيذ بقاعدة محلية أو adapter قابل للاستبدال، ثم PostgreSQL/pgvector في البيئة السحابية.

**اختبارات القبول:** source lookup، versioning، freshness calculation، وإعادة بناء snapshot سابق.

### المرحلة 3: Industry Profiles

اختيار صناعتين أو ثلاثًا للدفعة الأولى، ثم بناء profiles versioned للفروع ذات الأولوية. يجب أن يتضمن profile دورة الشراء والشرائح والاعتراضات والعرض وKPIs والامتثال والقنوات والمصطلحات.

**اختبارات القبول:** industry match، unmatched، branch differences، وعدم استخدام profile لصناعة أخرى دون تطابق.

### المرحلة 4: Evidence Package وgates

بناء حزمة أدلة موحدة، وتشغيل Grounding/Citation/Freshness/Contradiction Gates على بيانات mock أو snapshots موثقة دون AI حي.

**اختبارات القبول:** claim مدعوم، claim بلا مصدر، snapshot متقادم، مصدران متعارضان، ومعلومة unavailable.

### المرحلة 5: Official Connectors

التنفيذ المرحلي:

1. وثائق المنصات الرسمية؛
2. Meta Ad Library للملاحظات الإبداعية والعروض والأنماط، لا لإثبات ROAS؛
3. Google Keyword Planning للكلمات والمؤشرات ضمن نطاقها؛
4. TikTok Creative Center للاتجاهات والأمثلة؛
5. مصادر حكومية وإحصائية ومرخصة.

كل connector يحتاج caching، rate limiting، retries، raw snapshots، normalization، source metadata، ومراقبة الفشل.

### المرحلة 6: Evidence-aware CDKS

تعديل CDKS لاستقبال `EvidencePackage` منفصلًا عن Wizard input. الأدلة قد تثري `market_context` و`platform_guides` و`creative_strategy` والرسائل والاختبارات، لكنها لا تتجاوز قرارات الهدف والجاهزية والامتثال.

### المرحلة 7: Grounded Strategy وReasoning citations

تمرير الحزمة إلى Strategy Builder ليقترح فقط، وإلى Reasoning Builder لشرح مصدر كل claim. لا تغيير في `data.blueprint` إلا عبر CDKS re-run، ولا benchmark بلا مصدر.

### المرحلة 8: Evaluation وdrift

قياس citation coverage، freshness compliance، industry relevance، unsupported numeric claims، source scope violations، contradiction count، وثبات canonical decisions عند تبديل مزود AI.

### المرحلة 9: Client UX

إظهار `system_validated` و`evidence_backed` و`directional_hypothesis` و`stale` و`unavailable` و`rejected` في الـBlueprint، بحيث لا يحتاج العميل إلى مراجعة يدوية روتينية لكنه يستطيع فتح المصدر والسبب عند الحاجة.

---

## 12. ما يحتاجه صاحب المشروع قبل البدء

لا يحتاج صاحب المشروع إلى إرسال API keys في المحادثة. المطلوب حاليًا:

1. اختيار صناعتين أو ثلاثًا للدفعة الأولى.
2. تحديد الأسواق الأولى بدقة، مثل مصر والسعودية والإمارات أو غيرها.
3. تحديد هل تحليل المنافسين سيكون بأسماء/domains محددة أم على مستوى فئة سوقية عامة.
4. تحديد freshness المطلوب: يومي، أسبوعي، شهري، أو عند الطلب.
5. تحديد أي تقارير أو PDFs أو playbooks داخلية يملك المشروع حق استخدامها.
6. تحديد connector الأول المراد تفعيله بعد اكتمال العقود.
7. إبقاء المفاتيح في `.env.local` أو secret store فقط.

يمكن تنفيذ Knowledge Contracts وSource Registry وgates وmock evidence دون أي مفاتيح أو مزودي AI أحياء.

---

## 13. قواعد لا يجوز خرقها في المحادثة الجديدة

1. لا تشغيل مزود AI حي أثناء بناء العقود أو الاختبارات الحتمية إلا بطلب واضح وضمن fixtures مجهلة.
2. لا benchmark أو CPC أو CVR أو saturation كحقيقة بلا مصدر موثق ومؤرخ ومحدد السوق والعملة.
3. لا تعديل مباشر من AI على `data.blueprint` أو قرارات CDKS.
4. لا نشر حملات ولا إنفاق ميزانية ولا external actions في مرحلة Blueprint-only.
5. لا حذف legacy أو تغيير contract version دون migration واختبارات regression.
6. لا استخدام معلومات خارج نطاق المصدر أو خارج ترخيصه.
7. لا إرسال secrets أو بيانات شخصية أو بيانات إنتاجية غير مجهلة إلى Git أو المحادثة.
8. كل تغيير منطقي يجب أن يتبعه TypeScript/build والاختبارات المناسبة.
9. كل مجموعة تغييرات مكتملة يجب أن تُراجع وتُرفع إلى GitHub في commit واضح.
10. يجب إبقاء اختبارات parity كحاجز دائم؛ نجاح Knowledge Layer لا يبرر تراجع `26/26 full`.

---

## 14. تعريف النجاح النهائي

لا نعتبر المرحلة الجديدة مكتملة عند وجود قاعدة بيانات أو API فقط. النجاح يتطلب:

- وجود knowledge contracts versioned؛
- مصدر مسجل لكل evidence؛
- freshness وlicense وscope metadata؛
- Industry Profile مطابق للسوق والصناعة؛
- Evidence Package قابل لإعادة الإنتاج؛
- رفض claims غير المسندة؛
- تمييز fact عن inference عن hypothesis؛
- ربط reasoning بالمصادر؛
- عدم تغيير CDKS لقراره بسبب AI وحده؛
- استمرار جميع اختبارات parity والجودة؛
- وضوح حالات الثقة في واجهة العميل؛
- عدم تنفيذ نشر أو إنفاق دون مسار اعتماد وإجراء خارجي منفصل.

والصياغة الصحيحة للحالة المستقبلية هي:

> **CDKS-validated, evidence-backed strategic blueprint with explicit limitations.**

ولا نستخدم `Market-Validated` إلا بعد وجود مصادر سوقية فعلية مناسبة واجتياز بوابات freshness وgrounding وcitation والتقييم.

---

## 15. الملفات الأساسية للمراجعة عند بدء المحادثة الجديدة

| المسار | سبب القراءة |
|---|---|
| `src/lib/orchestrator/cdks-engine.ts` | المحرك الحتمي ومولد الأقسام |
| `src/lib/contracts/canonical-blueprint.ts` | عقد الـBlueprint الحالي |
| `src/lib/contracts/blueprint-contract-v3.ts` | عقد envelope وطبقتي AI |
| `src/app/api/generate/v5/route.ts` | دورة التوليد v5 |
| `src/lib/ai-strategy-builder.ts` | Strategy Builder وحدود سلطته |
| `src/lib/ai-reasoning-builder.ts` | Reasoning Builder وحدود سلطته |
| `src/app/blueprint/page.tsx` | renderers وReasoning Dashboard |
| `scripts/quality-reference-coverage-gate.cjs` | Coverage Gate |
| `scripts/reference-parity-enterprise-regression.cjs` | 260 Enterprise assertions |
| `scripts/reference-parity-semantic-regression.cjs` | semantic regression |
| `scripts/ai-layer-impact-audit.ts` | AI governance audit |
| `scripts/provider-fallback-regression.ts` | 429 → Mistral fallback |
| `docs/reference-parity-manifest.json` | parity leaves وassertions |
| `docs/REFERENCE_PARITY_ENTERPRISE_ASSERTIONS.md` | نطاق اختبارات Enterprise |
| `QUALITY_REFERENCE_COVERAGE_GATE.md` | آخر تقرير جودة |
| `tests/results/AI_LAYER_IMPACT_AUDIT_REPORT.md` | إثبات عدم التأثير على canonical |
| `docs/KNOWLEDGE_LAYER_IMPLEMENTATION_REQUIREMENTS.md` | متطلبات المرحلة الجديدة |
| `docs/BLUEPRINT_PARITY_AND_KNOWLEDGE_LAYER_ROADMAP_UPDATED.md` | خطة الانتقال المحدثة |

---

## 16. تعليمات جاهزة لبدء المحادثة الجديدة

يمكن استخدام النص التالي في أول رسالة:

> هذا هو مشروع Campaign Builder AI / CDKS في مستودع `wizard-temp`. اقرأ أولًا الملف المرفق `docs/CDKS_CONVERSATION_HANDOFF_TO_KNOWLEDGE_LAYER.md`، ثم راجع `docs/KNOWLEDGE_LAYER_IMPLEMENTATION_REQUIREMENTS.md` و`docs/BLUEPRINT_PARITY_AND_KNOWLEDGE_LAYER_ROADMAP_UPDATED.md` و`docs/ai-context.md` والملفات التنفيذية المشار إليها.
>
> الحالة الحالية: Blueprint parity مكتمل `26/26 full`، Golden HTTP `10/10`، Semantic regression `10/10`، Enterprise assertions `260/260`، UI renderers `26/26`. طبقتا Strategy Builder وReasoning Builder موجودتان وتعملان كطبقتين اقتراح/تفسير فقط، ولا تعدلان Canonical Blueprint.
>
> المطلوب الآن هو بدء المرحلة الجديدة من **Knowledge Layer وMarket Intelligence**، بدءًا بـKnowledge Contracts ثم Source Registry وEvidence Package وIndustry Profiles، دون تشغيل AI حي، ودون Fine-tuning، ودون تعديل سلطة CDKS أو كسر Blueprint-only.
>
> لا تعلن أن النظام Market-Validated قبل وجود مصادر سوقية رسمية موثقة ومؤرخة. لا تخترع benchmarks أو CPC أو saturation. عند غياب المصدر استخدم `unavailable` مع السبب. افحص git status والـcommits والاختبارات قبل أي تعديل، وكل commit مكتمل يجب رفعه إلى GitHub.

---

## 17. المراجع الداخلية والخارجية

### المراجع الداخلية

- `docs/ملف المرجع الشامل – مشروع CDKS.md` — المرجع التاريخي للتصميم الأولي والمشكلات المبكرة.
- `docs/REFERENCE_PARITY_MANIFEST.md` و`docs/reference-parity-manifest.json` — معيار التكافؤ.
- `docs/REFERENCE_PARITY_ENTERPRISE_ASSERTIONS.md` — مصفوفة الفحوص Enterprise.
- `QUALITY_REFERENCE_COVERAGE_GATE.md` — تقرير البوابة الأخير.
- `docs/KNOWLEDGE_LAYER_IMPLEMENTATION_REQUIREMENTS.md` — متطلبات طبقة المعرفة ومصادر البيانات.
- `docs/BLUEPRINT_PARITY_AND_KNOWLEDGE_LAYER_ROADMAP_UPDATED.md` — الخطة المحدثة بعد إغلاق parity.

### مصادر Knowledge Layer المخطط لها

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [Meta Ad Library Tools](https://transparency.meta.com/researchtools/ad-library-tools/)
- [Google Ads API Keyword Planning](https://developers.google.com/google-ads/api/docs/keyword-planning/overview)
- [TikTok Creative Center](https://ads.tiktok.com/resources/help/article/creative-center?lang=en)

هذه المصادر لا تعطي جميعها النوع نفسه من الأدلة. Meta/TikTok يساعدان في الملاحظات الإبداعية والعامة، Google يساعد في إشارات الكلمات، والوثائق الرسمية تساعد في السياسات والمتطلبات. لا يجوز تحويل أي مصدر منها تلقائيًا إلى أداء مالي أو benchmark عام خارج نطاقه.

---

## 18. الخلاصة النهائية

تم إنجاز الأساس الحتمي والـBlueprint parity وطبقتي AI المحكومتين. المشكلة التي بقيت ليست نقصًا في عدد الحقول أو renderers، بل نقص طبقة معرفة سوقية موثقة ومحدثة. لذلك تكون الخطوة التالية الصحيحة هي بناء Knowledge Contracts وSource Registry وEvidence Package، ثم إضافة المصادر والبوابات تدريجيًا، مع الحفاظ على كل ما تم إنجازه كـbaseline غير قابل للكسر.

**نقطة البداية التنفيذية في المحادثة الجديدة:** `Knowledge Contract`، وليس Fine-tuning أو تشغيل API سوقي حي مباشرة.

---

**نهاية وثيقة نقل السياق**
