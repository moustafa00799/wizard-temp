# إغلاق فجوات Knowledge Layer بدون جمع بيانات جديدة — 2026-08-27

## القرار التشغيلي

تم إيقاف جمع البيانات الجديدة مؤقتًا بسبب عدم توافر مصادر إضافية، واعتماد استراتيجية **الإغلاق المنضبط** بدل محاولة ملء كل فجوة بقيمة تقديرية. الإغلاق هنا لا يعني تحويل كل سجل إلى دليل سوقي؛ بل يعني إعطاء كل عنصر موجود حالة نهائية قابلة للفهم: قابل للاستخدام الاستشاري، مرشح لـSnapshot خاص، محدود، غير متاح، مؤجل، أو quarantine.

> **قاعدة الإغلاق:** إذا لم نستطع إثبات السوق والنشاط والفترة والملكية والنطاق، نغلق الفجوة بحالة صريحة ولا نخترع قيمة بديلة.

## ما تم إغلاقه

| المجال | الحالة بعد الإغلاق |
|---|---|
| Public Source Registry | مغلق مع قيود؛ المصادر العامة والسياق العام منفصلان عن بيانات العملاء |
| Google Ads وTikTok الخاصة | مغلقة مع قيود؛ read-only وprivate operational evidence فقط |
| Easy Orders المصري | مغلق كـlimited private package؛ EGP والتصنيف والنتائج الاتجاهية محفوظة بحدودها |
| Google Drive | مغلق كـ86 artifact منقحًا؛ 61 analytics/SC، 12 catalog-like، 10 scope-unverified، و3 تكرارات مستبعدة |
| Catalog وMerchant Center | مغلقة منخفضة الأولوية كـ`catalog_identity_unverified`، ولا تُربط بـEasy Orders |
| MTD SALES وملف البائع | مغلقة كـ`scope_unverified`/unavailable، بلا revenue claims |
| الملفات الحساسة وunknown exports | مغلقة quarantine، بلا فتح إضافي أو AI أو persistence خام |
| Industry Profiles | مغلقة كـdraft/advisory profiles مع unmatched behavior واضح |
| Strategy Builder وAI Reasoning | مغلقة من ناحية الحوكمة؛ AI استشاري فقط و`blueprint_only` |

## المسارات القابلة للإغلاق من الأدلة الموجودة

### ShaadDesign وGA4 السعودية

أكد مالك الحساب أن Property ID هو `6262496156`، وأن النشاط هو ShaadDesign، والموقع `https://shd.sa/`، والسوق السعودية، والعملة SAR، والفترة من `2023-01-01` إلى `2023-12-31`. أصبح هذا المسار مرشحًا لإنشاء **Saudi Restricted Snapshot** خاص، مع إبقاء Reporting Time Zone كـ`unavailable` إذا لم تكن موجودة في التصدير السابق.

هذا المسار لا يثبت حجم السوق السعودي ولا أداء المنافسين، ولا يسمح وحده باشتقاق CPC أو CPA أو CVR أو ROAS. هو دليل first-party مقيّد على نشاط مملوك، ويُستخدم لتفسير سلوك الموقع والقنوات ضمن نطاقه فقط.

### بقية بيانات Drive

تُستخدم تقارير Search Console مستقبلًا تحت نطاق الموقع فقط، فلا تتحول clicks أو impressions أو CTR أو position إلى market-demand volume. تُحفظ تقارير Keyword Planner كإشارات تخطيطية خاصة ما لم تتوفر location وlanguage وmethod وdate scope. وتبقى ملفات الكتالوج والمبيعات القديمة منفصلة حتى لا تؤثر على استراتيجية نشاط سعودي أو متجر Easy Orders المصري.

## دور AI الاستشاري بعد الإغلاق

تم توصيل سجل guardrails موحد إلى payload الخاص بـStrategy Builder وAI Reasoning. لا يرسل السجل بيانات Drive الخام؛ بل يرسل تعليمات حوكمة عامة ومنقحة، منها أن يستخدم النموذج evidence المقيد بالنطاق فقط، ويحافظ على المقاييس `unavailable`، ويطلب مراجعة بشرية للحسابات المختلطة أو تعارض property/site/currency/timezone، ولا يعلن Market Validation.

يمكن للـAI الاستشاري الآن أن يلخص ما هو معروف، يوضح القيود، يقترح فرضيات ورسائل وتجارب، ويرتب أسئلة التحقق. لكنه لا يستطيع تغيير objective أو funnel أو channels أو readiness أو budget أو launch، ولا ينشر حملة، ولا ينفق ميزانية، ولا يغيّر Canonical Blueprint. مخرجاته تظل `advisory_only` ضمن `blueprint_only`.

## الحالات التي أُغلقت عمدًا بلا معالجة إضافية

| الحالة | قرار الإغلاق |
|---|---|
| Catalog feed وMerchant Center غير المثبتين | لا ربط ولا benchmark ولا سوق مستنتج |
| `MTD SALES` التاريخي | لا revenue ولا current business claim |
| `maroof data` والملفات ذات PII المحتمل | quarantine أو scope_unverified |
| `data-export` غير واضح المصدر | لا فتح جماعي ولا AI ولا retry |
| Google Ads 939 | deferred إلى authorization جديدة فقط |
| GA4 live connector | غير مطلوب ما دام التصدير المقيد صالحًا |
| Meta | مؤجل حسب ترتيب المشروع |
| Docs/PDF/HTML غير ذات الأولوية | deferred؛ لا يلزم إغلاقها لإنهاء الأساس التشغيلي |

## معايير النجاح

يُعتبر الإغلاق ناجحًا إذا كانت كل فجوة لها disposition مع سبب وحدود استخدام، وإذا لم توجد قيم مخمّنة في currency أو market أو industry، ولم تُخلط بيانات مصر والسعودية، ولم تُحفظ صفوف أو PII أو credentials، ولم تُنشأ حزمة سوقية من سجل غير مثبت، ولم يتغير Canonical Blueprint.

تمت إضافة `knowledge-gap-closure.ts` ليكون العقد البرمجي لهذه الحالات، وإضافة regression مستقلة وضمها إلى CI. نتائج regression الحالية تثبت وجود 13 disposition، منها إغلاق منخفض الأولوية، quarantine، ومصدر مؤهل لـRestricted Snapshot، مع `marketValidated=false` و`canonicalBlueprintMutation=false` و`liveAiCalls=false`.

## ما بقي فعليًا

تم إنشاء **ShaadDesign Restricted Snapshot** و`limited package` للفترة المؤكدة، مع سبع facts منقحة، وبقاء Reporting Time Zone وexact-period GA4 performance aggregates كـ`unavailable`. لذلك لم تعد هناك حاجة لجمع بيانات جديدة لإغلاق الأساس التشغيلي لهذا المسار.

المتبقي هو إعادة حساب coverage النهائي على مستوى كل المسارات، ومراجعة تصنيف الحساب 428 المختلط عند الحاجة، وإبقاء Google Ads 939 وGA4 live وMeta مؤجلة. يمكن الآن استخدام AI الاستشاري فوق Knowledge Context المقيد، مع استمرار عدم الادعاء بأن Knowledge Layer أصبحت سوقية أو Market-Validated بالكامل.
