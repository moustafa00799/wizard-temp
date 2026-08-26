# خطة التعامل الآمن مع المصادر المؤجلة وإغلاق Knowledge Layer

**المشروع:** Campaign Builder AI / CDKS
**تاريخ الإصدار:** 26 أغسطس 2026
**نوع الوثيقة:** خطة تنفيذ ومرجع تشغيل للمصادر الخاصة التي تتطلب مصادقة أو صلاحيات
**المرجع السابق:** `docs/CDKS_KNOWLEDGE_LAYER_FULL_HANDOFF_CONTINUATION_2026-08-25.md`
**حالة الخطة:** جاهزة للتنفيذ، ولم تُمنح أي صلاحية جديدة ولم تُنفذ أي عملية كتابة خارجية أثناء إعدادها
**السلطة الحاكمة:** CDKS وCanonical Blueprint وKnowledge Contracts الحالية

---

## 1. الغرض وحدود هذه الوثيقة

تشرح هذه الوثيقة كيف ينتقل المشروع من مرحلة جمع المصادر العامة إلى التعامل المنضبط مع المصادر التي يملكها العميل أو تتطلب حسابًا أو OAuth أو API credentials. الهدف هو إغلاق الفجوات التي لا يمكن للمصادر العامة وحدها إغلاقها، خصوصًا فجوات أداء الإعلانات، مسار التحويل، التجارة الإلكترونية، الكلمات والصفحات العضوية، بيانات التطبيقات، وسياق الحسابات المملوكة.

هذه الوثيقة لا تعني أن كل مصدر خاص سيحوّل النظام تلقائيًا إلى `Market-Validated`. بيانات العميل المملوكة تساعد في بناء **First-Party Evidence** وتحسين التوصية الخاصة بالحساب أو النشاط، لكنها لا تساوي بالضرورة دليلًا رسميًا عامًا على السوق كله. تبقى `globalMarketValidated=false` إلى أن تمر كل حزمة بنطاق السوق والصناعة واللغة والعملة والفترة والمنهجية والترخيص وprovenance والاختبارات المطلوبة.

> **قاعدة السلطة:** CDKS يقرر، Knowledge Layer يثبت أو يعلن عدم التوافر، Strategy Builder يقترح، Reasoning يفسر، والإنسان يعتمد عند أي إجراء خارجي. لا يستطيع أي مزود AI أو مصدر خاص تعديل Canonical Blueprint أو فتح صلاحية النشر أو الإنفاق.

لا يُسمح بإرسال كلمات مرور أو cookies أو refresh tokens أو API keys داخل المحادثة أو إلى GitHub أو داخل أرشيفات عامة. المصادقة تكون من خلال شاشة موافقة رسمية أو دعوة صلاحية محدودة أو ملف تصدير يرفعه المستخدم إلى قناة آمنة، وليس عبر مشاركة بيانات الدخول.

---

## 2. خط الأساس الحالي قبل بدء المصادر الخاصة

آخر حالة عامة موثقة في المستودع هي **56 Source Records، و25 public context artifacts، وثلاث Evidence Packages عربية بحالة `limited`، وصفر حزم `ready`**. الحزم الحالية تغطي `EG/education_general/ar/EGP` و`SA/ecommerce_general/ar/SAR` و`EG/local_service_general/ar/EGP`، بينما ما زالت الحزم exact المستقلة للنطاقات `EG/ecommerce_general` و`SA/education_general` و`SA/local_service_general` غير مكتملة. لم يتم إعلان `Market-Validated`.

| العنصر | الحالة الحالية |
|---|---|
| `generation_mode` | `blueprint_only` |
| `external_actions_allowed` | `false` |
| `budget_spend_allowed` | `false` |
| `globalMarketValidated` | `false` دائمًا في هذه المرحلة |
| Public registry | 56 مصدرًا |
| Public context artifacts | 25 artifact |
| Evidence Packages | 3 عربية، كلها `limited` و`fresh` |
| Ready packages | 0 |
| Meta | مؤجل إلى آخر ترتيب الجمع |
| AI | اختياري واستشاري، وليس مصدر حقائق |
| Database | SQLite تجريبية قابلة للنقل، وليست قاعدة إنتاج نهائية |

أظهر فحص موصلات الجلسة أن موصل **TikTok for Business** مفعّل، بينما تظهر موصلات **Google Ads** و**Meta Ads Manager** و**Google Workspace** غير مفعّلة. لا يوجد حاليًا موصل مخصص ظاهر لـGA4 أو Search Console أو Play Console أو App Store Connect، ولا توجد موصلات custom للمستخدم في قائمة الفحص. هذه الحالة يجب إعادة التحقق منها عند بدء التنفيذ، ولا ينبغي افتراض أن تفعيل موصل مدمج يساوي نجاح المصادقة أو صلاحية الحساب.

