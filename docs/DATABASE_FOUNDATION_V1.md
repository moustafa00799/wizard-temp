# Database Foundation v1

## الهدف والنطاق

يضيف هذا الإصدار طبقة تخزين أولية قابلة للنقل لبيانات Campaign Builder AI. الهدف هو حفظ brief والـBlueprint والمصادر والـsnapshots وحزم الأدلة والسياق الاستراتيجي وحالة الموصلات وسجل المزامنة والموافقات والتدقيق، مع إبقاء المشروع في وضع `blueprint_only`.

> هذه الطبقة لا تنفذ اتصالًا حيًا بـMeta أو Google أو TikTok أو GA4، ولا تنشئ أو تعدل أو تنشر حملات، ولا تمنح أي صلاحية كتابة.

## قرار التخزين في v1

يستخدم الإصدار الأول SQLite عبر `node:sqlite` المتاحة في بيئة Node الحالية، مع SQL migration مستقلة وواجهة repositories. لا تُربط قاعدة البيانات بواجهة العميل مباشرة، وتبقى كل عملياتها الخادمية. تصميم الجداول يعتمد على أنواع نصية معيارية وحقول JSON، ما يسمح بنقل المخطط لاحقًا إلى MySQL/TiDB أو محرك مستضاف دون تغيير عقود Knowledge وStrategy.

| طبقة | ما يُنفذ في v1 | ما يؤجل |
|---|---|---|
| Structured Store | SQLite schema وforeign keys وindexes وunique constraints | قاعدة مستضافة إنتاجية |
| JSON payloads | حفظ نسخة JSON مع metadata وhashes | Object Store للملفات الأصلية |
| Vector retrieval | لا يوجد | embeddings وVector Index |
| Persistence | repositories للكيانات الأساسية | jobs وqueue workers |
| Provider state | accounts وconnections وread-only scopes وcollections | OAuth connectors الحية |
| Governance | approvals وaudit events وحظر write-enabled | RBAC كامل ومتعدد العملاء |

## الكيانات

| المجموعة | الكيانات |
|---|---|
| العزل | `workspaces`, `workspace_memberships` |
| مدخلات العميل | `client_briefs`, `wizard_submissions` |
| القرار canonical | `canonical_blueprints`, `blueprint_versions` |
| المعرفة | `source_records`, `source_versions`, `industry_profiles`, `knowledge_snapshots`, `knowledge_snapshot_versions`, `market_facts`, `claims` |
| الأدلة | `evidence_packages`, `evidence_package_snapshots`, `evidence_links` |
| الاستراتيجية | `strategy_contexts`, `strategy_recommendations` |
| الموصلات | `provider_accounts`, `provider_connections`, `provider_scopes`, `provider_collections` |
| المزامنة | `sync_runs`, `sync_cursors`, `deferred_sources` |
| الحوكمة | `approval_events`, `audit_events` |

كل كيان تشغيلي رئيسي يحتوي على `workspace_id` أو يرتبط بكيان يحمل `workspace_id`. تعتمد العلاقات الخارجية على `ON DELETE RESTRICT` لمنع حذف سجل مصدر أو Blueprint بينما توجد أدلة أو توصيات تعتمد عليه.

## قواعد الأمان

تفرض migration أن يكون `generation_mode='blueprint_only'` وأن تكون `external_actions_allowed=0` و`budget_spend_allowed=0`. كما أن `provider_connections.read_only=1` دائمًا في هذا الإصدار، وrepository يرفض `write_enabled`.

لا تُخزن كلمات مرور أو OAuth tokens أو refresh tokens أو API keys أو cookies أو MFA. الحقل `secret_ref`، عند استخدامه، هو معرف غير سري لمكان تخزين خارجي، ويُرفض أي نص يبدو كأنه مادة سرية.

لا تُحفظ raw reports داخل Git أو fixtures. الحقول JSON في هذا الإصدار مخصصة لـmetadata وpayloads منقحة، ويمكن استبدالها لاحقًا بمراجع Object Store عند بناء ingestion production.

## Migration وAPI

توجد migrations في:

```text
src/lib/db/migrations/0001_database_foundation.ts
src/lib/db/migrations/0002_personal_staging.ts
src/lib/db/migrations/0003_staging_test_runs.ts
src/lib/db/migrations/0004_knowledge_snapshot_persistence.ts
```

