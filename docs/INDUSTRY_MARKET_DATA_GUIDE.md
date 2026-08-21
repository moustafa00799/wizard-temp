# دليل الحصول على بيانات الصناعات والأسواق لمنصة Campaign Builder AI

## الغرض من الدليل

هذا الدليل يشرح **ما البيانات التي تحتاجها المنصة، ومن أين تحصل عليها، وكيف تميز بين بيانات العميل الفعلية وإشارات السوق العامة والتقديرات الاتجاهية**. الهدف ليس جمع أكبر عدد من الأرقام، بل بناء Knowledge Layer قابلة للتدقيق، مرتبطة بصناعة وسوق ولغة وعملة وفترة ومصدر محدد.

تبدأ المنصة بتحديد الصناعة والسوق قبل جمع البيانات الفعلية. فالصناعة تحدد معنى التحويل والـfunnel والاعتراضات وKPIs، بينما يحدد السوق الدولة أو مجموعة الدول واللغة والعملة والنطاق الجغرافي. لا يجوز دمج بيانات مصر والسعودية والإمارات في claim واحد، ولا استخدام رقم من صناعة عامة لتبرير قرار خاص بقطاع فرعي.

> **قاعدة أساسية:** إذا لم يوجد مصدر مسموح وموثق ومؤرخ يثبت metric محددًا في نطاق صناعة وسوق محدد، تكون النتيجة `unavailable` مع سبب واضح، وليس رقمًا تقديريًا.

## 1. طبقات البيانات التي يجب جمعها

| طبقة المعرفة | أمثلة للبيانات | أفضل مصدر أولي | شكلها داخل Knowledge Layer | ما الذي لا يجوز استنتاجه |
|---|---|---|---|---|
| تعريف الصناعة | الفرع، القطاع، use case، دورة الشراء، العروض، الاعتراضات، KPIs | Wizard العميل، CRM، مقابلة موثقة، وثائق النشاط | `IndustryProfile` و`Claim` من نوع recommendation أو directional | لا يجوز اعتبار profile draft معيارًا سوقيًا |
| نطاق السوق | الدولة، المدينة، مناطق الخدمة، اللغة، العملة، فترة القياس | إعدادات العميل، ad account، CRM، مصدر حكومي | scope داخل كل snapshot/fact | لا يجوز نقل metric من سوق إلى آخر |
| أداء العميل | spend، impressions، clicks، leads، purchases، revenue، pipeline، calls، bookings | Ads Insights، GA4، CRM، ERP/POS، call tracking | `MarketFact` بحالة evidence-backed عند اكتمال المصدر | لا يمثل أداء المنافسين أو متوسط السوق |
| نية البحث | queries، impressions، clicks، CTR، position، keyword ideas، historical/forecast metrics | Search Console، Google Ads Keyword Planning، Google Trends | `KeywordSignal` أو `MarketFact` مع method وperiod | لا يجوز تحويل search interest إلى مبيعات أو CPC متحقق |
| التخطيط المدفوع | impressions/clicks/cost/CPC/CTR المتوقعة، budget scenarios | Google Ads Forecast، أدوات المنصة المصرح بها | Claim أو fact من نوع forecast/directional | forecast ليس أداءً فعليًا ولا benchmark عامًا |
| الإعلانات والمنافسون | creative format، hook، CTA، offer pattern، لغة الإعلان، منصة الظهور، تاريخ الرصد | Meta Ad Library، TikTok Creative Center، صفحات رسمية | `CompetitorObservation` | لا يجوز استنتاج spend أو ROAS أو conversion للمنافس من مجرد ظهور الإعلان |
| الاقتصاد والقطاع | السكان، قوة العمل، الأسعار، التجارة، الناتج، مؤشرات القطاع، التجارة الرقمية | CAPMAS، GASTAT، FCSC، GCC-Stat، World Bank | `MarketFact` مع indicator code وperiod وunit | لا يساوي إجمالي السكان حجم جمهور قابل للاستهداف |
| التطبيق | installs، sales، subscriptions، crashes، ANR، retention، reviews | App Store Connect، Play Console Reporting، Firebase/GA4، MMP | `MarketFact` أو first-party event snapshot | لا يمثل app benchmark عامًا إلا إذا كان المصدر يثبت ذلك صراحة |
| الحضور المحلي | locations، reviews، calls، bookings، service areas | Google Business Profile، CRM، call/booking system | `MarketFact` أو `CompetitorObservation` حسب الملكية | لا يمثل كل الطلب المحلي أو CPC المحلي |
| الامتثال | قيود المنتجات، الترخيص، claims، الخصوصية، الموافقات، الفئات الخاصة | وثائق رسمية، legal/compliance review، سياسات المنصة | `Claim` وlimitations وwarnings | لا يُنشأ claim قانوني أو تنظيمي من مصدر عام غير موثق |