---

## 3. القرار المعماري: مساران صالحان ومسار بدء آمن

### المسار الأول: التصديرات الآمنة أولًا

في هذا المسار ينزّل مالك الحساب CSV أو XLSX أو ZIP من المنصة نفسها، ثم يرفعه عبر قناة آمنة. لا يخزن CDKS refresh token ولا يحتاج إلى إنشاء تطبيق OAuth لكل منصة. هذا هو المسار الأقل مخاطرة والأسرع لتجربة schema وnormalizer وEvidence Package على عينة حقيقية، لكنه لا يوفر مزامنة تلقائية وسيحتاج إلى تصدير جديد عند تحديث البيانات.

### المسار الثاني: موصلات OAuth أو service account للقراءة التشغيلية

في هذا المسار ينشئ المستخدم التفويض من شاشة المزود الرسمية، ثم يجمع النظام البيانات عبر موصل خادم مقيد. هذا مناسب للمنتج متعدد العملاء والمزامنة الدورية والـcursor والـbackoff، لكنه يحتاج إعدادات أكثر، ومراجعة صلاحيات، وتخزين token آمن، والتزامًا بسياسات كل مزود. في بعض الخدمات تكون صلاحية OAuth واسعة نسبيًا، ولذلك يجب فرض read-only داخل كود الموصل، واختبارات تمنع أي mutation endpoint، وallowlist للحسابات والعمليات.

| النهج | المقايضة | التكلفة التشغيلية | تعقيد الإعداد |
|---|---|---|---|
| التصديرات أولًا | أمان أعلى وسرعة تجربة، لكن دون مزامنة تلقائية | منخفضة | منخفض |
| OAuth/service account | قابل للمزامنة والتوسع، لكن يحتاج إعدادًا وصيانة وتدويرًا للأسرار | متوسطة | متوسط إلى مرتفع |
| الترتيب العملي | بدء smoke test بتصدير صغير، ثم تحويل المصدر الناجح إلى موصل رسمي | يجمع مزايا المسارين تدريجيًا | متوسط |

الترتيب العملي الآمن المقترح هو **تجربة التصدير أولًا على مصدر واحد أو حساب واحد، ثم تفعيل موصل المصادقة لذلك المصدر فقط بعد نجاح schema والاختبارات**. لا ينبغي تفعيل كل المنصات دفعة واحدة؛ ذلك يصعّب عزل الخطأ ويزيد نطاق الصلاحيات.

---

## 4. مصفوفة المصادر الخاصة ومتطلبات كل مصدر

| المصدر | طريقة الوصول المطلوبة | أقل نطاق عملي | البيانات المفيدة | ما يجب منعه |
|---|---|---|---|---|
| Google Ads | OAuth 2.0، مع Developer Token وفق توثيق Google Ads API [1] | حسابات العملاء المحددة وعمليات reporting/GAQL المسموح بها | الحملات، المجموعات، الإعلانات، الأصول، impressions، clicks، cost، conversions، conversion value، device، geo، search terms/keywords حسب الصلاحية | أي mutate، إنشاء/تعديل حملة، budget، bid، audience، conversion settings |
| GA4 | OAuth مع وصول إلى GA4 property، واستخدام Google Analytics Data API [2] | `analytics.readonly` على properties المحددة | sessions، users، landing pages، source/medium، events، conversions، ecommerce purchase/revenue، geo/device، مع احترام aggregation thresholds | user-level export، PII، تعديل tags أو audiences أو property settings |
| Google Search Console | OAuth أو user access على property؛ التوثيق يذكر owner/full/read [3] | `read` أو أقل وصول يسمح بـSearch Analytics | query، page، country، device، clicks، impressions، CTR، average position، sitemaps/coverage عند الحاجة | إضافة/إزالة properties أو sitemaps، URL operations غير المطلوبة |
| TikTok Business | اتصال Business Center/Developer app أو الموصل المفعّل، وتقارير Marketing API [5] | reporting/read على Business Centers والحسابات المحددة | campaign/ad group/ad/creative reporting، dimensions، metrics، dates، device/placement/geo عند توفرها | create/edit/delete، creative upload، audience upload، catalog، bidding، optimization |
| Meta Ads | Meta App + `ads_read` وauthorization؛ Ads Insights موثق رسميًا [4] | الحسابات المسموح بها فقط، ومنها allowlist المشروع الحالي عند إعادة التحقق | account/campaign/ad set/ad Insights، fields، date ranges، attribution parameters، breakdowns، paging | `ads_management`، الإنشاء، التعديل، النشر، budget، bid، audience، catalog، rate-limit bypass |
| Google Play Console | Google Cloud project + Google Play Developer API + service account أو OAuth [6] | app-level read permissions للتطبيقات المحددة | app metadata، public/owned reporting، reviews أو quality/vitals حسب الحاجة | releases، tracks، APK، purchases، subscriptions، finance، reply/write ما لم يعتمد تصميم مستقل |
| App Store Connect | API access يطلبه Account Holder، ثم role-based API key وفق Apple [7] | analytics/reporting للدول والتطبيقات المطلوبة فقط | app analytics، downloads أو reports المتاحة، ratings/reviews كسياق، app metadata | submissions، pricing، finance، agreements، users، app management |
| CRM والمتجر والطلبات | API user/read-only أو export يقدمه مالك النظام | workspace/store/customer scope محدد | leads، lead status، orders، revenue، refunds، margin، booking، source، consent، timestamps | PII غير الضرورية، تعديل الطلبات، refunds، customers، payments |
| Google Business Profile أو مصادر مكالمات/حجوزات | OAuth أو export رسمي، وتحتاج تحققًا مستقلًا قبل التنفيذ | locations المملوكة والخدمات المطلوبة فقط | hours، locations، calls/booking aggregates إذا كانت متاحة، local actions | تعديل الملف التجاري، نشر posts، إدارة reviews أو locations دون طلب صريح |

