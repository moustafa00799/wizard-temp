# Multi-tenant Isolation وAuthorization وAudit

## هدف المرحلة

تقوي هذه المرحلة حدود `workspace` في مسارات lifecycle وتضيف سجل تدقيق قابلًا للقراءة ضمن نطاق workspace واحد. لا تغيّر هذه الإضافات سلطة `Canonical Blueprint` ولا تفتح أي provider write أو نشر أو إنفاق.

> **الاعتماد البشري في CDKS يعني السماح بالمراجعة والتجهيز والتصدير فقط، ولا يعني Launch أو Publish أو Spend.**

## عزل workspace

يتحقق مسار `campaign-lifecycle` من وجود workspace المطلوب قبل أي قراءة أو كتابة. عند إنشاء lifecycle تتم مطابقة workspace الخاص بالـBlueprint مع workspace المطلوب؛ لذلك لا يمكن استخدام Blueprint من `workspace A` لإنشاء lifecycle في `workspace B`.

تستخدم قراءات lifecycle مفتاحي `workspace_id` و`lifecycle_id` معًا، كما تبقى قراءات الأحداث مقيّدة بالمفتاحين نفسيهما. اختبار cross-workspace يثبت أن طلب القراءة من workspace آخر يعيد حالة فارغة، ولا يكشف lifecycle أو events من العميل الأول.

## صلاحية المراجع

عند إرسال transition من نوع `user`، يجب أن يكون `actor_user_id` عضوًا في workspace وله أحد الأدوار `owner` أو `admin` أو `reviewer`. يمنع ذلك اعتماد مستخدم عضو في workspace مختلف، حتى لو كان يملك معرف lifecycle وhash صحيحين.

في `production` توجد بوابة إضافية: يجب تهيئة `CDKS_AUTHORIZED_REVIEWER_IDS` بقائمة server-side، ويجب أن يطابقها المراجع. إذا لم تتم تهيئة القائمة أو لم يطابقها actor، يُرفض الاعتماد. في البيئة المحلية والاختبارات يستخدم المشروع عضوية صريحة في SQLite التجريبية فقط.

> لا توجد هوية مستخدم فعلية أو مزود Authentication مفعّل في المشروع حاليًا؛ لذلك لا يُدّعى أن هذه الطبقة بديل عن جلسات موثقة أو RBAC إنتاجي كامل.

## Audit events

أضيف `listEvents(workspaceId)` في repository مع ترتيب زمني ثابت. أضيف كذلك `GET /api/audit-events?workspace_id=...`؛ لا يقرأ المسار workspace غير موجود، وفي production يتطلب مستخدمًا موثقًا عضوًا في workspace بدور مناسب.

تُرفض payloads التي تحتوي مفاتيح تشير إلى كلمات مرور أو tokens أو API keys أو secrets أو authorization أو cookies. وعند القراءة يُطبّق redaction دفاعي على القيم المتداخلة. لا تُحفظ credentials أو PII في audit payloads.

## الاختبارات

ينفذ `test:workspace:isolation` السيناريوهات التالية: إنشاء workspaceين منفصلين، إنشاء Blueprint وlifecycle لكل منهما، منع إنشاء lifecycle عابر للنطاق، منع قراءة lifecycle من workspace آخر، منع reviewer من workspace B من اعتماد A، قبول reviewer المصرح به في A، والتحقق من أن audit events لا تعبر حدود workspace ولا تعرض مفاتيح حساسة.

تستمر اختبارات lifecycle وPreparation وMeasurement وDatabase Foundation وPersonal Staging، ويُشغّل regression العزل داخل CI. تظل تحذيرات SQLite التجريبية وتحذير Node في Actions غير مانعة للنجاح.

## المتبقي قبل الإنتاج

يلزم ربط middleware أو provider Authentication حقيقي ليستخرج هوية المستخدم من جلسة موثقة بدل الثقة في body، ثم تحويل `actor_user_id` إلى قيمة server-derived، وإضافة إدارة عضويات ومراجعة صلاحيات فعلية. كما يلزم إضافة rate limiting ومراقبة مركزية ونسخ احتياطية واختبار استعادة قبل نشر مستضاف.

طوال هذه المرحلة يبقى `marketValidated=false` ما لم توجد أدلة سوقية رسمية موثقة بنطاق وفترة مطابقة.
