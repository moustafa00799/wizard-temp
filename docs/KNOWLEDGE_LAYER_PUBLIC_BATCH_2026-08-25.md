# تقرير الدفعة العامة الأولى من Knowledge Layer وMarket Intelligence

**المشروع:** Campaign Builder AI / CDKS

**تاريخ الالتقاط:** 25 أغسطس 2026

**النطاق:** مصر والسعودية؛ التجارة الإلكترونية، التعليم، والخدمات المحلية؛ العربية والإنجليزية بحسب المصدر.

> **الحالة الرسمية:** هذه الدفعة حسّنت التغطية العامة القابلة للتدقيق، لكنها لا تجعل النظام Market-Validated. ما زالت `globalMarketValidated=false`، والحزم الثلاث المنشأة حالتها `limited` وليست `ready`.

## ما تم تنفيذه

تم فحص Git قبل التعديل، ثم إضافة إصلاح مستقل يسمح للمصادر الرسمية العامة ذات النطاق العام، مثل World Bank، بأن تطابق السوق والصناعة واللغة المطلوبة عندما لا يفرض المصدر قيدًا صريحًا على ذلك البعد. كما أضيفت بوابة تمنع الحزمة من أن تُصنَّف `ready` عندما تحتوي على فجوة تغطية موثقة.

تم بناء ingestion حتمي لمؤشرات World Bank يختار أحدث ملاحظة غير فارغة لكل دولة ومؤشر، مع الاحتفاظ بالرابط، الفترة، الوحدة، وقت الالتقاط، hash الملف الخام، والقيود. واجهة World Bank Indicators API العامة لا تتطلب مفتاح API، وتوفر وصولًا برمجيًا إلى سلاسل زمنية متعددة؛ لذلك استُخدمت كسياق عام لا كبديل لبيانات الحملات أو الجمهور القابل للاستهداف [1].

تم تحويل نشرة CAPMAS التعليمية الرسمية للعام الأكاديمي 2019/2020 إلى حقائق منظمة ومقيدة الفترة. وتؤكد النشرة أنها تغطي المدارس والمعاهد ومراكز التدريب والقطاعين الحكومي والخاص، وأن أرقامها مخصصة للسياق التعليمي والتخطيط؛ لذلك لم تُستخدم لإثبات طلب إعلاني حالي أو أداء تجاري [2].

تم التقاط أربع صفحات عامة من Google Trends، بالإنجليزية والعربية لمصر والسعودية، لنطاق آخر خمس سنوات وبحث الويب. حُفظت المصطلحات، الروابط، متوسطات المؤشر النسبي، بعض الاستعلامات ذات الصلة، والمناطق الفرعية الظاهرة. Google Trends يعطي مؤشرًا نسبيًا من 0 إلى 100 داخل المقارنة، وليس حجم بحث مطلقًا أو CPC أو تحويلات [3] [4] [5].

تم فحص بوابة GASTAT وفئات الإحصاءات العامة السعودية، لكن الوصول إلى بيانات API التفصيلية يتطلب حسابًا وتطبيقًا ومفتاح مصادقة بحسب البوابة؛ لذلك بقيت سجلات GASTAT الحالية discovery metadata ولم تُستخدم كحقائق رقمية [6].

تم استخدام TikTok Business للقراءة فقط لاكتشاف الحسابات المصرح بها وقراءة metadata والتقرير الأساسي. اكتُشفت أربعة حسابات، وكلها مصرية بعملة EGP وحالة مفعلة. التقرير المحدود للفترة 2026-07-26 إلى 2026-08-24 أعاد 40 صفًا على مستوى الحملات عبر أربع صفحات، وظهرت ثلاثة معرفات معلنين في الصفوف، وكانت مقاييس الإنفاق والانطباعات والنقرات والتحويلات في الصفوف المعادة صفرية. هذه بيانات first-party خاصة بقياس نافذة محددة وليست benchmark عامًا، ولذلك بقيت خارج public manifest. وثائق TikTok تفرق بين قدرات التقارير وقدرات الإدارة؛ ولم تُستخدم أي عملية إنشاء أو تعديل أو حذف أو ميزانية أو مزايدة أو جمهور أو كتالوج [7].

## الحقائق المنظمة الحالية