### ملاحظة مهمة حول Google Ads

يحتاج Google Ads API إلى OAuth 2.0 وDeveloper Token وفق توثيق Google الرسمي، ولا ينبغي تقديم OAuth على أنه صلاحية دقيقة تضمن read-only تلقائيًا. لذلك سيكون **read-only قرارًا معماريًا داخل الموصل**: نسمح بطلبات SELECT/reporting محددة، ونمنع mutation methods على مستوى الكود، ونضيف اختبارات سلبية تؤكد أن أي محاولة إنشاء أو تعديل أو نشر تُرفض قبل إرسالها. إذا كان المطلوب أقل مخاطرة ممكنة في البداية، فالتصدير الرسمي من Google Ads أفضل من API مباشر إلى أن ينجح smoke test.

---

## 5. متطلبات المستخدم قبل أي ربط

لا يحتاج المستخدم إلى إرسال كلمة مرور أو token في المحادثة. المطلوب هو تحديد الحسابات والخصائص والتطبيقات المستهدفة، ثم تنفيذ التفويض من نافذة المزود الرسمية أو دعوة حساب خدمة إلى نطاق محدود. يجب أن تكون كل الأرقام والأسماء في allowlist واضحة قبل بدء الجمع.

| المطلوب من المستخدم | الغرض |
|---|---|
| قائمة Google Ads Customer IDs أو Manager/Client IDs | منع جمع حسابات غير مقصودة |
| قائمة GA4 Property IDs واسم كل نشاط | مطابقة البيانات بالصناعة والسوق |
| قائمة Search Console properties | التأكد من الوصول إلى المواقع الصحيحة |
| Business Center وAd Account IDs في TikTok | حصر reporting في الحسابات المسموح بها |
| Meta Ad Account IDs | الحفاظ على allowlist الحالي وعدم جمع حسابات إضافية |
| Package names أو App IDs في Play وApple | منع قراءة تطبيقات غير مملوكة |
| الفترة الزمنية لكل مصدر | منع خلط الفترات أو تكرار observations |
| السوق والصناعة واللغة والعملة | بناء Evidence Package exact |
| قرار retention والـPII | تحديد ما يحفظ raw وما ينقح قبل AI |

يُفضل البدء بحساب واحد أو property واحدة وفترة قصيرة نسبيًا كـsmoke test. بعد ثبوت الوصول، schema، pagination، hash، وscope، يمكن زيادة الفترة والحسابات تدريجيًا. لا ينبغي جمع ألف حملة من البداية قبل التأكد من أن naming taxonomy وindustry classification وconversion definitions سليمة.

---

## 6. خطوات التنفيذ التفصيلية حسب المصدر

### 6.1 Google Ads

الخطوة الأولى هي تحديد Customer IDs والحساب المستخدم في Google Ads، ثم اختيار هل نبدأ بتصدير رسمي أم OAuth/API. يذكر التوثيق الرسمي أن Google Ads API يعتمد OAuth 2.0 وأن الطلبات تحتاج كذلك إلى Developer Token، وأن OAuth يسمح للتطبيق بالوصول دون تخزين معلومات دخول المستخدم [1].

في smoke test يجب طلب نطاق زمني واحد، وحساب واحد، وتقارير SELECT فقط على مستوى campaign وad group وad وkeyword/search term بحسب ما هو متاح. يجب حفظ `customerId` و`loginCustomerId` إن كان الحساب عبر Manager، وdate range، وcurrency، وconversion definitions، وraw response hash، وpagination state.

