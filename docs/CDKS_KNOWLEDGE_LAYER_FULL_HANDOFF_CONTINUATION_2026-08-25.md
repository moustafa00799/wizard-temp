# تقرير التسليم الشامل — تكملة ملف المرجع الأول لمشروع CDKS وCampaign Builder AI

**الإصدار:** 1.0.0 — تكملة مرجعية بعد مرحلة Knowledge Layer وMarket Intelligence العامة
**تاريخ التقرير:** 25 أغسطس 2026
**المستودع:** `moustafa00799/wizard-temp`
**الفرع:** `main`
**آخر commit مؤكد:** `c8e19b7 docs: record payment marketplace coverage`
**الحالة:** النسخة المحلية و`origin/main` متطابقتان بعد `git fetch origin main`، ولا توجد commits محلية غير مرفوعة أو commits على GitHub غير موجودة محليًا.
**العلاقة بالملف السابق:** هذه الوثيقة تكمل ملف `docs/ملف المرجع الشامل – مشروع CDKS.md` وملف `docs/CDKS_CONVERSATION_HANDOFF_TO_KNOWLEDGE_LAYER.md`. لا تستبدل التاريخ السابق ولا تعيد تفسيره كحالة حالية؛ بل تضيف ما تم بعده وتوضح ما بقي.

---

## 1. تعليمات استخدام هذا الملف مع نموذج ذكاء اصطناعي آخر

يجب على أي نموذج أو مطور يستلم هذا الملف أن يتعامل معه باعتباره **سجل استئناف تنفيذي** وليس وصفًا تسويقيًا. يبدأ العمل من المستودع الفعلي، لا من أرقام قديمة داخل وثائق سابقة، وذلك بقراءة هذا الملف ثم التحقق من `git status` و`git log` و`origin/main` وملفات الحالة المولدة.

يجب ترتيب مصادر الحقيقة عند حدوث تعارض بينها على النحو التالي: الكود والاختبارات الحالية، ثم artifacts والـmanifests المولدة، ثم أحدث commit على `origin/main`، ثم وثائق المرحلة الحالية، ثم وثائق التسليم السابقة باعتبارها سجلًا تاريخيًا. لا يجوز اعتبار أي رقم أو ادعاء وارد في هذه الوثيقة صالحًا إذا خالف artifact أو regression حديثًا.

### 1.1 أوامر البدء الإلزامية

```bash
gh repo clone moustafa00799/wizard-temp
cd wizard-temp
npm ci
git fetch origin main
git status --short --branch
git log --oneline --decorate -25
npm run test:knowledge:contracts
npm run test:knowledge:evidence
npm run test:knowledge:public-ingestion
npm run test:knowledge:public-evidence
npm run test:knowledge:public-quality
```

إذا كان المستودع موجودًا محليًا بالفعل، لا تستخدم `git reset --hard` ولا `git clean -fd`. نفّذ `git pull --ff-only origin main` فقط إذا كانت الحالة المحلية نظيفة من التعديلات المتعمدة. يجب الحفاظ على الملفات الشخصية والعربية وملفات raw المحلية، حتى لو ظهرت `untracked`.

### 1.2 القواعد التي لا يجوز للنموذج التالي كسرها

> **CDKS يقرر، Strategy Builder يقترح، Reasoning يفسر، والإنسان يعتمد عند الإجراء الخارجي.**

تبقى `CanonicalBlueprint` وقرارات `objective` و`funnel` و`channels` و`readiness` و`budget` و`launch` تحت سلطة CDKS والقواعد الحتمية. لا يجوز لطبقة Knowledge أو أي مزود AI أن يكتب مباشرة في `data.blueprint` أو أن يرفع الجاهزية أو أن يفتح صلاحية نشر أو إنفاق.

وتظل القيم التالية ثابتة ما لم يصدر قرار تصميمي موثق مع migration واختبارات جديدة:

| الحاجز | القيمة الحالية |
|---|---|
| `generation_mode` | `blueprint_only` |
| `external_actions_allowed` | `false` |
| `budget_spend_allowed` | `false` |
| `globalMarketValidated` | `false` دائمًا في هذه المرحلة |
| Fine-tuning | مؤجل وغير مطلوب لإكمال العمل الحالي |
| البيانات الحساسة | لا تُرسل إلى المحادثة أو Git أو مزود AI |
| AI | اختياري واستشاري، ولا يغير Canonical Blueprint |
| عمليات منصات الإعلانات | قراءة فقط؛ لا create/edit/delete/publish/budget/bid/audience/catalog |

---

## 2. الغرض النهائي للمشروع

Campaign Builder AI / CDKS منصة ذكية لبناء وإدارة الاستراتيجيات الإعلانية. يبدأ العميل من Wizard تفاعلي يصف النشاط والعرض والسوق والهدف والتحويل والجمهور والقنوات والتتبع والقيود. يحول CDKS هذه المدخلات إلى قرارات حتمية وCampaign Blueprint منظم، ثم يمكنه عرض توصية استراتيجية وتفسير Reasoning اختياريين.

الهدف ليس إنتاج JSON صغير أو نص إعلاني عام، بل بناء مخرج يضم الملخص التنفيذي، الهدف، الـfunnel، القنوات، تحليل الجمهور، استراتيجية الإبداع، هيكل الحملات والجماهير، توزيع الميزانية، التتبع، خطة الإطلاق، العرض، المخاطر، الامتثال، الاختبارات، القياس، السياق السوقي، provenance، telemetry، والتحذيرات.

أضيفت Knowledge Layer لأن CDKS، رغم قوته في الاتساق والقواعد، لا يمثل تلقائيًا حقيقة السوق أو الطلب أو CPC أو أداء المنافسين. Knowledge Layer تضيف مصادر ولقطات مؤرخة وقيودًا وحالات `limited` و`directional` و`unavailable`، ولا تستبدل CDKS ولا تحول كل رقم عام إلى benchmark إعلاني [1].

---

## 3. ملخص الحالة الحالية في لحظة التسليم

أغلقت المحادثة الحالية جولة جمع عامة واسعة لمصر والسعودية ولثلاث صناعات ذات أولوية: `ecommerce_general` و`education_general` و`local_service_general`. تم دمج CBE وSAMA ووزارة التخطيط وNafeza وNoon وAmazon ومتاجر التطبيقات، إضافة إلى المصادر العامة التي سبقتها الجولة مثل World Bank وUNESCO وUNCTAD وUNdata وCAPMAS وDataSaudi وGASTAT وKAPSARC وGoogle Trends وITU.

الحالة الرقمية الحالية المولدة من `public-knowledge-quality-report-2026-08-25.json` هي: **53 مصدرًا مسجلًا، 22 artifact سياقيًا عامًا، 3 Evidence Packages عربية محدودة، و0 حزمة جاهزة، مع `globalMarketValidated=false`**. بوابة الجودة في آخر بناء هي `PASS`، لكن بوابة Market Validation هي `BLOCKED_BY_INCOMPLETE_COVERAGE` [2].

| المجال | الحالة الحالية |
|---|---|
| Blueprint parity | مكتمل: 26/26 renderer و0 partial و0 missing في آخر baseline موثق |
| Golden HTTP | 10/10 PASS |
| Semantic regression | 10/10 PASS |
| Enterprise assertions | 260/260 PASS |
| Knowledge Contracts | مدمجة بإصدار 1.0 ومختبرة |
| Source Registry | 53 سجلًا، مع scope وlicense وfreshness وlimitations |
| Public context artifacts | 22 artifactًا مع raw/derived provenance وhashes |
| Evidence Packages العامة | 3 حزم عربية، كلها `limited` و`fresh` |
| Scoped Strategy Context | موجود ومقيد؛ لا يرفع `globalMarketValidated` |
| Database foundation | SQLite تجريبية، migrations وrepositories واختبار idempotency والعزل |
| Personal Staging | بيئة شخصية لمحاكاة العميل واختبار Wizard وStrategy Context |
| AI advisory | اختياري، governed، ولا يغير canonical output |
| Production hosting | غير منفذ؛ لا MySQL/TiDB/Object Storage أو jobs إنتاجية حتى الآن |
| Live public connectors | الجولة الحالية قراءة عامة فقط؛ Meta مؤجل عمدًا إلى النهاية |
| Market-Validated | غير معلن وممنوع إعلانه حاليًا |

---

## 4. التسلسل التاريخي الكامل للمراحل والقرارات

### 4.1 المرحلة الأصلية: بناء CDKS وBlueprint

بدأ المشروع بفصل القرار الاستراتيجي عن العرض النهائي. كان المطلوب تحويل `CanonicalWizardInput` الذي يضم 41 حقلًا إلى Blueprint غني يمكن اختباره دلاليًا. بُنيت سياسات مستقلة للهدف والـfunnel والقنوات وجاهزية الإطلاق، ثم جمعها `src/lib/orchestrator/cdks-engine.ts` داخل Canonical Blueprint متوافق مع Zod.

أدى ذلك إلى تثبيت الفرق بين المدخلات والقرار canonical والاقتراح الاستراتيجي والتفسير. لم يعد AI هو مصدر الحقيقة الوحيد، ولم تعد الواجهة تعتمد على مخرج غير منظم.

### 4.2 مرحلة تكافؤ المراجع

كانت هناك مرحلة قديمة يظهر فيها baseline يحتوي 6 أقسام كاملة و12 جزئية و8 مفقودة. اتضح لاحقًا أن جزءًا معتبرًا من ذلك كان `false missing` ناتجًا عن اختلاف paths وwrappers وmapping، وليس غيابًا فعليًا في القرار.

تم إصلاح خريطة التغطية والـwrappers، وإنشاء renderers للأقسام، وتوحيد canonical paths، وإضافة `audience_analysis` و`creative_strategy` و`tracking_assessment` و`recommended_funnel` و`launch_plan` و`budget_management` و`budget_split` و`testing` و`market_context` و`compliance` و`technical_audit` و`offer_strategy` و`tracking_checklist` و`telemetry` وغيرها. النتيجة المثبتة أصبحت 26/26 full بدل التعامل مع baseline القديم كأنه الحالة الحالية.

### 4.3 مرحلة AI متعدد المزودين ثم إعادة الحوكمة

