# تقرير الدفعة العامة الموسعة من Knowledge Layer وMarket Intelligence

**المشروع:** Campaign Builder AI / CDKS

**تاريخ الالتقاط:** 25 أغسطس 2026

**النطاق:** مصر والسعودية؛ التجارة الإلكترونية، التعليم، والخدمات المحلية؛ العربية والإنجليزية بحسب المصدر.

> **الحالة الرسمية:** اكتملت جولة موسعة من جمع وتنظيم المصادر العامة، لكنها لا تجعل النظام Market-Validated. ما زالت `globalMarketValidated=false`، والحزم الثلاث المنشأة حالتها `limited` وليست `ready`.

## الملخص التنفيذي

تم استنفاد مجموعة كبيرة من المصادر العامة القابلة للوصول دون صلاحيات خاصة، ثم تحويلها إلى snapshots وSource Records وEvidence Packages قابلة لإعادة البناء. توسعت Registry من 9 إلى **35 مصدرًا مسجلًا**، وأصبح الـmanifest يضم **14 artifact عامًا إضافيًا** فوق World Bank وCAPMAS وGoogle Trends. أُبقيت ملفات HTML وPDF وCSV/JSON الخام الكبيرة في التخزين المحلي مع hashes وروابط إعادة التنزيل، ولم تُضمّن عشوائيًا في Git.

المصادر الجديدة حسّنت طبقات **السياق السكاني والاقتصادي والرقمي والتعليمي والتجاري ونشاط المدفوعات**. لكنها لا تعوّض البيانات الخاصة اللازمة لقياس الجمهور الإعلاني أو أداء الحملات أو funnel العميل. لذلك لم يتم تحويل أي مؤشر عام إلى CPC أو CPA أو CVR أو ROAS أو reach أو frequency أو saturation، ولم يتم اعتبار نشاط الدفع أو التجارة الدولية دليلًا مباشرًا على الطلب الإعلاني.

## ما تم جمعه وتنفيذه

تم تشغيل ingestion حتمي للبيانات الرسمية التي يمكن إعادة تنزيلها. كل artifact يحتفظ بـsource ID، رابط المصدر والـquery، فترة الملاحظة، الوحدة، وقت الالتقاط، hash للمدخل الخام، طريقة الاختيار، والقيود. تختار أدوات الإدخال أحدث القيم غير الفارغة عند الحاجة ولا تستنتج قيمًا للفترات المفقودة.

### المصادر الرسمية العامة الجديدة

| المصدر | ما تم جمعه | الاستخدام داخل Knowledge Layer | القيد الرئيسي |
|---|---:|---|---|
| UNESCO UIS | 14 ملاحظة تعليمية لمصر والسعودية | التسجيل، المشاركة، محو الأمية، وسياق العرض التعليمي | أحدث سنة تختلف حسب المؤشر؛ ليست طلبًا إعلانيًا |
| UNCTAD Digital Economy عبر World Bank Data360 | 87 ملاحظة للفترة 2010–2023 | التجارة الرقمية دوليًا، استخدام ICT، ووجود الأعمال على الويب | التجارة الرقمية الدولية ليست GMV محليًا |
| UNdata Statistical Yearbook | 479 ملاحظة عبر 11 جدولًا لمصر والسعودية | السكان، GDP، GVA، التعليم، المعلمون، العمل، CPI، التجارة، الإنترنت | سنوات السلاسل غير متساوية وبعض القيم estimates أو projections |
| DataSaudi/GASTAT/SAMA | خمسة artifacts بإجمالي 1,630 ملاحظة تقريبًا | الاقتصاد الرقمي، استخدام المنشآت للتقنية، التعليم العالي، المدارس والمعلمون، والإنفاق التعليمي | بعض الجداول ذات فترة غير متجانسة؛ الترخيص بقي `unknown` |
| DataSaudi/GASTAT للتجارة مع مصر | 53 صادرات و64 واردات | سياق تجارة السعودية مع مصر فقط | ليست تجارة إلكترونية محلية أو أداء حملات |
| KAPSARC/SAMA | 2,992 ملاحظة قطاعية، و44 قطاع/مدينة، و32 ملاحظة تفصيلية حديثة | نشاط دفع إجمالي حسب القطاع والمدينة للسعودية | لا يثبت أن النشاط إلكتروني بالكامل ولا يربط إعلانًا بتحويل |
| ITU workbook | فحص جميع الأوراق | تحقق من التغطية الإقليمية | الملف المتاح احتوى على مجاميع إقليمية ولم يحتوِ صفوفًا مباشرة لمصر أو السعودية |