يُرفض أي endpoint يتضمن create أو update أو remove أو mutate. وتُضاف اختبارات تثبت أن تغيير `fields` أو `resource` إلى mutation لا يمر من collector. لا تُرسل بيانات Google Ads إلى AI قبل إزالة أسماء العملاء أو النصوص التي تتضمن PII وتسجيل provenance لكل metric.

### 6.2 GA4

يحتاج Data API إلى authorized access إلى GA4 property، وهو يقدم وصولًا آليًا إلى بيانات تقارير Google Analytics وأبعادها ومقاييسها [2]. يجب اختيار properties مملوكة للعميل وتحديد event model قبل الاستيراد؛ فوجود event باسم `purchase` لا يعني أنه مضبوط بنفس المعنى في كل property.

يُجمع في البداية report aggregate يضم التاريخ، البلد، المنطقة أو المدينة إن توفرت، device، source/medium، landing page، sessions، users، engaged sessions، key events/conversions، transaction count، purchase revenue عند وجود ecommerce tracking. لا تُجمع user IDs أو raw email أو customer identifiers. إذا ظهرت قيم sampling أو thresholding أو `(other)` يجب حفظها كما هي وتسجيل limitation بدل ملء الفراغ.

### 6.3 Google Search Console

توضح الصفحة الرسمية أن Search Console API توفر REST access إلى المواقع وsitemaps وSearch Analytics وURL Inspection، وأن الوصول إلى property يجب أن يكون owner أو full أو read [3]. لمسار Knowledge Layer نحتاج read access فقط، ونستخدم Search Analytics query للأبعاد المطلوبة.

يُجمع query/page/country/device مع clicks وimpressions وCTR وaverage position للفترة المتاحة. لا يُستخدم Search Console كحجم بحث مطلق للسوق كله؛ هو بيانات أداء عضوي لمواقع يملكها العميل. كما لا نستخدم عمليات إضافة أو إزالة property أو sitemap.

### 6.4 TikTok Business

تذكر وثائق TikTok أن API for Business تضم Marketing API للاستعلام عن بيانات TikTok Ads Manager وإنشاء وإدارة الإعلانات، كما تدعم التقارير المخصصة [5]. في مشروع CDKS نستخدم الجزء الخاص بالتقارير فقط، لأن وجود القدرة التقنية على الكتابة لا يعني السماح بها.

الموصل المدمج ظاهر حاليًا مفعّلًا في الجلسة، لكن يجب فحص الأدوات والمخططات الفعلية قبل أول call. يبدأ الجمع بحساب Business Center واحد وفترة قصيرة، ثم تُحفظ request schema، response hash، paging، account ID، report type، والـdimensions والـmetrics. يتوقف collector عند 401/403/429 أو model/schema mismatch ولا يعيد الطلب بسرعة.

### 6.5 Meta Ads — آخر منصة في ترتيب الجمع

توضح Meta أن Ads Insights API تحتاج إلى App وإذن `ads_read`، وتوفر Insights على مستوى ad account وcampaign وad set وad مع fields وdate ranges وattribution parameters وbreakdowns وpaging [4]. هذا ينسجم مع سياسة المشروع في القراءة فقط.

يُعاد استخدام allowlist الحسابات الحالية بعد التحقق، ويبدأ smoke test بطلب صغير دون breakdown عالي الكلفة. بسبب rate-limit الذي حدث سابقًا مع breakdown حسب `publisher_platform`، يجب الحفاظ على queue لكل حساب، cache، persisted cursors، backoff، circuit breaker، وتسجيل reason عند التوقف. لا تُطلب `ads_management` ولا أي write scope.

### 6.6 Google Play Console

يوضح دليل Google Play Developer API أن البدء يتطلب Google Cloud project، وتفعيل API، ثم service account أو OAuth مع أذونات Google Play Console المناسبة، مع التحذير من كشف service-account credentials [6]. المسار الأكثر أمانًا للخادم هو service account مخصص، تتم دعوته إلى حساب المطور بصلاحيات app-level للقراءة فقط.

يجب فصل تقارير الجودة أو reviews عن APIs المالية والطلبات والاشتراكات. لا تُستخدم نصوص المراجعات كعينة إحصائية أو دليل على السوق؛ يمكن الاحتفاظ بملخصات اتجاهية فقط بعد مراجعة الخصوصية وعدم استخراج نسب غير مدعومة.

### 6.7 App Store Connect

تقول Apple إن Account Holder يجب أن يطلب الوصول إلى App Store Connect API، وإن الموافقة قد تتم case-by-case، وإن المفاتيح role-based ويمكن أن تكون team keys أو individual keys. كما أن مفتاح الفريق يتطلب Account Holder أو Admin، والمفتاح الخاص يُحمّل مرة واحدة ويجب حفظه وإلغاؤه إذا تعرض للخطر [7].

