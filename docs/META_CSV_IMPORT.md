# Meta Ads Manager CSV Import

## الغرض

يحوّل `meta-csv-import-adapter.ts` التصديرات الرسمية من Meta Ads Manager إلى `MetaCollectionResult` متوافق مع `MetaSnapshotCollector`، ثم يمكن تمرير النتيجة إلى `buildMetaEvidencePackage`. هذا المسار **إضافي وقراءة فقط**؛ لا ينشئ حملات ولا يغيّر الميزانيات ولا ينشر أي شيء، ولا يغيّر سلطة CDKS أو Canonical Blueprint.

## نطاق الحسابات

المحول يطبق allowlist ثابتة للحسابين المسموحين فقط: Nadia Ahmed (`act_1259153761545048`) وDeega / شروق عبدالله (`act_809145896791225`). أي حساب آخر يُرفض قبل parsing. لا تُحفظ كلمات المرور أو access tokens أو cookies أو headers الحساسة في ناتج الاستيراد.

## المدخلات

يحتاج الاستيراد إلى `accountId` و`entityLevel` (`campaign` أو `adset` أو `ad`) والفترة `dateStart`/`dateStop` ووقت الالتقاط والعملة واللغة ونص CSV الرسمي. يُفضّل الاحتفاظ باسم الملف الأصلي في `fileName` لأغراض التتبع. يجب حفظ الملفات الخام خارج Git وفي مساحة محمية، مع تسجيل وقت المنطقة الزمنية والعملة والفلاتر الظاهرة في واجهة Meta.

## السلوك

المحول يطبق parser يدعم الحقول المقتبسة والفواصل داخل أسماء الأعمدة أو القيم، ويحتفظ بنسخة `raw` لكل صف داخل نتيجة الذاكرة. ويحوّل الحقول العددية المعروفة إلى أرقام، بينما يحوّل `-` والقيم الفارغة إلى `undefined` بدل اعتبارها صفرًا. ويُنشئ `queryHash` حتميًا من الحساب والمستوى والفترة ورؤوس الأعمدة، ويضع `pages=1` لأن الملف الرسمي يمثل تصديرًا واحدًا لا صفحات API.

يستخرج المحول الحقول التشغيلية المتاحة مثل الإنفاق والانطباعات والنقرات وLanding Page Views وResults وReach وFrequency وAttribution setting عند وجودها، ويحتفظ بقيم `Country` و`Platform` الصريحة في الحقول normalized `country` و`publisher_platform` بالإضافة إلى `raw`. أما objective أو IDs أو actions أو conversion value أو ROAS أو placement أو creative metadata، فلا تُستنتج إن لم تظهر كأعمدة صريحة؛ بل تُسجل في `missingFields` و`limitations`. وجود breakdown في الملف لا يبرر جمع صفوفه مع تقرير آخر ذي breakdown مختلف. وعند وجود `Country` أو `Platform`، يضيف Evidence adapter حقائق additive منفصلة مثل الإنفاق والانطباعات والنقرات لكل قيمة بُعد، مع إبقاء كل تقرير في Evidence Package مستقل. ويظل محافظًا ولا يجمع المقاييس غير القابلة للجمع عبر الصفوف. لا يجوز اعتبار الغياب في تصدير آخر 30 يومًا دليلًا على صفر تاريخي، ولا يجوز جمع CPC أو CPM أو ROAS أو Reach أو Frequency عبر صفوف غير متجانسة كأنها benchmarks.

## التصديرات التي تم جمعها في جلسة المتصفح

| الحساب | المستوى | النطاق | الحالة | ملاحظة |
|---|---|---|---|---|
| Nadia Ahmed | Campaigns | 2023-07-23 إلى 2026-08-23 | تم التصدير رسميًا | ملف CSV خارج Git |
| Nadia Ahmed | Ad sets | 2023-07-23 إلى 2026-08-23 | تم التصدير رسميًا | ملف CSV خارج Git |
| Nadia Ahmed | Ads | 2023-07-23 إلى 2026-08-23 | تم التصدير رسميًا | ملف CSV خارج Git |
| Deega / شروق عبدالله | Campaigns | 2023-07-23 إلى 2026-08-23 (Maximum) | تم التصدير رسميًا | ملف CSV خارج Git |
| Deega / شروق عبدالله | Ad sets | 2023-07-23 إلى 2026-08-23 (Maximum) | تم التصدير رسميًا | ملف CSV خارج Git |
| Deega / شروق عبدالله | Ads | 2026-07-24 إلى 2026-08-22 | ملف رسمي صفّه الوحيد فارغ بعد العنوان | لا يُفسّر كصفر تاريخي |
| Deega / شروق عبدالله | Ads | Maximum | تعذر التصدير برسالة Meta `Cannot export data` | لا تكرار فوري للطلب |

### ملفات الجولة المرفقة والتحقق المحلي

| الملف | نوع التقرير المستنتج من الأعمدة | الصفوف | النطاق/الأبعاد | قرار النطاق |
|---|---|---:|---|---|
| `Nadia-Ahmed-Campaigns-Jul-23-2023-Aug-23-2026.csv` | Campaigns مع Month time series | 3,458 | 2023-07-23 إلى 2026-08-22؛ 37 شهرًا؛ 88 اسم حملة | صالح كدليل Nadia وفق اسم الملف، مع عدم وجود account ID داخل CSV |
| `Nadia-Ahmed-Campaigns-Jul-23-2023-Aug-23-2026(1).csv` | Campaigns مع Country | 28 | `EG` و`unknown`؛ 17 اسم حملة | صالح كـCountry breakdown لـNadia وفق اسم الملف؛ `unknown` لا يُحوّل إلى سوق |
| `Nadia-Ahmed-Campaigns-Jul-23-2023-Aug-23-2026(2).csv` | Campaigns مع Platform | 59 | Facebook وInstagram وMessenger وAudience Network وUncategorized؛ 17 اسم حملة | صالح كـPlatform breakdown لـNadia وفق اسم الملف |
| `Untitled-report-Jul-23-2023-to-Aug-23-2026.csv` | تقرير Campaign/Platform مع عمود Ads | 58 | خمس قيم Platform وأربع قيم Ads؛ 15 اسم حملة | **غير مستورد**: لا account ID، وسياق الواجهة كان متعارضًا |

تطابقت مجاميع الإنفاق والانطباعات والنقرات الأساسية بين ملف Month وملفي Country وPlatform تقريبًا، وهو سلوك متوقع لتقارير breakdown البديلة لنفس الفترة، لكنه لا يعني جمعها معًا. احتُفظ بالتقرير غير المسمى كمدخل غير موثوق النطاق فقط، ولم يُنسب إلى Nadia أو Deega ولم يُستخدم لإنشاء Evidence Package.

جميع هذه البيانات هي **account-owned operational evidence**. لا تُصنّف Market-Validated ولا تُستخدم كـgeneral market benchmark. كما أن industry لا تُستنتج من أسماء الحملات؛ يلزم تصنيف صريح ومراجعة بشرية.

## التشغيل والاختبار

يُشغّل اختبار المحول عبر `npm run test:knowledge:meta-csv`. ويغطي الاختبار parsing للقيم المقتبسة، allowlist، رفض تصدير المستوى الخاطئ، الحقول الناقصة، Country وPlatform normalized، وربط النتيجة بـEvidence Package. التغيير لا يضيف أي ملف CSV خام إلى المستودع.