أرقام الأعداد أعلاه هي أعداد الملاحظات التي نتجت من الإدخال، وليست أحجام جمهور أو تقديرات سوق. مصدر UNESCO يذكر رخصة **CC BY-SA 4.0** في artifact الخاص به، بينما لم يتم افتراض الترخيص للمصادر الأخرى التي لم تعرض شروط استخدام صريحة [9] [10] [11] [12] [13] [14].

### World Bank وCAPMAS وGoogle Trends

تم الإبقاء على **10 ملاحظات World Bank** الأحدث غير الفارغة لمؤشرات السكان والإنترنت والتحضر ومحو الأمية وGDP per capita PPP لمصر والسعودية. هذه مؤشرات سياق عام وليست audience size أو benchmark إعلاني [1].

تم الإبقاء على **6 حقائق CAPMAS** التعليمية للعام الأكاديمي 2019/2020، ومنها 487 مؤسسة تدريب حكومية و344,398 دارسًا حكوميًا و282,163 خريجًا حكوميًا. هذه أرقام عرض تعليمي تاريخية مرتبطة بالنشرة نفسها، ولا تعني طلبًا حاليًا أو نتيجة تسويقية [2].

تم الاحتفاظ بـ**4 لقطات Google Trends** بالعربية والإنجليزية لمصر والسعودية خلال آخر خمس سنوات. القيم السابقة التي التُقطت، مثل متوسطات المقارنة الإنجليزية 47/31/2 لمصر و55/21/2 للسعودية للمصطلحات المحددة، هي مؤشرات نسبية داخل كل مقارنة فقط. عند محاولة استعلام ضيق جديد ظهر رد 429 من الخدمة، فأُوقف الجمع ولم تُكرر الطلبات بسرعة. Google Trends لا يقدم حجم بحث مطلقًا أو تكلفة نقرة أو تحويلات [3] [4] [5].

## أمثلة على البيانات المضافة

أضافت KAPSARC/SAMA سياقًا قطاعيًا سعوديًا حديثًا. في أحدث السجلات المتاحة في artifact القطاع/المدينة بتاريخ 2025-07-06، ظهر صف إجمالي قطاع التعليم بقيمة **101 ألف معاملة** و**102,218 ألف ريال**، وصف المطاعم والمقاهي بقيمة **61,107 ألف معاملة** و**1,920,901 ألف ريال**، وصف الصحة بقيمة **7,637 ألف معاملة** و**805,092 ألف ريال**. هذه أرقام معاملات/قيم دفع مجمعة كما أبلغ عنها المصدر، ولا يجوز تفسيرها كمبيعات إلكترونية خالصة أو كتحويلات ناتجة عن إعلان [12] [13].

أضاف UNdata سلاسل قابلة للمقارنة للسكان، التعليم والاتصال الرقمي. من أمثلتها أن جدول الوصول الأساسي إلى أجهزة الكمبيوتر يعرض لمصر **83.8% في التعليم الابتدائي عام 2023**، وللسعودية **99.2% في التعليم الابتدائي عام 2023**، مع بقاء هذه القيم في سياق الوصول التعليمي لا في سياق الجمهور الإعلاني. كما يضم جدول التعليم تسجيلات الطلبة ومعلمين ومؤشرات الالتحاق عبر سنوات غير متطابقة [11].

أضاف UNCTAD مؤشرات مثل التجارة الدولية للخدمات القابلة للتسليم رقميًا، ونسب الأعمال ذات الوجود على الويب، ونسب الأعمال التي تضع طلبات عبر الإنترنت عندما تكون الملاحظة متاحة. هذه المؤشرات مفيدة لتكوين فرضية عن البيئة الرقمية، لكنها لا تثبت حجم الطلب المحلي أو أداء حملة بعينها [10].