لذلك لا يبدأ هذا المسار إلا بعد أن يطلب Account Holder الوصول رسميًا أو يحدد مستخدمًا يملك الدور المطلوب. نحتاج analytics/reporting فقط، ولا نمنح submission أو pricing أو finance أو user-management. تحفظ معلومات key metadata مثل key ID وissuer وcreatedAt، ولا تحفظ private key داخل Git أو داخل artifact.

### 6.8 CRM والمتجر والطلبات

إذا كان الهدف إغلاق فجوة ROAS أو funnel الحقيقي، فلا تكفي منصات الإعلان وGA4 وحدها. نحتاج orders أو leads أو bookings وstatus وrevenue وrefunds وmargin وربطًا واضحًا مع source/campaign/UTM أو click IDs. هذا المصدر خاص بالكامل، ولذلك يُستخدم API user read-only أو export رسمي، وتُزال PII قبل أي تحليل أو AI.

يجب أن نميز بين revenue gross وnet، وبين order created وorder paid وorder fulfilled وrefunded. لا تُحسب CPA أو ROAS إذا لم تكن نافذة الإسناد وتعريف conversion وcurrency وrefund treatment موثقة.

---

## 7. مسار التطبيع داخل Knowledge Layer

لا يدخل raw provider response مباشرة إلى Strategy Builder. يمر كل مصدر عبر الطبقات التالية:

| الطبقة | الناتج | شروط القبول |
|---|---|---|
| Access record | provider، account/property/app ID، grant type، scope summary، status | لا token أو secret داخل السجل |
| Raw snapshot | response أو export مؤرخ | hash، URL/endpoint، request metadata، period |
| Normalized observation | rows/objects موحدة | market، industry إن عُرفت، language، currency، unit، method |
| Evidence reference | ربط fact بالـartifact والـraw input | source ID وraw hash وcapturedAt |
| Claim | fact أو inference أو directional hypothesis | evidence IDs وlimitation واضحة |
| Evidence Package | snapshot exact scope | coverage/freshness/license gates |
| Strategy Context | سياق مقيد للـStrategy Builder | advisory فقط، لا mutation للـblueprint |

يجب ألا يحتوي `SourceRecord` على token، ولا يُحفظ access token داخل JSON أو database export. يكفي تخزين نوع المنح، provider، الحساب، صلاحية القراءة، وقت التحقق، ومرجع secret manager غير قابل للعرض. أما artifact فيسجل raw hash وquery وperiod وlimitation دون تسريب response حساس إذا كانت سياسة الاحتفاظ تمنع ذلك.

---

## 8. توزيع المصادر على الصناعات الثلاث

### التجارة الإلكترونية

الأولوية العملية هي ربط Google Ads وGA4 وCRM/store وMeta/TikTok بعد تنفيذ smoke tests. نحتاج campaign cost وclicks وconversions وpurchase revenue وrefund treatment وproduct/category وlanding page وUTM أو click ID. Search Console يضيف أداء البحث العضوي للموقع، بينما SAMA/CBE وNoon/Amazon والمصادر العامة تظل context أو supply/price observations.

لا نستخدم بيانات منصة واحدة لإعلان أن السوق كله يتحول بنفس المعدل. تُبنى الحزمة كـfirst-party account evidence، وتُفصل عن public market context. إذا غابت conversion value أو order linkage، يبقى ROAS وprofitability `unavailable`.

### التعليم

نحتاج في البيانات الخاصة إلى leads، applications، enrollments، course/product، lead status، source، cost، conversion window، وGA4 events مثل view_course وstart_application وcomplete_application عند وجودها. لا تتحول بيانات تسجيلات العميل إلى تقدير لحجم سوق التعليم المصري أو السعودي كله.

تُستخدم Ministry/UIS/CAPMAS/ILOSTAT كـpublic context، بينما account-owned ad and CRM data تستخدم لتخصيص الاستراتيجية لنشاط بعينه. يجب فصل enrollment الحقيقي عن lead أو form submit، وعدم احتساب طالب مكرر كتحويل مستقل.

### الخدمات المحلية

الأولوية هي lead forms، calls، bookings، CRM status، location، service type، response time، وrevenue أو job completed. GA4 وSearch Console وMeta/TikTok/Google Ads تساعد في attribution إذا كانت UTM وcall tracking وCRM linkage مضبوطة. OSM والمصادر الاقتصادية الإقليمية تبقى supply/geographic context ولا تثبت bookings أو demand.

---

## 9. مراحل التنفيذ المقترحة

### المرحلة صفر: تثبيت inventory والـallowlist

نسجل كل account/property/app ID والفترة والصناعة والسوق واللغة والعملة، ونحدد لكل مصدر owner وgrant type وread operations المسموحة. لا نبدأ بربط جماعي أو تاريخ طويل قبل توقيع هذه المصفوفة داخليًا.

