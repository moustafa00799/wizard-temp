# توسعة المصادر العامة وMarket Intelligence — 2026-08-27

## الغرض والنطاق

تضيف هذه الدفعة مصادر عامة جديدة إلى طبقة المعرفة للمشروع من دون استخدام تسجيل دخول أو تجاوز CAPTCHA أو تنفيذ أي عملية شراء أو تعديل. تم الإبقاء على سجل 2025-08-25 كما هو، وإنشاء سجل زمني إضافي `public-source-registry-2026-08-27.json` حتى تبقى provenance والتغييرات قابلة للتتبع ولا تختلط الإصدارات التاريخية.

تمت إضافة **14 سجل مصدر جديد** و**25 ملاحظة منقحة**: 18 ملاحظة من سياق رسمي أو حكومي، و3 ملاحظات من واجهات متاجر عامة، و4 ملاحظات من صفحات تطبيقات عامة. تم إنشاء حزم إضافية محدودة للنطاقين `EG/ecommerce_general/ar/EGP` و`SA/ecommerce_general/ar/SAR`، وكلتاهما بحالة `limited` و`freshnessStatus=fresh`. بقيت `marketValidated=false` عمدًا.

| المسار | المصادر الجديدة | الملاحظات | الحزمة |
|---|---:|---:|---|
| السياق الرسمي والاقتصادي والقطاعي | 7 | 18 | يدخل في حزم مصر والسعودية كسياق محدود |
| الأسعار والعرض والواجهات التجارية | 3 | 3 | ملاحظات قناة عامة فقط |
| التطبيقات العامة | 4 | 4 | مؤشرات صفحة متجر التطبيق فقط |
| الإجمالي | **14** | **25** | **حزمتان limited** |

## المصادر الرسمية الجديدة

تمت إضافة منهجية **GASTAT** لمسح الاقتصاد الرقمي في السعودية، وتثبت الصفحة أن المسح يغطي الأنشطة الاقتصادية، ويستخدم ISIC4، ويرتبط بالمناطق الإدارية الثلاث عشرة، ويشير إلى تغطية 2022–2023 وفترة مرجعية 2023. هذه وثيقة منهجية وجودة، وليست سلسلة رقمية كاملة للتجارة الإلكترونية [1].

كما أضيفت صفحة رسمية لوزارة الاتصالات وتقنية المعلومات السعودية بتاريخ 27 أبريل 2025، وتحتوي على سياق وطني منسوب إلى الناشر حول الاقتصاد الرقمي وقطاع ICT والاتصال والبنية الرقمية. حُفظت القيم بوصفها سياقًا وطنيًا منسوبًا للناشر، ولم تُحول إلى حجم سوق تجارة إلكترونية أو benchmark إعلاني [2].

وأضيفت صفحتا **International Trade Administration** عن الاقتصاد الرقمي والتجارة الإلكترونية في مصر، وصفحتاها المناظرتان عن السعودية. هذه صفحات حكومية أمريكية رسمية، لكنها مصادر حكومية ثانوية؛ ولذلك حُفظت نسب الأرقام إلى الناشر وتاريخ الصفحة، ولم تُعامل كبديل عن جداول CAPMAS أو GASTAT أو SAMA الأولية. تتناول الصفحات البنية الرقمية والإنترنت والتجارة الإلكترونية والمدفوعات واللوجستيات، ولا توفر أداء متجر العميل أو CPC أو CPA أو ROAS [3] [4] [5] [6].

أضيفت كذلك صفحة **State Information Service / MCIT Egypt** التي تلخص مؤشرات قطاع ICT وإنجازات 2023. بقيت منفصلة عن صفحة ITA ولم تتم تسوية الفروق العددية بينها وبين أي مصدر آخر، لأن اختلاف التعريف أو السنة أو طريقة القياس لا يجوز إخفاؤه بعملية دمج حسابية [7].

## مصادر الأسعار والعرض

تمت إضافة لقطة عامة من صفحة إلكترونيات **Jumia Egypt**. ظهر في الصفحة عدد منتجات معروض في الفئة، وأسعار بالجنيه المصري، وبعض الأسعار المرجعية والخصومات، والتقييمات، وإشارات البائع والمتجر الرسمي، وفلاتر الفئة. تم حفظها كـ`category_structure` و`market_page_observation`؛ لا تمثل اللقطة متوسط سعر أو طلبًا أو مبيعات أو حصة سوقية [8].

تمت إضافة لقطة من **Carrefour Egypt** لسياق القاهرة، وظهر فيها تصنيف Food Cupboard وأسعار بالجنيه المصري وعروض ووقت توصيل ووسوم توفر. هذه الملاحظات تخص واجهة متجر في وقت محدد ولا تمثل متوسطًا وطنيًا أو حجم طلب أو أداء منافس [9].

تمت إضافة صفحة الهواتف العامة في **Jarir Saudi Arabia**. أمكن التحقق من بنية الفئات والعلامات التجارية وبعض إشارات الخدمات والدفع والضمان والإرجاع والتوصيل، لكن لم يظهر جدول ثابت موثوق للأسعار في اللقطة النهائية؛ لذلك لم يتم اختراع أي سعر لجرير [10].

## مصادر التطبيقات العامة

تمت إضافة صفحة Google Play لتطبيق **Jumia**، وصفحة Google Play لتطبيق **Jarir Bookstore**، وصفحة Apple App Store الإقليمية لمصر لتطبيق Jumia، وصفحة Apple App Store لتطبيق Jarir. تم الاحتفاظ بالتقييم، ونص عدد المراجعات أو نطاق التنزيل، وموضع التصنيف عند ظهوره، وإصدار التطبيق وبعض metadata. لم يتم الاحتفاظ بنصوص المراجعين أو هوياتهم.

