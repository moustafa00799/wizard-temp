# Campaign Preparation وMeasurement Contract

## النطاق

تضيف هذه المرحلة مسارًا آمنًا لتجهيز `Canonical Blueprint` بعد تسجيل `Human Approval`، وتضيف خطة قياس صريحة تفرق بين ما يجب تتبعه مستقبلًا وما تمت ملاحظته فعلًا.

> **Preparation Export ليس أمر نشر وليس payload كتابة لمنصة إعلانية.** هو ملف منظم للمراجعة أو التحضير، وتظل كل الإجراءات الخارجية والإنفاق مقفلة.

## Preparation Export

يوفر المسار `POST /api/campaign-preparation` ملفًا من نوع `campaign-preparation-v1`. لا يُنشأ الملف إلا إذا كانت حالة lifecycle هي `approved`، وكان الـBlueprint موجودًا في الـworkspace نفسه، وكان `canonical_sha256` المحفوظ يطابق محتوى Blueprint الحالي.

يحتوي الـenvelope على هوية lifecycle وhash الـBlueprint ونسخة Blueprint و`reviewChecklist` و`blockedActions`. وتثبت checklist أن الاعتماد البشري مسجل، وأن hash تم التحقق منه، وأن `blueprintOnly=true`، وأن `externalActionsAllowed=false` و`budgetSpendAllowed=false` و`providerWriteEnabled=false` و`marketValidationClaimed=false`.

يظهر زر **تجهيز Export للمراجعة** في صفحة Blueprint فقط بعد حالة `Human Approved`. يقوم الزر بطلب envelope من الخادم ثم ينزله محليًا، ولا يستخدم مكوّنات إعداد حملات خارجية ولا يغير الـBlueprint.

## Measurement Contract

ينتج `buildMeasurementPlan` عقدًا من نوع `measurement-plan-v1`. يقرأ فقط قائمة الأحداث المخططة الموجودة في Blueprint، ويصنفها كـ`planned` من مصدر `wizard_tracking_plan`. وجود حدث مخطط لا يثبت أن الوسم مثبت أو أن الحدث يرسل بيانات فعلية.

تظل المقاييس التالية `unavailable` حتى يتوفر مصدر runtime مطابق وتعريف نطاق قابل لإعادة الإنتاج: spend، impressions، clicks، conversions، realized revenue، refunds، CPA، وROAS. كما تظل attribution window وconversion definition غير متاحتين ما لم تتم مطابقة مزود التحويل وتعريف الحدث والفترة.

| العنصر | الحالة الافتراضية | سبب الحماية |
|---|---|---|
| الأحداث المطلوبة | `planned` | خطة تنفيذ وليست ملاحظة runtime |
| الإنفاق والظهور والنقرات | `unavailable` | لا يوجد provider delivery snapshot مطابق |
| التحويلات | `unavailable` | لا يوجد conversion definition موثق ومطابق |
| الإيراد المحقق والمرتجعات | `unavailable` | لا يقدمهما Blueprint وحده |
| CPA وROAS | `unavailable` | يتطلبان إنفاقًا وتحويلات/إيرادًا موثقًا |
| Attribution | `unavailable` | لا توجد نافذة إسناد ومطابقة مزود مؤكدة |
| Market Validation | `false` | بيانات العميل أو الخطة لا تثبت حجم السوق |

## الاختبارات

يختبر `campaign-lifecycle-http-regression.ts` توليد Blueprint، إنشاء Draft، الانتقال إلى Review، رفض اعتماد system، اعتماد المستخدم، ثم إنشاء Preparation Export والتحقق من جميع flags وحالات Measurement.

ويختبر `measurement-contract-regression.ts` أن الأحداث المخططة لا تتحول إلى observations وأن المقاييس الثمانية والإسناد تبقى unavailable مع أسباب واضحة. كما تُشغّل اختبارات Database Foundation وPersonal Staging وCampaign Lifecycle وKnowledge Context وAI Advisory وTypeScript وBuild ضمن بوابات المشروع.

## الحدود المستقبلية

قبل بناء أي Connector ذي صلاحية كتابة، يلزم إضافة readiness gate منفصل يراجع provider authorization وtracking readiness وconversion mapping وhuman approval. هذه المرحلة لا تفتح ذلك المسار ولا تمنح AI أو النظام صلاحية نشر أو إنفاق.
