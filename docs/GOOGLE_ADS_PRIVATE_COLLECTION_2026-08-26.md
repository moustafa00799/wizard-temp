# Google Ads — تقرير جمع خاص قراءة فقط

**المشروع:** Campaign Builder AI / CDKS
**تاريخ الالتقاط:** 26 أغسطس 2026
**الفترة المطلوبة للتقارير:** 2024-01-01 إلى 2026-08-25
**نطاق التنفيذ:** الحسابات التي قدمها المستخدم فقط، مع منع أي عمليات كتابة أو نشر أو إنفاق

## 1. ملخص الحالة

تم تفعيل موصل Google Ads وحده بعد تحديث إعدادات الجلسة وموافقة المستخدم. الموصل يوفر أدوات قراءة فقط لاكتشاف العملاء، وتشغيل استعلامات GAQL من نوع `SELECT`، وفحص metadata للحقول. لم تُفعّل موصلات Google الأخرى في هذه الجولة، ولم تُرسل أي كلمة مرور أو API key أو refresh token إلى المحادثة.

| Customer ID | النتيجة | السوق/العملة/المنطقة الزمنية | الحالة التصنيفية |
|---|---|---|---|
| `428-290-0193` (`4282900193`) | تم التحقق من health وقراءة التقارير | مختلط EG/SA على مستوى الحملات / EGP / Africa/Cairo | `mixed_or_multi_industry` على مستوى الحساب |
| `689-913-7548` (`6899137548`) | تم التحقق من health وقراءة التقارير | EG / SAR / Asia/Riyadh | `local_service_general` بنطاق مصر المؤكد من المستخدم |
| `939-797-6723` (`9397976723`) | مرفوض بـ403 `USER_PERMISSION_DENIED` | غير متاح | `unavailable` إلى حين تصحيح الوصول |

الحساب الثالث لم يُعتبر فاشلًا نهائيًا أو محذوفًا. بعد تجربة مسار الحساب الصحيح في Google Ads، ظل موصل Google Ads الحالي يعيد `USER_PERMISSION_DENIED`، بينما ظهر الحساب في واجهة Google Ads تحت هوية أخرى. لذلك سُجل `9397976723` كمصدر **deferred/unavailable مستقل**، ولن تتم إعادة المحاولة إلا بعد تفويض جديد أو منح هوية الموصل صلاحية مباشرة. لا يؤثر هذا التأجيل على صلاحية أو أدلة الحسابين 428 و689.

## 2. البيانات التي جُمعت فعليًا

| النوع | الحساب 4282900193 | الحساب 6899137548 | ملاحظة |
|---|---:|---:|---|
| Customer health | 1 صف | 1 صف | الهوية، الاسم إن ظهر، العملة والمنطقة الزمنية |
| Campaign inventory | 24 حملة | 3 حملات | كل الحملات غير المحذوفة في الاستعلام |
| Ad-group inventory | 57 مجموعة | 3 مجموعات | الحالات محفوظة كما أعادها المزود |
| Creative inventory | 67 صفًا | 3 صفوف | أنواع الإعلانات والرسائل وURLs محفوظة محليًا فقط |
| Keyword inventory | 500 صفًا في الصفحة الأولى | 132 صفًا | صفحة 428 محدودة ولا يُدعى اكتمالها |
| Conversion actions | 14 إجراء | 2 إجراء | التعريفات والحالة وcounting type والقيمة الافتراضية |
| Campaign performance | 24 صفًا | 3 صفوف | تقرير مجمع للفترة المحددة |
| Device performance | 49 صفًا | صف واحد | breakdown منفصل لا يُجمع مع المجمع مباشرة |
| Keyword performance | 500 صفًا في الصفحة الأولى | 132 صفًا | عبر `keyword_view` المتوافق مع metrics |
| Top search terms | 100 صف | 11 صفًا | عينة مرتبة بالنقرات والانطباعات، وليست كل search volume |

## 3. ملخص الأداء المجمع

| الحساب | الانطباعات | النقرات | التكلفة بعد تحويل micros | التحويلات | قيمة التحويل | CTR مشتق من الصفوف نفسها |
|---|---:|---:|---:|---:|---:|---:|
| `4282900193` | 4,831,778 | 2,909 | 118,870.006827 EGP | 0 | 0 EGP | 0.060206% |
| `6899137548` | 84 | 2 | 31.612213 SAR | 0 | 0 SAR | 2.380952% |