هذه المؤشرات تخص صفحة متجر تطبيق وبالـlocale الظاهر فيها. وهي لا تثبت عدد المستخدمين النشطين في مصر أو السعودية، ولا المبيعات أو الاحتفاظ أو التحويل أو الحصة السوقية. كما أن اختلاف أرقام المراجعات بين رأس الصفحة وقسم التقييمات، أو اختلاف Google Play عن Apple، لا تتم تسويته إلى رقم جديد [11] [12] [13] [14].

## التطبيع والحزم

تم إنشاء ثلاثة artifacts منقحة داخل `data/knowledge/public/source-expansion/2026-08-27/`: `normalized-official-observations.json` و`normalized-marketplaces-observations.json` و`normalized-apps-observations.json`. يحتوي كل artifact على `rawInput` يشير إلى capture ملخص مؤرخ وhash، وليس إلى ملفات raw خارجية أو مسارات شخصية.

تم بناء حزمة مصر وحزمة السعودية باستخدام عقود Knowledge Layer الحالية. الحقائق الرسمية دخلت كـ`limited_external_evidence`، وملاحظات المتاجر والتطبيقات دخلت كـ`channel_presence` عامة. لم تُنشأ keyword signals أو seasonality signals إيجابية من هذه الدفعة؛ بل ظلت seasonality `unavailable` لعدم وجود سلسلة موسمية دقيقة بالنطاق. لا توجد claims جديدة تستحق `evidence_backed`، لتجنب رفع سياق عام إلى ادعاء سوقي.

| النطاق | الحالة | المصادر داخل الحزمة | الحقائق | ملاحظات القنوات | unknowns |
|---|---|---:|---:|---:|---:|
| مصر / التجارة الإلكترونية / العربية / EGP | `limited` | 7 | 9 | 4 | 4 |
| السعودية / التجارة الإلكترونية / العربية / SAR | `limited` | 7 | 9 | 3 | 4 |

## بوابات الجودة والسلامة

نجحت دفعة التوسعة في **39 assertion** شملت صحة `SourceRecord`، وعدم تكرار source IDs مع سجل 2025-08-25، وتطابق hashes للـcaptures الملخصة، وتطابق أعداد observations، وصحة الحزم عبر Zod، وحالة `marketValidated=false`، وعدم وجود PII أو نصوص مراجعات أو مفاتيح أو tokens، وعدم تجاوز CAPTCHA أو تسجيل الدخول أو تنفيذ mutation.

الملفات الخام التي أُنشئت أثناء التصفح أو كانت موجودة سابقًا، مثل HTML وPDF وGoogle Trends captures، بقيت خارج commit وفق سياسة المشروع. الملفات التي تدخل Git هي registry المؤرخ، artifacts المنقحة، captures الملخصة، scripts، والتوثيق فقط. لا تحتوي هذه الدفعة على بيانات Easy Orders الخاصة أو صفوف العملاء.

## القرار المعماري

هذه الدفعة ترفع **اتساع السياق العام** ولا تجعل أي نطاق Market-Validated. الأسعار والتقييمات والظهور العام مفيدة لصياغة أسئلة واستكشاف القنوات، لكنها لا تعطي benchmark إعلانيًا. بيانات المتجر الخاصة في Easy Orders تظل first-party operational evidence منفصلة عن هذه المصادر العامة.

بعد اعتماد هذه الدفعة واختبارها، يمكن العودة إلى المصادر المؤجلة: GA4، Google Ads `9397976723`، Search Console، ثم Meta في النهاية. لا ينبغي فتح مصدر جديد قبل مراجعة هذه الدفعة في Git وCI.

## المراجع

[1]: https://www.stats.gov.sa/en/w/methodology-and-quality-report-of-digital-economy-statistics "GASTAT Digital Economy Statistics Methodology and Quality Report"
[2]: https://mcit.gov.sa/en/news/saudi-arabia%E2%80%99s-digital-economy-new-era-tech-growth-innovation-and-global-impact-empowered-hrh "Saudi MCIT digital economy context"
[3]: https://www.trade.gov/country-commercial-guides/egypt-digital-economy "ITA Egypt Digital Economy"
[4]: https://www.trade.gov/country-commercial-guides/egypt-ecommerce "ITA Egypt eCommerce"
[5]: https://www.trade.gov/country-commercial-guides/saudi-arabia-digital-economy-0 "ITA Saudi Arabia Digital Economy"
[6]: https://www.trade.gov/country-commercial-guides/saudi-arabia-ecommerce "ITA Saudi Arabia eCommerce"
[7]: https://sis.gov.eg/en/media-center/files/ict-sector/ "Egypt State Information Service ICT Sector"
[8]: https://www.jumia.com.eg/mlp-electronics-products-deals/ "Jumia Egypt Electronics Products and Deals"
[9]: https://www.carrefouregypt.com/mafegy/en/food-cupboard/n/c/clp_FEGY1700000 "Carrefour Egypt Food Cupboard"
[10]: https://www.jarir.com/sa-en/smartphones.html "Jarir Saudi Smartphones"
[11]: https://play.google.com/store/apps/details?id=com.jumia.android&hl=en_US "Jumia Google Play"
[12]: https://play.google.com/store/apps/details?id=com.jarirbookstore.JBMarketingApp&hl=en_US "Jarir Google Play"
[13]: https://apps.apple.com/eg/app/jumia-online-shopping/id925015459 "Jumia Egypt Apple App Store"
[14]: https://apps.apple.com/us/app/jarir-bookstore/id535777677 "Jarir Apple App Store"
