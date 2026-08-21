# متطلبات بناء Knowledge Layer وMarket Intelligence لمنصة Campaign Builder AI

## 1. القرار التنفيذي المختصر

مخرجات CDKS الحالية متماسكة من ناحية القواعد والعقود والاتساق، لكنها لا تُعد وحدها Market-Validated أو Industry-Validated. لذلك لا نبدأ بـFine-tuning، ولا نطلب من Rule Engine أن يتذكر السوق. نضيف طبقة معرفة وبيانات سوقية versioned، ثم نمرر snapshot موثقًا إلى CDKS وطبقتي AI.

الترتيب المقترح هو:

```text
Wizard Input
  ↓
Source Registry + Knowledge Store
  ↓
Market Evidence Snapshot
  ↓
Evidence-aware CDKS
  ↓
Grounded Strategy Builder
  ↓
Reasoning with citations
  ↓
Quality Gates
  ↓
System-Validated Blueprint
```

الهدف ليس إعطاء وعد غير واقعي بأن كل توقع سيكون صحيحًا بنسبة 100%. الهدف القابل للقياس هو أن كل حقيقة سوقية تكون مؤرخة ومحددة النطاق ومتصلة بمصدر، وأن كل معلومة غير مؤكدة تتحول إلى `directional_hypothesis` أو `unavailable` بدل عرضها كحقيقة.

## 2. ما المطلوب من صاحب المشروع؟

لا يحتاج صاحب المشروع إلى تجهيز نموذج محلي أو تدريب نموذج من البداية. المطلوب منه أولًا حسم نطاق التشغيل وتوفير صلاحيات ومراجع محددة.

| المطلوب من صاحب المشروع | الغرض | هل هو إلزامي للـMVP؟ |
|---|---|---:|
| تحديد أول الصناعات ذات الأولوية | بناء Industry Profiles قابلة للاختبار بدل محاولة تغطية كل الصناعات | نعم |
| تحديد الأسواق الأولى | مثل مصر، السعودية، الإمارات أو الخليج كمنطقة | نعم |
| تحديد اللغات والعملات | العربية والإنجليزية، وEGP/SAR/USD | نعم، وهي محسومة مبدئيًا |
| قائمة المنافسين أو domains إن وجدت | تحسين تحليل المنافسين وتجنب مطابقة أسماء عامة | اختياري لكنه مفيد |
| بيانات العميل التجريبية | عروض، أسعار، مناطق، USP، شرائح، اعتراضات، قنوات | نعم للـfixtures، وليس مطلوبًا إرسال بيانات حساسة حقيقية |
| حسابات ومفاتيح API | Google Ads/Keyword Planning وأي مصدر مدفوع أو مقيد | عند تفعيل connector المعني فقط |
| قرار سياسة الخصوصية | ما الذي يخرج إلى مزود AI وما الذي يبقى anonymized | نعم |
| قرار freshness لكل نوع بيانات | يومي، أسبوعي، شهري، أو عند الطلب | نعم |
| معايير قبول Blueprint | ما الذي يجعل المخرج system_validated | نعم |
| مراجع الصناعة الداخلية | PDFs، سياسات، تقارير، عروض، أو playbooks يملك المشروع حق استخدامها | اختياري للـMVP ومهم للمرحلة المتقدمة |

لا ينبغي إرسال API keys أو كلمات المرور في المحادثة أو Git. تُحفظ محليًا أو في Secret Manager، وتُسجل في النظام هوية المزود والإصدار ووقت الاستخدام دون تسجيل المفتاح نفسه.

## 3. المتطلبات التقنية العامة

المشروع الحالي يملك أساسًا مناسبًا: Next.js/TypeScript، عقود Zod، endpoint v5، CDKS، Strategy Builder، Reasoning Builder، اختبارات canonical وsemantic وUI، وحالة Blueprint-only. ما نحتاجه هو إضافة طبقات جديدة بدل إعادة بناء المشروع.

### 3.1 مكونات النظام