### المرحلة الأولى: تصدير smoke test

يُختار Google Ads أو GA4 أو Search Console أولًا، ويُستخرج export صغير من حساب واحد. يتم بناء parser، raw hash، normalization، PII scan، scope check، وEvidence Reference. إذا فشل المصدر في تعريف conversion أو currency أو owner، يتوقف المسار قبل توسيعه.

### المرحلة الثانية: تفعيل OAuth أو service account للمصدر الناجح

بعد نجاح التصدير، يُفعّل الاتصال الرسمي لذلك المصدر فقط. تُجرى health check، account-list check، date-range check، read-only negative tests، pagination، backoff، replay، وtoken-revocation test. بعدها فقط يمكن زيادة الحسابات أو الفترة.

### المرحلة الثالثة: جمع GA4/Search Console وCRM بالتوازي المنضبط

هذه المرحلة تغلق فجوة funnel وorganic demand الخاصة بالمواقع المملوكة. لا نخلط Search Console performance الخاص بموقع العميل مع absolute market demand، ولا نخلط GA4 users مع audience size في منصة إعلانية.

### المرحلة الرابعة: TikTok ثم مصادر التطبيقات

يُراجع connector المفعّل لـTikTok ويُستخرج report read-only صغير. بعد ذلك يُقرر هل Play/App Store Connect ضروريان لصناعة التطبيق أو مجرد سياق إضافي؛ إذا لم توجد تطبيقات مملوكة ضمن النطاق، لا نطلب صلاحيات غير لازمة.

### المرحلة الخامسة: Meta أخيرًا

بعد استقرار schema وrate-limit controls في بقية المصادر، تُجمع Meta read-only للحسابات المسموح بها فقط. يبدأ الطلب بمستوى account/campaign دون breakdown مكلف، ثم تضاف breakdowns تدريجيًا بعد نجاح القياسات والحصة الزمنية.

### المرحلة السادسة: بناء الحزم والتحقق

يعاد بناء registry وmanifest وartifacts وEvidence Packages. تُنشأ الحزم exact لكل market/industry/language/currency المطلوبة، وتُعلن gaps صراحة. لا يُرفع status إلى `ready` إلا إذا اجتازت الحزمة كل gates، ولا يُرفع `globalMarketValidated` بناء على اكتمال الاتصال وحده.

---

## 10. بوابات الأمان والاختبارات الإلزامية

| الاختبار | ما يثبته |
|---|---|
| OAuth health check | token صالح والمصدر reachable |
| Account/property allowlist | عدم جمع حساب غير مصرح به |
| Scope inspection | grant يطابق الحد الأدنى المطلوب |
| Read-only negative test | رفض create/edit/delete/publish/budget/bid/audience/catalog |
| Date/currency check | عدم خلط الفترات أو العملات |
| Pagination/cursor test | عدم فقدان الصفحات أو تكرارها |
| Raw hash replay | إعادة بناء normalized artifact بنفس النتيجة |
| PII/secrets scan | عدم تسريب email/phone/token/key إلى artifacts أو logs |
| Rate-limit test | backoff وcircuit breaker والتوقف عند 429 |
| Failure classification | تمييز 401/403/404/429/5xx وunavailable بدقة |
| Duplicate detection | عدم إعادة إدخال observations السابقة |
| Evidence scope test | مطابقة السوق والصناعة واللغة والعملة والفترة |
| AI sanitization test | AI لا يرى raw secrets أو PII غير اللازمة |
| Blueprint immutability | Strategy/Reasoning لا يغيران Canonical Blueprint |
| Market-validation gate | لا `ready` ولا `Market-Validated` مع gaps |

يجب تشغيل smoke test على حساب واحد أولًا، ثم regression على fixture حقيقية منقحة، ثم replay من raw snapshot. لا تُستخدم بيانات اصطناعية لتغطية نجاح المصدر؛ إذا تعذر الحصول على dataset حقيقي، تسجل الحالة `unavailable` ويطلب المستخدم مسار export أو authorization لاحقًا.

---

## 11. ما أستطيع تنفيذه وما يحتاج المستخدم

| أستطيع تنفيذه بعد توفر الوصول | يحتاج إلى إجراء من المستخدم أو مالك الحساب |
|---|---|
| إنشاء collector read-only، queue، cache، backoff، cursors، raw snapshots وnormalizers | بدء OAuth من شاشة المزود الرسمية أو دعوة حساب الخدمة |
| فحص schema وpagination وhashes وPII وscope | تحديد IDs والحسابات والخصائص والتطبيقات المسموح بها |
| بناء Source Records وEvidence References وEvidence Packages | طلب Developer Token أو API access حيث يطلبه المزود |
| تشغيل الاختبارات المحلية وCI ورفض write paths | مراجعة/قبول شاشة التفويض أو connector review |
| تصنيف campaign/creative/keyword ضمن قواعد المشروع | تأكيد taxonomy الصحيحة وتعريف conversion وrevenue |
| إبقاء كل المخرجات advisory وblueprint-only | توفير export رسمي إذا تعذر الربط المباشر |