ناقشت المحادثة نماذج متعددة وأخطاء نماذج قديمة، ثم استقر التشغيل الحالي على ترتيب إداري مختلف عن الوصف التاريخي القديم:

| الدور | المزود الرئيسي الحالي | fallback أو الاستخدام البديل | النموذج القابل للضبط |
|---|---|---|---|
| Strategy Builder | Groq | Mistral عند timeout أو rate limit أو network/5xx القابل لإعادة المحاولة | `openai/gpt-oss-120b` ثم `mistral-small-latest` |
| AI Reasoning | Groq | Mistral للمسار نفسه | `openai/gpt-oss-120b` ثم `mistral-small-latest` |
| Benchmark | Gemini | ليس fallback تلقائيًا لرحلة العميل | `gemini-3.6-flash` |

المقصود هو **Groq** وليس Grok. أما أسماء DeepSeek/Qwen/GLM وGemini 2.5 Flash الواردة في ملف المرجع الأول فهي تاريخية أو مرتبطة بمرحلة سابقة، ولا يجوز استخدامها كإعداد حالي دون فحص الكود و`.env.local`.

أصبح AI اختياريًا أمام العميل بمفتاح واحد: **هل تريد استخدام AI الاستشاري؟**. عند الإيقاف لا تُرسل طلبات AI. عند التشغيل لا يكفي consent وحده؛ يجب أن يكون الخادم مفعّلًا في وضع Non-Production وأن تمر البيانات عبر `sanitizeWizardInputForAI`، ثم تتحقق الخوادم من الـschema والحواجز قبل العرض [3].

يعمل Strategy Builder وReasoning بعد بناء CDKS للـBlueprint الأساسي. يكتبان في `data.strategy` و`data.reasoning` فقط. لا يمكنهما تغيير objective أو funnel أو channels أو readiness أو budget أو launch، ولا يمكنهما إنشاء claim خارجي بلا provenance.

### 4.4 مرحلة قاعدة البيانات والاختبار كعميل

بسبب رغبة المستخدم في رؤية المشروع كعميل قبل الإنتاج، أضيفت Personal Staging فوق SQLite. الغرض هو محاكاة Workspace شخصية، تخزين brief وWizard submission وBlueprint وKnowledge Snapshot وEvidence Package وStrategy Context وRecommendation، ثم فحص العزل والاستمرارية والـrollback والحواجز [4].

قاعدة البيانات الحالية تجريبية قابلة للنقل، وليست قاعدة إنتاج نهائية. تستخدم `node:sqlite` وmigration `0001_database_foundation.ts` وrepositories، وتحتوي على كيانات للعزل، brief، blueprint، knowledge، evidence، strategy، provider state، sync cursors، approvals، وaudit events. كل كيان تشغيلي مرتبط بـ`workspace_id` أو كيان يحمل هذا الحقل، مع foreign keys وقيود حذف محافظة.

أضيفت مجموعة الحالات العشر السابقة إلى autofill وrandomized regression. أصبح التشغيل المحلي الأخير الذي تم تنفيذه في هذه المحادثة يستخدم 10 حالات × 10 variants = **100 تشغيل**، كلها PASS، مع seed ثابت `20260825` في الأمر الذي شُغل هنا. البيئة لا تعني multi-user production أو OAuth renewal أو rate limits حقيقية أو حملًا كبيرًا.

### 4.5 مرحلة Knowledge Layer Contracts وRegistry

تمت إضافة `src/lib/contracts/knowledge/knowledge-contracts.ts` بإصدار `1.0`. تغطي العقود:

| العقد | الوظيفة |
|---|---|
| `SourceRecord` | تعريف الناشر والرابط والنوع والنطاق والترخيص والحداثة والقيود |
| `MarketFact` | حقيقة أو قيمة سياقية مع status وsource IDs وscope ووقت الالتقاط |
| `CompetitorObservation` | ملاحظة إبداعية أو عرضية أو وجود قناة، لا أداء منافس مفترض |
| `KeywordSignal` | إشارة بحث اتجاهية أو غير متاحة |
| `SeasonalitySignal` | موسمية موثقة أو غير متاحة |
| `Claim` | fact أو inference أو directional hypothesis أو recommendation مع evidence IDs |
| `IndustryProfile` | دورة الشراء والعروض والشرائح والاعتراضات وKPIs والقنوات والامتثال |
| `MarketEvidenceSnapshot` | لقطة مؤرخة لسوق وصناعة ولغة وعملة محددة |
| `EvidencePackage` | حزمة مرتبطة بالمصادر واللقطات والclaims والقيود |

يمنع العقد fact أو inference من إعلان `evidence_backed` دون evidence IDs. ويجبر `unavailable` على `value: null` وسبب صريح. كما يمنع snapshot متناقضًا من إعلان `fresh`، ويمنع الحزمة المفقودة من إعلان `ready`.

### 4.6 Industry Profiles ذات الأولوية

تمت إضافة profile مستقل للتعليم إلى جانب profiles للفروع الأساسية. النطاقات المنطقية الحالية هي:

- `ecommerce_general`: شراء منتج أو مجموعة منتجات، مع التركيز على العرض، السعر، المخزون، الشحن، الإرجاع، الدفع، والـpurchase tracking.
- `education_general`: وعي بالحاجة ثم مقارنة ثم تسجيل/تقديم ثم حضور أو إكمال ثم إحالة. لا يجوز افتراض قبول أو توظيف أو دخل أو نتيجة تعليمية بلا substantiation.
- `local_service_general`: lead ثم qualified lead ثم booking ثم show-up ثم completed service، مع فصل المكالمة والنموذج والحجز والإيراد.
- `app` و`b2b`: profiles أولية قابلة للتوسع، لكنهما خارج الأولوية العامة الحالية.

ملف التعليم يظل `draft` و`sourceIds=[]` عندما يتعلق الأمر بقاعدة الصناعة نفسها. وجود أرقام تعليم رسمي في مصر أو السعودية لا يجعل الطلب على الدورات الخاصة أو الإلكترونية مثبتًا.

### 4.7 الربط المقيد بين Knowledge وStrategy

أضيفت `ScopedStrategyContext` و`ScopedStrategySelection` لتوفير نسخة قراءة فقط من Snapshot مؤكد النطاق. التدفق الحالي هو:

```text
CanonicalWizardInput
  + CDKS Engine
  → CanonicalBlueprint
  + Scoped Market Evidence Selection
  → ScopedStrategyContext
  → Deterministic StrategyRecommendation / optional AI proposal
  → Human review
  → CDKS rerun فقط إذا تغير input أو حدث قرار معتمد
```

توجد ثلاثة نطاقات تجريبية في وثيقة السياق المقيد تحمل قرار `market_validated` محليًا: `SA/ecommerce_general` و`EG/education` و`SA/education`. هذا **تحقق scoped تجريبي** لا يساوي Market Validation عالميًا ولا يثبت CPC أو CPA أو CVR أو ROAS أو saturation. يجب عدم خلطه مع الوضع الحالي للحزم العامة، التي ما زالت `limited` وتغطي ثلاثة نطاقات مختلفة كما هو موضح في قسم الحزم أدناه [5].

### 4.8 الجولة العامة الموسعة الأخيرة

بعد اختيار مصر والسعودية والصناعات الثلاث، جرى ترتيب المصادر العامة قبل Meta. تم جمع وتطبيع مصادر مؤسسية وإحصائية وأسواق عامة، مع إيقاف آمن عند الحجب أو CAPTCHA أو 429. لم يتم تجاوز حماية أو تنفيذ عملية تسجيل دخول أو شراء أو نشر.

أضيفت في آخر commitين:

| Commit | ما تم تنفيذه |
|---|---|
| `af07147` | CBE/SAMA والبدائل المصرية وNoon/Amazon ومتاجر التطبيقات، مع registry وmanifest والحزم والاختبارات |
| `c8e19b7` | تحديث تقرير التغطية والمراجع والقيود والفجوات |

---

## 5. الحالة التقنية الحالية ومسارات الملفات

### 5.1 مكونات CDKS الأساسية

| المسار | الدور |
|---|---|
| `src/lib/contracts/wizard-input.ts` | `CanonicalWizardInput` وحقول الـWizard الموحدة |
| `src/lib/contracts/canonical-blueprint.ts` | العقد النهائي للـBlueprint |
| `src/lib/policies/objectivePolicy.ts` | قرار الهدف |
| `src/lib/policies/funnelPolicy.ts` | قرار الـfunnel |
| `src/lib/policies/channelPolicy.ts` | قرار القنوات |
| `src/lib/policies/launchReadinessPolicy.ts` | قرار readiness |
| `src/lib/orchestrator/cdks-engine.ts` | orchestrator الحتمي |
| `src/app/api/generate/v5/route.ts` | مسار API v5 |
| `src/app/wizard/` | Wizard وreview وconsent |
| `src/app/blueprint/` | عرض Blueprint وrenderers |

### 5.2 مكونات AI

| المسار | الدور |
|---|---|
| `src/lib/ai-strategy-builder.ts` | اقتراح استراتيجية لا يكتب canonical |
| `src/lib/ai-reasoning-builder.ts` | تفسير قرارات CDKS |
| `src/lib/ai-reasoning-provider.ts` | provider abstraction وnormalized output |
| `src/lib/contracts/blueprint-contract-v3.ts` | عقد envelope v5/v3 المتعلق بالـBlueprint |
| `scripts/ai-reasoning-live-regression.ts` | فحص contract/fallback/fail-closed بمزود تجريبي؛ لا يعني أنه اتصال إنترنت حي |
| `scripts/provider-fallback-regression.ts` | fallback و429/error classification |
| `scripts/provider-schema-regression.ts` | wire schema والتحقق المحلي |
| `scripts/api-client-ai-optin-regression.ts` | consent وopt-in |

### 5.3 مكونات Knowledge وpublic ingestion

