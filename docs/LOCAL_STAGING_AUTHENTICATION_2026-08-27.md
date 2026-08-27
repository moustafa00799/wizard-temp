# Local Staging Authentication — 2026-08-27

## القرار

تم اختيار **Local Signed Session Adapter** بدل إضافة مزود OAuth خارجي في هذه المرحلة. هذا الاختيار مناسب لأن النطاق الحالي هو Local Staging شخصي، ولا يحتاج إلى حسابات خارجية أو Redirect URLs أو صلاحيات جديدة. صُمم الـadapter كحد فاصل قابل للاستبدال لاحقًا بمزود Authentication حقيقي.

> **هذا ليس نظام Authentication إنتاجيًا.** هو مسار محلي مضبوط للتجربة، مع session موقعة وعضوية workspace واختبارات tampering، ولا يدّعي إثبات هوية خارج جهاز الاختبار.

## آلية العمل

يدخل المستخدم إلى `/login` ويقدم `CDKS_LOCAL_AUTH_ACCESS_CODE`. يقارن الخادم الكود بطريقة constant-time، ثم ينشئ session قصيرة العمر تحتوي `userId` و`workspaceId` و`role` ووقت الإصدار والانتهاء. تُوقّع الـsession بـHMAC-SHA256 وتُرسل في cookie من نوع HttpOnly وSameSite=Lax، ولا تُعاد قيمة الكود أو session token في JSON أو السجلات.

تُستخدم الجلسة في مسارات lifecycle وPreparation وAudit. لا يثق الخادم في `actor_user_id` المرسل من الواجهة؛ فإذا أُرسل يجب أن يطابق هوية الجلسة، والهوية المعتمدة التي تُحفظ في lifecycle event تُستخرج من session. كما لا تسمح الواجهة بإرسال system transitions العامة.

## الإعداد

انسخ `.env.example` إلى `.env.local`، ثم غيّر القيمتين السريتين:

```bash
cp .env.example .env.local
```

يجب أن يكون `CDKS_LOCAL_AUTH_ACCESS_CODE` بطول 12 محرفًا على الأقل، وأن يكون `CDKS_LOCAL_AUTH_SESSION_SECRET` بطول 32 محرفًا على الأقل وذا قيمة عشوائية محلية. لا تضع `.env.local` في Git ولا ترسل محتواه في المحادثة. استخدم `CDKS_LOCAL_AUTH_ROLE=owner` للاختبار الشخصي فقط.

شغّل الخادم كما يلي:

```bash
npm ci
npm run build
CDKS_APP_DB_PATH=.local/cdks-app.sqlite npm run start
```

ثم افتح `http://localhost:3000/login`. بعد الدخول تنتقل الواجهة إلى `/wizard`. يمكن فحص الجلسة عبر `GET /api/auth/local/me` وتسجيل الخروج عبر زر أو `POST /api/auth/local/logout`.

## الصلاحيات

يُنشئ تسجيل الدخول المحلي workspace المحدد في البيئة وعضوية أولية للمستخدم. تقبل lifecycle transitions البشرية أدوار `owner` و`admin` و`reviewer` فقط، بينما يستطيع `analyst` قراءة Audit عند استخدام مزود حقيقي لاحقًا. تبقى كل العمليات `blueprint_only`، ولا توجد صلاحية provider write أو Publish أو Spend.

## الاختبارات

يختبر `npm run test:auth:local` الكود الخاطئ، login الصحيح، عدم تسريب access code، قراءة `me`، session tampering، الطلب anonymous، وlogout. ويستخدم `test:campaign:lifecycle:http` session موقعة فعلية لاختبار رحلة Draft إلى Review إلى Human Approval ثم Preparation Export. كما تثبت `test:workspace:isolation` أن جلستي workspace A وB لا تعبران حدود كل منهما.

## الاستبدال لاحقًا

عند اختيار مزود خارجي، يُستبدل implementation داخل adapter، لا عقود lifecycle أو audit أو workspace. يجب أن يعيد المزود هوية موثقة وworkspace membership وrole، ويجب أن يستمر الخادم في اشتقاق actor من session وعدم قبول actor من body. قبل الإنتاج يلزم إعداد MFA أو سياسة مناسبة، session revocation، account recovery، invite management، CSRF strategy، rate limiting، audit للـlogin/logout، ومراجعة مستقلة للـRBAC.

## الحدود

Access Code المحلي يثبت امتلاك سر البيئة، وليس هوية شخص أو مؤسسة. لذلك يستخدم فقط في Local Staging على جهاز المالك. لا يجوز إعادة استخدامه في بيئة مشتركة أو مستضافة، ولا يجوز اعتباره بديلًا عن OAuth أو SSO أو مزود هوية مُدار. ما يزال `marketValidated=false`، وما يزال اعتماد الحملة يعني review/preparation/export فقط وليس launch أو publish أو spend.