لا يمكنني تجاوز login أو CAPTCHA أو rate limit أو الحصول على بيانات خاصة دون grant صحيح. كما لا ينبغي للمستخدم إرسال كلمة المرور أو private key أو refresh token في الرسائل. إذا احتاج مزود إلى إنشاء OAuth app أو API key، ينفذ المالك ذلك في بوابته، ثم يستخدم المسار الرسمي لإضافته إلى بيئة الربط الآمنة.

---

## 12. معايير اعتبار Knowledge Layer مكتملة عمليًا

لا توجد قيمة واحدة يمكن اختراعها لتقول إن Knowledge Layer اكتملت لمجرد وجود عدد كبير من rows. الإغلاق العملي يتطلب أن تكون كل مجموعة collections مطلوبة إما `verified` أو `unavailable` بسبب موثق، وأن تغطي الحزم exact النطاقات التي قررها المنتج، وأن تتوافر first-party evidence للمصادر التي يحتاجها funnel وperformance، وأن تعبر كل artifacts اختبارات provenance وscope وfreshness والخصوصية وعدم الكتابة.

يُعتبر المسار جاهزًا للانتقال إلى بناء استراتيجية مخصصة عندما تتحقق الشروط الآتية:

1. كل حساب أو property أو app مستهدف موجود في allowlist ومثبتت ملكيته أو صلاحية الوصول إليه.
2. كل مصدر خاص له access record وraw snapshot مؤرخ وhash وnormalizer وSource Record.
3. توجد تعريفات موثقة لـconversion وrevenue وcurrency وattribution window لكل مصدر أداء.
4. تم فصل public market context عن first-party account evidence وعن inference وrecommendation.
5. الحزم exact لكل الأسواق والصناعات واللغات المطلوبة إما `ready` أو تحتوي `unavailable` صريحًا بدل قيم مخترعة.
6. اختبارات write blocking وPII/secrets scan وrate-limit وreplay وblueprint immutability ناجحة.
7. لم يتم رفع `globalMarketValidated` إلا إذا استوفت قاعدة المشروع شروطها لكل نطاق، وليس لأن أحد connectors نجح.

حتى بعد استكمال هذه الشروط، ستظل CPC أو CPA أو CVR أو ROAS أو saturation أو competitor performance `unavailable` إذا لم يقدم المصدر matching evidence صالحًا لها. لا تُملأ هذه المقاييس من متوسطات عامة أو من تخمين AI.

---

## 13. نموذج رسالة البدء العملية

يمكن بدء التنفيذ الفعلي برسالة تحتوي على المعرفات غير السرية فقط، مثل:

```text
أوافق على بدء المسار الهجين.

Google Ads Customer IDs: ...
GA4 Property IDs: ...
Search Console properties: ...
TikTok Business Center / Ad Accounts: ...
Meta Ad Accounts: ...
Google Play package names: ...
Apple App IDs: ...
CRM/store: اسم المنصة فقط ...
الفترة الأولى للاختبار: من ... إلى ...
الأسواق والصناعات: مصر/السعودية + ecommerce_general/education_general/local_service_general
اللغة والعملة: ...
أوافق على read-only reporting فقط، ولا أوافق على أي إنشاء أو تعديل أو نشر أو إنفاق.
```

بعد ذلك يبدأ مصدر واحد فقط كـsmoke test. لا تُرسل أي credential في الرسالة؛ عند الحاجة تظهر شاشة التفويض الرسمية أو يستخدم المستخدم export آمنًا.

---

## 14. الخلاصة التنفيذية

الطريقة الآمنة لإنهاء المرحلة ليست جمع كل شيء دفعة واحدة، بل تحويل كل مصدر من حالة `deferred` إلى حالة موثقة عبر بوابة منفصلة: هوية المالك، أقل grant، allowlist، raw snapshot، normalization، tests، Evidence Reference، ثم package exact. البداية الأنسب هي Google Ads أو GA4 بتصدير صغير، ثم GA4/Search Console، ثم TikTok المفعّل، ثم التطبيقات عند الحاجة، وMeta أخيرًا كما طلبت سياسة المشروع.

بمجرد نجاح أول smoke test حقيقي، يمكن تنفيذ بقية العمل داخل المستودع دون تغيير سلطة CDKS. أما ما لا يتوافر له grant أو export صالح فيبقى `unavailable` مع السبب. بهذه الطريقة نغلق الفجوات القابلة للإغلاق فعليًا، ونحافظ على نزاهة Knowledge Layer بدل تحويل الاتصال بالمصادر إلى ادعاء Market Validation.