## الحزم المحدودة المنشأة

| الحزمة | النطاق الدقيق | الحالة | عدد الحقائق | عدد المصادر | أهم ما ينقصها |
|---|---|---|---:|---:|---|
| `pkg-eg-education-public-20260825` | EG / education_general / ar / EGP | `limited`, freshness `fresh` | 36 | 5 | طلب التعليم الحالي، audience size، CPC/CPA/CVR/ROAS، creative observations، funnel |
| `pkg-sa-ecommerce-public-20260825` | SA / ecommerce_general / ar / SAR | `limited`, freshness `fresh` | 33 | 5 | حجم البحث المطلق، audience size، CPC/CPA/CVR/ROAS، attribution، creative observations |
| `pkg-eg-local-service-public-20260825` | EG / local_service_general / ar / EGP | `limited`, freshness `fresh` | 19 | 5 | إشارات طلب محلي كافية، calls/CRM، audience size، CPC/CPA/CVR/ROAS، creative observations |

تحتوي كل حزمة على facts متاحة من مصادر عامة وfacts `unavailable` معلنة صراحة، وإشارات keyword اتجاهية أو غير متاحة، وseasonality غير متاحة، وcompetitor observations غير متاحة. بعض artifacts العامة موجودة في manifest لكنها لا تنطبق على كل نطاق؛ لا يتم نسخ fact إلى نطاق صناعة إلا إذا مرّ باختبار السوق والصناعة واللغة والعملة في المولد.

## ما تم التحقق منه

| بوابة التحقق | النتيجة |
|---|---:|
| Source Registry وSourceRecord parsing | PASS؛ 35 مصدرًا |
| public ingestion regression | PASS؛ 89 assertion |
| public evidence package regression | PASS؛ 40 assertion |
| public quality report | PASS؛ hashes وsource IDs وقيود benchmark |
| market validation gate | BLOCKED؛ `marketValidated=false` |
| live AI calls | 0؛ لم يُستخدم AI كمصدر حقائق |
| عمليات الكتابة على منصات الإعلانات | 0؛ كل جمع الحسابات كان قراءة فقط |

نجح المسار القابل لإعادة التنفيذ `npm run knowledge:public:full` في إعادة بناء snapshots وRegistry وmanifest والحزم. كما مر TypeScript strict ومولّد الحزم بعد دمج artifacts الجديدة، مع إبقاء سلطة CDKS وCanonical Blueprint و`generation_mode=blueprint_only` دون تغيير.

## الفجوات التي لا يمكن إغلاقها من المصادر العامة وحدها

| الفجوة | الحالة بعد الجولة العامة | المطلوب الفعلي |
|---|---|---|
| Google Ads Keyword Planner | غير متصل | وصول رسمي read-only أو Export من الحساب لبيانات الكلمات والمؤشرات التاريخية [8] |
| GA4 وSearch Console | غير متصلان | OAuth رسمي أو exports من الحساب؛ لا تتحول البيانات إلى benchmark عام |
| CRM والمتجر والطلبات والإيراد | غير متصل | Export أو connector رسمي من العميل؛ مطلوب لقياس funnel وROAS الحقيقي |
| audience size وreach وfrequency | غير متاحين عامةً بالنطاق المطلوب | مصدر منصة رسمي أو first-party مصرح به |
| CPC وCPA وCVR وROAS | غير متاحة عامةً كـbenchmark موثوق للنطاقات | تقارير حملات مرتبطة بإسناد واضح ونافذة زمنية محددة |
| TikTok Creative Center | لم ينتج dataset ثابتًا في الحالة العامة الحالية | إعادة محاولة محافظة لاحقًا أو ملاحظات عامة مستقرة؛ دون claims عن الأداء |
| Meta | مؤجل عمدًا إلى النهاية | جمع read-only بعد تثبيت بقية الطبقة؛ لا إنشاء أو تعديل أو إنفاق |
| English exact-scope packages | لم تُنشأ كحزم مستقلة | مصدر إنجليزي مطابق للنطاق أو قرار صريح حول سياسة اللغة |
| SA education وSA local service وEG ecommerce | لا توجد حزم exact مستقلة حاليًا | بناء حزم إضافية بعد اكتمال source-metric-scope matrix، وليس بمجرد توافر مؤشرات عامة |

