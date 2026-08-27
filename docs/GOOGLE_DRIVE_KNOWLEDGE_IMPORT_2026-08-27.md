# دمج بيانات Google Drive في Knowledge Layer — 2026-08-27

## الملخص التنفيذي

تم تنفيذ فحص واسع ومقيد لمحتويات Google Drive المتاحة للمشروع، ثم اختيار البيانات المفيدة من أكثر من GA4 بدل قصر العمل على مسار GA4 فقط. شمل المسار تحليلات GA4، تقارير Search Console، تقارير Keyword Planner، تقارير الحملات وشراء الوسائط، ملفات الكتالوج وMerchant Center، ملف منتج تشغيلي، تقرير مبيعات تاريخي، وملف تعريف بائع. جرى التعامل مع هذه المواد بوصفها **بيانات first-party خاصة بالمستخدم**، وليست أدلة سوق عامة. حُفظت ملفات الإدخال داخل workspace خاص على هيئة artifacts منقحة لا تحتوي صفوفًا أو قيمًا خامًا، ثم أُنشئت لاحقًا حزمة خاصة محدودة لـShaadDesign فقط بعد تأكيد نطاقها؛ ولم تُنشأ أي حزمة عامة أو Claim سوقي.

> النتيجة الحاكمة: **تم دمج 86 artifact منقحًا في SQLite الخاص بـDrive، ثم إنشاء Snapshot و`limited package` خاصين بـShaadDesign بعد تأكيد Property والموقع والسوق والعملة والفترة. بقي `marketValidated=false`، ولم يتغير Canonical Blueprint، ولا توجد حزمة عامة أو حزمة جاهزة لاعتماد سوقي.**

## حدود الفحص ومخزون Drive

بدأ التنفيذ بفهرسة metadata فقط، ثم جرى تصنيف الملفات قبل فتح المحتوى. الفهرس المحلي شمل 1,166 ملفًا، منها 141 Google Sheets و333 Google Docs و43 PDF و95 مجلدًا. لم يتم تنزيل Drive بالكامل، ولم تُرسل بيانات Drive الخام إلى نموذج ذكاء اصطناعي، ولم تُنفذ أي عملية كتابة أو نقل أو حذف على Drive.

| مجموعة الفحص | العدد أو الحالة | طريقة التعامل |
|---|---:|---|
| إجمالي ملفات Drive المفهرسة | 1,166 | Metadata فقط في مرحلة الحصر |
| Google Sheets | 141 | Probe محدود ثم تصدير 86 ملفًا مرشحًا |
| Google Docs | 333 | لم يحدث bulk extraction؛ اكتفاء بالترتيب metadata-first والاحتفاظ بمسار فحص لاحق |
| PDF | 43 | لم يحدث bulk extraction؛ استُبعدت البيانات الحساسة أو غير المرتبطة |
| ملفات مختارة للتطبيع | 86 | XLSX مؤقت، SHA-256، parser محلي، ثم إزالة الخام |
| ملفات لم تُفتح عمدًا | `Save pw.xlsx`، ملفات credentials وentity access، archives، executables، code، multimedia | Quarantine دائم في هذه الدفعة |
| عمليات Drive الكتابية | 0 | القراءة فقط |
| استدعاءات AI لتحليل Drive | 0 | التحليل البنيوي محلي deterministic |

أُنشئ manifest محلي كامل للتصنيف تحت `.local`، لكن لم يُرفع إلى GitHub لأنه يحتوي أسماء ومعرّفات Drive الخاصة. أسماء الملفات والمعرّفات الكاملة لا تظهر في artifact المتتبع؛ ويستخدم artifact بدلًا منها `sourceRef` مشتقًا من prefix لـSHA-256.

## التصنيف النهائي للبيانات المختارة

صُنفت الملفات المختارة إلى تسع فئات. لا يعني اختيار الملف أنه أصبح صالحًا لبناء استراتيجية؛ فالاختيار يعني فقط أن له بصمة بيانات مفيدة ويمكن تخزين aggregate منقح له مع وضع بوابة نطاق واضحة.

