# Security وE2E وLocal Observability

## مدخلات API

أضيف `readJsonBody` لمسارات `generate/v5` و`campaign-lifecycle` و`campaign-preparation`. يفرض حدًا حجميًا قدره 256 KiB لطلب Wizard و32 KiB لطلبات lifecycle وPreparation، ويفحص `content-length` والجسم الفعلي، ويحوّل JSON الفارغ أو غير الصالح إلى استجابة 400، والطلب الأكبر إلى 413.

تستمر Schemas الخاصة بـZod في فحص الحقول والقيم بعد هذا الحاجز. كما تستمر مراجع workspace وlifecycle وevent وBlueprint في قبول charset محدود، مما يمنع traversal-like references أو إدخال تعليمات غير متوقعة في المعرفات.

## Security regression

ينفذ `test:security` و`test:security:production` حالات invalid JSON، body كبير، reference غير آمن، محاولة Preparation قبل Human Approval، transition مع hash خاطئ، والتحقق من health/governance. وتثبت حالة production simulation أن غياب `CDKS_AUTHORIZED_REVIEWER_IDS` يمنع الاعتماد، ثم أن reviewer المسجل server-side يمكنه الاعتماد داخل workspace الخاص به فقط.

> **AI استشاري فقط:** لا يغيّر أي من اختبارات الأمن أو health سلطة Rules Engine أو Canonical Blueprint، ولا يفتح provider write أو publish أو spend.

## Health وReadiness

يوفر `GET /api/health` فحصًا محليًا لاتصال SQLite، وجود جداول الأساس، حالة `PRAGMA foreign_keys`، وعدد migrations. ويعيد `status=ok` و`readiness=local_staging_ready` عند تحقق هذه الشروط في البيئة المحلية.

تتضمن الاستجابة governance صريحة: `blueprintOnly=true`، و`externalActionsAllowed=false`، و`budgetSpendAllowed=false`، و`marketValidated=false`. كما تذكر `deployment.productionReady=false` لأن المشروع لا يملك بعد مزود Authentication حقيقيًا، وقاعدة مستضافة ونسخًا احتياطية ومراقبة مركزية وconnector write gates.

## نتيجة المرحلة

نجحت اختبارات الأمن المحلية وproduction simulation وworkspace isolation وlifecycle HTTP وmeasurement contract وTypeScript وBuild. تحذيرات SQLite experimental وNode.js deprecation في GitHub Actions لا تمنع النجاح، لكنها ديون بيئية ينبغي تحديثها لاحقًا.

هذه المرحلة لا تنفذ نشرًا مستضافًا ولا تربط OAuth جديدًا ولا ترسل بيانات لمزود خارجي. الخطوة التالية هي تجهيز حزمة deployment محلي/تجريبي قابلة للنقل، مع إبقاء نقطة التوقف الموضوعية عند الحاجة إلى قرار المستخدم حول مزود Authentication والاستضافة والأسرار التشغيلية.