| المسار | الدور |
|---|---|
| `src/lib/contracts/knowledge/knowledge-contracts.ts` | عقود Knowledge v1.0 |
| `src/lib/knowledge/source-registry.ts` | lookup وscope وfreshness وassertUsable |
| `scripts/build_public_source_record_additions.py` | بناء Source Records العامة الإضافية |
| `scripts/merge_public_source_registry.py` | دمج registry الأصلية والإضافات حتميًا |
| `scripts/build_public_payment_and_marketplace_context.py` | توليد CBE/SAMA ومصر والمتاجر والتطبيقات من captures المنظمة |
| `scripts/rebuild_public_knowledge_manifest.py` | إعادة بناء manifest وhashes |
| `scripts/build_public_evidence_packages.ts` | بناء الحزم العربية المحدودة |
| `scripts/public-knowledge-ingestion-regression.ts` | اختبار artifacts والـsource IDs والقيود |
| `scripts/public-evidence-package-regression.ts` | اختبار الحزم والـstatus والـunknowns |
| `scripts/public-knowledge-quality-report.ts` | تقرير hashes والتغطية والبوابات |

### 5.4 التخزين التجريبي

| المسار | الدور |
|---|---|
| `src/lib/db/migrations/0001_database_foundation.ts` | migration الأولى |
| `src/lib/db/database.ts` | فتح SQLite وتطبيق migrations |
| `src/lib/db/index.ts` | exports وrepositories |
| `.local/cdks-staging.sqlite` | قاعدة Staging الشخصية، خارج Git |
| `src/app/staging/` و`src/app/api/staging` | واجهة/API التجربة الشخصية |

### 5.5 متغيرات البيئة المعتمدة دون المفاتيح

الإعداد الذي استقر عليه النقاش هو Non-Production وAI اختياري، مع عدم إدراج المفاتيح في هذا الملف أو Git:

```env
AI_LIVE_ENABLED=true
AI_PROVIDER_MODE=nonprod
AI_DATA_POLICY=sanitized_wizard_only

AI_STRATEGY_PROVIDER=groq
AI_REASONING_PROVIDER=groq
AI_STRATEGY_FALLBACK_PROVIDER=mistral
AI_BENCHMARK_PROVIDER=gemini
AI_BENCHMARK_ENABLED=true

GROQ_STRATEGY_MODEL=openai/gpt-oss-120b
GROQ_REASONING_MODEL=openai/gpt-oss-120b
MISTRAL_STRATEGY_MODEL=mistral-small-latest
MISTRAL_REASONING_MODEL=mistral-small-latest
GEMINI_BENCHMARK_MODEL=gemini-3.6-flash

GROQ_AI_TIMEOUT_MS=15000
MISTRAL_AI_TIMEOUT_MS=30000
GEMINI_AI_TIMEOUT_MS=45000

# محليًا فقط — لا تضع القيم الحقيقية في المحادثة أو Git
GROQ_API_KEY=
MISTRAL_API_KEY=
GEMINI_API_KEY=

AI_BENCHMARK_MAX_CASES=1
AI_BENCHMARK_GROQ_INTERVAL_MS=20000
AI_BENCHMARK_MISTRAL_INTERVAL_MS=15000
AI_BENCHMARK_GEMINI_INTERVAL_MS=15000
AI_BENCHMARK_STOP_ON_RATE_LIMIT=true
AI_BENCHMARK_STOP_ON_NOT_FOUND=true
```

القيم الفعلية للمفاتيح يجب وضعها في `.env.local` أو Secret Manager. نجاح الاختبارات المحلية لا يثبت صلاحية مفتاح أو quota مزود خارجي، ولا ينبغي تشغيل Benchmark واسع قبل نجاح Smoke Test واحد.

---

## 6. طبقات Knowledge Layer وما تم إنجازه في كل طبقة

| الطبقة | المنفذ | ما زال ناقصًا |
|---|---|---|
| Taxonomy والنطاق | مصر/السعودية وثلاث صناعات أولوية مع مفاتيح canonical | مزيد من الصناعات الفرعية والمدن ومراجعة aliases |
| Contracts | Zod v1.0 للعقود الأساسية | إضافة migration فقط عند الحاجة لحقول جديدة |
| Source Registry | 53 مصدرًا، scopes وlicense وfreshness وlimitations | مراجعة تراخيص صريحة لبعض المصادر، وتفعيل مصادر جديدة عند تحققها |
| Public ingestion | World Bank وCAPMAS وTrends وUNESCO وUNCTAD وUNdata وDataSaudi وKAPSARC وCBE/SAMA وmarketplaces/apps | توسيع exact-scope مع مصادر industry-specific قابلة للتحقق |
| Evidence Packages | 3 حزم عربية `limited/fresh` | 3 نطاقات exact مفقودة وEnglish packages |
| Scoped Strategy Context | موجود ومقيد قراءة فقط | إدخال جميع الحزم public الحديثة بعد source-metric-scope review |
| Grounding/Citation/Freshness | موجود جزئيًا في العقود والـquality reports | gates مستقلة أقوى على كل claim وcontradiction handling |
| Evidence-aware CDKS | قرارات السياق التجريبية موجودة | دمج كامل داخل CDKS دون تغيير السلطة أو canonical paths |
| Strategy Builder grounding | توصيات مقيدة في context تجريبي | ربط كل proposal بclaims/evidence في الحزمة العامة |
| Reasoning citations | Reasoning governed ومطبع | إظهار source IDs وlimitations وfreshness في UX النهائي |
| Storage | SQLite foundation وmetadata | MySQL/TiDB وObject Storage وretention وbackup |
| Connectors | policy/collector scaffolding وقراءة عامة | OAuth/jobs/cursors والمصادر الرسمية عند تجهيز الصلاحيات |
| Evaluation | regression واسع | drift monitoring وتقارير دورية وalerts |
| Client UX | Blueprint وReasoning وStaging | evidence panels وconfidence badges وunavailable explanations |

---

## 7. مخرجات الجولة العامة والأدلة المنظمة

### 7.1 أعداد artifacts الحالية

الأعداد التالية مأخوذة من التقرير المولد، وهي أعداد ملاحظات منظمة وليست أحجام جمهور أو تقديرات سوق [2]:

| Artifact | عدد الملاحظات | الاستعمال الصحيح |
|---|---:|---|
| World Bank latest observations | 10 | population/internet/urbanization/literacy/GDP context |
| Google Trends snapshots | 4 | relative directional search interest فقط |
| CAPMAS education facts | 6 | عرض تعليمي تاريخي 2019/2020 |
| UNESCO UIS | 14 | تعليم رسمي ومشاركة/محو أمية وسياق supply |
| UNCTAD via World Bank Data360 | 87 | اقتصاد رقمي وتجارة خدمات رقمية ووجود الأعمال على الويب |
| UNdata | 479 | 11 جدولًا للسكان وGDP وGVA والتعليم والعمل وCPI والتجارة والإنترنت |
| DataSaudi/GASTAT education/digital/trade | 1,747 عبر artifacts متعددة | سياق سعودي رسمي وتعليم وتجارة؛ ليس benchmark إعلانيًا |
| KAPSARC/SAMA numeric POS artifacts | 109 + 2,992 + 44 + 32 | دفع إجمالي حسب القطاع/المدينة؛ ليس ecommerce-only demand |
| CBE | 2 | ملاحظات مؤسسية نوعية فقط |
| SAMA news-1139 | 5 | حقائق وطنية للدفع الإلكتروني وسياق payment ecosystem |
| SAMA interface/POS pages | 1 + 1 | وصف البنية ونطاق التقارير دون اختلاق صف رقمي |
| MPED | 1 | نطاق اكتشاف الحسابات القومية |
| Nafeza | 2 | معدلات تحويل جمركية بتاريخ محدد للتطبيع فقط |
| Noon/Amazon storefronts | 11 | عروض وأسعار وتقييمات ومخزون وبائعون على صفحات عامة |
| App Stores | 4 | تقييمات وتنزيلات وإصدارات بlocale متجر واضح |

الأرقام الكبيرة في DataSaudi/KAPSARC ناتجة عن صفوف وسلاسل متعددة، ولا تعني عدد عملاء أو حجم طلب. كل artifact يحتفظ بالمصدر والفترة والوحدة والـscope والـraw hash والقيود.

### 7.2 CBE — مصر

تمت قراءة صفحة CBE العامة الخاصة بأنظمة الدفع. سجل artifact أن الصفحة تصف RTGS، وgovernment-securities book-entry، وCheques Clearing House، وNational Switch/ATM، وACH، والإيداع المركزي للأوراق المالية، والخدمات المصرفية عبر الإنترنت والهاتف، ومدفوعات وتحصيل الحكومة والفواتير. كما تصف أهداف تطوير المدفوعات الإلكترونية والتشغيل البيني والمعايير وحماية المستهلك والحد من المخاطر.

هذه الملاحظات نوعية مؤسسية فقط. لم تقدم الصفحة سلسلة رقمية عن التجارة الإلكترونية أو المبيعات أو الجمهور، كما واجه مستخرج النص رفضًا رسميًا بينما أمكن قراءتها في المتصفح. لذلك لا يجوز استخدام CBE لإغلاق فجوة EG/ecommerce أو لاستخراج CPC أو conversion أو demand. المصدر والرصد محفوظان في `data/knowledge/public/cbe/2026-08-25/` [6].

### 7.3 SAMA — السعودية

خبر SAMA الرسمي المنشور في 12 أبريل 2026 يذكر أن المدفوعات الإلكترونية بلغت 85% من إجمالي مدفوعات التجزئة في 2025 مقابل 79% في 2024، وأن عدد المعاملات الإلكترونية بلغ 14.6 مليارًا في 2025 مقابل 12.6 مليارًا في 2024. احتُفظ بالقيم الأربع كما وردت، مع ملاحظة نوعية عن ذكر mada وPOS ومدفوعات التجارة الإلكترونية ضمن نمو نظام الدفع.

هذه أرقام وطنية لنظام الدفع وليست GMV للتجارة الإلكترونية ولا عدد طلبات منتجات ولا أداء إعلان. أُضيفت فقط كسياق `limited_external_evidence` إلى حزمة السعودية للتجارة الإلكترونية، وأصبحت هذه الحزمة 35 fact و6 مصادر، مع بقاء حالتها `limited` [7].

تصف صفحة SAMA أخرى واجهة مدفوعات التجارة الإلكترونية التي تدمج mada بالشبكات العالمية، وتستخدم مواصفات تقنية موحدة، وتسجيلًا مركزيًا، وحلول تمويل وtokenization. كما تذكر صفحة POS الأسبوعية وجود تقارير بحسب النشاط والمدينة وعدد وقيمة المعاملات والتغيرات الأسبوعية، لكن لم تُستخرج صفوف رقمية جديدة من تلك الصفحة [8] [9].