التكلفة في الجدول ناتجة عن `metrics.cost_micros / 1,000,000`. وCTR هو نسبة مشتقة من النقرات والانطباعات في الصفوف نفسها، وليس benchmark للسوق. لا يتم حساب CPA أو ROAS أو الربحية؛ فالتقرير أعاد صفرًا للتحويلات وقيمة التحويل، ولا توجد بعد بيانات CRM أو طلبات أو refunds مرتبطة بالحسابين.

## 4. ملاحظات التصنيف

الحساب `4282900193` يحتوي إشارات تشغيلية لأكثر من موضوع تجاري، بما في ذلك حملات تعليمية وصيانة وخدمات واتصالات، لذلك تم إبقاؤه `mixed_or_multi_industry` بدل إجباره على `education_general` أو `local_service_general` أو `ecommerce_general`. أسماء الحملات والكلمات والرسائل تصلح كمرشحات تصنيف مرشحة فقط، وليست إثباتًا مستقلاً للسوق أو الصناعة.

الحساب `6899137548` يحتوي ثلاث حملات بحث متوقفة، وثلاثة إعلانات اتصال مفعلة، و132 كلمة مفتاحية مفعلة. أكد المستخدم أن النشاط هو صيانة منزلية في مصر؛ لذلك يسجل normalizer النطاق التشغيلي كـ`EG/local_service_general` مع `currency= SAR` كعملة حساب فقط، ويسجل عدم التطابق بين السوق والعملة صراحةً. لا ينبغي تحويل العملة أو اسم الحساب أو اسم الحملة إلى إثبات قانوني مستقل.

تعريفات التحويل مهمة في تفسير الصفر. في الحساب 428 ظهرت إجراءات مثل الاتصال والنقر للاتصال والاتجاهات، وفي الحساب 689 ظهر إجراء اتصال إعلاني مفعّل وإجراء اشتراك محذوف. لذلك لا يجوز تفسير `conversions=0` بأنه عدم وجود أي اتصال تجاري خارج Google Ads؛ بل هو صفر لما سجله تعريف Google Ads المختار خلال الفترة والاستعلام.

## 5. حدود البيانات والخصوصية

البيانات الملتقطة هي **First-Party Account Evidence** مملوكة للحسابات، وليست public market benchmark. الكلمات المفتاحية ونصوص الإعلانات وURLs قد تتضمن معلومات تجارية، ولذلك بقيت الصفوف الخام في:

```text
/home/ubuntu/wizard-temp/.local/private-research/google-ads/2026-08-26/
```

ويحتوي المسار على `SHA256SUMS`. لم تُرفع هذه الصفوف أو النصوص إلى GitHub، ولم تُرسل إلى AI. يجب تنقيحها قبل أي استخدام في Strategy Builder أو AI Advisory. أما هذا التقرير فهو summary آمن بلا نصوص إعلانية أو كلمات مفتاحية أو URLs.

تقرير 428 للكلمات المفتاحية والتكلفة قد يكون محدودًا بالصفحة الأولى أو بالاستعلام، لذلك لا يُستخدم لإثبات total keyword universe. Device وkeyword وsearch-term reports منفصلة عن campaign aggregate لتجنب double counting. Search terms هي عينة top-100/11 من البيانات المرتجعة وليست Search Volume عامًا.

## 6. حالة Evidence والـMarket Validation

أُنشئ normalized output خاص schema-valid للحسابين المتاحين:

```text
/home/ubuntu/wizard-temp/.local/private-research/google-ads/2026-08-26/normalized-readonly-evidence.json
```

يحتوي الناتج الحالي على 20 collection (10 لكل حساب)، وتقسيمات campaign عددها 24 للحساب 428 و3 للحساب 689، وحزمة provider exact واحدة للحساب 689. جميعها تحمل `marketValidated=false`، ولا توجد `liveAiCalls`. توجد أيضًا نسخة evidence خارجية أقدم في `/home/ubuntu/multiplatform_evidence_packages_google_ads_2026-08-26.json`؛ لا تُدمج معها الصفوف المتداخلة. كون provider package تقنيًا صالحًا لا يعني أن الحساب يغطي صناعة واحدة أو أن بياناته تثبت سوق مصر أو السعودية كله. لا تزال حزم الصناعات العامة الثلاث تحتاج أدلة سوقية مستقلة، وتبقى المقاييس غير المدعومة `unavailable`.

لم تُغيّر هذه الجولة Canonical Blueprint أو campaign state أو budgets أو bids أو audiences أو catalogs. ولم تُنفذ أي عملية إنشاء أو تعديل أو نشر أو إنفاق.

## 7. مسار الإكمال التالي

