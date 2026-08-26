# TikTok read-only collection — 27 أغسطس 2026

**المشروع:** Campaign Builder AI / CDKS
**نوع الوثيقة:** تقرير آمن عن دفعة TikTok الحالية
**حالة الوصول:** current TikTok for Business authorization only
**السياسة:** read-only، blueprint-only، ولا توجد عمليات كتابة أو إنفاق

## 1. الغرض والنطاق

استُخدم تفويض TikTok الحالي لاكتشاف جميع الحسابات التي يراها token الحالي، ثم مطابقة العمليات مع نتائج الجمع السابقة المؤرخة في 23 أغسطس 2026 و25 أغسطس 2026. لم يُفحص أي حساب مرتبط ببريد آخر؛ سيُعامل ذلك البريد كمجموعة تفويض مستقلة عند بدء مساره لاحقًا.

أظهرت عملية الاكتشاف الحالية أربعة حسابات، وهي نفس الحسابات الأربعة الموجودة في سجل الاكتشاف السابق. لذلك لم تُكرر عمليات `auth_advertiser_get` و`advertiser_info_get` وعمليات inventory التي كانت مكتملة سابقًا إلا عندما كانت هناك فجوة واضحة أو نافذة جديدة غير متداخلة.

| Advertiser ID | الاسم الظاهر | حالة الظهور في التفويض الحالي | حالة نطاق CDKS |
|---|---|---|---|
| `7215064338044944385` | Plan B0327 | متاح | account access ظاهر، market/industry mapping غير مؤكد |
| `7302642673201119233` | Mr Moustafa | متاح | account access ظاهر، market/industry mapping غير مؤكد |
| `7304560039707328514` | Deega | متاح | account access ظاهر، market/industry mapping غير مؤكد |
| `7556312373204795409` | windoor solutions | متاح | account access ظاهر، market/industry mapping غير مؤكد |

## 2. سياسة عدم التكرار

أُنشئ فهرس محلي سابق يضم 35 نتيجة TikTok، منها 22 نتيجة غير فارغة، مع تسجيل الأداة وعدد الصفوف وSHA256 لكل ملف. استُخدمت النتائج السابقة بدل إعادة جمعها عندما كان نوع العملية والحساب والنطاق متطابقين. جُمعت فقط نافذة أداء جديدة من 23 إلى 26 أغسطس 2026، وهي لا تتطابق مع نافذة التقرير السابقة المنتهية في 22 أغسطس 2026.

تم أيضًا جمع inventory الناقص فقط: `adgroup_get` و`ad_get` لحساب windoor، لأن الحسابين Plan B وMr Moustafa لديهما inventory سابق محفوظ، بينما أعاد Deega نتيجة فارغة في النطاقين. لم تُفسر النتيجة الفارغة على أنها غياب تاريخي للحملات أو الإعلانات.

## 3. النتائج الجديدة غير الحساسة

| العملية الجديدة | الحساب | النتيجة الآمنة |
|---|---|---:|
| `adgroup_get` | windoor solutions | 8 ad groups، موزعة على حملتين، وحالات التشغيل الظاهرة ENABLE/DISABLE |
| `adgroup_get` | Deega | 0 rows؛ empty bounded result فقط |
| `ad_get` | windoor solutions | 32 ads، مرتبطة بـ8 ad groups وحملتين |
| `ad_get` | Deega | 0 rows؛ empty bounded result فقط |
| `report_integrated_get` | Plan B0327 | 14 campaign rows في النافذة الجديدة |
| `report_integrated_get` | Mr Moustafa | 24 campaign rows في النافذة الجديدة |
| `report_integrated_get` | windoor solutions | 2 campaign rows في النافذة الجديدة |
| `report_integrated_get` | Deega | 0 rows؛ empty bounded result فقط |

تستخدم تقارير الأداء الجديدة `BASIC` و`AUCTION_CAMPAIGN` وdimension واحدة هي `campaign_id`. استُخدمت المقاييس التي قبلها TikTok في الطلب المصحح: spend، impressions، clicks، reach، frequency، CPC، CPM، وCTR. رفض TikTok محاولة أولى تضمنت اسم metric `conversions`، فتم تسجيل الخطأ وتصحيح schema باستبعاد الحقل غير المدعوم؛ لم تتم إعادة إرسال الاستعلام نفسه بسرعة.