### 7.4 البدائل المصرية العامة

توضح صفحة وزارة التخطيط والتنمية الاقتصادية نطاق بيانات الحسابات القومية السنوية والفصلية، GDP حسب عناصر الإنفاق والأنشطة، النمو والاستثمارات، والحسابات الإقليمية حسب المحافظة والمنطقة. لم تُنسخ جداول تفاعلية رقمية من هذه الصفحة؛ لذلك artifact الخاص بها discovery/context وليس dataset رقميًا [10].

عرضت صفحة Nafeza معدلات تحويل جمركية في 24 فبراير 2026، منها 47.8800 EGP لكل USD و12.7646 EGP لكل SAR. هذه ليست أسعارًا استهلاكية أو توقعًا لسعر الصرف، وإنما قيم تطبيع جمركية يجب استخدامها فقط مع تاريخها وتسميتها [11].

تعذر استخدام `https://data.gov.eg/` وبوابة `https://egypt.opendataforafrica.org/` كـdatasets في هذه الجولة. ظهرت حالات error أو rejection/unsaved pages، فتم تسجيل المسار كـdiscovery/unavailable وعدم استبداله ببوابة طرف ثالث أو تخمين محتوى.

### 7.5 Noon وAmazon

في Noon مصر ظهرت فئة الهواتف مع فلاتر العلامة والسعر والتقييم وحالة المنتج والشبكة والذاكرة والرام والشاشة والبطارية والكاميرا والنظام والبائع. كما ظهرت صفحة Galaxy A17 بسعر 10,315 EGP وتقييم 4.5 من 2,652 تقييمًا ومخزون منخفض وبائع iQ وnoon-express، مع ترتيب #44 في Smartphones وBest Seller label.

في Noon السعودية أعادت صفحة الفئة نصًا غير مستقر، لكن الصفحة العامة أظهرت taxonomy واسعة مثل الهواتف واللابتوبات والجمال والأزياء والأجهزة والبقالة والألعاب والمنزل، مع deals وbestsellers وhighly-rated. صفحة Galaxy S25 Ultra أظهرت 3,298.95 SAR مقابل 3,559 SAR وخصم 7% وتقييم 4.5 من 6,830 تقييمًا، ومخزونًا منخفضًا وبائع H Store وnoon-express. هذه observations صفحة واحدة وليست متوسط سعر أو مبيعات أو حصة سوق [12] [13].

في Amazon مصر ظهرت شرائح merchandising مثل أقل من EGP 199 وأقل من EGP 499 ومن EGP 500 ومن EGP 999 ومراتب من EGP 935. محاولة صفحة منتج مصرية عادت CAPTCHA/interstitial؛ لم يتم تجاوزها ولم يُخترع سعر أو تقييم أو بائع. في Amazon السعودية أظهرت صفحة كابل Anker سعر 38.90 SAR مقابل 59 SAR، وتقييم 4.5 من 106,328 مراجعة، وFulfilled by Amazon، وبائع AnkerDirect SA، وRiyadh delivery context. كما ظهرت بطاقات توصية بمنتجات أخرى، وحُفظت كـpage-level recommendations لا كعينة سوق أو performance [14] [15].

### 7.6 متاجر التطبيقات

أظهر Google Play صفحة Noon بــ4.6/5 و50M+ downloads، مع 1.16M في رأس الصفحة و1.14M داخل قسم Ratings and reviews، وآخر تحديث ظاهر 24 أغسطس 2026. وأظهر Amazon Shopping بــ4.3/5 و1B+ downloads، مع 4.67M في الرأس و4.54M داخل القسم، وآخر تحديث ظاهر 16 يوليو 2026.

في Apple App Store الأمريكي ظهر Noon بتقييم 4.5 و326K Ratings وإصدار 4.260824، وAmazon بتقييم 4.8 و8.4M Ratings وإصدار 27.13.0. تم حفظ `storeLocale` صراحة (`en_US` أو `US`). لا يجوز تحويل هذه الأرقام إلى active users أو installs في مصر أو السعودية أو market share. كما لا يجوز حساب متوسط جديد من اختلاف عداد الرأس وعدّاد القسم [16] [17] [18] [19].

---

## 8. الحزم الحالية والتغطية

### 8.1 Evidence Packages العامة

| package | النطاق | الحالة | facts | sources | unknowns |
|---|---|---|---:|---:|---:|
| `pkg-eg-education-public-20260825` | `EG/education_general/ar/EGP` | `limited`, `fresh` | 36 | 5 | 14 |
| `pkg-sa-ecommerce-public-20260825` | `SA/ecommerce_general/ar/SAR` | `limited`, `fresh` | 35 | 6 | 14 |
| `pkg-eg-local-service-public-20260825` | `EG/local_service_general/ar/EGP` | `limited`, `fresh` | 19 | 5 | 14 |

### 8.2 التغطية الناقصة

من أصل ستة نطاقات مستهدفة، توجد حزم عامة محدودة لثلاثة فقط. النطاقات الناقصة هي:

1. `EG/ecommerce_general`؛
2. `SA/education_general`؛
3. `SA/local_service_general`.

كما لا توجد حزم exact باللغة الإنجليزية لأي من النطاقات. لا يجوز إنشاء هذه الحزم لمجرد وجود World Bank أو payment context أو صفحة متجر؛ يلزم source-metric-scope matrix واضحة، ومرجع مناسب للسوق والصناعة واللغة والعملة والفترة.

### 8.3 الفرق بين scoped validation وpublic packages

يجب الحفاظ على التمييز التالي عند قراءة الوثائق:

| النوع | الحالة |
|---|---|
| Scoped Strategy Context التجريبي | يملك قرارات محلية لبعض النطاقات مثل SA/ecommerce وEG/education وSA/education، ولا يرفع global status |
| Public Evidence Packages الحالية | ثلاث حزم محدودة مختلفة: EG/education وSA/ecommerce وEG/local_service |
| Market-Validated العالمي | غير موجود وممنوع إعلانه |
| Benchmarks إعلانية | غير متاحة؛ CPC وCPA وCVR وROAS وreach وfrequency وsaturation وcompetitor performance تبقى unavailable |

---

## 9. مصادر البيانات المستخدمة بالكامل

### 9.1 سجل المصادر العامة الحالي

هذه هي مجموعات الـ53 Source Records المدمجة في `data/knowledge/public/public-source-registry-2026-08-25.json`. كل سجل يحتوي على `sourceId` وpublisher وURL وsourceType وmarket/industry/language عند توفرها وlicenseStatus وobservedAt وfreshnessPolicy وlimitations وenabled.