تمت الخطوة الأولى مبدئيًا عبر تصنيف حتمي على مستوى الحملة في 428، مع إبقاء كل المرشحات `unreviewed` وعدم تحويلها إلى IndustryProfile. وتم تثبيت تأكيد المستخدم للحساب 689 كـ`EG/local_service_general` مع SAR كعملة فقط. أما `9397976723` فأصبح سجلًا مؤجلًا مستقلًا في normalizer: حالته `unavailable/deferred`، وهو مستبعد من الحزم الحالية، وبوابة إعادة المحاولة هي `new_authorization_or_direct_user_access`. عند توفر الوصول، يجب جمع snapshots جديدة والتحقق من النطاق والـSHA256 قبل الدمج؛ لا يُسمح بدمج صفوف قديمة غير قابلة للمطابقة ولا بترقية Market Validation تلقائيًا.

بعد ذلك يمكن جمع تقرير GA4 أو CRM/المتجر لنفس الفترات والحسابات، ثم مطابقة conversions مع leads/orders/revenue/refunds. لن تُحسب ROAS أو CPA الحقيقية قبل هذا الربط. بالنسبة للحساب 689، يمكن الاحتفاظ بحزمة provider exact على نطاق `EG/local_service_general/ar/SAR` بوصفها evidence تشغيلية خاصة، لا بوصفها Market-Validated. أما حملات 428 فلا تُبنى لها حزمة صناعة نهائية قبل قبول المراجعة البشرية لكل partition.

## 8. قرار التأجيل والدمج اللاحق

التأجيل هو الخيار الأنسب حاليًا لأن بيانات 428 و689 أصبحت ممثلة ومختبرة، بينما مصادقة 939 لم تنجح عبر هوية الموصل الحالية. فصل 939 يمنع فقدان صلاحية الحسابين السابقين، ويمنع خلط بيانات حساب لم تُتحقق ملكيته التشغيلية للموصل بعد. عند استئنافه، تكون خطوات الدمج: فتح تفويض مباشر أو منح هوية الموصل وصولًا مباشرًا، إجراء health check، جمع التقارير المطلوبة، حساب SHA256، تصنيف الحملات على مستوى الحملة، ثم بناء package exact فقط بعد مراجعة النطاق. تبقى raw data خارج Git، وتظل بيانات 939 account-owned evidence لا benchmark سوقيًا.

## 9. الاختبارات التي تم تنفيذها

تم التحقق من وجود موصل Google Ads، ثم فحص metadata قبل كل فئة fields. فشل استعلام أول بسبب استخدام `campaign.start_date` و`campaign.end_date` غير المعتمدين، فتم إيقافه وفحص metadata ثم إعادة استعلام مصحح. وفشل استعلام metrics على `ad_group_criterion` بسبب عدم توافق المورد، فتم استخدام `keyword_view` بعد فحص metadata بدل إعادة الطلب الفاشل.

نجحت health queries للحسابين 428 و689، ونجحت campaign/ad-group/creative/keyword/conversion/device/search-term read queries. فشل health query للحساب 939 بـ403 موثق. كل الاستعلامات كانت GAQL `SELECT` قراءة فقط، ولم تستخدم mutation methods. أضيف إلى المستودع `scripts/build_google_ads_readonly_current_evidence.ts` و`src/lib/knowledge/providers/google-ads-readonly-normalizer.ts` و`npm run test:knowledge:google-ads-readonly`. الـnormalizer يتحقق من SHA256SUMS، يرفض الحسابات خارج allowlist، يبقي 428 مختلطًا على مستوى الحساب، يسجل 689 كمصر مع SAR كعملة فقط، ويمثل 939 كـ`unavailable/deferred` دون retry تلقائي. regression يثبت أن 939 مستبعد من packages ولا يمكن دمجه إلا بعد بوابة التفويض والتحقق.

## المراجع الرسمية

[1]: https://developers.google.com/google-ads/api/docs/oauth/overview "Google Ads API OAuth 2.0 overview"
[2]: https://developers.google.com/google-ads/api/docs/query/overview "Google Ads API Query overview"
[3]: https://developers.google.com/google-ads/api/docs/concepts/call-structure "Google Ads API call structure"
[4]: https://developers.google.com/google-ads/api/docs/oauth/overview#multi-user-authentication "Google Ads multi-user authentication"

**ملاحظة:** لا يحتوي هذا الملف على credentials أو access tokens أو raw provider rows. تفاصيل الصفوف الخاصة محفوظة خارج Git بموجب سياسة المشروع.
