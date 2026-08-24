# Personal Staging — CDKS

## الغرض

`Personal Staging` هي بيئة اختبار شخصية تحاكي تجربة العميل النهائي داخل Campaign Builder AI دون أن تكون بيئة إنتاجية أو متصلة بصلاحيات كتابة في منصات الإعلانات. هدفها اختبار شكل المنتج، دورة البيانات، العزل، الحوكمة، الأعطال، والاستعادة قبل نقل التطبيق إلى backend وقاعدة بيانات مستضافة.

## نقطة الدخول

بعد تشغيل التطبيق محليًا:

```text
/staging
```

وتوجد وصلة إليها من الصفحة الرئيسية. الواجهة تعرض Workspace شخصية، وعدادات السجلات، وحالة migrations، وحالة الحوكمة، وثلاثة سيناريوهات منقحة:

- السعودية — التجارة الإلكترونية.
- السعودية — التعليم.
- مصر — التعليم.

يمكن تشغيل كل سيناريو من الواجهة. التشغيل يقرأ السجل المزروع، ويعرض Blueprint ID، وStrategy Context، والتوصية، والمصادر، والقيود، وقرارات CDKS، دون إنشاء حملة أو إرسال طلب إلى منصة خارجية.

## تخزين runtime

تستخدم البيئة قاعدة SQLite ملفية في:

```text
.local/cdks-staging.sqlite
```

ويمكن تغيير المسار عبر متغير البيئة:

```text
CDKS_STAGING_DB_PATH=/path/to/staging.sqlite
```

مجلد `.local/` مستثنى من Git. لا توجد raw reports أو access tokens أو refresh tokens أو API keys في الـfixtures أو قاعدة الاختبار.

## دورة السيناريو

```text
Redacted Demo Brief
  → Canonical Wizard Input
  → CDKS Engine
  → Canonical Blueprint
  → Scoped Market Evidence
  → Scoped Strategy Context
  → Advisory Recommendation
  → Pending Human Review
```

تُسجل النتائج في `staging_runs` مع روابط إلى `workspace_id` و`blueprint_id` و`context_id` و`recommendation_id`. الـseed يستخدم transaction واحدة؛ إذا فشل أي جزء أثناء التهيئة، يتم rollback ولا تبقى بيئة نصف مزروعة.

## الحواجز الأمنية والحوكمة

| الحاجز | سياسة Personal Staging |
|---|---|
| نطاق البيانات | Workspace واحدة شخصية فقط، مع بقاء `workspace_id` في كل الكيانات |
| الاتصالات | لا توجد live connectors؛ أي provider connection مستقبلية تبدأ `read_only_ready` |
| الكتابة الخارجية | `write_enabled` محظورة |
| Blueprint | لا يسمح السياق الاستراتيجي بتغييره؛ يتم حفظ hash ونتيجة التحقق |
| CDKS | يظل صاحب قرار objective وfunnel وchannels وreadiness وbudget وlaunch |
| الأدلة | evidence refs وsource IDs والقيود محفوظة، بينما raw reports مستبعدة |
| Market Validation | `globalMarketValidated=false` دائمًا، والتحقق scoped فقط |
| AI | `liveAiCalled=false`، والتوصيات الحالية deterministic/advisory |
| الأسرار | لا تحفظ الأسرار في database أو fixtures أو logs |
| الإدخال | API يقبل enum لسيناريوهات محددة، ويرفض القيم غير المعروفة بـ400 |

## سيناريوهات الاختبار

يُشغّل الاختبار الرسمي عبر:

```bash
npm run test:personal-staging
```

ويتحقق من:

1. إنشاء migrations والـseed من الصفر.
2. idempotency: تكرار GET أو seed لا يضاعف السجلات.
3. persistence: إغلاق قاعدة SQLite وإعادة فتحها مع بقاء السجلات.
4. تشغيل السيناريوهات الثلاثة وإرجاع توصيات advisory.
5. API GET وPOST وقبول السيناريو الصحيح.
6. رفض scenario ID غير معروف دون تعديل البيانات.
7. بقاء `externalActionsAllowed=false` و`budgetSpendAllowed=false`.
8. بقاء `globalMarketValidated=false`.
9. إثبات أن Canonical Blueprint لم يتغير.
10. غياب `write_enabled` وsecret material.
11. روابط evidence وعدم وجود recommendation بلا context.
12. حذف ملفات الاختبار المؤقتة بعد انتهاء regression.

## اختبار HTTP محلي

يمكن فحص البيئة بعد تشغيل `npm run dev`:

```bash
curl http://127.0.0.1:3000/staging
curl http://127.0.0.1:3000/api/staging
curl -X POST http://127.0.0.1:3000/api/staging \
  -H 'content-type: application/json' \
  -d '{"scenarioId":"sa-ecommerce"}'
```

القيمة المتوقعة هي JSON استشاري يحمل `blueprintId` و`contextId` و`recommendationId` وحقول الحوكمة. يجب أن يعيد السيناريو غير المعروف HTTP 400.

## ما لا تمثله البيئة

هذه البيئة لا تمثل production availability أو multi-user authentication أو OAuth renewal أو rate limits الحقيقية للمنصات أو performance تحت حمل كبير. كما أن fixtures السوقية منقحة وليست بيانات عميل حقيقية، و`node:sqlite` مناسب لتجربة محلية وليس قرار قاعدة إنتاجية نهائيًا.

## مسار الاستكمال لاحقًا

عند اعتماد تجربة Personal Staging، يمكن الانتقال دون إعادة بناء تدفق الاستراتيجية إلى:

1. Adapter لقاعدة MySQL/TiDB مع نفس repositories.
2. authentication وRBAC وworkspace isolation متعدد المستخدمين.
3. Secret Manager وOAuth connectors قراءة فقط.
4. jobs وqueues وsync runs فعلية.
5. Object Storage للوثائق وraw snapshot metadata.
6. backup/restore ومراقبة واستعادة من الأعطال.
7. واجهات الموافقة البشرية وقرارات write permission منفصلة.

لا تفتح أي صلاحيات كتابة للمنصات اعتمادًا على نجاح Personal Staging وحده.