| الفئة | عدد artifacts | النطاق الحالي | القرار |
|---|---:|---|---|
| GA4 | 53 | نشاط سعودي للديكور والتصميم الداخلي حسب توضيح المالك، لكن property/site والعملة غير مثبتة من الملف وحده | Artifact خاص، غير مؤهل لحزمة |
| GA4/Google Ads linked | 3 | تقرير مرتبط، لكن لا يطابق تلقائيًا حسابات Google Ads الرسمية 428 و689 | Artifact خاص، لا ROAS ولا overwrite |
| Search Console | 6 | تقارير مرتبطة بالنشاط السعودي، وقُبل تكرار واحد فقط كنسخة غير مكررة | Artifact خاص، لا market demand |
| Keyword Planner | 2 | Keyword Stats وKeyword Forecasts؛ location/language/method غير مكتملة | Artifact خاص، بلا benchmark عام |
| Campaign reports | 6 | تقارير حملات وmedia buying مختلفة الهوية والنشاط | Artifact خاص، scope غير محسوم |
| Catalog feeds | 13 | Product/Merchant Center/feed candidates بهويات مستقلة | Artifact خاص، `catalog_identity_unverified` |
| Store product | 1 | ملف منتج تاريخي منفصل عن Easy Orders | Artifact خاص، لا ربط تلقائي |
| Sales report | 1 | `MTD SALES` تاريخي لعام 2022، بلا قاموس أو إثبات ملكية/عملة كافٍ | Artifact خاص، `scope_unverified` |
| Seller profile | 1 | `maroof data`، يحتوي إشارات شخصية محتملة ولا يثبت أداء سوق | Artifact هيكلي خاص فقط |
| **الإجمالي** | **86** | **كلها داخل workspace خاص** | **لا حزم عامة؛ حزمة ShaadDesign الخاصة موثقة لاحقًا** |

بعد تطبيق قواعد التكرار الصريحة، أصبحت الحالة داخل قاعدة Drive كالتالي:

| حالة النطاق | العدد | المعنى |
|---|---:|---|
| `activity_and_market_user_confirmed_property_unverified` | 61 | نشاط/سوق سعودي موضح من المالك، مع بقاء property/site/currency دون إثبات رسمي كافٍ |
| `catalog_identity_unverified` | 12 | كتالوجات أو منتجات لا يجوز إرفاقها بـEasy Orders أو سوق محدد |
| `scope_unverified` | 10 | كلمات أو حملات أو مبيعات أو تعريف بائع تحتاج owner/source dictionary |
| `excluded_duplicate` | 3 | تكرار Search Console معروف ونسختان Catalog متطابقتان ضمن قاعدة dedup المحددة |
| **الإجمالي** | **86** | **لا يوجد artifact صالح تلقائيًا لحزمة سوقية عامة** |

## مسار النشاط السعودي: GA4 وSearch Console وKeyword Planner

أكد المستخدم أن مجموعة GA4 لا علاقة لها بـEasy Orders، وأنها تخص نشاطًا سعوديًا مستقلًا في الديكور والتصميم الداخلي. لذلك وُسِمت artifacts الخاصة بالتحليلات وSearch Console بالسوق `SA` وبالمفتاح الصناعي المقترح `interior_design_and_decoration`، لكن مع `verified=false` و`currency=null`. هذا الفصل يمنع خلطها مع متجر Easy Orders المصري ذي العملة EGP.

تحتوي artifacts على metric tokens وaggregates عددية، وفترات يمكن قراءتها عندما تكون قابلة للاستخراج، وأبعاد عامة مثل channel وdevice وgeography وaudience وpage/query presence. لم تُحفظ أسماء الصفحات أو عناوين URL أو عبارات البحث أو أسماء الحملات أو أي نص إعلاني. بالنسبة إلى Search Console، فإن clicks وimpressions وCTR وposition تُفهم مستقبلًا تحت نطاق الموقع المملوك فقط؛ ولا تُعامل على أنها حجم طلب سوقي مطلق.