## 2. خريطة الأدوات والمصادر

### أ. بيانات العميل المملوكة: نقطة البداية الإلزامية

بيانات العميل هي أقوى مصدر لتخصيص الاستراتيجية، لأنها تصف نشاطًا وحسابًا فعليًا. يجب البدء منها قبل شراء تقارير السوق أو تشغيل أي connector عام. وتشمل حسابات الإعلانات المصرح بها، GA4، Search Console، CRM، ERP/POS، المتجر، نظام المكالمات والحجوزات، وأدوات قياس التطبيقات.

يوفر Google Analytics Data API تقارير مخصصة مثل `runReport` و`runFunnelReport` و`runRealtimeReport`، مع احترام إعداد Reporting Identity في property؛ لذلك يجب حفظ إعداد الهوية وطريقة العد عند تخزين أي KPI [12]. ويوفر Search Console API أبعادًا مثل page وquery وcountry وdevice، ويوصي باستعلام يومي ليوم واحد لأن البيانات قد تتأخر عادةً 2–3 أيام، مع حد معلن للصفوف اليومية لكل search type [13].

للحسابات المدفوعة، يوفر Meta Ads Insights API بيانات أداء قابلة للتخصيص عبر مستويات الحساب والحملة ومجموعة الإعلانات والإعلان، ويشير إلى استخدام Pixel أو Conversions API لتسجيل الأحداث المراد قياسها [7]. وتوفر LinkedIn وTikTok وGoogle Ads مسارات تقارير أو conversion عند توافر الحساب والصلاحيات المناسبين [9] [10] [11]. هذه البيانات تظل **بيانات العميل** وليست benchmark عامًا للصناعة.

### ب. أدوات Google للبحث والتخطيط

يدعم Google Ads Keyword Planning API توليد keyword ideas وad group themes وhistorical metrics وforecast metrics. وتذكر وثائق Google أن historical metrics تُحدّث شهريًا تقريبًا وأن الطلبات rate-limited، ولذلك يجب تخزين النتائج مع query parameters وscope ووقت الالتقاط وعدم تكرار الاستعلام بلا حاجة [1].

تستخدم Google Ads Forecast Metrics للتقدير على campaign configuration مقترح، وقد تشمل impressions وCTR وaverage CPC وclicks وcost. ويتأثر forecast بالكلمات والمواقع واللغات وCPC bid والفترة وإعدادات الحملة، ولذلك يجب تخزينه كـforecast/directional لا كأداء محقق [4]. الوصول البرمجي يحتاج OAuth 2.0 وdeveloper token، كما أن Access Level يحدد الحسابات والعمليات والخدمات المسموح بها؛ وتقيّد بعض مستويات الوصول خدمات التخطيط [2] [3].

Google Trends مناسب لإشارات موضوعية أو موسمية واتجاهات البحث. تسمح الواجهة بتصدير chart إلى CSV، وتطلب Google نسبة البيانات إليها عند إعادة الاستخدام، كما تفرق صراحة بين Trends وGoogle Ads [5]. داخل Knowledge Layer يحفظ كل export مع المصطلح أو topic، البلد، الفترة، category، search type، تاريخ التصدير، والرابط؛ ولا يحول إلى CPC أو conversion أو saturation.

### ج. مكتبات الإعلانات والـcreative signals