---

## المراجع الرسمية

[1]: https://developers.google.com/google-ads/api/docs/oauth/overview "Google Ads API — OAuth 2.0 overview"
[2]: https://developers.google.com/analytics/devguides/reporting/data/v1 "Google Analytics Data API — overview"
[3]: https://developers.google.com/webmaster-tools/about "Google Search Console API — overview"
[4]: https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights "Meta Ads Insights API"
[5]: https://ads.tiktok.com/resources/help/article/marketing-api?lang=en "TikTok API for Business — About API for Business"
[6]: https://developers.google.com/android-publisher/getting_started "Google Play Developer API — Getting started"
[7]: https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/ "Apple App Store Connect API — Get started"

**ملاحظة provenance:** تم التحقق من صفحات Google Ads وGA4 وSearch Console وMeta وTikTok وGoogle Play وApple الرسمية أثناء إعداد هذه الخطة. أُبقيت هذه الوثيقة خطة تشغيلية؛ لا تحتوي على أي credential ولا تمنح صلاحية فعلية لأي حساب.


---

## 15. نتيجة أول تنفيذ Google Ads في 26 أغسطس 2026

بعد تثبيت allowlist الحسابات المستقلة `428-290-0193` و`689-913-7548` و`939-797-6723`، وتفعيل موصل Google Ads وحده، نجحت health وGAQL read queries للحسابين الأول والثاني. الحساب `4282900193` ظهر بعملة EGP والمنطقة الزمنية Africa/Cairo، والحساب `6899137548` ظهر بعملة SAR والمنطقة الزمنية Asia/Riyadh. أما `9397976723` فأعاد 403 `USER_PERMISSION_DENIED`، ولم تُحفظ منه أي صفوف قابلة للاستخدام.

تم جمع campaign inventory وad-group inventory وcreative inventory وkeyword inventory وconversion actions وcampaign performance وdevice performance وkeyword performance وعينة top search terms للحسابين الناجحين. التقرير المجمع للفترة 2024-01-01 إلى 2026-08-25 أعاد للحساب 428 عدد 4,831,778 impression و2,909 click وتكلفة 118,870.006827 EGP و0 conversions وقيمة تحويل 0، وأعاد للحساب 689 عدد 84 impression و2 click وتكلفة 31.612213 SAR و0 conversions وقيمة تحويل 0. هذه أرقام account-owned operational evidence وليست benchmark سوقيًا، ولا تُستخدم لحساب ROAS أو CPA دون CRM/store revenue وربط conversion موثق. لا يجوز جمع campaign aggregate مع device أو keyword breakdowns.

حُفظت الصفوف الخام والـhashes في `.local/private-research/google-ads/2026-08-26/` خارج Git. كما أُنشئ تقرير summary آمن في `docs/GOOGLE_ADS_PRIVATE_COLLECTION_2026-08-26.md`، وnormalized output خاص من خلال `scripts/build_google_ads_readonly_current_evidence.ts`، وملف evidence خارجي. لم تُرسل نصوص الإعلانات أو الكلمات المفتاحية إلى AI، ولم تُنفذ أي عملية إنشاء أو تعديل أو نشر أو إنفاق.

هذا التنفيذ لا يرفع `globalMarketValidated` ولا يجعل بيانات Google Ads benchmark سوقيًا. الحساب 428 بقي `mixed_or_multi_industry` على مستوى الحساب، مع 24 campaign partition مرشحة حتميًا: 14 تعليم EG، و5 خدمات محلية EG، و5 اتصالات SA؛ وكلها `unreviewed` ولا تُربط بـIndustryProfile أو Canonical Blueprint. الحساب 689 ثبته المستخدم كنشاط صيانة منزلية في مصر، فصار نطاقه التشغيلي `EG/local_service_general` مع عملة حساب SAR فقط، وسُجل mismatch صراحةً دون استخدام العملة كدليل سوق. أُنشئت حزمة provider exact خاصة له دون تحويلها إلى Market-Validated. أُجّل الحساب 939 وجميع خصائص GA4 رسميًا كمصادر مستقلة بحالة `unavailable/deferred` بناءً على طلب المستخدم، مع استبعادها من الحزم الحالية وعدم دمجها مع 428 أو 689. عند استئنافها، يجب تأكيد المعرفات أو مسارات الصلاحية الصحيحة، جمع snapshots جديدة مع SHA256، ثم استكمال Search Console أو CRM/المتجر قبل اعتماد funnel أو revenue. لا يؤثر هذا التأجيل على سلامة الأدلة العامة أو بيانات Google Ads المنجزة.