| المكوّن | وظيفته | الناتج الرئيسي |
|---|---|---|
| Knowledge Contracts | تعريف شكل الصناعة والسوق والمصدر والادعاء | Zod schemas وversioned types |
| Source Registry | تعريف المصدر وترخيصه ونطاقه وتحديثه | `SourceRecord` |
| Ingestion Jobs | جلب واستخراج وتطبيع البيانات | Raw snapshots وnormalized records |
| Knowledge Store | تخزين الحقائق والوثائق والإصدارات | Structured DB + document/object storage |
| Retrieval Layer | اختيار الأدلة ذات الصلة بالسوق والصناعة والعميل | `EvidencePackage` |
| Evidence-aware CDKS | استخدام الأدلة كمدخل مقيد للقواعد | قرارات CDKS مع evidence IDs |
| Grounded Strategy Builder | إثراء الاستراتيجية من الأدلة فقط | proposals وhypotheses |
| Reasoning with citations | شرح القرار والتمييز بين fact/inference/hypothesis | claims وevidence وlimitations |
| Quality Gates | فحص المصدر والحداثة والتعارض والاتساق | accepted/rejected/degraded |
| Client UX | عرض حالة المعرفة والثقة والمصادر | badges وevidence panels |
| Evaluation/Drift | قياس الجودة وتغير البيانات والقواعد | reports وalerts |

### 3.2 التخزين

يُفضّل استخدام تخزين منظم للبيانات الرقمية، وتخزين وثائق للكلام الأصلي، وطبقة embeddings للبحث الدلالي. لا ينبغي وضع كل شيء في Vector Database فقط؛ الأرقام والتواريخ والسوق والعملة تحتاج استعلامات دقيقة.

```text
Structured Store:
  industries
  markets
  source_records
  market_facts
  keyword_snapshots
  competitor_observations
  seasonality_signals
  claims
  evidence_links
  evaluation_runs

Object/Document Store:
  original source snapshots
  extracted text
  policy documents
  archived payloads

Vector Index:
  document chunks
  semantic retrieval metadata
  source_id and version_id on every chunk
```

### 3.3 العقود الأساسية