يسمح Meta Ads Archive API بالبحث في الإعلانات المؤرشفة عبر كلمات النص والصور والصوت في الفيديو وزر الدعوة إلى الإجراء، مع فلاتر لحالة الإعلان وتاريخ التسليم والدول واللغات ونوع الوسائط والمنصات وPage IDs [6]. وتوضح Meta أن البحث لا يترجم كلمات البحث، ولذلك يجب تكرار البحث باللغات المناسبة. يستخدم هذا المصدر لتسجيل **أنماط إبداعية وعروض ورسائل ووجود إعلاني**، وليس لاستخراج أداء منافس أو CPC أو ROAS.

يوفر TikTok Creative Center أقسام Top Ads وTrends وInfluencer marketing وCreative Tools [8]. يسجل النظام منه creative patterns وhooks وformats وموضوعات واتجاهات مع رابط وبلد ولغة وفترة ووقت التقاط. لا تُدخل أمثلة case studies أو عبارات top-performing كمتوسطات سوقية، ولا تُدخل أرقام CPA أو ROAS أو CPM للمثال على أنها معيار عام.

### د. مصادر الجمهور والحضور المحلي والتطبيقات

تتضمن LinkedIn Marketing APIs مسارات للحملات والتقارير وLead Sync وConversions وAudience Insights، لكن الوصول يعتمد على التطبيق والصلاحيات وحالة الاستخدام [10]. وتسمح LinkedIn Conversions API بإرسال conversion events من خادم المعلن لقياس أثر الحملات، مع permissions وأدوار مناسبة على الحساب [11].

تتيح Google Business Profile APIs إدارة المواقع والتفاعل مع reviews وposts وquestions ومتابعة engagement مثل calls وbookings للمواقع المصرح بها [14]. هذه البيانات مناسبة للصناعات المحلية، خصوصًا عند دمجها مع CRM ونظام المكالمات والحجوزات.

لتطبيقات iOS، يتيح App Store Connect API أتمتة بيانات Analytics وSales and Finance وPower and Performance Metrics وCustomer Reviews وغيرها من موارد App Store Connect [15]. ولتطبيقات Android، يتيح Google Play Developer Reporting API الوصول البرمجي إلى بيانات التطبيق لأغراض reporting والتحليل الداخلي، بما في ذلك Android vitals مثل crash rate وANR [16].

### هـ. المصادر الحكومية والاقتصادية

تستخدم البيانات الحكومية كسياق للسوق والقطاع، لا كبديل عن أداء الحملات. توفر CAPMAS المصرية بوابة وCentral Data Catalog للإصدارات والبيانات السكانية والاقتصادية والاجتماعية [18]. وتوفر GASTAT السعودية فئات للاقتصاد والأسعار والأعمال والاقتصاد الرقمي والتجارة وغيرها [19]. وتوفر FCSC في الإمارات UAE.STAT وبيانات السكان وقوة العمل والاقتصاد والبيانات المفتوحة [20]. ويقدم GCC-Stat بوابة «مرسى» وإصدارات ومؤشرات مشتركة لدول الخليج [21]. كما يوفر World Bank Indicators API سلاسل زمنية لمؤشرات عامة مثل السكان والدخل وغيرها [17].

كل مؤشر حكومي يجب أن يحفظ معه اسم الجهة، اسم الـdataset أو النشرة، indicator code إن وجد، الفترة، الوحدة، الدولة أو المنطقة، تاريخ الإصدار، تاريخ الالتقاط، ورابط المصدر. لا يجوز استعمال إجمالي السكان أو الناتج أو التجارة كحجم جمهور مستهدف أو CPC أو saturation.

### و. المصادر التجارية المرخصة

يمكن لاحقًا تقييم أدوات مدفوعة مثل Similarweb وSemrush وSensor Tower وdata.ai وEuromonitor وStatista وNielsen أو YouGov بحسب الصناعة والسوق. هذه ليست مصادر رسمية تلقائيًا، ولا يجب إدخال نتائجها إلى Evidence Package إلا بعد توثيق الترخيص، تاريخ الاستخراج، تعريف metric، نطاق التغطية، طريقة التقدير، والقيود. تحفظ في `SourceRecord` كـ`licensed_report` مع `licenseStatus` مناسب.