لا يمكن إغلاق هذه الفجوات بمجرد إضافة تقارير عامة عن الاقتصاد أو السكان؛ لأن شرط المشروع هو مطابقة **السوق والصناعة واللغة والعملة والفترة والمنهجية**، مع provenance وإمكانية إعادة الإنتاج. لذلك لا تعلن هذه الدفعة Market-Validated.

## سياسة التخزين وإعادة التشغيل

تم اختيار سياسة متعمدة: تُحفظ artifacts المنظمة الصغيرة وسكربتات الإدخال والـhashes في Git، بينما تبقى الملفات الخام الكبيرة مثل CSV/JSON وPDF/HTML في المساحة المحلية أو تنتقل لاحقًا إلى Object Storage. لا تُستخدم ملفات `.local/` كمرجع وحيد لإثبات اكتمال clone؛ عند غياب الخام على clone جديد يظهر ذلك كفجوة معلنة قابلة لإعادة التنزيل من الرابط الرسمي.

يمكن إعادة تشغيل الدفعة من جذر المستودع بالأوامر التالية:

```bash
npm run knowledge:public:full
npm run test:knowledge:public-ingestion
npm run test:knowledge:public-evidence
npm run test:knowledge:public-quality
```

وتظل هذه الأوامر قراءة/توليدًا محليًا فقط؛ لا تحتوي على عمليات نشر حملات أو تعديل ميزانيات أو مزايدات أو جماهير أو كتالوجات.

## المراجع

[1]: https://api.worldbank.org/v2/country/EGY/indicator/IT.NET.USER.ZS?format=json&per_page=100 "World Bank Indicators API — Egypt example"

[2]: https://censusinfo.capmas.gov.eg/Metadata-en-v4.2/index.php/catalog/777/download/2298 "CAPMAS Education and Training Bulletin 2019/2020"

[3]: https://trends.google.com/trends/explore?date=today%205-y&geo=EG&q=online%20shopping%2Conline%20courses%2Clocal%20services "Google Trends — Egypt English comparison"

[4]: https://trends.google.com/trends/explore?date=today%205-y&geo=SA&q=online%20shopping%2Conline%20courses%2Clocal%20services "Google Trends — Saudi Arabia English comparison"

[5]: https://support.google.com/trends/answer/4365538?hl=en "Google Trends — export and attribution guidance"

[6]: https://dp.stats.gov.sa/ "GASTAT Data Portal"

[7]: https://ads.tiktok.com/help/article/marketing-api?lang=en "TikTok for Business Marketing API overview"

[8]: https://developers.google.com/google-ads/api/docs/keyword-planning/overview "Google Ads API Keyword Planning overview"

[9]: https://api.uis.unesco.org/api/public/documentation/ "UNESCO UIS Public API documentation"

[10]: https://data360.worldbank.org/en/dataset/UNCTAD_DE "UNCTAD Digital Economy dataset via World Bank Data360"

[11]: https://data.un.org/ "United Nations Statistics Division — UNdata Statistical Yearbook"

[12]: https://datasource.kapsarc.org/explore/assets/points-of-sale-transactions-and-sales-by-sector/ "KAPSARC/SAMA — Points of sale transactions and sales by sector"

[13]: https://datasource.kapsarc.org/explore/assets/point-of-sale-transactions-by-sector-and-city/ "KAPSARC/SAMA — Point of sale transactions by sector and city"

[14]: https://www.itu.int/en/ITU-D/Statistics/pages/stat/default.aspx "ITU ICT statistics and public downloads"

[15]: https://www.stats.gov.sa/en/statistics-tabs/-/categories/122941?tab=436312&category=122941 "DataSaudi/GASTAT — digital economy statistics"

[16]: https://www.stats.gov.sa/en/statistics-tabs/-/categories/123481?tab=436312&category=123481 "DataSaudi/GASTAT — exports and imports by country"

[17]: https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html "OECD Data Explorer API documentation"

[18]: https://data.imf.org/en/Resource-Pages/IMF-API "IMF Data API documentation"