| المجموعة | Source IDs والروابط |
|---|---|
| World Bank | `src-world-bank-egy-indicators-v2-20260825` — [Egypt API](https://api.worldbank.org/v2/country/EGY)؛ `src-world-bank-sau-indicators-v2-20260825` — [Saudi API](https://api.worldbank.org/v2/country/SAU) |
| CAPMAS | `src-capmas-central-data-catalog-20260825` — [Central Data Catalog](https://censusinfo.capmas.gov.eg/Metadata-en-v4.2/index.php/catalog/)؛ `src-capmas-education-bulletin-2019-2020` — [Education bulletin](https://censusinfo.capmas.gov.eg/Metadata-en-v4.2/index.php/catalog/777/download/2298)؛ `src-capmas-telecommunications-bulletin-2016-2017` — [Telecommunications bulletin](https://censusinfo.capmas.gov.eg/Metadata-en-v4.2/index.php/catalog/343/download/677) |
| Google Trends | `src-google-trends-eg-explore-20260825` و`src-google-trends-sa-explore-20260825` — [Google Trends](https://trends.google.com/trends/)؛ القيم نسبية directional وليست absolute volume |
| UNESCO وUNCTAD | `src-unesco-uis-egy-sau-education-20260825` — [UIS API documentation](https://api.uis.unesco.org/api/public/documentation/)؛ `src-unctad-digital-economy-egy-sau-20260825` — [UNCTAD Data360](https://data360.worldbank.org/en/dataset/UNCTAD_DE) |
| UNdata | `src-undata-statistical-yearbook-egy-sau-20260825` — [UNdata](https://data.un.org/)؛ `src-undata-population_and_density-egy-sau-20260825` — [Population, Surface Area and Density CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_1_202511_Population%2C%20Surface%20Area%20and%20Density.csv)؛ `src-undata-gdp_and_gdp_per_capita-egy-sau-20260825` — [GDP and GDP per Capita CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_230_202511_GDP%20and%20GDP%20Per%20Capita.csv)؛ `src-undata-gva_by_activity-egy-sau-20260825` — [GVA by Activity CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_153_202511_Gross%20Value%20Added%20by%20Economic%20Activity.csv)؛ `src-undata-education_enrollment-egy-sau-20260825` — [Education CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_309_202511_Education.csv)؛ `src-undata-teaching_staff-egy-sau-20260825` — [Teaching Staff CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_323_202511_Teaching%20Staff%20in%20education.csv)؛ `src-undata-education_ict_access-egy-sau-20260825` — [Education ICT CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_245_202511_Public%20expenditure%20on%20education%20and%20access%20to%20computers.csv)؛ `src-undata-labour_force_and_unemployment-egy-sau-20260825` — [Labour Force CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_329_202511_Labour%20Force%20and%20Unemployment.csv)؛ `src-undata-employment_by_activity-egy-sau-20260825` — [Employment CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_200_202511_Employment.csv)؛ `src-undata-consumer_price_index-egy-sau-20260825` — [CPI CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_128_202511_Consumer%20Price%20Index.csv)؛ `src-undata-trade_balance-egy-sau-20260825` — [Trade CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_123_202511_Total%20Imports%20Exports%20and%20Balance%20of%20Trade.csv)؛ `src-undata-internet_usage-egy-sau-20260825` — [Internet Usage CSV](https://data.un.org/_Docs/SYB/CSV/SYB68_314_202511_Internet%20Usage.csv)` |
| DataSaudi/GASTAT/SAMA | `src-gastat-datasaudi-digital-economy-gdp-sa-20260825` و`src-gastat-datasaudi-digital-establishment-usage-sa-20260825` — [Digital economy categories](https://www.stats.gov.sa/en/statistics-tabs/-/categories/122941?tab=436312&category=122941)؛ `src-gastat-datasaudi-foreign-trade-exports-20260825` و`src-gastat-datasaudi-foreign-trade-imports-20260825` — [Foreign trade categories](https://www.stats.gov.sa/en/statistics-tabs/-/categories/123481?tab=436312&category=123481)؛ `src-gastat-datasaudi-education-expenditure-sa-20260825` — [Education expenditure](https://www.stats.gov.sa/en/statistics-tabs?tab=436318&category=514986)؛ `src-sama-datasaudi-higher-education-students-sa-20260825` و`src-sama-datasaudi-students-schools-teachers-sa-20260825` — [SAMA/DataSaudi report](https://www.sama.gov.sa/en-US/Publications/EconomicReports/Pages/report.aspx?cid=127)؛ `src-gastat-open-data-20260825` — [GASTAT Open Data](https://dp.stats.gov.sa/opendata)؛ `src-gastat-statistics-categories-20260825` — [GASTAT Statistics](https://www.stats.gov.sa/en/statistics)` |
| KAPSARC/SAMA | `src-kapsarc-sama-pos-ecommerce-sa-20260825` — [POS transactions](https://datasource.kapsarc.org/explore/assets/pos-transactions/)؛ `src-kapsarc-sama-pos-sector-sa-20260825` — [POS by sector](https://datasource.kapsarc.org/explore/assets/points-of-sale-transactions-and-sales-by-sector/)؛ `src-kapsarc-sama-pos-sector-city-sa-20260825` — [POS by sector and city](https://datasource.kapsarc.org/explore/assets/point-of-sale-transactions-by-sector-and-city/)؛ `src-kapsarc-sama-pos-detailed-sector-city-sa-20260825` — [Detailed POS by sector/city](https://datasource.kapsarc.org/explore/assets/detailed-point-of-sale-transactions-by-sector-and-city/) |
| ITU | `src-itu-key-ict-regional-2025` — [ITU Statistics](https://www.itu.int/en/ITU-D/Statistics/pages/stat/default.aspx). لم يتم العثور على صفوف مباشرة EG/SA في workbook المختار |
| CBE | `src-cbe-payment-system-eg-20260825` — [Payment Systems and Services](https://www.cbe.org.eg/en/payment-systems-and-services) |
| SAMA الرسمي | `src-sama-national-payment-news1139-sa-20260825` — [85% e-payments news](https://www.sama.gov.sa/en-US/MediaCenter/News/pages/news-1139.aspx)؛ `src-sama-ecommerce-interface-news1095-sa-20260825` — [E-commerce payments interface](https://sama.gov.sa/en-US/MediaCenter/News/pages/news-1095.aspx)؛ `src-sama-weekly-pos-page-sa-20260825` — [Weekly POS reports](https://www.sama.gov.sa/en-US/Statistics/Indices/Pages/POS.aspx) |
| مصر العامة الإضافية | `src-mped-national-accounts-eg-20260825` — [MPED National Accounts](https://mped.gov.eg/Analytics?lang=en)؛ `src-nafeza-customs-fx-eg-20260825` — [Nafeza Customs FX](https://sandbox.nafeza.gov.eg/ar/currencies)؛ `src-egypt-national-open-data-portal-20260825` — [data.gov.eg](https://data.gov.eg/)، وهو `enabled=false` وdiscovery-only لأن المسار لم يثبت dataset قابلًا للقراءة |
| Noon/Amazon | `src-noon-eg-mobile-category-20260825` و`src-noon-eg-galaxy-a17-product-20260825` — [Noon Egypt category](https://www.noon.com/egypt-en/electronics-and-mobiles/mobiles-and-accessories/mobiles-20905/) و[Galaxy A17](https://www.noon.com/egypt-en/galaxy-a17-dual-sim-4g-black-4gb-ram-128gb-middle-east-version/N70214276V/p/?o=b93223709b1aab3c)؛ `src-noon-sa-mobile-category-20260825` و`src-noon-sa-galaxy-s25-product-20260825` — [Noon Saudi category](https://www.noon.com/saudi-en/electronics-and-mobiles/mobiles-and-accessories/mobiles-20905/) و[Galaxy S25 Ultra](https://www.noon.com/saudi-en/galaxy-s25-ultra-dual-sim-titanium-black-12gb-ram-256gb-5g-international-version/N70142933V/p/)؛ `src-amazon-eg-homepage-20260825` — [Amazon Egypt](https://www.amazon.eg/-/en/)؛ `src-amazon-eg-product-captcha-20260825` — [Amazon Egypt product attempt](https://www.amazon.eg/-/en/Silver-Crest-Performance-Convection-DR-8803S/dp/B0C1ZJJ1XG)، وهو `enabled=false`؛ `src-amazon-sa-anker-product-20260825` — [Amazon Saudi Anker page](https://www.amazon.sa/-/en/Anker-2-Pack-Premium-Charger-Samsung/dp/B07DC5PPFV/) |
| App Stores | `src-google-play-noon-en-us-20260825` — [Google Play Noon](https://play.google.com/store/apps/details?id=com.noon.buyerapp&hl=en_US)؛ `src-google-play-amazon-en-us-20260825` — [Google Play Amazon](https://play.google.com/store/apps/details?id=com.amazon.mShop.android.shopping&hl=en_US)؛ `src-apple-store-noon-us-20260825` — [Apple Store Noon](https://apps.apple.com/us/app/noon-shopping-food-grocery/id1269038866)؛ `src-apple-store-amazon-us-20260825` — [Apple Store Amazon](https://apps.apple.com/us/app/amazon-shopping/id297606951) |

### 9.2 مصادر مزودي البيانات الخاصة والـfirst-party التي نوقشت أو جُمع منها evidence

هذه ليست مصادر عامة في الـpublic manifest، ولا يجوز خلطها به أو تحويلها إلى benchmark عام. هي مسارات account-owned أو property-owned تحتاج تحقق ملكية ونطاقًا:

| المزود | ما تم جمعه أو تهيئته | الحالة والسياسة |
|---|---|---|
| Meta Ads Manager | حسابا Nadia Ahmed `act_1259153761545048` وDeega/شروق عبدالله `act_809145896791225`؛ exports على campaign/ad set/ad، وتقارير Month/Country/Platform | قراءة فقط، allowlist، CSV الخام خارج Git، لا benchmark عام |
| Meta Snapshot Collector | core collector مع queue، cache، persisted cursors، backoff، circuit breaker، raw snapshots وEvidence Package design | لا write scopes؛ حدث rate limit في breakdown وتم التوقف |
| Google Ads | تقارير ومجموعات مرتبطة بالعملاء `4282900193` و`5805554566` في archive الخاص بالمزود | read-only؛ النطاق غير المتحقق لا يمر إلى Evidence Package usable |
| TikTok Business | metadata وتقارير للمعلنين المكتشفين، مع إبقاء Mr Moustafa وPlan B0327 وwindoor solutions candidates غير مؤكدة؛ Deega أعاد empty report لا صفرًا | GET/report فقط؛ empty ≠ zero performance |
| GA4 | ملاحظة property UI لـEnfrad `471345574` وempty observation لـ`466390867` لفترة 28 يومًا | لا spend أو ROAS مستنتج؛ الملكية والنطاق شرط |
| Meta/TikTok/Google official policies | وثائق APIs وCreative Center وAds/GA4 | مصادر سياسات/تقارير، لا تعويض عن scope أو license |

القاعدة الحاكمة لبيانات الحسابات هي أن `scopeStatus=unverified` يحتفظ بالصفوف في archive الخارجي عند الحاجة، لكنه لا يسمح بإنشاء Evidence Package usable. كما لا تُستنتج الصناعة أو السوق من اسم الحملة أو اللغة أو keyword وحدها [20].

### 9.3 الملفات الداخلية المرجعية المستخدمة

| الملف | الوظيفة في هذا التسليم |
|---|---|
| `docs/ملف المرجع الشامل – مشروع CDKS.md` | المرجع التاريخي الأول الذي طلب المستخدم تكملته |
| `docs/CDKS_CONVERSATION_HANDOFF_TO_KNOWLEDGE_LAYER.md` | handoff السابق قبل Knowledge Layer |
| `docs/KNOWLEDGE_LAYER_IMPLEMENTATION_REQUIREMENTS.md` | المتطلبات والسياسات والـgates |
| `docs/BLUEPRINT_PARITY_AND_KNOWLEDGE_LAYER_ROADMAP_UPDATED.md` | خارطة الانتقال بعد اكتمال parity |
| `docs/KNOWLEDGE_LAYER_PHASE1_IMPLEMENTATION_STATUS.md` | حالة Knowledge Contracts/Registry الأولى |
| `docs/KNOWLEDGE_STRATEGY_CONTEXT.md` | الربط المقيد بين Evidence وStrategy |
| `docs/INDUSTRY_MARKET_DATA_GUIDE.md` | taxonomy ومصادر كل طبقة ومتطلبات الصناعات |
| `docs/PROVIDER_KNOWLEDGE_IMPORT.md` | سياسة أدلة Google Ads/TikTok/GA4 |
| `docs/META_CSV_IMPORT.md` | سياسة CSV الرسمية لحسابي Meta |
| `docs/META_SNAPSHOT_COLLECTOR.md` | تصميم collector القراءة فقط |
| `docs/OPTIONAL_AI_ADVISORY.md` | opt-in وsanitization وfallback والـAI governance |
| `docs/DATABASE_FOUNDATION_V1.md` | قاعدة SQLite والمigrations والعزل |
| `docs/PERSONAL_STAGING.md` | سيناريوهات Staging وrandomized suite |
| `docs/KNOWLEDGE_LAYER_PUBLIC_BATCH_2026-08-25.md` | تقرير الجولة العامة السابقة والحالية |
| `data/knowledge/public/public-knowledge-quality-report-2026-08-25.json` | الحالة machine-readable الأحدث |

---

## 10. المشاكل التي واجهتنا والحلول المعتمدة

### 10.1 فقدان العمق الدلالي

**المشكلة:** وضع استراتيجية كبيرة في طلب AI واحد أدى إلى مخرجات مختصرة أو سطحية.
**الحل:** فصل CDKS الحتمي عن Strategy Builder وعن Reasoning، وتوسيع Canonical Blueprint، ثم اختبار كل طبقة منفصلة.

### 10.2 أزمة Data Contract

**المشكلة:** payload قديم بعدد حقول ومسؤوليات مختلف عن `CanonicalWizardInput` ذي 41 حقلًا.
**الحل:** تثبيت canonical contracts، تصنيف الحقول، ورفض `undefined` عندما توجد قيمة canonical، واستخدام `unavailable` أو `not_applicable` عند الحاجة.

### 10.3 False Missing في Coverage Gate

**المشكلة:** أقسام كانت تظهر missing بسبب wrappers أو aliases لا بسبب غياب البيانات.
**الحل:** إصلاح `REFERENCE_SECTION_MAP` وnormalization وdisplay adapter. النتيجة 26/26 full، وعدم إضافة paths legacy مكررة كحل زائف.

### 10.4 أخطاء UI وعدم وضوح الناتج للعميل

**المشكلة:** كانت بعض القيم موجودة في canonical ولا تظهر في UI، أو يرى العميل مخرجات متفرقة لا يعرف هل هي نتيجة Wizard أم Reasoning.
**الحل:** renderers وadapter موحد وclient-first outcome، مع فصل واضح بين نتيجة Wizard/Blueprint وStrategy proposal وReasoning explanation.

### 10.5 Groq wire schema rejection

**المشكلة:** قيود structured output مثل `maxItems` سببت رفضًا من المزود رغم نجاح Zod محليًا.
**الحل:** تبسيط wire schema، ثم validation محلي صارم، وتطبيع provider-owned reasoning output قبل إدخاله في envelope.

### 10.6 Rate limits و429

**المشكلة:** ظهرت 429 في بعض طلبات Groq/Meta/Google Trends، كما كان التشغيل المتقارب يسبب فشلًا أو استهلاك quota.
**الحل:** تصنيف 429، backoff، fallback إلى Mistral حيث يسمح نوع الخطأ، circuit breaker، تقليل benchmark إلى case واحدة، intervals محافظة، وإيقاف إعادة الطلب عند حظر أو rate limit. لا يجوز اعتبار 429 قيمة صفرية أو فشلًا في CDKS نفسه.

### 10.7 نماذج قديمة أو غير متاحة

**المشكلة:** ظهرت أسماء تاريخية مثل `qwen-2.5-coder-32b` أو `gemini-2.5-flash` في مراحل سابقة، وتبين أن بعضها غير متاح للمستخدمين الجدد أو متوقف.
**الحل:** فحص catalog ورسائل المزود وتحديث identifiers إلى Groq/Mistral/Gemini الحالية في الإعداد المعتمد، مع عدم افتراض التوفر مستقبلًا.

### 10.8 مفاتيح API وصلاحيات غير صحيحة

**المشكلة:** إدخال مفاتيح بصيغة placeholder أو مشاركة secrets في المحادثة تسبب 401 ومخاطر تسريب.
**الحل:** عدم طلب أو نشر المفاتيح، استخدام `.env.local` أو Secret Manager، وتسجيل provider/model/version/request metadata دون المفتاح.

### 10.9 Literal Types وTypeScript

**المشكلة:** outputs لا تطابق Zod literal unions.
**الحل:** `as const`، تثبيت القيم الحرفية، وتشغيل `tsc --noEmit` وproduction build بعد التعديلات.

### 10.10 خلط الحسابات الخاصة مع Market Intelligence

**المشكلة:** وجود 1000 حملة أو عدة حسابات لا يجعل البيانات benchmark للصناعة، خصوصًا إذا كانت الحسابات غير متجانسة أو غير مؤكدة الملكية أو بعضها ناجح وبعضها لا.
**الحل:** فصل `account-owned operational evidence` عن public market evidence، والتحقق من owner/scope/period/currency/attribution، وترك industry candidates `unreviewed` حتى المراجعة. لا يمكن لبيانات عميل واحد أو حسابات متعددة أن تضبط `globalMarketValidated`.

### 10.11 تعارض تقارير Meta breakdown

**المشكلة:** تقرير Month وCountry وPlatform قد يحتوي على صفوف مختلفة، والتقرير غير المسمى كان سياقه متعارضًا.
**الحل:** حفظ كل breakdown منفصلًا، وعدم جمع segmented totals مع unsegmented أو breakdown آخر دون entity-and-scope deduplication. التقرير غير المسمى لم يُستورد إلى Evidence Package.

### 10.12 فشل البوابات العامة أو الحجب

| المصدر/الحالة | المعالجة الآمنة |
|---|---|
| CBE Data Measurement/Reports | توثيق server rejection وعدم اختلاق dataset |
| data.gov.eg | discovery/unavailable، source disabled، لا dataset غير مثبت |
| Egypt Data Portal | error/unsaved pages، لا استبدال ببوابة ثالثة |
| Amazon Egypt product | CAPTCHA محفوظ كـunavailable، بلا bypass أو retry |
| Google Trends query جديد | 429، إيقاف الاستعلامات وعدم إعادة الضغط |
| Noon Saudi category | response غير مستقر، الاحتفاظ taxonomy فقط وعدم اختلاق cards |
| Noon iPhone page | response truncated قبل buy-box، عدم تسجيل سعر/تقييم غير ظاهر |
| TikTok Creative Center | لم ينتج dataset عام ثابتًا في الحالة الملتقطة، لا claims |

### 10.13 خلط payment وecommerce demand

**المشكلة:** وجود POS أو electronic payments قد يبدو كأنه online shopping demand أو ad conversion.
**الحل:** تسمية artifacts كسياق payment ecosystem أو sector payment context، ووضعها `limited_external_evidence` أو qualitative، وعدم تحويلها إلى GMV أو audience أو ROAS.

### 10.14 خلط app-store ratings مع السوق القطري

**المشكلة:** صفحة Google Play أو App Store قد تعرض تقييمًا عالميًا أو خاصًا بالـstore locale، وليس مصر أو السعودية.
**الحل:** حفظ `storeLocale`، والاحتفاظ بالعدادين كما ظهرا، وعدم استنتاج active users أو market share أو installs قطريًا.

### 10.15 التقدير من الغياب

**المشكلة:** غياب صفوف أو empty report قد يُفهم كصفر أداء، وغياب حدث أو قيمة قد يُملأ بتقدير.
**الحل:** empty ≠ zero، و`unavailable` مع سبب، وعدم استنتاج CPC/CPA/CVR/ROAS/reach/frequency/saturation أو competitor performance.

---

## 11. الاختبارات والتحقق

### 11.1 اختبارات baseline السابقة

| الاختبار | النتيجة الموثقة |
|---|---:|
| Reference Coverage Gate | 26/26 full، 0 partial، 0 missing |
| Golden HTTP v5 | 10/10 PASS |
| Semantic regression | 10/10 PASS |
| Enterprise assertions | 260/260 PASS |
| UI renderers | 26/26 |
| AI governance audit | 0 Canonical sections impacted |
| Knowledge contracts الأولى | 11 assertions PASS |
| Source Registry/Evidence الأولى | 16 assertions PASS |
| Industry Profiles والمطابقة | 24 assertions PASS |

### 11.2 الاختبارات التي شُغلت في هذه الجولة

| الأمر | النتيجة |
|---|---|
| `npm run knowledge:public:full` | PASS؛ أعاد بناء public context وartifacts وregistry وmanifest والحزم |
| `npm run test:knowledge:public-ingestion` | PASS؛ **112 assertion**، 53 مصدرًا، 22 artifact، 10 World Bank، 4 Trends |
| `npm run test:knowledge:public-evidence` | PASS؛ 3 حزم محدودة، scope/freshness/unknowns سليمة |
| `npm run test:knowledge:public-quality` | PASS؛ hashes وsource IDs وgates سليمة |
| `npm run test:knowledge:contracts` | PASS |
| `npm run test:knowledge:evidence` | PASS |
| `npm run test:knowledge:industry` | PASS |
| `npm run test:knowledge:providers` | PASS |
| `npm run test:knowledge:content` | PASS |
| `npm run test:knowledge:strategy-context` | PASS |
| `npm run test:database:foundation` | PASS؛ 41 assertion |
| `npm run test:personal-staging` | PASS؛ 58 assertion، 3 scenarios |
| `npm run test:randomized:wizard -- 20260825 10` | PASS؛ 100/100، 10 fixtures × 10 variants |
| `npm run test:autofill:fixtures` | PASS؛ 15 assertion، 10 profiles |
| `npm run test:wizard:review:consent` | PASS؛ 81 assertion |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS؛ Next 16.2.12 production build |

### 11.3 CI وGitHub

نجح CI للـcommit `af07147` في run [32896851483](https://github.com/moustafa00799/wizard-temp/actions/runs/32896851483)، ونجح CI للـcommit النهائي `c8e19b7` في run [32896988922](https://github.com/moustafa00799/wizard-temp/actions/runs/32896988922). workflow يشمل `npm ci` وproduction build واختبارات provider/reasoning/consent وCDKS regression gate بعد تشغيل server مؤقت.

المراجعة الأخيرة بعد `git fetch origin main` أثبتت:

```text
HEAD       = c8e19b793dfafb3265b3cbec1c03fbeae669e8e7
origin/main= c8e19b793dfafb3265b3cbec1c03fbeae669e8e7
local-only commits  = none
remote-only commits = none
tracked diff        = none
```

---

## 12. العناصر التي لم تُرفع إلى GitHub وأسباب ذلك

يجب التفريق بين ثلاثة أنواع: ملفات raw مستبعدة عمدًا، ملفات خاصة أو حساسة خارج المستودع، ونتائج لم تكتمل بسبب حجب أو عدم قابلية إعادة التحقق. عدم وجود هذه العناصر على GitHub لا يعني أن commit ناقص.

### 12.1 ملفات raw محلية غير متتبعة حاليًا

هذه هي العناصر التي ظهرت في آخر `git status --short` وبقيت محليًا:

```text
data/knowledge/public/capmas/2026-08-25/catalog.html
data/knowledge/public/capmas/2026-08-25/pdfs/
data/knowledge/public/capmas/2026-08-25/searches/
data/knowledge/public/gastat/
data/knowledge/public/google-trends/2026-08-25/eg-arabic-explore.html
data/knowledge/public/google-trends/2026-08-25/eg-english-explore.html
data/knowledge/public/google-trends/2026-08-25/sa-arabic-explore.html
data/knowledge/public/google-trends/2026-08-25/sa-english-explore.html
```

**السبب:** هذه صفحات HTML وPDF وsearch captures أو raw downloads كبيرة/خام. تم رفع normalized artifacts والـscripts والـhashes والروابط والقيود إلى GitHub، بينما تُحفظ raw خارج Git لتقليل الحجم واحترام سياسة التخزين وحقوق إعادة الاستخدام. لا تحذفها ولا ترفعها جماعيًا إلا بعد قرار صريح بشأن license وObject Storage وretention.

### 12.2 ملفات خاصة أو حساسة خارج Git

تظل ملفات Meta CSV وraw provider collections وGA4/Google/TikTok archives خارج Git. بعض التقارير محفوظ في Downloads أو archive محلي خارج repository، و`/home/ubuntu/multiplatform_evidence_packages.json` artifact خارج Git. السبب هو أنها account-owned وقد تحتوي على معرفات حملات أو أرقام تشغيلية أو بيانات لا ينبغي نشرها.

تظل `.local/`، بما فيها `.local/cdks-staging.sqlite` وملاحظات البحث والـraw notes، خارج Git. قاعدة SQLite للتجربة وليست artifact canonical. لا يجوز رفع `.env.local` أو مفاتيح API أو cookies أو headers أو refresh tokens أو raw customer exports.

### 12.3 عناصر لم تكتمل ولم يُرفع لها dataset

| العنصر | الحالة | ما تم رفعه بدلًا منه |
|---|---|---|
| data.gov.eg | لم يثبت endpoint/dataset قابل للقراءة | disabled SourceRecord discovery مع سبب |
| Egypt Data Portal | error/unsaved pages | لا قيمة؛ بقي discovery-only في notes |
| CBE numeric reports | rejection من endpoint | browser capture نوعي وartifact بلا أرقام |
| Amazon Egypt product | CAPTCHA | unavailable observation وSourceRecord disabled |
| Noon Saudi category cards | response غير مستقر | taxonomy qualitative فقط |
| Noon iPhone buy-box | extraction truncated | لا سعر ولا تقييم غير ظاهر |
| Google Trends query إضافي | 429 | الإبقاء على 4 snapshots السابقة وعدم retry سريع |
| TikTok Creative Center public dataset | غير ثابت في الالتقاط | لا claims؛ TikTok account reporting private |
| English exact packages | لم تكتمل evidence المطابقة | بقيت الحزم العربية الثلاث فقط |
| EG/ecommerce وSA/education وSA/local_service public packages | gaps scope | unknowns وlimited gate، لا package اصطناعي |

### 12.4 لماذا لا ينبغي رفع هذه الملفات الآن

رفع raw غير مكتمل أو غير مرخص قد يعطي النموذج التالي انطباعًا خاطئًا بأن المصدر ممثل أو أن العينة شاملة. كما أن رفع account-owned exports قد يسبب كشفًا لمعلومات تشغيلية. السياسة الصحيحة هي رفع artifact صغير قابل للتدقيق، ومرجع المصدر ووقت الالتقاط والـhash، مع إبقاء المصدر الأصلي خارج Git أو في Object Storage مصرح به.

---

## 13. المراحل المتبقية — أساسية وفرعية

### المرحلة A: تثبيت baseline ومنع التراجع

**الهدف:** إبقاء parity وblueprint-only وAI isolation ثابتة أثناء تطوير Knowledge.

المهام الفرعية هي تشغيل baseline قبل كل تغيير، عدم تعديل migration القديمة بعد نشرها، عدم تغيير `CanonicalBlueprint` بلا migration، إضافة regression لأي field جديد، والتأكد من أن تبديل أو فشل AI لا يغير القرارات canonical.

**شرط الإغلاق:** 26/26 parity، 10/10 golden، 260/260 enterprise، build وCI PASS، ولا تغير في canonical hash عند تشغيل AI ON/OFF.

### المرحلة B: استكمال الحزم العامة ذات النطاق الدقيق

المهام الأساسية هي بناء Evidence Packages لـ`EG/ecommerce_general` و`SA/education_general` و`SA/local_service_general`، ثم إضافة English exact packages فقط عند وجود مصادر إنجليزية ومطابقة. المهام الفرعية تشمل source-metric-scope matrix، تحديد metric definitions، مراجعة periods والوحدات والعملات، وربط كل fact بمصدر وevidence.

**شرط الإغلاق:** لا claim بلا evidence، لا خلط سوق/صناعة/لغة/عملة، freshness محسوبة، contradictions صريحة، وجميع الحزم لا تزال limited ما لم تحقق شروط ready فعليًا.

### المرحلة C: Grounding/Citation/Freshness/Contradiction Gates

يجب فصل أربع بوابات حتمية:

| البوابة | المهمة الأساسية |
|---|---|
| Grounding Gate | رفض claim خارجي بلا evidence مناسبة |
| Citation Gate | فرض source/evidence IDs وexcerpt أو query قابل للمراجعة |
| Freshness Gate | تخفيض الحالة أو رفض snapshot المتقادم |
| Contradiction Gate | عدم اختيار AI قيمة متعارضة تلقائيًا؛ إبقاء contradiction وlimited |

المهام الفرعية هي إضافة tests للـscope violation، unsupported numeric claim، source disabled، license restricted/unknown، duplicate evidence، periods المتعارضة، و`unavailable` التي تحتوي قيمة غير null.

### المرحلة D: Evidence-aware CDKS

يستقبل CDKS `EvidencePackage` أو `ScopedStrategyContext` كمدخل منفصل عن Wizard. يجب أن يثري market context والرسائل والاختبارات والتحفظات فقط. لا يجوز له تغيير objective أو funnel أو channel أو readiness أو budget أو launch أو compliance gate.

المهام الفرعية هي حفظ `rule_id` و`authority=CDKS` و`source_ids` و`evidence_status` و`confidence` لكل قرار متأثر، إضافة tests للتبديل بين package موجود ومفقود، وإظهار fallback deterministic عند غياب الأدلة.

### المرحلة E: Grounded Strategy Builder وReasoning citations

يجب أن يقرأ Strategy Builder الحزمة المنقحة ويعيد proposals تحمل claims مصنفة: fact أو inference أو directional hypothesis أو recommendation. يجب أن يضيف Reasoning source IDs وlimitations وfreshness، وأن يرفض النصوص التي تعطي benchmark غير موثق أو تدعي نتيجة منافس.

المهام الفرعية هي ربط public marketplace observations بوصفها offer patterns فقط، إبقاء app-store observations خارج country facts، وإضافة evidence panels في UI لا تخلط بين Recommendation وCanonical Blueprint.

### المرحلة F: إكمال مصادر العميل الرسمية

هذه هي المصادر الأكثر قيمة لتخصيص الاستراتيجية، لكنها تحتاج صلاحيات أو exports من المستخدم:

1. Google Ads Keyword Planning للحصول على keyword ideas وhistorical/forecast metrics مع market/language/currency/period.
2. GA4 وSearch Console لمعرفة source/landing/query/event/funnel، مع definitions وattribution window وtimezone.
3. CRM والمتجر وERP/POS وcall tracking وbooking system للحصول على qualified lead وpurchase وrevenue وclosed job.
4. Meta Ads Insights/official exports للحسابين المسموحين فقط، مع account ID وperiod وbreakdown scope.
5. TikTok Business read-only reporting بعد تحقق advertiser ownership.
6. App Store Connect وGoogle Play Reporting/Firebase عند دخول فرع app.

كل مصدر يجب أن يُسجل أولًا في Registry، ثم يمر scope/ownership/period/currency/queryHash، ثم يُبنى له raw archive خارج Git وnormalized artifact صغير. لا يجوز تحويل نتائج حساب واحد إلى industry benchmark.

### المرحلة G: Official Connectors بطريقة آمنة

ترتيب التنفيذ المقترح هو: وثائق المنصات الرسمية، ثم connector منخفض المخاطر، ثم Google Keyword Planning، ثم TikTok Creative Center/Business read-only، ثم Meta أخيرًا كما طلب المستخدم. كل connector يحتاج queue، cache، backoff، rate limiter، persisted cursors، circuit breaker، raw snapshot hash، normalization، retries محافظة، وحالة failure.

لا ينبغي بناء scraping واسع. إذا ظهر CAPTCHA أو server block أو 429، يُسجل سبب unavailable ويُوقف المسار. لا تستخدم Browser takeover أو cookies كبديل لموصل رسمي دون حاجة واضحة وموافقة مناسبة.

### المرحلة H: نقل قاعدة البيانات إلى بيئة مستضافة

SQLite الحالية كافية لاختبار شكل المنتج والعزل والـrepositories، لكنها ليست production multi-tenant. المسار المستقبلي:

| الطبقة | المطلوب |
|---|---|
| Database | MySQL/TiDB أو PostgreSQL مستضاف مع migrations جديدة، indexes، constraints، transactions |
| Object Storage | raw snapshots وdocuments وexports مع encryption وretention وhashes |
| Auth | authentication وRBAC وworkspace membership وعزل tenant |
| Secrets | Secret Manager وOAuth token encryption وعدم حفظ material في DB |
| Jobs | queue workers، sync runs، retries، cursors، schedules، dead-letter handling |
| Observability | logs منقحة، metrics، alerts، audit events، trace IDs |
| Recovery | backup/restore، migration rollback strategy، disaster recovery test |
| Security | TLS، least privilege، validation، rate limits، abuse protection، isolation tests |

لا تبدأ النقل إلى production قبل تثبيت repositories والـcontracts، لأن الهدف هو تغيير driver لا إعادة بناء domain model.

### المرحلة I: Client UX

يجب أن يرى العميل الفرق بين:

- **System validated:** اجتاز العقد والبوابات الداخلية.
- **Evidence backed:** claim مؤرخ ومسنود بمصدر مناسب.
- **Directional hypothesis:** اتجاه أو فرضية تحتاج اختبارًا.
- **Limited:** سياق صحيح جزئيًا لكنه لا يغطي السؤال كاملًا.
- **Stale:** موجود لكنه تجاوز freshness.
- **Unavailable:** لا يوجد دليل كاف ولم يتم اختلاق بديل.
- **Rejected:** فشل policy أو consistency.

تحتاج الواجهة إلى Evidence summary، source link، capturedAt، scope، limitations، وسبب unavailable، مع عدم إغراق العميل بتفاصيل لا يحتاجها. يجب أن تبقى التوصية الاستشارية في مكان منفصل عن Blueprint الرسمي.

### المرحلة J: Evaluation وDrift

أضف تقريرًا دوريًا يراقب citation coverage وfreshness compliance وcontradiction count وunsupported numeric claims وindustry match rate وsource availability وprovider errors وcanonical stability. يجب أن يكتشف تغير schema أو license أو URL أو تعريف metric، لا مجرد نجاح HTTP.

### المرحلة K: Fine-tuning

لا يُنفذ Fine-tuning الآن. بعد اكتمال corpus مرخص ومقاس، قد يُدرس فقط إذا بقيت مشكلة أسلوب أو تنسيق أو مهمة متكررة لا يحلها retrieval والـprompting والـrules. Fine-tuning لا يعوض source freshness أو market truth ولا يصلح غياب البيانات.

---

## 14. خطة تنفيذ عملية للنموذج التالي

### Sprint 1 — استئناف آمن

اقرأ هذا الملف و`KNOWLEDGE_LAYER_IMPLEMENTATION_REQUIREMENTS.md` و`KNOWLEDGE_STRATEGY_CONTEXT.md` و`PUBLIC_BATCH` و`public-knowledge-quality-report`. افحص GitHub وstatus. شغل الاختبارات العامة. لا تلمس raw untracked.

### Sprint 2 — تدقيق artifacts والـcontracts

تحقق من أن كل artifact في manifest له rawInput وsha256 ومصدر مسجل، وأن كل source ID يطابق registry، وأن كل public observation لا يحمل CPC/CPA/CVR/ROAS/saturation كقيمة observed. أضف schema مستقلًا لملاحظات marketplace إذا احتاج المنتج اعتمادًا رسميًا، لكن لا تجبرها على `CompetitorObservationSchema` إذا كانت حقول السعر والمنتج غير ممثلة فيه.

### Sprint 3 — gates

نفذ Grounding/Citation/Freshness/Contradiction tests، ثم اربط حالات failure بـ`limited` أو `unavailable`. لا تجعل نجاح schema وحده يرفع Market Validation.

### Sprint 4 — إكمال scopes العامة

ابدأ بـEG ecommerce، ثم SA education، ثم SA local service، مع مصادر public أو licensed مطابقة. لا تستخدم payment context أو app ratings لإغلاق هذه الفجوات وحدها.

### Sprint 5 — client data

اطلب من المستخدم، عند جاهزيته، exports أو connector رسميًا مع تحديد account/property IDs والفترة والعملة والـtimezone والـattribution. لا تطلب كلمات مرور أو API keys في المحادثة، ولا ترفع raw files إلى Git.

### Sprint 6 — integration

اربط الحزم بالحالة المقيدة وStrategy Builder وReasoning، مع tests تثبت أن تبديل الحزمة أو AI لا يغير Canonical Blueprint. ثم أضف UX للثقة والمصادر والقيود.

### Sprint 7 — production readiness

بعد نجاح staging فقط، جهز MySQL/TiDB/Object Storage/Auth/RBAC/Secret Manager/jobs/backups/monitoring. نفذ migration جديدة بدل تعديل `0001`، واختبر restore والعزل والفشل.

---

## 15. قائمة قرارات المستخدم التي يجب الحفاظ عليها

| القرار الذي اتُخذ في المحادثة | أثره التنفيذي |
|---|---|
| الأولوية مصر والسعودية | كل evidence يحتاج market صريحًا؛ لا دمج تلقائي بين البلدين |
| الصناعات الأولى ecommerce/education/local service | تبقى هي source-matrix الأولوية |
| Meta في آخر ترتيب الجمع | لا تبدأ Meta قبل استنفاد public/official low-risk sources |
| القراءة فقط | لا create/edit/delete/publish أو spend أو audience/catalog writes |
| حسابا Meta المسموحان فقط | Nadia وDeega/شروق عبدالله وفق allowlist في docs |
| لا مفاتيح في المحادثة | `.env.local` أو Secret Manager فقط |
| AI استشاري اختياري بمفتاح واحد | opt-in من العميل + server gates + sanitization |
| Groq ثم Mistral، وGemini benchmark | لا تجعل Gemini fallback تلقائيًا لمسار العميل |
| استخدام 10 fixtures وrandom | يظل deterministic seed ويُحفظ مع نتيجة suite |
| قاعدة شخصية غير نهائية | SQLite/Staging للعرض والاختبار، لا production claim |
| عدم إعلان Market-Validated | حتى اجتياز source/scope/freshness/coverage gates لكل claim |
| عدم اختلاق benchmarks | unavailable مع rationale هو الناتج الصحيح عند غياب الدليل |

---

## 16. ما ينبغي عدم اعتباره منجزًا

نجاح build أو وجود 53 مصدرًا لا يعني اكتمال Market Intelligence. وجود artifacts كثيرة لا يعني أنها كلها تنطبق على كل industry/market. وجود صفحة متجر لا يعني demand أو sales. وجود POS لا يعني ecommerce-only. وجود ratings أو downloads لا يعني active users أو market share. وجود بيانات account-owned لا يعني benchmark للصناعة. ووجود Strategy Context scoped لا يعني global market validation.

كذلك لا ينبغي اعتبار Personal Staging قاعدة إنتاج، ولا اعتبار تشغيل اختبارات provider التجريبية اتصالًا حيًا ناجحًا بكل مزود، ولا اعتبار `liveAiCalled=false` عيبًا؛ هذا مقصود في اختبارات الخصوصية والسياسات.

---

## 17. مراجع وروابط التحقق

[1]: docs/KNOWLEDGE_LAYER_IMPLEMENTATION_REQUIREMENTS.md "Knowledge Layer implementation requirements"
[2]: data/knowledge/public/public-knowledge-quality-report-2026-08-25.json "Latest public Knowledge quality report"
[3]: docs/OPTIONAL_AI_ADVISORY.md "Optional governed AI advisory"
[4]: docs/DATABASE_FOUNDATION_V1.md "Database foundation v1"
[5]: docs/KNOWLEDGE_STRATEGY_CONTEXT.md "Scoped Knowledge Strategy Context"
[6]: https://www.cbe.org.eg/en/payment-systems-and-services "Central Bank of Egypt — Payment Systems and Services"
[7]: https://www.sama.gov.sa/en-US/MediaCenter/News/pages/news-1139.aspx "SAMA — E-Payments Account for 85% of Total Retail Payments in 2025"
[8]: https://sama.gov.sa/en-US/MediaCenter/News/pages/news-1095.aspx "SAMA — E-commerce payments interface"
[9]: https://www.sama.gov.sa/en-US/Statistics/Indices/Pages/POS.aspx "SAMA — Weekly POS reports"
[10]: https://mped.gov.eg/Analytics?lang=en "Egypt Ministry of Planning and Economic Development — National Accounts Data"
[11]: https://sandbox.nafeza.gov.eg/ar/currencies "Nafeza — Egyptian Customs foreign exchange page"
[12]: https://www.noon.com/egypt-en/galaxy-a17-dual-sim-4g-black-4gb-ram-128gb-middle-east-version/N70214276V/p/?o=b93223709b1aab3c "Noon Egypt — Galaxy A17 product page"
[13]: https://www.noon.com/saudi-en/galaxy-s25-ultra-dual-sim-titanium-black-12gb-ram-256gb-5g-international-version/N70142933V/p/ "Noon Saudi Arabia — Galaxy S25 Ultra product page"
[14]: https://www.amazon.eg/-/en/ "Amazon Egypt — public homepage"
[15]: https://www.amazon.sa/-/en/Anker-2-Pack-Premium-Charger-Samsung/dp/B07DC5PPFV/ "Amazon Saudi Arabia — Anker product page"
[16]: https://play.google.com/store/apps/details?id=com.noon.buyerapp&hl=en_US "Google Play — Noon"
[17]: https://play.google.com/store/apps/details?id=com.amazon.mShop.android.shopping&hl=en_US "Google Play — Amazon Shopping"
[18]: https://apps.apple.com/us/app/noon-shopping-food-grocery/id1269038866 "Apple App Store US — Noon"
[19]: https://apps.apple.com/us/app/amazon-shopping/id297606951 "Apple App Store US — Amazon Shopping"
[20]: docs/PROVIDER_KNOWLEDGE_IMPORT.md "Provider knowledge import policy"

---

## 18. الخلاصة التنفيذية

المشروع تجاوز مرحلة بناء CDKS الأساسي وتكافؤ Blueprint، وتجاوز مرحلة إنشاء العقود والـRegistry والحزم الأولى، ونفذ قاعدة بيانات شخصية واختبارات مكثفة، ثم جمع دفعة عامة واسعة لمصر والسعودية. النسخة الحالية على GitHub متزامنة وCI ناجح، وملفات artifacts الصغيرة المنظمة مرفوعة.

ما لم يُغلق هو **اكتمال المعرفة السوقية ذات النطاق الدقيق**، وليس أساس CDKS. توجد ثلاث حزم public عربية محدودة، وتوجد gaps لثلاثة نطاقات أخرى، ولا توجد English exact packages. كما أن audience size وabsolute search volume وCPC وCPA وCVR وROAS وreach وfrequency وsaturation وcompetitor performance وclient funnel performance تبقى unavailable حتى وصول evidence مناسب.

الاستكمال الصحيح لا يبدأ بإضافة أرقام أكثر عشوائيًا ولا بـFine-tuning. يبدأ بـgates مستقلة، source-metric-scope matrix، ثم مصادر العميل الرسمية، ثم connectors قراءة فقط، ثم Evidence-aware CDKS، ثم Strategy/Reasoning citations، ثم UX، ثم نقل التخزين إلى بيئة مستضافة. يجب أن يبقى النظام طوال ذلك **blueprint-only، fail-closed، ومعلنًا بصدق على أنه غير Market-Validated عالميًا**.

**نهاية التقرير.**
