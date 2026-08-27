# Deployment Readiness — 2026-08-27

## النتيجة الحالية

المشروع قابل للتشغيل والاختبار محليًا في وضع `personal_staging` باستخدام Next.js وSQLite و`blueprint_only`. يمكن تشغيل Wizard وإنشاء Canonical Blueprint، ثم مراجعته واعتماده بشريًا، ثم استخراج Preparation Envelope وخطة Measurement. لا يوجد نشر لحملة ولا provider write ولا إنفاق ميزانية.

> **هذه ليست production deployment readiness.** هي جاهزية تشغيل محلي واختبار قابل للنقل، مع بقاء `marketValidated=false`.

## التشغيل المحلي

بعد تثبيت Node.js 22 أو أحدث ونسخ المستودع، تُستخدم الأوامر التالية:

```bash
npm ci
npm run build
CDKS_APP_DB_PATH=.local/cdks-app.sqlite npm run start
```

تفتح الواجهة على `http://localhost:3000`، ويمكن فحص الصحة من `GET /api/health`. يجب أن يظهر اتصال SQLite، وforeign keys مفعلة، وmigration count غير صفري، مع governance يثبت `blueprintOnly=true` و`externalActionsAllowed=false` و`budgetSpendAllowed=false` و`marketValidated=false`.

## بوابات التحقق

قبل النقل إلى أي بيئة أخرى، يجب تشغيل `npm run test:deployment:local` ثم `npm run test:security` و`npm run test:workspace:isolation`. وتبقى بوابات lifecycle وmeasurement وDatabase Foundation وPersonal Staging وAI advisory وKnowledge private regressions وrandomized/autofill جزءًا من suite المشروع.

يفرض `deployment-readiness-local-regression.cjs` وجود ملفات التشغيل ومسارات API الأساسية، ووجود أوامر `build` و`start` والاختبارات، وعدم تتبع `.env` أو `.env.local` أو `.local` أو SQLite runtime في Git، وبقاء governance markers الآمنة.

## أسرار وبيئات

لا يوضع أي API key أو OAuth token أو cookie أو raw provider/Drive file في Git أو SQLite payload أو AI request. تُحفظ القيم محليًا في `.env.local` أو في secret manager للبيئة المستضافة. يجب ضبط `CDKS_AUTHORIZED_REVIEWER_IDS` server-side في production؛ ومن دونها تُحظر Human Approval في production.

القائمة الحالية لا توفر Authentication provider فعليًا، ولا object storage، ولا managed MySQL/TiDB، ولا queue/worker أو backups أو centralized observability. لذلك لا يجوز اعتبار `CDKS_DEFAULT_WORKSPACE_USER_ID` أو actor القادم من body هوية إنتاجية.

## المتطلبات المؤجلة قبل الاستضافة

يتطلب النشر المستضاف قرارًا من المستخدم بشأن مزود Authentication والبيئة المستضافة وقاعدة البيانات الدائمة وObject Storage وسياسة الأسرار والنسخ الاحتياطية. بعد ذلك يلزم تنفيذ middleware يستخرج الهوية من session موثقة، وترحيل SQLite إلى مخزن مستضاف مع migrations وbackup/restore، وإضافة rate limiting وstructured logs وalerts وreadiness probes وعمليات rollback.

كما يلزم قرار منفصل قبل أي connector حي: read-only scopes أولًا، ownership verification، exact-period evidence، redaction، retry/backoff، ثم approval مستقل لأي صلاحية كتابة. لا تفتح هذه الدفعة تلك الصلاحيات.

## موقف Market Validation

ما يزال النظام يستخدم `marketValidated=false` افتراضيًا. لا تُحوّل أحداث Measurement المخططة إلى observations، ولا تُنشأ مؤشرات CPC أو CPA أو CVR أو ROAS أو saturation أو competitor performance بلا evidence رسمي مطابق للمصدر والفترة والنطاق.