لا يتضمن هذا التقرير أرقام spend أو impressions أو clicks أو نصوص الإعلانات أو الروابط أو أرقام الهاتف. القيم الخام محفوظة فقط في المسار الخاص المحلي المشار إليه في قسم retention.

## 4. التطبيع والحزم

أُضيف normalizer دائم داخل Knowledge Layer، مع collector يقرأ المسار الخاص، يتحقق من `MANIFEST.json` وSHA256، ويُخرج normalized artifact منقحًا. يحتفظ الناتج ببيانات الحساب، ونوع collection، ونافذة التقرير، وquery hash، وraw hash، وحالة الصفوف والقيود، بينما يحذف raw rows من الملف المنقح.

الحسابات الأربعة مصنفة حاليًا كـ`scopeStatus=unverified`، و`industryScopeStatus=unmapped`، و`marketScopeStatus=unmapped`. لذلك أُغلقت الحزم الحالية عند `packageCount=0`. هذا إغلاق مقصود وليس فشلًا؛ لا توجد حزمة TikTok exact ولا أي ترقية إلى `Market-Validated` قبل تأكيد السوق والصناعة والنطاق.

| الحاجز | الحالة |
|---|---|
| `provider=tiktok_ads` | ثابت |
| عدد الحسابات الحالية | 4 |
| نافذة الأداء الجديدة | 2026-08-23 إلى 2026-08-26 |
| collections المنقحة | 8 |
| الحزم الناتجة | 0 بسبب scope/industry unmapped |
| `marketValidated` | `false` |
| creative raw content في summary | غير مُصدّر |
| عمليات write أو spend | 0 |

## 5. retention والخصوصية

النتائج الخام والـnormalized private artifact موجودة محليًا خارج Git في:

```text
/home/ubuntu/tiktok_exports/2026-08-26/current-auth/
```

يحتوي `MANIFEST.json` على hashes للملفات والتعريف بوقت الجمع والنافذة وسياسة عدم التكرار. لا يحتوي التقرير المتتبع على ad text أو landing-page URLs أو phone fields أو asset payloads. لم تُرسل هذه البيانات إلى AI، ولم تُدرج أي credentials أو cookies أو tokens أو private keys.

## 6. ما لم يتم فعله

لم تُستخدم أدوات إنشاء أو تحديث أو حذف أو تعطيل أو دعوة أو ربط Business Center. لم تُطلب audience estimation أو audience insights، لأن هذه الإشارات لا تكفي لتقدير حجم السوق أو saturation. ولم تُجمع حسابات البريد الآخر، ولم تُخلط مع التفويض الحالي.

بيانات TikTok هنا **account-owned operational evidence**. لا يجوز استخدامها كـmarket benchmark، ولا استخراج CPC أوCPA أوCVR أوROAS سوقية منها، ولا جمع تقارير campaign aggregates مع breakdowns متداخلة. وإذا ظهرت أرقام conversions غير متاحة في تقرير صالح، تسجل كـ`unavailable` بدل استنتاج عدم وجود تحويلات.

## 7. الخطوة التالية

الخطوة التالية داخل CDKS هي اختبار replay من الـprivate manifest، ثم تقرير ما إذا كان أحد الحسابات الأربعة مرتبطًا فعليًا بأحد النطاقات الثلاثة: مصر/السعودية مع التجارة الإلكترونية أو التعليم أو الخدمات المحلية. لا يتم هذا الربط من اسم الحساب وحده. بعد تأكيد المستخدم، يمكن إنشاء provider package exact لحساب أو campaign محدد، مع إبقاء الحسابات الأخرى منفصلة.

أما حسابات TikTok المرتبطة بالبريد الآخر، فتحتاج تفويضًا منفصلًا واكتشافًا جديدًا، ثم تُحفظ في collection منفصلة ولا تُدمج مع هذه الدفعة إلا بعد إثبات هوية التفويض وملكية الحساب وscope mapping.

## المراجع الرسمية

[1]: https://ads.tiktok.com/resources/help/article/marketing-api?lang=en "TikTok API for Business — About API for Business"
[2]: https://business-api.tiktok.com/portal/docs?id=1738864835805186 "TikTok Marketing API — reporting types and limits"
[3]: https://business-api.tiktok.com/portal/docs/basic-reports-supported-dimensions/v1.3 "TikTok Basic Reports — supported dimensions"
[4]: https://ads.tiktok.com/resources/help/article/basic-data?aadvid=7302642673201119233&lang=en "TikTok Help Center — basic data and metric definitions"