لا ينبغي شراء أي أداة تجارية قبل تحديد السؤال الذي ستجيب عنه. فإذا كان المطلوب هو قياس أداء العميل، فـGA4 وCRM وAds Insights أولى. وإذا كان المطلوب هو اتجاهات المنافسين الإبداعية، فالمكتبات الرسمية العامة قد تكفي. وإذا كان المطلوب تقدير قطاع كامل أو app intelligence، فقد يكون التقرير المرخص مناسبًا، لكن نتيجته تظل منفصلة عن observed first-party performance.

## 3. ماذا نحتاج لكل صناعة؟

### E-commerce

الحد الأدنى هو كتالوج المنتجات، الأسعار، الهوامش أو نطاقات الربحية إن كان العميل يسمح، المخزون، الشحن والإرجاع، order events، add-to-cart، checkout، purchase، revenue، currency، country، product category، ومصادر الزيارات. يضاف إليها GA4 وSearch Console وAds Insights وcatalog/feed وتقارير المتجر.

يستخدم Knowledge Layer هذه البيانات لبناء funnel خاص بالمتجر وتحديد الرسائل والاعتراضات والـtracking needs. أما CPC أو حجم الطلب في السوق فلا يملأ من افتراضات المنتج؛ يطلب من Google Ads/Trends أو مصدر مرخص موثق، وإلا يبقى `unavailable`.

### Local Service

الحد الأدنى هو نوع الخدمة، مناطق التغطية، ساعات العمل، سعة الفريق، calls، messages، lead forms، qualified leads، bookings، show-up، revenue أو closed jobs، وزمن الاستجابة. يضاف Google Business Profile وGoogle Ads وMeta lead data وCRM وcall tracking عند توفرها.

يجب فصل `lead` عن `qualified_lead` وعن `booked_appointment` وعن `completed_service`. وجود reviews أو ظهور محلي لا يثبت حجم الطلب ولا conversion rate. بيانات المكالمات أو الحجوزات تحتاج consent وretention policy ونطاقًا زمنيًا.

### Mobile App

الحد الأدنى هو install، first open، activation، تعريف retention، subscription أو purchase، revenue، crash/ANR، app version، OS، country، attribution source، وconsent state. يضاف Firebase/GA4 أو MMP، App Store Connect، Google Play Reporting، وAds Insights من الحسابات المصرح بها.

يجب توثيق تعريف كل event وعدم استخدام `install` بديلًا عن `activation` أو `subscription`. تقارير المتجر قد تصف التطبيق المملوك فقط، بينما أدوات الإعلانات تصف الحساب المصرح به؛ لا توجد منها تلقائيًا benchmark صناعة.

### B2B

الحد الأدنى هو account/company type، lead، MQL، SAL، SQL، opportunity، proposal، win/loss، pipeline value، sales cycle، decision-maker role، source، campaign ID، وCRM stage timestamps. يضاف LinkedIn Marketing/Conversions عند توافره، GA4 وSearch Console وwebinar/demo systems وCRM.

ينبغي عدم خلط lead volume مع pipeline quality. إذا لم توجد بيانات كافية عن المراحل اللاحقة، تستخدم المنصة `unknowns` و`unavailable` بدل تقدير win rate أو CAC أو LTV.

## 4. استراتيجية الوصول: Build versus Buy

| الحاجة | ابدأ بـ | أضف لاحقًا | قرار الشراء |
|---|---|---|---|
| أداء العميل | exports أو API من الحساب المصرح، GA4، GSC، CRM | connectors وجدولة ومزامنة | لا تشترِ تقريرًا سوقيًا لتعويض غياب tracking |
| نية البحث | Search Console وGoogle Trends | Google Ads Keyword Planning | استخدم API إذا كان هناك volume وحاجة إلى reproducibility |
| creative research | Meta Ad Library وTikTok Creative Center | أدوات licensed creative intelligence | اشترِ فقط إذا كانت التغطية والنطاق موثقين |
| سوق/قطاع | CAPMAS/GASTAT/FCSC/GCC-Stat/World Bank | licensed sector reports | اسأل أولًا عن dataset definition وgeography وrelease date |
| تطبيق | App Store Connect وPlay Reporting وFirebase/MMP | Sensor Tower/data.ai ونحوها | اشترِ عندما يتطلب القرار app-market coverage لا يملكها العميل |
| B2B firmographics | CRM وLinkedIn APIs وcompany websites الرسمية | provider مرخص | لا تعتبر headcount أو industry label حقيقة دون مصدر وتعريف |