لا تُعدّل migrations السابقة بعد تطبيقها؛ تُضاف أي تغييرات لاحقة في migration جديدة.

وتوجد واجهة التشغيل في:

```text
src/lib/db/database.ts
src/lib/db/index.ts
```

الاستخدام الأساسي:

```ts
const database = openDatabase(":memory:");
const repositories = createRepositories(database);
repositories.workspaces.create({ workspaceId: "ws-1", name: "Demo" });
```

`openDatabase` يفعّل foreign keys ويطبق كل migrations بصورة idempotent. يمكن تمرير مسار ملف SQLite لاحقًا بدل `:memory:` دون تغيير repositories. ينشئ `knowledge.createSnapshot` تلقائيًا revision أولى مع `snapshot_sha256` و`source_manifest_sha256`، ويرفض تعارض المحتوى أو hash المختلف لنفس revision. كما يسجل `deferredSources` الحسابات أو الموصلات المؤجلة دون السماح بإدخالها في Evidence Packages أو `marketValidated`. لا يُنصح بتشغيل ملف قاعدة بيانات إنتاجي من مستودع Git أو داخل مجلد fixtures.

توجد خدمة التكامل في:

```text
src/lib/knowledge/persisted-strategy-context.ts
```

وتقوم بقراءة `ScopedStrategyContext` و`StrategyRecommendation` من قاعدة البيانات، والتحقق من Zod contract، ومطابقة workspace/package/market/industry/Blueprint bindings، ورفض أي سياق يفعّل `globalMarketValidated` أو أي governance flag غير آمن. هذه الخدمة لا تعدل Canonical Blueprint.

## الاختبار

يشغل regression بواسطة:

```bash
npm run test:database:foundation
```

ويتحقق من نجاح migrations أربع مرات دون تكرار، وإنشاء نسختين من brief، وربط Wizard submission، وحفظ Blueprint وhash، وحفظ Source وIndustryProfile وSnapshot وsnapshot revision وFact وEvidence Package وStrategy Context وRecommendation، وإنشاء provider connection قراءة فقط، وتسجيل مصدر مؤجل، وتحديث cursor، وتسجيل approval وaudit event. ويشغل تكامل Strategy Context مستقلًا عبر `npm run test:database:strategy-context`.

كما يثبت الاختبار أن النظام:

| البوابة | الإثبات |
|---|---|
| Migration idempotency | أربع migrations بعد التطبيق المتكرر |
| Referential integrity | حذف workspace مع سجلات تابعة مرفوض |
| Versioning | حفظ أكثر من نسخة brief ونسخة Blueprint ذات hash وsnapshot revision ذات hash |
| Scope metadata | snapshot وpackage وcontext تحفظ market وindustry، وdeferred source منفصل |
| Read-only provider | `write_enabled` مرفوض |
| Secret hygiene | مراجع secret المقبولة لا تحتوي material، وتظهر قيم API key في URL مرفوضة |
| Governance | canonical hash لا يتغير داخل persistence layer، وglobalMarketValidated/governance unsafe مرفوضان |
| Reproducibility | seed منقح deterministic داخل regression |

## نقطة التوقف المرحلية

عند نجاح هذا الإصدار يكون المشروع قد أنجز **قاعدة بيانات واختباراتها، وحفظ snapshots بإصدارات، وربطًا مقيدًا مع Strategy Context**، وليس منصة تشغيلية مكتملة. تبقى الموصلات الحية والمزامنة المجدولة وObject Store وVector Index وRBAC وSecret Manager وretention/encryption وdrift monitoring وClient UX وصلاحيات الكتابة خارج النطاق عمدًا.

## نقاط الاستئناف المستقبلية

يمكن استئناف المشروع دون كسر المخطط عبر إضافة migrations جديدة بدل تعديل migrations السابقة بعد نشرها. المسار اللاحق المقترح هو إضافة driver مستضاف، ثم Search Console أو CRM/store، ثم GA4 أو إعادة فتح Google Ads 939 read-only، ثم sync jobs وcursors حقيقية، ثم Object Store وevidence panels، وأخيرًا تقييم أي انتقال إلى صلاحيات كتابة في مرحلة مستقلة وبموافقة صريحة.