```ts
SourceRecord = {
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

```ts
Claim = {
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

```ts
MarketEvidenceSnapshot = {
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

## 4. مصادر البيانات العملية وتجهيزاتها

### 4.1 Meta Ad Library

يمكن استخدام [Meta Ad Library Tools](https://transparency.meta.com/researchtools/ad-library-tools/) لمراقبة الإعلانات العامة النشطة، الرسائل، العروض، الزوايا، والأنماط الإبداعية ضمن ما تسمح به الأداة والمنطقة. لا يجوز استنتاج إنفاق المنافس أو ROAS أو التحويلات من ظهور إعلان فقط؛ الأداة مصدر ملاحظة إبداعية وتنافسية، وليست مصدر أداء مالي.

**التجهيزات:** تحديد الدول والصناعات، قائمة domains أو أسماء المنافسين، سياسة استخدام البيانات، connector أو عملية ingestion مسموحة، ومخزن snapshots مؤرخ.

### 4.2 Google Ads Keyword Planning

يمكن استخدام [Google Ads API Keyword Planning](https://developers.google.com/google-ads/api/docs/keyword-planning/overview) للحصول على أفكار الكلمات والـthemes وبعض historical/forecast metrics. تحتاج هذه البيانات إلى `capturedAt` وmarket وlanguage وcurrency، لأن المقاييس ليست حقيقة ثابتة لكل زمان وسوق. كما يجب احترام rate limits وشروط Google وتخزين النتائج بحيث لا نكرر الطلبات بلا داعٍ.

**التجهيزات:** حساب Google Ads أو access مناسب، developer token عند الحاجة، customer ID، OAuth credentials، الدول واللغات، وحدود الاستهلاك، وقرار ما إذا كان connector يبدأ ببيانات مجمعة أو بحساب عميل محدد.

### 4.3 TikTok Creative Center

يمكن استخدام [TikTok Creative Center](https://ads.tiktok.com/resources/help/article/creative-center?lang=en) لتحليل الاتجاهات والأمثلة الإبداعية وTop Ads ضمن حدود الوصول والمنطقة. هذه البيانات تساعد في تحليل الأنماط والرسائل، لكنها لا تثبت مبيعات أو ROAS المنافسين.

**التجهيزات:** تحديد ما إذا كان الاستخدام يدويًا أو عبر وصول رسمي، توثيق المصدر ووقت الالتقاط، وعدم تنفيذ scraping يخالف الشروط.

### 4.4 مصادر رسمية وإحصائية ووثائق المنصات

تُضاف مصادر حكومية وإحصائية وتقارير قطاعية مرخصة لتغطية السكان والاقتصاد والقطاعات والمناطق، مع تسجيل jurisdiction وperiod وmethodology. كما تضاف وثائق Meta وGoogle وTikTok الخاصة بالسياسات والتتبع والامتثال. لا تتحول المؤشرات العامة إلى CPC أو Conversion Rate خاصين بحملة دون مصدر مباشر أو تعريف واضح بأنها فرضية.

### 4.5 بيانات العميل

تُستخدم بيانات العميل الفعلية، عند توفرها وموافقة العميل، لرفع دقة العرض والشرائح والرسائل والـbenchmarks الداخلية. يجب فصلها عن بيانات السوق العامة، وتسجيل مصدرها وفترة القياس، وتطبيق anonymization وretention policy. لا يُسمح بأن تتحول نتيجة عميل واحد إلى benchmark عام للصناعة.

## 5. شرح خارطة التنفيذ ذات المراحل التسع

### المرحلة 1: Knowledge Contract

ننشئ عقود Zod وTypeScript لـ`IndustryProfile` و`MarketEvidenceSnapshot` و`SourceRecord` و`Claim` و`EvidencePackage`. نحدد في هذه المرحلة الفرق بين fact وinference وhypothesis، ونعرف حالات `fresh/stale/expired/unavailable`.

**شرط الإتمام:** كل مخرج سوقي أو صناعي يمكنه حمل source IDs ووقت الالتقاط وحدود الاستخدام، ولا يمكن للعقد قبول رقم سوقي بلا حالة ومصدر.

### المرحلة 2: Source Registry

ننشئ سجلًا مركزيًا للمصادر يحدد الناشر والرابط والنوع والترخيص والأسواق والصناعات واللغة وfreshness policy وطريقة الاستخراج والقيود. هذا السجل يمنع استخدام مصدر واحد خارج نطاقه، ويسمح بإيقاف مصدر متقادم دون تعديل القواعد يدويًا.

**شرط الإتمام:** يستطيع النظام معرفة لماذا استخدم مصدرًا، ومتى جُلب، ومتى ينتهي، وما الذي لا يثبته.

### المرحلة 3: Industry Profiles

نبني ملفات صناعية منفصلة للفروع الأربعة، ثم نبدأ بعدد محدود من الصناعات ذات الأولوية بدل محاولة دعم كل شيء منذ اليوم الأول. يحتوي الملف على دورة الشراء، العرض المعتاد، الشرائح، الاعتراضات، KPIs، قيود الامتثال، القنوات المحتملة، موسمية عامة موثقة، ومصطلحات السوق.

**شرط الإتمام:** عند إدخال نشاط، يستطيع النظام تحديد الصناعة المطابقة ودرجة المطابقة ومصدر قواعد الصناعة، أو يعلن `industry_profile_status: unmatched` بدل التخمين.

### المرحلة 4: Official Connectors

نربط المصادر الرسمية بصورة قابلة لإعادة التشغيل، مع rate limiting، retries، caching، raw snapshots، normalization، ومراقبة فشل المصدر. لا نبدأ بكل connectors مرة واحدة؛ الأولوية تكون لمصدر كلمات مفتاحية ومصدر إبداع تنافسي ومصدر وثائق منصات.

**شرط الإتمام:** يمكن إعادة إنتاج snapshot سابق، ومعرفة الفرق بين نسختين، وعدم فقد المصدر الأصلي.

### المرحلة 5: Evidence-aware CDKS

نوسع CDKS بحيث يستقبل `EvidencePackage` منفصلًا عن `WizardInput`. يمكن للأدلة أن تؤثر في توصيات السياق والرسائل والاختبارات والتحفظات، لكن لا تسمح بتجاوز قواعد الهدف أو readiness أو compliance أو blueprint-only.

**شرط الإتمام:** كل قرار يحتوي على `rule_id` و`evidence_ids` عند استخدام المعرفة الخارجية، أو يوضح أن القرار مبني على input/rule فقط. عند غياب دليل كافٍ يستخدم النظام `fail-closed`.

### المرحلة 6: Grounded Strategy Builder

يستقبل Strategy Builder مدخلات العميل وقرارات CDKS وEvidence Package، ويقترح فقط الرسائل والجماهير والاختبارات والزوايا التي يدعمها السياق. يمنع من تقديم benchmark أو معلومة تنافسية كحقيقة إذا لم توجد evidence مناسبة.

**شرط الإتمام:** كل proposal يحمل claims مصنفة، ومصادرها، ودرجة الثقة، ولا يستطيع تعديل canonical decisions مباشرة.

### المرحلة 7: Reasoning with citations

يشرح Reasoning سبب القرار أو الاقتراح، ويفصل بين ما هو صادر من CDKS وما هو مستنتج من السوق وما هو فرضية. يظهر `source_ids` و`limitations` و`confidence` و`freshness_status` في الـenvelope والواجهة.

**شرط الإتمام:** لا يوجد claim مهم بلا evidence أو تفسير صريح لكونه directional أو unavailable.

### المرحلة 8: Evaluation and drift

نضيف اختبارات للحداثة، التعارض، تغطية الاستشهادات، مطابقة الصناعة، وعدم اختلاق الأرقام. نضيف drift monitoring لاكتشاف تغير المصدر أو انتهاء snapshot أو تراجع جودة connector.

**شرط الإتمام:** تقارير دورية تحتوي على citation coverage، freshness compliance، contradiction count، unsupported numeric claims، industry match rate، ورفض AI policy violations.

### المرحلة 9: Client UX

نعرض للعميل حالة المعلومة بدل نص واحد يوحي بيقين زائف:

| الحالة | معناها في الواجهة |
|---|---|
| `system_validated` | اجتاز المخرج العقود والبوابات الداخلية |
| `evidence_backed` | يوجد مصدر مناسب ومؤرخ يدعم المعلومة |
| `directional_hypothesis` | استنتاج أو فرضية قابلة للاختبار وليست حقيقة |
| `stale` | المعلومة موجودة لكنها تجاوزت سياسة freshness |
| `unavailable` | لا يوجد مصدر كافٍ؛ لم يُخترع بديل |
| `rejected` | فشل المخرج في policy أو consistency gate |

**شرط الإتمام:** يستطيع العميل فهم مستوى الاعتماد دون أن يراجع كل قاعدة، بينما تبقى المصادر والتفاصيل متاحة عند الحاجة.

## 6. المتطلبات التشغيلية والأمنية

يحتاج النظام إلى jobs مجدولة لجلب البيانات وتحديث snapshots، وسجل أخطاء ومراقبة، وSecret Manager، وسياسة retention، وتشفير للبيانات الحساسة، وRBAC، وسجل تدقيق لكل قرار. لا نسمح بإرسال بيانات العميل إلى مزود AI إلا وفق `AI_DATA_POLICY`، ولا نخلط fixtures المجهلة ببيانات إنتاجية.

ويجب أن يبقى النظام Cloud Only كما تقرر سابقًا، مع مزود AI خارجي مضبوط، timeout وfallback وrate-limit handling، وتسجيل provider/model/version دون المفاتيح.

## 7. ما يمكن تنفيذه داخل المستودع وما يحتاج تجهيزًا خارجيًا

| العمل | يمكن تنفيذه داخل wizard-temp | يحتاج من الخارج |
|---|---:|---|
| العقود والـschemas | نعم | لا شيء |
| Source Registry | نعم | قرارات النطاق والترخيص |
| Industry Profiles الأولية | نعم | اختيار الصناعات ومراجعة المحتوى |
| Evidence Package وCDKS integration | نعم | لا شيء للـmock |
| Strategy/Reasoning grounding | نعم | API provider عند الاختبار الحي |
| Evaluation وdrift tests | نعم | snapshots حقيقية أو بيانات موثقة |
| Google connector | الكود نعم | Google Ads access وcredentials |
| Meta/TikTok connector | الكود حسب access | صلاحيات وشروط المصدر |
| قاعدة بيانات إنتاجية وjobs | تحتاج بيئة نشر | حساب cloud وsecrets وmonitoring |
| تقارير قطاعية مدفوعة | لا يمكن افتراضها | شراء أو ترخيص قانوني |
| بيانات حملات العميل | لا | موافقة العميل وواجهات analytics/CRM |

## 8. التجهيزات الفورية قبل بدء التنفيذ

الحد الأدنى المطلوب الآن هو اختيار صناعتين أو ثلاث للدفعة الأولى، وتحديد الدول الأولى داخل مصر والخليج، وتأكيد ما إذا كان المطلوب تحليل منافسين بأسماء محددة أم تحليل فئة سوقية عامة، وتحديد الـfreshness المطلوب لكل نوع من البيانات.

كما نحتاج إلى قرار بشأن connector الأول. أوصي بالبدء بمصادر لا تتطلب وصولًا حساسًا: وثائق المنصات الرسمية، snapshots مجهلة، ومصدر إبداع تنافسي عام ضمن شروط الاستخدام. بعد تثبيت العقود والاختبارات نضيف Google Keyword Planning، ثم أي مصدر آخر يحتاج حسابات أو تكلفة.

ولا نحتاج الآن إلى تزويدي بمفاتيح API في المحادثة. عند الحاجة تُضاف محليًا في `.env.local` أو في Secret Manager، وتظل خارج Git.

## 9. تقدير الأولوية

أوصي بتنفيذ أول دفعة بالترتيب التالي:

```text
Knowledge Contracts
→ Source Registry
→ Industry Profiles لعدد محدود
→ Evidence Snapshot mock + fixtures حقيقية مجهلة
→ Evidence-aware CDKS
→ Grounded Strategy Builder
→ Reasoning citations
→ Evaluation gates
→ Connectors الحية
→ Client UX النهائي
```

هذا الترتيب يمنع بناء connectors كثيرة قبل معرفة شكل المخرج، ويمنع تدريب نموذج على بيانات غير منظمة، ويجعل كل خطوة قابلة للاختبار والرجوع.

## 10. القرار النهائي

المشروع لا يحتاج الآن إلى تدريب أو Fine-tuning. يحتاج إلى **معرفة موثقة ومحدثة، عقود صريحة، مصدر لكل claim، قواعد تستخدم evidence بأمان، واختبارات تمنع عرض التخمين كحقيقة**. بعد اكتمال هذه البنية، يمكن تقييم Fine-tuning على بيانات معتمدة إذا بقيت مشكلة أسلوب أو صياغة، وليس باعتباره حلًا لمشكلة freshness أو market truth.

### مراجع رسمية

[1]: https://www.nist.gov/itl/ai-risk-management-framework "NIST AI Risk Management Framework"

[2]: https://transparency.meta.com/researchtools/ad-library-tools/ "Meta Ad Library Tools"

[3]: https://developers.google.com/google-ads/api/docs/keyword-planning/overview "Google Ads API Keyword Planning"

[4]: https://ads.tiktok.com/resources/help/article/creative-center?lang=en "TikTok Creative Center"

[5]: https://developers.google.com/google-ads/api/docs/start "Google Ads API Documentation"