**القاعدة العملية:** ابدأ بملفات CSV/JSON ثابتة وfixtures deterministic، ثم ابنِ connector واحدًا منخفض المخاطر بعد تثبيت schema وscope وfreshness وlicense. لا تبدأ بـAI حي أو scraping واسع قبل وجود هذه البوابات.

## 5. الحقول الإلزامية عند تسجيل أي مصدر أو قيمة

لكل `SourceRecord` يجب حفظ `sourceId` وpublisher وsourceUrl وsourceType وmarket/industry إن كانت محددة وlanguage وlicenseStatus وobservedAt وfreshnessPolicy وversion وlimitations وenabled. ولا تكفي خانة URL وحدها لإثبات أن metric صالح.

لكل evidence يجب حفظ `evidenceId` وsourceId وobservedAt وexcerpt أو reference قابل للمراجعة وlimitations. لكل metric رقمي يحفظ النظام القيمة والوحدة والعملة والفترة وطريقة الاستخراج، ويميز observed عن forecast وعن directional hypothesis.

لكل claim يحفظ النظام النص، النوع، السوق، الصناعة، درجة الثقة، evidence IDs، تاريخ الإنشاء، valid-until إن وجد، والقيود. الـfact أو inference الذي يعلن `evidence_backed` دون evidence IDs يجب رفضه. وإذا كانت القيمة غير متاحة، تستخدم الصيغة التالية:

```json
{
  "value": null,
  "status": "unavailable",
  "sourceIds": [],
  "unavailableReason": "No verified market source is registered for this metric and scope."
}
```

## 6. سياسة درجات المصدر

| المستوى | الوصف | طريقة الاستخدام |
|---|---|---|
| A — First-party/official | بيانات حساب العميل أو جهة حكومية/منصة رسمية موثقة | يمكن أن تكون evidence-backed إذا كان النطاق والتاريخ والمنهج مكتملين |
| B — Licensed report | تقرير تجاري مرخص أو dataset مدفوع بتعريف واضح | evidence-backed بشروط الترخيص والنطاق والتاريخ؛ يظل غير رسمي |
| C — Public directional | Trends وCreative Center وAd Library وإشارات عامة | directional/observed pattern، لا benchmark أداء إلا إذا أثبت المصدر ذلك صراحة |
| D — Internal hypothesis | فرضية من فريق التسويق أو profile draft | recommendation أو directional فقط، ولا evidence-backed |

يمكن ضبط freshness بحسب طبيعة المصدر: أداء العميل قد يحتاج daily، إشارات البحث أو التقارير قد تكون weekly أو monthly، والمصدر الإصدارِي أو on-demand يظل مرتبطًا بتاريخ الإصدار/الالتقاط ولا يصبح صالحًا تلقائيًا لمجرد وجوده في registry.

## 7. بوابة إعلان Market-Validated

لا تستخدم المنصة وصف **Market-Validated** إلا إذا تحققت الشروط التالية لكل claim سوقي، وليس لاسم الصناعة فقط:

| الشرط | المطلوب |
|---|---|
| Scope | السوق والصناعة واللغة والعملة والفترة مطابقة تمامًا للسؤال |
| Source | مصدر رسمي أو مرخص ومسموح بالاستخدام، بإصدار ورابط واضحين |
| Observation | قيمة ملتقطة أو مستخرجة مع observedAt وmethod، لا تخمين أو نسخ يدوي بلا أثر |
| Evidence | evidence reference يربط claim بالمصدر، مع excerpt أو query/export قابل للمراجعة |
| Freshness | snapshot/source داخل freshness policy أو يحمل سببًا واضحًا للتقادم |
| Contradictions | لا توجد تعارضات غير محلولة، أو تعرض التعارضات كـlimited لا كـready |
| Reproducibility | query parameters أو file hash أو export محفوظ لاستعادة النتيجة |
| Coverage | كل metric مؤثر في claim له دليل؛ لا يكفي مصدر واحد عام لتغطية كل السوق |

