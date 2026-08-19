# AI Reasoning Dashboard v1

## الغرض

تضيف Dashboard v1 طبقة عرض تفسيرية فوق `Blueprint v3` و`/api/generate/v5`. هدفها هو جعل مخرجات `AI Reasoning Builder` قابلة للمراجعة البشرية من خلال عرض الأدلة والـclaims والافتراضات والقيود وآثار الاستدلال على قرارات CDKS، دون تحويل reasoning إلى مصدر قرار مستقل.

> **AI يقترح ويشرح فقط، CDKS يقرر، والإنسان يعتمد.**

## موضع التكامل

تم ربط المكوّن `src/components/ReasoningDashboard.tsx` بصفحة `src/app/blueprint/page.tsx`. تقرأ الصفحة envelope المخزن في `sessionStorage` تحت المفتاح `blueprint_data`، وتطبع بنية v5 الحالية إلى الشكل الذي تحتاجه Dashboard. إذا لم يُطلب reasoning أو كانت حالة reasoning `not_requested`، تظهر حالة فارغة واضحة بدل افتراض وجود بيانات.

عند وجود reasoning، يستخدم المكوّن `reasoning.contract` أولًا، مع fallback إلى reasoning القديم عند الحاجة، ويحافظ على بقية أقسام Blueprint الحالية دون إعادة بنائها أو تغيير قرارات CDKS.

## أقسام الواجهة

| القسم | ما يعرضه |
|---|---|
| نظرة عامة | حالة reasoning، رقم العقد، المعرّفات، الملخص، المزود/النموذج، grounding، وآثار reasoning على القرارات |
| Claims | قائمة الادعاءات مع النوع والحالة والثقة، وتفاصيل claim المحدد وروابط الأدلة والقيود |
| الأدلة | سجل الأدلة مع النوع والمسار والمصدر والسلطة وحالة تأكيد المستخدم، مع توسعة النص والقيود |
| القيود والسلامة | الافتراضات والشكوك والقيود العامة، ومؤشرات الحواجز التي تثبت عدم التعديل أو النشر أو الإنفاق |

## مصفوفة الحقول

تستخدم لوحة العرض الحقول التالية من عقد `AI Reasoning Contract v1.0`:

| المجموعة | الحقول |
|---|---|
| الهوية والحالة | `contract_version`, `reasoning_id`, `blueprint_id`, `generated_at`, `status`, `purpose`, `model` |
| الادعاءات | `claims[].id`, `statement`, `claim_type`, `status`, `confidence`, `evidence_refs`, `decision_refs`, `limitations` |
| الأدلة | `evidence[].id`, `kind`, `path`, `source_ref`, `authority`, `user_confirmed`, `relevance`, `excerpt`, `limitations` |
| عدم اليقين | `uncertainties[].statement`, `category`, `severity`, `affects`, `resolution` |
| الأثر | `decision_impacts[].decision_ref`, `impact`, `rationale`, `preserved_authority`, `changed` |
| الجودة والسلامة | `grounding`, `limitations`, `safety`, `provenance`, `failure` |

## قواعد العرض والسلامة

لا تعرض الواجهة claim غير مسند على أنه حقيقة؛ إذ يظهر بحالة تحذير أو رفض. كما تعرض الثقة والتصنيف منفصلين حتى لا تُفهم الثقة كاعتماد بشري. وتعرض الأدلة مع سلطتها وحالة تأكيدها، وتربط القيود بالـclaim أو بالقرار حيثما كانت الروابط متاحة.

تظهر حواجز السلامة في الواجهة بصورة صريحة، بما في ذلك `can_mutate_cdks=false` و`can_change_blueprint=false` و`can_authorize_launch=false` و`can_spend_budget=false` و`external_actions_allowed=false` و`budget_spend_allowed=false`. ولا توفر Dashboard أي زر نشر أو إنفاق أو تعديل؛ فهي واجهة مراجعة فقط.

## حالات التشغيل

| الحالة | سلوك Dashboard |
|---|---|
| `not_requested` | حالة فارغة تشرح أن reasoning لم يُطلب |
| `pending` | عرض الحالة باعتبارها قيد المعالجة مع بيانات جزئية إن وجدت |
| `completed` | عرض الملخص والـclaims والأدلة والقيود وآثار القرارات |
| `failed` | عرض فشل محكوم ورسالة المزود دون كسر Blueprint أو readiness |
| `safety.status=rejected` | عرض شارة رفض مغلق وحواجز السلامة مع إبقاء المخرج قابلًا للمراجعة |

## التحقق

تم التحقق من البناء عبر `npx tsc --noEmit` و`npm run build`. كما تم إجراء فحص بصري محلي على `http://localhost:3001/blueprint` باستخدام fixture reasoning مجهّلة، وأثبت ظهور لوحة RTL، وبطاقات grounding، والتبويبات الأربعة، وتفاصيل claims والأدلة. كما تم التحقق من التفاعل مع تبويبي Claims والأدلة.

لا تستخدم Dashboard أي مزود AI مباشرة، ولا تضيف أي اتصال خارجي أو صلاحية تنفيذية. وهي متوافقة مع سياسة المرحلة الحالية `blueprint_only`.

## الخطوة التالية

الخطوة التالية المنطقية هي تحسين ربط بيانات v5 الحقيقية مع Dashboard عبر مسار UI رسمي، ثم إضافة حالات عرض للـ`failed` و`rejected` من fixtures حتمية، وبعد ذلك يمكن بناء Dashboard v1.1 أو الانتقال إلى إدخال reasoning في دورة اعتماد بشرية واضحة، دون تفعيل النشر أو الإنفاق.