| المجموعة | العدد | الاستخدام المسموح | القيود الأساسية |
|---|---:|---|---|
| World Bank latest observations | 10 | سياق سكاني ورقمي واقتصادي عام لمصر والسعودية | أحدث قيمة غير فارغة؛ ليست audience size أو demand أو performance benchmark |
| CAPMAS education facts | 6 | سياق عرض ومشاركة قطاع التعليم في مصر | سنة 2019/2020 فقط؛ ليست طلبًا حاليًا أو أداءً إعلانيًا |
| Google Trends snapshots | 4 | إشارة اكتشاف اتجاهية للمصطلحات العربية والإنجليزية | مؤشر نسبي؛ لا يُقارن كحجم مطلق بين صفحات مختلفة |
| Registered public sources | 9 | Source Registry وprovenance | ثلاثة صفوف discovery-only أو عامة بلا قيمة metric مباشرة |
| Raw artifacts hash-checked locally | 22 | تدقيق وإعادة فحص محلي | PDFs وHTML الخام الكبير بقيت خارج commit عمدًا |

أحدث الملاحظات العامة المنظمة التي حُفظت لمصر تشمل: مستخدمو الإنترنت **74.64839935% في 2024**، السكان **118,365,995 في 2025**، السكان الحضريون **42.9043204925248% في 2025**، ومؤشر GDP per capita PPP **20,204.0130500153 دولارًا دوليًا حاليًا للفرد في 2025**. وتشمل السعودية: مستخدمو الإنترنت **100% في 2024**، السكان **36,973,555 في 2025**، السكان الحضريون **84.6123121062185% في 2025**، ومؤشر GDP per capita PPP **73,783.5613906833 دولارًا دوليًا حاليًا للفرد في 2025**. كما أُبقيت literacy ضمن سياقها الزمني: مصر **79.4531619498685% في 2022** والسعودية **97.9300003051758% في 2024**. هذه الأرقام مؤشرات سياق عامة ويجب ألا تدخل Blueprint كجمهور قابل للاستهداف أو كـbenchmark إعلاني [1].

ومن نشرة CAPMAS التعليمية، تم تثبيت: **487 مؤسسة تدريب حكومية**، **344,398 دارسًا حكوميًا**، و**282,163 خريجًا حكوميًا** للعام الأكاديمي 2019/2020. كما سُجلت نسب الاستجابة المنهجية الظاهرة في النشرة: **96.2% للمصادر الحكومية** و**98.4% للمصادر الخاصة التابعة للنطاق المذكور**. هذه facts تعليمية تاريخية موثقة، وليست توقعًا للطلب أو قياسًا لحجم الجمهور الإعلاني [2].

في Google Trends، أظهرت صفحة مصر الإنجليزية متوسطات نسبية قدرها **47 للتسوق عبر الإنترنت، 31 للدورات عبر الإنترنت، و2 للخدمات المحلية**. وأظهرت صفحة السعودية الإنجليزية **55 و21 و2** بالترتيب نفسه. أما المقارنة العربية فأظهرت مصر **1 و0 و0** والسعودية **1 و3 و0**، مع رسالة صريحة بعدم كفاية البيانات لعبارة الخدمات المحلية في المقارنتين العربيتين. هذه إشارات اكتشاف منخفضة أو اتجاهية، ولا تُفسَّر على أنها حجم طلب [3] [4] [5].

## الحزم المحدودة المنشأة

| الحزمة | النطاق الدقيق | الحالة | المصادر المرتبطة | أهم ما ينقصها |
|---|---|---|---:|---|
| `pkg-eg-education-public-20260825` | EG / education_general / ar / EGP | `limited`, freshness `fresh` | 3 | طلب التعليم الحالي، audience size، CPC/CPA/CVR/ROAS، creative observations، بيانات funnel |
| `pkg-sa-ecommerce-public-20260825` | SA / ecommerce_general / ar / SAR | `limited`, freshness `fresh` | 2 | مصدر سعودي رقمي على مستوى dataset، حجم البحث المطلق، CPC/CPA/CVR/ROAS، creative observations، بيانات funnel |
| `pkg-eg-local-service-public-20260825` | EG / local_service_general / ar / EGP | `limited`, freshness `fresh` | 2 | دليل طلب محلي كافٍ، حجم البحث، CPC/CPA/CVR/ROAS، creative observations، بيانات CRM/calls |

كل حزمة تحتوي على facts متاحة وfacts `unavailable` صريحة، وإشارات keyword اتجاهية أو غير متاحة، وseasonality غير متاحة، وcompetitor observations غير متاحة. هذا التصميم يمنع الاستدلال الصامت أو اختلاق benchmarks، ويحافظ على سلطة CDKS وBlueprint-only.

## الفجوات التي لم تُغلق