أما تقارير Keyword Planner، فتم حفظها كمسار خاص مستقل. لم يتم تحويل أي رقم فيها إلى متوسط طلب عام أو CPC أو competition benchmark لأن location وlanguage وdate range وmethod وcurrency لم تُثبت جميعًا بعقد قابل لإعادة الإنتاج. أي استخدام لاحق يتطلب استخراج هذه الحقول من metadata الرسمية أو تفويضًا مباشرًا واضحًا.

## الملفات المرتبطة بالحملات وGoogle Ads

تمت معالجة ستة تقارير حملات وmedia buying بصورة aggregate فقط. parser لا يحتفظ بالكلمات المفتاحية أو العناوين أو creative text أو URLs، ولا يحاول استنتاج الصناعة من النصوص بعد التنقية. لذلك تبقى هذه السجلات مفيدة لمعرفة وجود مقاييس وتواريخ وبنية التقرير، لكنها لا تصبح performance evidence قابلة لبناء benchmark.

أما ثلاثة تقارير GA4/Google Ads linked، فقد بقيت منفصلة عن نتائج Google Ads الرسمية الخاصة بالحسابين 428 و689. لا يتم دمجها أو reconciliation إلا بعد مطابقة account/property/time/currency/conversion definition. لم تُستخرج منها ROAS أو CPA أو revenue linkage، ولم تُستبدل بها نتائج Google Ads المقيدة سابقًا، كما ظل الحساب 939 المؤجل خارج هذا المسار.

## الكتالوجات وEasy Orders وملفات المبيعات

تم الحفاظ على هويات الكتالوجات منفصلة. وجود تطابق جزئي سابق بين بعض معرّفات Product feed وEasy Orders لا يثبت الملكية أو أن الملفين يمثلان نفس المتجر. لذلك تحمل هذه السجلات `unverified_catalog_candidate` أو `catalog_identity_unverified` ولا تُرفق تلقائيًا بمتجر Easy Orders.

يبقى Easy Orders المصري مسارًا مستقلًا كما هو موثق في [`EASY_ORDERS_PRIVATE_IMPORT_2026-08-27.md`](./EASY_ORDERS_PRIVATE_IMPORT_2026-08-27.md): سوق EG، عملة EGP، 1,088 طلبًا فريدًا للفترة المعلنة، وقيود الإيراد المحصل وtaxonomy كما هي. ملف `MTD SALES` التاريخي لا يُخلط معه؛ لا توجد قرينة كافية على النشاط أو العملة أو أن أرقام الميزانية تمثل realized revenue. ملف `اوردرات Deega Store` الفارغ لم ينتج دليلًا، وبيان المحفظة لم يُعامل كتقرير طلبات أو مبيعات.

## التنقية والخصوصية

يستخدم artifact عقدًا صريحًا في [`google-drive-readonly.ts`](../src/lib/knowledge/google-drive-readonly.ts). كل سجل يثبت `rows=[]` و`rawRowsOmitted=true` و`rawValuesOmitted=true`، ويحتفظ فقط بملخصات sheets، metric availability، date range القابل للاستخراج، وأعلام النطاق. وقد فُرضت البوابات التالية:

| البوابة | النتيجة |
|---|---|
| صفوف الطلبات أو الحملات الخام | غير محفوظة |
| أسماء العملاء والهواتف والبريد والعناوين | غير محفوظة |
| نصوص الملاحظات والتعليقات والمراجعات | غير محفوظة |
| creative text وURLs وsearch queries وkeywords | غير محفوظة |
| passwords وtokens وcookies وkeys وcredentials | لم تُفتح الملفات التي يحتمل احتواءها عليها |
| Drive IDs الكاملة | بقيت في local manifest ولم تدخل artifact المتتبع |
| currency غير مثبتة | لا يتم تخمينها؛ تُحفظ `null` |
| global Market Validation | محظورة في schema وSQLite |
| Canonical Blueprint | لم يُقرأ للتعديل ولم تتغير hash أو authority |

## Persistence وReplay Safety