إذا فشل شرط واحد، يستخدم النظام `limited` أو `directional` أو `unavailable` حسب الحالة. لا يوجد «متوسط CPC» أو «نسبة تشبع» افتراضية للملء التلقائي.

## 8. ترتيب التنفيذ المقترح

### المرحلة صفر: اعتماد taxonomy

يحدد صاحب المنتج من ثلاث إلى خمس صناعات ذات أولوية، مع الصناعة الفرعية، الأسواق، اللغات، العملات، والأهداف. يفضل استخدام hierarchy ثابت: `branch → industryKey → useCase`. لا تضف alias جديدًا إلا بعد اعتماده، ولا تجعل resolver يستنتج الصناعة من نص حر.

### المرحلة الأولى: تجهيز بيانات العميل

ينشئ العميل أو الفريق exports ثابتة من CRM والمتجر والتحليلات وحسابات الإعلانات. لكل export يحفظ وقت الالتقاط، الفلاتر، timezone، currency، attribution window، event definitions، ونسخة الملف. هذه المرحلة تبني أساسًا خاصًا بالعميل حتى لو لم تتوفر أي market data خارجية.

### المرحلة الثانية: مصادر رسمية عامة

يضاف Google Trends أو Google Ads Keyword Planning للبحث، Meta Ad Library أو TikTok Creative Center للإشارات الإبداعية، والمصدر الحكومي المناسب للسوق. تظل النتائج محددة النطاق ومؤرخة، وتوضع كـdirectional حين لا يكون المصدر أداءً ملاحظًا.

### المرحلة الثالثة: المصادر المرخصة

إذا بقي سؤال تجاري مهم بلا إجابة، يحدد الفريق metric والـscope المطلوب قبل شراء dataset. يفحص الترخيص، طريقة التقدير، التغطية، تاريخ التحديث، سياسة التخزين، وإمكانات export/API. يسجل المصدر في registry قبل إدخال أي claim.

### المرحلة الرابعة: المراجعة والـgates

تمر الحزمة عبر schema validation وsource referential integrity وscope وfreshness وcontradiction checks. تراجع unknowns وlimitations يدويًا، ثم تدمج Knowledge Layer مع الاستراتيجية بصورة تفسيرية فقط؛ لا تعدل هذه المرحلة Canonical Blueprint ولا تمنح AI سلطة إطلاق أو تغيير قرار CDKS.

## 9. ما يجب طلبه من العميل في Wizard أو onboarding

| المدخل | مثال على شكل الإجابة |
|---|---|
| الصناعة الأساسية | `dental_clinic` أو `fashion_ecommerce` بدل `business` فقط |
| الفرع | `local_service` أو `ecommerce` أو `app` أو `b2b` |
| الأسواق | `EG`، `SA`، `AE`، أو مدن/مناطق محددة |
| اللغات والعملات | `ar/en` و`EGP/SAR/AED` بحسب الحساب |
| الهدف والتحويل | purchase، qualified lead، booked appointment، activation، opportunity |
| دورات القياس | يومي/أسبوعي/شهري، attribution window، timezone |
| مصادر العميل | Ads account، GA4، GSC، CRM، store، app analytics |
| القيود | منتجات ممنوعة، claims مقيدة، consent، مناطق خدمة، موافقات |
| أولوية المعرفة | ما السؤال الذي يجب أن يجيب عنه النظام أولًا؟ |

## 10. توصية البداية للمشروع الحالي

البنية الحالية تدعم أربعة فروع draft: `ecommerce` و`local_service` و`app` و`b2b`. قبل بناء بيانات سوق فعلية، ينبغي أن يعتمد صاحب المشروع قائمة أولويات أكثر تحديدًا، مثل «عيادات الأسنان في مصر» أو «متجر أزياء في السعودية» أو «SaaS B2B في الإمارات»، مع توضيح هل المطلوب هو بيانات عامة، أم بيانات العميل، أم benchmark مرخص.

الدفعة التقنية الحالية جاهزة لاستقبال ذلك من خلال `SourceRecord` و`EvidencePackage` و`IndustryProfile` و`MarketEvidenceSnapshot`. لكنها لا تحتوي بعد على snapshots سوقية رسمية كافية، ولذلك تظل Industry Profiles بصيغة draft، وتظل قيم CPC وsaturation وbenchmarks غير المتاحة `unavailable`.