| الفجوة | الحالة الحالية | المسار الصحيح التالي |
|---|---|---|
| GASTAT metric-level | غير متاح بلا account/application/auth key أو export رسمي | تفعيل وصول رسمي أو رفع export ناتج من البوابة؛ لا حاجة لطلب كلمة المرور في المحادثة |
| Google Ads Keyword Planner | غير متصل | إضافة وصول read-only رسمي ثم تخزين keyword ideas/historical metrics مع وقت التحديث والحدود [8] |
| GA4 وSearch Console وCRM/Store | غير متصل | رفع exports رسمية ينتجها صاحب الحساب إذا تعذر OAuth؛ تبقى first-party ولا تتحول إلى benchmark عام |
| TikTok Creative Center | لم تُلتقط observations عامة بعد | جمع observations يدوية عامة للرسائل والعروض والوجود فقط، بلا performance claims |
| Meta | مؤجل كما طُلب | تنفيذ آخرًا وبـread-only فقط بعد تثبيت بقية طبقة الأدلة |
| English exact-scope packages | غير منشأة في هذه الدفعة | إعادة بناء الحزم بعد توافر مصدر إنجليزي أو اعتماد قرار تغطية locale صريح |
| الثلاثة المقابلة للسعودية/التعليم والخدمات المحلية | غير منشأة | إضافة مصادر سعودية dataset-level ثم إعادة تشغيل الحزم والبوابات |

لم تُسجل أي قيمة لـ**CPC أو CPA أو CVR أو ROAS أو reach أو frequency أو saturation أو competitor performance أو client funnel performance** في public batch. عند غياب المصدر الموافق للنطاق، القيمة `unavailable` مع سبب صريح.

## سياسة التخزين وإعادة التشغيل

تم commit الآثار المنظمة الصغيرة وسكربتات إعادة البناء، بما في ذلك Source Registry وlatest observations وGoogle Trends normalized observations وCAPMAS facts وEvidence Packages وQuality Report. لم تُضف ملفات CAPMAS PDF أو HTML الخام الكبير إلى Git؛ بقيت محليًا في شجرة البيانات لأغراض التدقيق، وسُجلت hashes وروابطها في manifest. عند نقل التخزين إلى object storage، يُحافظ على نفس artifact IDs وhashes وsource URLs.

يمكن إعادة تنفيذ الدفعة من جذر المستودع بالأوامر التالية:

```bash
npm run knowledge:public:ingest
npm run knowledge:public:manifest
npm run knowledge:public:packages
npm run test:knowledge:public-ingestion
npm run test:knowledge:public-evidence
npm run test:knowledge:public-quality
```

## نتائج الاختبارات والـCI

اجتازت regression الخاصة بالنطاق العام وEvidence Package **19 assertion**، واجتازت regression الخاصة بالإدخال العام **52 assertion**، واجتازت regression الخاصة بالحزم **31 assertion**. كما اجتازت اختبارات العقود والصناعات ومزودي الأدلة وstrategy context وقاعدة البيانات وrandomized wizard وautofill وreview consent، إضافة إلى TypeScript strict وNext production build. تم رفع commit إصلاح النطاق والحالة المحدودة `7c53c49` بنجاح، ثم commit الدفعة العامة `9158daf` بنجاح، ونجح CI للاثنين.

## المراجع

[1]: https://api.worldbank.org/v2/country/EGY/indicator/IT.NET.USER.ZS?format=json&per_page=100 "World Bank Indicators API — Egypt example"

[2]: https://censusinfo.capmas.gov.eg/Metadata-en-v4.2/index.php/catalog/777/download/2298 "CAPMAS Education and Training Bulletin 2019/2020"

[3]: https://trends.google.com/trends/explore?date=today%205-y&geo=EG&q=online%20shopping%2Conline%20courses%2Clocal%20services "Google Trends — Egypt English comparison"

[4]: https://trends.google.com/trends/explore?date=today%205-y&geo=SA&q=online%20shopping%2Conline%20courses%2Clocal%20services "Google Trends — Saudi Arabia English comparison"

[5]: https://support.google.com/trends/answer/4365538?hl=en "Google Trends — export and attribution guidance"

[6]: https://dp.stats.gov.sa/ "GASTAT Data Portal"

[7]: https://ads.tiktok.com/help/article/marketing-api?lang=en "TikTok for Business Marketing API overview"

[8]: https://developers.google.com/google-ads/api/docs/keyword-planning/overview "Google Ads API Keyword Planning overview"