أضيفت migration مستقلة [`0005_drive_evidence_artifacts.ts`](../src/lib/db/migrations/0005_drive_evidence_artifacts.ts) تنشئ جدول `drive_evidence_artifacts` مع قيود على SHA-256، class، scope، null currency، وعدم السماح بـ`market_validated=1`. وأضيف repository replay-safe في [`database.ts`](../src/lib/db/database.ts)، بحيث يؤدي إدخال نفس artifact مرة ثانية إلى مقارنة المحتوى بدل إنشاء duplicate، بينما يؤدي اختلاف المحتوى تحت نفس hash إلى فشل مغلق.

يستخدم سكربت الدمج [`merge_google_drive_private_evidence.ts`](../scripts/merge_google_drive_private_evidence.ts) workspace مستقلًا اسمه `ws-cdks-private-google-drive`. مرحلة ingestion لا تنشئ Evidence Packages عامة ولا Claims ولا Strategy Context؛ تحفظ فقط artifacts منقحة وتدقيق merge. وبعد اكتمال Owner Attestation لـShaadDesign، أنشأ builder منفصل Snapshot و`limited package` خاصين (`shaaddesign-ga4-restricted-snapshot-2023` و`shaaddesign-ga4-restricted-package-2023`) دون رفعهما إلى Public Source Registry أو إعلان Market Validation.

لإعادة بناء artifact من exports المحلية بعد تجهيز `export-manifest.jsonl`، يشغّل المستخدم `npm run knowledge:google-drive:normalize` ثم `npm run knowledge:google-drive:merge`، ويمكن تشغيل `npm run test:knowledge:google-drive-private` للتحقق. لا يحتاج parser إلى Drive IDs داخل artifact النهائي، ويمكنه العمل بمتغيرات `CDKS_GOOGLE_DRIVE_NORMALIZED_ROOT` و`CDKS_GOOGLE_DRIVE_EXPORT_MANIFEST` و`CDKS_GOOGLE_DRIVE_NORMALIZED_OUTPUT`. وعند تشغيل CI دون artifacts الخاصة غير المرفوعة، ينشئ regression fixture منقحًا داخل SQLite في الذاكرة؛ أما عند وجود قاعدة merge الخاصة فيستخدمها ويتحقق من أعدادها الفعلية.

## الاختبارات التي أُجريت

| الاختبار | النتيجة |
|---|---|
| تصنيف metadata لـ1,166 ملفًا | PASS |
| تصدير 86 Sheet مع backoff محافظ | 86/86 PASS |
| parser محلي aggregate-only | 86/86 PASS |
| إزالة التواريخ غير الواقعية الناتجة عن Excel serials | PASS |
| Zod normalized Drive contract | PASS عبر مسار الدمج |
| `npx tsc --noEmit` | PASS |
| `npm run test:database:foundation` | PASS، 63 assertion، 5 migrations |
| `npm run test:knowledge:google-drive-private` | PASS |
| أول merge إلى workspace Drive | 86 artifacts |
| replay للدمج | 86/86 replay، 0 artifact جديد |
| raw-row/privacy/credential gates | PASS |
| عدد Evidence Packages عامة لworkspace Drive | 0؛ توجد حزمة ShaadDesign خاصة محدودة منفصلة |
| Market Validation | false، كما هو مقصود |

تم أيضًا تشغيل قاعدة الدمج على مستوى SQLite للتحقق من عدم وجود currency مخمّنة، وعدم وجود تكرار غير مسموح، وعدم وجود raw rows، وعدم وجود flags تسمح بـBlueprint mutation أو external writes.

## الملفات المتتبعة التي أضيفت أو عُدلت

| الملف | الوظيفة |
|---|---|
| `src/lib/db/migrations/0005_drive_evidence_artifacts.ts` | جدول artifacts وقيود الحوكمة |
| `src/lib/db/database.ts` | تطبيق migration وrepository replay-safe |
| `src/lib/db/index.ts` | تصدير migration الجديدة |
| `src/lib/knowledge/google-drive-readonly.ts` | عقد Zod للـnormalized artifact |
| `src/lib/knowledge/index.ts` | تصدير عقد Drive |
| `scripts/merge_google_drive_private_evidence.ts` | دمج خاص بلا packages |
| `scripts/google-drive-merge-regression.ts` | regression الخصوصية والنطاق وreplay |
| `scripts/database-foundation-regression.ts` | تحديث توقع عدد migrations إلى 5 |
| `.github/workflows/cdks-regression.yml` | تشغيل Drive regression ضمن CI |
| `package.json` | أوامر merge وregression الجديدة |
| `docs/GOOGLE_DRIVE_KNOWLEDGE_IMPORT_2026-08-27.md` | هذا التقرير |