القرار التنفيذي الموصى به هو اعتماد **صناعتين أو ثلاثًا فقط كبداية**، ثم تنفيذ source matrix لكل صناعة وسوق، وجمع first-party exports أولًا، وبعد ذلك إضافة مصدر رسمي عام واحد لكل سؤال سوقي محدد. بهذه الطريقة تستطيع المنصة أن تتوسع دون خلط الأسواق أو اختلاق أرقام، ودون المساس بسلطة CDKS أو Blueprint-only.

## 11. روابط الأدوات الرسمية

| المجال | الرابط |
|---|---|
| Google Ads Keyword Planning | [Keyword Planning API][1] |
| Google Ads authentication | [OAuth 2.0 for Google Ads API][2] |
| Google Ads access | [Access Levels and Permissible Use][3] |
| Google Ads forecasts | [Generate Forecast Metrics][4] |
| Google Trends | [Export, embed, and cite Trends data][5] |
| Meta Ad Library | [Ads Archive API][6] |
| Meta performance | [Ads Insights API][7] |
| TikTok creative | [TikTok Creative Center][8] |
| TikTok business reporting | [TikTok Business API][9] |
| LinkedIn marketing | [LinkedIn Marketing API Program][10] |
| LinkedIn conversions | [LinkedIn Conversions API][11] |
| Google Analytics | [Google Analytics Data API][12] |
| Search Console | [Search Console performance data][13] |
| Local business | [Google Business Profile APIs][14] |
| iOS apps | [App Store Connect API][15] |
| Android apps | [Google Play Developer Reporting API][16] |
| Global context | [World Bank Indicators API][17] |
| Egypt | [CAPMAS][18] و[CAPMAS Central Data Catalog][18a] |
| Saudi Arabia | [GASTAT Statistics Categories][19] |
| United Arab Emirates | [FCSC UAE Official Statistics][20] |
| GCC | [GCC-Stat][21] |

## References

[1]: https://developers.google.com/google-ads/api/docs/keyword-planning/overview "Google Ads API — Keyword Planning"
[2]: https://developers.google.com/google-ads/api/docs/oauth/overview "Google Ads API — OAuth 2.0"
[3]: https://developers.google.com/google-ads/api/docs/api-policy/access-levels "Google Ads API — Access Levels and Permissible Use"
[4]: https://developers.google.com/google-ads/api/docs/keyword-planning/generate-forecast-metrics "Google Ads API — Generate Forecast Metrics"
[5]: https://support.google.com/trends/answer/4365538?hl=en "Google Trends — Export, embed, and cite Trends data"
[6]: https://developers.facebook.com/docs/graph-api/reference/ads_archive/ "Meta Graph API — Ads Archive"
[7]: https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights "Meta Ads Insights API"
[8]: https://ads.tiktok.com/creative/creativeCenter "TikTok Creative Center"
[9]: https://business-api.tiktok.com/portal/docs "TikTok API for Business"
[10]: https://learn.microsoft.com/en-us/linkedin/marketing/?view=li-lms-2026-07 "LinkedIn Marketing API Program"
[11]: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/conversions-api?view=li-lms-2026-07 "LinkedIn Conversions API"
[12]: https://developers.google.com/analytics/devguides/reporting/data/v1 "Google Analytics Data API overview"
[13]: https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data "Search Console API — Getting your performance data"
[14]: https://developers.google.com/my-business "Google Business Profile APIs"
[15]: https://developer.apple.com/documentation/appstoreconnectapi "App Store Connect API"
[16]: https://developers.google.com/play/developer/reporting "Google Play Developer Reporting API"
[17]: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation "World Bank Indicators API documentation"
[18]: https://www.capmas.gov.eg/ "CAPMAS — Egypt"
[18a]: https://censusinfo.capmas.gov.eg/Metadata-en-v4.2/index.php/catalog/ "CAPMAS Central Data Catalog"
[19]: https://www.stats.gov.sa/en/statistics "GASTAT — Statistics Categories"
[20]: https://fcsc.gov.ae/ "Federal Competitiveness and Statistics Centre — UAE"
[21]: https://gccstat.org/ "GCC-Stat"