الملفات الخام، manifest الكامل، exports XLSX، SQLite الخاص، hashes المحلية التفصيلية، وملفات `.local` لم تُرفع إلى GitHub. هذا مقصود وليس نقصًا في الدمج؛ فالـruntime الذي يملك التفويض يستطيع إعادة بناء artifact من export خاص محليًا عند الحاجة.

## ما لم يُدمج ولماذا

لم تُفتح `Save pw.xlsx` أو أي ملف يشير إلى كلمة مرور أو credential أو access entity. كما لم يتم bulk extraction لكل Docs وPDF لأن وجود اسم ملف أو مستند تعليمي لا يثبت أنه first-party performance data، ولأن كثيرًا من ملفات Meta التعليمية تكرارات إرشادية يجب أن تبقى reference material لا account evidence. لم يتم فتح الملفات التي تتضمن هواتف أو بيانات عملاء إلا بالقدر البنيوي الضروري لمعرفة أنها PII، ولم تحفظ أي قيمة منها.

كما لم يُرفع أي record إلى public source registry. بيانات Drive الخاصة لا تُعادل CAPMAS أو GASTAT أو CBE أو SAMA أو المصادر العامة الأخرى، ولا يمكنها وحدها إعلان market validation. تظل حزم السوق العامة السابقة منفصلة كما هي موثقة في [`PUBLIC_SOURCE_EXPANSION_2026-08-27.md`](./PUBLIC_SOURCE_EXPANSION_2026-08-27.md).

## الخطوات المتبقية قبل حزمة سعودية قابلة للاستخدام

الخطوة التالية ليست إعلان اكتمال Market Validation، بل طلب إثبات نطاق منخفض المخاطر لمجموعة السعودية. يجب تثبيت property/site identity، واسم النشاط أو workspace، وcurrency/timezone/locale، والفترة لكل تقرير، ومعيار conversion إذا أريد ربط GA4 بتقارير Google Ads. بعد ذلك فقط يمكن بناء snapshot سعودي محدود من facts المسموح بها، مع بقاءه private/restricted، ثم تقييمه مقابل عقد الصناعة دون خلطه بالتجارة الإلكترونية المصرية.

وبالنسبة إلى Keyword Planner، يجب تثبيت location وlanguage وdate range وforecast method والعملة إن كانت معروضة. وبالنسبة إلى الكتالوجات، يلزم مصدر ownership أو رابط متجر مؤكد ومرجع زمني، ولا يكفي تطابق ID أو title أو domain جزئي. وبالنسبة إلى الحملات، يلزم scope/account/period/conversion definition؛ وإلا تبقى aggregates تشخيصية فقط.

حتى بعد اكتمال هذه الإثباتات، لن تنتقل البيانات الخاصة إلى public market evidence ولن تتحول تلقائيًا إلى `market_validated`. سيظل Strategy Builder وReasoning وAI استشاريين، وسيظل Canonical Blueprint هو السلطة الوحيدة، وسيظل `blueprint_only` فعالًا.

## المراجع الداخلية

[1]: ../src/lib/knowledge/google-drive-readonly.ts "عقد Google Drive المنقح"
[2]: ../src/lib/db/migrations/0005_drive_evidence_artifacts.ts "Migration تخزين Drive artifacts"
[3]: ../scripts/merge_google_drive_private_evidence.ts "سكربت دمج Drive الخاص"
[4]: ../scripts/google-drive-merge-regression.ts "Regression دمج Drive"
[5]: ./EASY_ORDERS_PRIVATE_IMPORT_2026-08-27.md "دمج Easy Orders الخاص"
[6]: ./PUBLIC_SOURCE_EXPANSION_2026-08-27.md "توسعة المصادر العامة"
