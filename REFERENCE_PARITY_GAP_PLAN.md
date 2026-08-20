# خطة تكافؤ Blueprint مع المراجع

## 1. الغرض

تحدد هذه الوثيقة الفجوات بين `CanonicalBlueprint v3` الحالي والـBlueprints المرجعية `ecommerce` و`local_service`، وتحولها إلى متطلبات عقد ومخرجات واختبارات قابلة للقياس. الهدف ليس نسخ بنية الملفات القديمة حرفيًا، بل تحقيق **تكافؤ دلالي قابل للإثبات** مع الحفاظ على مبادئ المشروع:

> AI يقترح، CDKS يقرر، الإنسان يعتمد، ولا توجد إجراءات نشر أو إنفاق في مرحلة Blueprint-only.

## 2. خط الأساس بعد إعادة تشغيل البوابة

آخر تشغيل محلي بتاريخ `2026-08-20T02:24:41.964Z` أعطى:

| المقياس | النتيجة |
|---|---:|
| اختبارات عقد API للـfixtures | 10/10 |
| حقول Canonical Wizard | 41/41 |
| الفروع | 4/4 |
| اللغات | 2/2 |
| العملات | 3/3 |
| حالات الجاهزية بعد التأكيد | 3/3 |
| تغطية أقسام المراجع | 6 كاملة، 12 جزئية، 8 مفقودة |
| النتيجة | `PASS_WITH_GAPS` |

### ملاحظة منهجية

توجد أقسام في تقرير البوابة مصنفة `missing` رغم أن محرك v5 أو الواجهة يقدمان جزءًا منها تحت مسار canonical مختلف. لذلك يجب أولًا فصل **فجوة التوليد/العقد** عن **فجوة خريطة القياس**. لا يجوز إضافة نسخ مكررة من البيانات فقط لإرضاء مسار legacy في البوابة.

أمثلة ذلك:

| اسم المرجع | المسار canonical الحالي المحتمل | الإجراء الصحيح |
|---|---|---|
| `first_14_days_plan` | `execution.launch_plan.detailed_timeline` | تحديث خريطة البوابة وإضافة alias عرضي موثق عند الحاجة |
| `pre_launch_fixes` | `execution.launch_plan.pre_launch_checklist` | تحديث خريطة البوابة، مع إبقاء renderer على العقد canonical |
| `monitoring` | `governance.monitoring_plan.post_launch_plan` | توحيد wrapper وقياس الأوراق قبل الحكم بأنها مفقودة |
| `benchmarks` | `governance.monitoring_plan.testing_plan.benchmarks` | توحيد wrapper وإضافة الحقول المرجعية الناقصة |
| `platform_guides` | `governance.monitoring_plan.testing_plan.platform_guides` | توحيد wrapper، ثم إثراء القواعد حسب المنصة |

## 3. مبدأ العقد الموسع

سيكون التوسع **إضافيًا وغير كاسر** عبر إصدار `CanonicalBlueprint v3.1`، مع إبقاء `contract_version: 3.0` للـfixtures الحالية إلى أن تكتمل بوابة الترحيل. كل قسم موسع يجب أن يلتزم بالقواعد التالية:

1. كل قرار قابل للتدقيق يستخدم بنية موحدة: `value`, `confidence`, `reasoning`, `rule_id`.
2. كل عنصر مشتق من مدخل Wizard أو قاعدة يحمل provenance قابلًا للربط بمسار المصدر.
3. القيم الرقمية تحفظ بوحدات صريحة: النسب بين `0-100` أو `0-1` حسب الحقل، والعملة في envelope.
4. الحقول غير القابلة للتطبيق تستخدم `status: not_applicable` مع سبب، ولا تستخدم `undefined` أو نص «غير محدد».
5. المخرجات branch-aware: نفس العقد، مع `applicability` وحقول اختيارية مشروطة بالفرع، بدل عقود منفصلة غير قابلة للمقارنة.
6. لا يُسمح للـAI بإنشاء benchmark أو claim سوقي غير موثق؛ يجب أن يحدد المصدر أو الحالة `unavailable`.

## 4. الأقسام الثمانية المصنفة مفقودة حاليًا

### 4.1 `audience_analysis`

**المطلوب:** إضافة تحليل حجم الجمهور، خطر التداخل، وfrequency cap.

| مجموعة المخرجات | الحقول الصريحة |
|---|---|
| الحجم | `min`, `max`, `label`, `daily_reach_estimate` |
| التداخل | `overlap_risk`, `overlapping_pairs` أو `segments`, `average_overlap`, `recommendations` |
| التكرار | `max_frequency_7_days`, `max_frequency_30_days`, `warning_threshold`, `rationale`, `action_if_exceeded` |

**مصادر القرار:** `geo_scope`, `target_locations`, `audience_segments`, `business_type`, `ad_channels`، وقواعد RF-006/RF-013/RF-014.

**الاختبار:** تغطية ecommerce متعدد الشرائح وlocal_service أحادي النطاق، مع التحقق من عدم إنتاج تقدير دقيق زائف عندما لا تتوفر بيانات فعلية.

### 4.2 `creative_strategy`

**المطلوب:** فصل استراتيجية الإبداع عن `creative_angles` التنفيذية.

| مجموعة المخرجات | الحقول الصريحة |
|---|---|
| الصيغ | `type`, `priority`, `specs`, `best_for`, `channel`, `asset_ready`, `recommendation` |
| تحديث الإبداع | `refresh_interval_days`, `test_new_creative_every`, `sunset_threshold`, `fatigue_indicators`, `refresh_triggers` |
| الدليل الاجتماعي | `social_proof_score`, `status`, `present`, `gaps`, `recommendations`, `ad_performance_impact` |

**مصادر القرار:** `creative_assets`, `content_capacity`, `sales_motion`, `awareness_level`, `business_type` وقواعد RF-007/RF-015/RF-028.

**الاختبار:** ضمان اختلاف التوصيات بين ecommerce وlocal_service وapp وb2b، وعدم اعتبار asset غير موجود جاهزًا.

### 4.3 `tracking_assessment`

**المطلوب:** إضافة تقييم تشخيصي منفصل عن checklist.

| مجموعة المخرجات | الحقول الصريحة |
|---|---|
| الدرجة | `score`, `level` |
| الأدوات | `present_tools`, `missing_tools` |
| الأحداث | `required_events` |
| خطة الإعداد | `setup_steps[]` مع `tool` و`steps[]` |

**مصادر القرار:** `tracking_status`, `tracking_tools`, `key_events`, `conversion_model`, `conversion_destination` وقاعدة RF-008.

**الاختبار:** حالات tracking مكتمل، جزئي، ومفقود، مع ضمان تطابق الدرجة مع الحالة وعدم فتح readiness blocker تلقائيًا من AI.

### 4.4 `monitoring`

هذه ليست فجوة schema كاملة؛ فالمحرك يملك `governance.monitoring_plan.post_launch_plan`. المطلوب أولًا تصحيح خريطة Coverage Gate ومواءمة wrapper، ثم إثراء الحقول إلى تكافؤ المرجع:

`primary_kpis`, `check_frequency`, `monitoring_schedule[]`, `alert_thresholds`, `reporting_dashboard`، إضافة إلى `confidence`, `reasoning`, `rule_id`.

### 4.5 `benchmarks`

المحرك يملك بنية benchmark أساسية. المطلوب توحيد المسار والwrapper وإضافة:

`industry_average_cvr`, `industry_average_ctr`, `target_cpa`, `performance_targets.week_1`, `week_2`, `week_3_plus`, `source`, `data_freshness`, `market`, `currency`, `applicability`, `confidence`.

لا يجوز اعتبار القيم حقائق سوقية حية دون مصدر؛ في حال عدم وجود مصدر موثوق يكون `status: unavailable` مع `reason`.

### 4.6 `platform_guides`

المحرك يملك قائمة عامة، لكنها لا تكافئ التفاصيل المرجعية. يجب إضافة قواعد حسب المنصة والقناة المختارة:

`platform`, `rules[]`, `objective_mapping`, `best_practices[]`, `tracking_requirements[]`, `creative_requirements[]`, `audience_constraints[]`, `policy_risks[]`.

يجب أن تكون التوصيات محكومة بقرار القنوات، وأن تعرض فقط المنصات المعتمدة في الـBlueprint.

### 4.7 `first_14_days_plan`

المخرجات موجودة فعليًا ضمن `execution.launch_plan.detailed_timeline`. لا نضيف نسخة ثانية؛ نُعرّف عقد alias رسمي أو خريطة قياس:

`total_days`, `milestones[]`, `critical_path`, `launch_ready_date`, مع مهام كل milestone وحقل `critical`.

يجب أن يدعم renderer الحالي الشكل canonical، وأن تتحقق البوابة من هذه المسارات بدل `current: null`.

### 4.8 `pre_launch_fixes`

المخرجات موجودة فعليًا ضمن `execution.launch_plan.pre_launch_checklist`. تُعرّف كواجهة قراءة legacy لا كمصدر ثانٍ للبيانات:

`items[]` مع `category`, `item`, `status`, `required`، و`summary` مع counters و`ready_to_launch` و`completion_percentage`.

## 5. الأقسام الاثنا عشر الجزئية حاليًا

| القسم | سبب النقص الحالي | متطلبات الوصول إلى 100% |
|---|---|---|
| `strategy_summary` | اختلاف أسماء `scores/channel_scores` ونقص بعض أوراق القرار | توحيد `recommended_objective`, `recommended_channels`, `funnel_type`, `confidence_score`, `estimated_timeline` مع جميع الأوراق وwrapper semantics |
| `recommended_funnel` | القرار موجود داخل `strategy.funnel_type` دون stages صريحة | إضافة `strategy.recommended_funnel` أو mapping موثق يحوي `funnel_type`, `stages[]`, `total_stages`، وكل stage: `stage_number`, `name`, `objective`, `content_template`, `kpi`, `budget_ratio` |
| `launch_plan` | البنية موجودة لكن القياس يحسب wrapper/حقولًا مختلفة | توحيد `detailed_timeline` و`pre_launch_checklist`، وإضافة confidence/reasoning/rule_id وحقول المرجع كافة |
| `budget_management` | pacing وburn-rate موجودان لكن التغطية لا تشمل كل الأوراق | استكمال `monthly_pacing`, `daily_targets`, triggers، الإسقاط الأسبوعي، alerts، recommendation، ووحدات العملة |
| `testing` | خطة A/B موجودة بعدد أقل من الحقول المرجعية | استكمال `tests`, `total_test_budget`, priority, duration, minimum spend, success metric, significance، مع فرض budget-only وعدم التنفيذ |
| `market_context` | seasonality وcompetitor موجودان لكن بعض الأوراق ناقصة | إضافة `market`, `country/region`, `seasonality`, CPC range, saturation, differentiation, budget recommendation, source/freshness |
| `compliance` | قائمة قانونية عامة قصيرة | حزمة مصر/الخليج/المنصة: legal requirements, privacy regulations, mandatory count, status, consultation flag، مع provenance وmanual review |
| `technical_audit` | تدقيق accessibility/mobile مختصر وبعض الحقول عامة | استكمال accessibility checks، mobile checks، `page_speed`, `ssl_certificate`, `domain_authority`، status وpriority fixes، مع `not_applicable` المفسرة |
| `offer_strategy` | مخرجات expiration موجودة لكن تغطيتها أقل من المرجع | إضافة `offer_type`, durations, urgency, tactics, copy examples, refresh frequency، وحقول confidence/reasoning/rule_id بصورة موحدة |
| `budget_split` | غالبية البيانات موجودة لكن بعض أوراق المرجع أو الوحدات ناقصة | استكمال daily budget، allocation، test/scale، CAC، currency/unit metadata، ومطابقة النسب دون تحويل خاطئ |
| `tracking_checklist` | 7/8 أوراق مغطاة | تحديد الورقة الناقصة صراحة في fixture diff، ثم إضافة الحقل أو تعديل خريطة القياس؛ لا يكفي عرض checklist بصريًا فقط |
| `debug` | `telemetry` لا يمثل debug المرجعي الكامل | إضافة قسم تشخيصي آمن يضم `scores_breakdown`, `rules_executed`, `decision_trace`, `validation_summary`, `warnings`, `timing`، دون أسرار أو بيانات شخصية أو prompt كامل |

## 6. تصميم التوسع المقترح

### المرحلة A: تصحيح القياس قبل تعديل العقد

1. تحديث `REFERENCE_SECTION_MAP` لمسارات `first_14_days_plan` و`pre_launch_fixes` و`monitoring` و`benchmarks` و`platform_guides` حسب canonical الفعلي.
2. إضافة اختبار wrapper normalization يزيل `value` من المرجع والـcanonical بطريقة موحدة.
3. إعادة تشغيل البوابة وتسجيل baseline جديد؛ لا نعلن أن قسمًا مفقود قبل التأكد من أن المسار غير موجود فعلًا.

### المرحلة B: v3.1 additive contract

1. إضافة schemas للأقسام الثلاثة الحقيقية المفقودة: `audience_analysis`, `creative_strategy`, `tracking_assessment`.
2. إضافة `recommended_funnel` وحقول parity الناقصة داخل `strategy`.
3. إضافة provenance لكل قسم جديد.
4. الحفاظ على `blueprint_only`, `external_actions_allowed: false`, `budget_spend_allowed: false`.

### المرحلة C: إثراء محرك CDKS

تُنقل القيم من قواعد deterministic ومصادر Wizard، ولا يُترك توليدها للـAI وحده. AI Strategy وAI Reasoning يمكنهما اقتراح تفسير أو بدائل، لكن المحرك يثبت القرار النهائي ويضع authority وconfidence.

### المرحلة D: واجهة Blueprint

إضافة renderers منظمة للأقسام الجديدة، مع إظهار:

- القيمة؛
- درجة الثقة؛
- سبب القرار؛
- مصدر القرار؛
- التحذير أو حالة `not_applicable`؛
- اختلاف الفرع والسوق والعملة.

### المرحلة E: اختبارات التكافؤ

لكل قسم ولكل فرع، يجب تحقق أربعة مستويات:

| المستوى | معيار النجاح |
|---|---|
| Schema | Zod parse ناجح دون `unknown` للقسم |
| Structural | جميع leaf fields المرجعية موجودة |
| Semantic | القيم تتوافق مع fixture expected outcomes والقواعد |
| UI | لا يظهر `غير محدد` عندما تكون قيمة canonical موجودة |

## 7. معيار إعلان التكافؤ 100%

لا نعلن الوصول إلى 100% بمجرد أن تصبح البوابة خضراء. الإعلان يتطلب:

1. `26/26` قسمًا بحالة `full` بعد توحيد mapping.
2. `10/10` fixtures API PASS.
3. `4/4` فروع، `2/2` لغات، `3/3` عملات.
4. اختبارات دلالية لكل قسم رئيسي عبر ecommerce وlocal_service على الأقل، ثم app وb2b.
5. فحص UI للأقسام الجديدة وعدم وجود fallback غير مبرر.
6. تحقق provenance وAI Reasoning لكل قرار جديد.
7. إثبات بقاء الحواجز: لا نشر ولا إنفاق ولا actions خارجية.

## 8. ترتيب التنفيذ المقترح

الأولوية ليست تشغيل مزودي AI حيّين. الترتيب الآمن هو:

1. تصحيح خريطة Coverage Gate وإعادة baseline.
2. إضافة schemas الحقيقية الثلاثة: audience analysis، creative strategy، tracking assessment.
3. استكمال funnel وlaunch plan وmonitoring وdebug.
4. إثراء budget/testing/benchmarks/market/compliance/technical audit/platform guides.
5. ربط renderers الجديدة بالواجهة.
6. إعادة تشغيل البوابة والاختبارات الدلالية والبصرية.
7. commit مستقل لكل مجموعة منطقية ورفعها إلى GitHub.

## 9. قرار المرحلة الحالية

المرحلة الحالية هي **تحليل وتصميم parity contract**، وليست إعلان وصول إلى 100%. الخطوة التنفيذية التالية هي تعديل خريطة Coverage Gate وكتابة اختبار normalization، ثم إصدار `CanonicalBlueprint v3.1` بشكل إضافي ومدروس بدل إضافة aliases مكررة غير موثقة.


## 9. تحديث التنفيذ بعد إعادة تشغيل Coverage Gate — 2026-08-20

تم تنفيذ المرحلة الأولى من سد الفجوات وإعادة تشغيل البوابة بعد إصلاح خريطة المسارات وتوسعة المخرجات canonical. النتيجة الجديدة:

| المقياس | النتيجة الجديدة |
|---|---:|
| اختبارات دورة Wizard v5 | PASS — 14 قسمًا غنيًا |
| اختبارات Golden API | 10/10 |
| حقول Canonical Wizard | 41/41 |
| الفروع | 4/4 |
| اللغات | 2/2 |
| العملات | 3/3 |
| حالات الجاهزية بعد التأكيد | 3/3 |
| أقسام المراجع | 10 كاملة، 16 جزئية، 0 مفقودة |
| النتيجة | `PASS_WITH_GAPS` |

### ما تم إنجازه في هذه الدفعة

أضيفت schemas ومخرجات حتمية صريحة لـ `audience_analysis` و`creative_strategy` و`tracking_assessment`، وأضيف `strategy.recommended_funnel` مع stages وKPIs ونسب الميزانية. كما تم توحيد ورفع تغطية `monitoring` و`benchmarks` و`platform_guides` و`pre_launch_checklist` عبر إضافة wrappers وmetadata اللازمة، مع الحفاظ على بعض الحقول القديمة للتوافق الخلفي.

تم كذلك تحديث `quality-reference-coverage-gate.cjs` لقياس المسارات canonical الفعلية، وتوسيع regression ليتحقق من الأقسام الأربعة عشر الغنية. لم تُستخدم مزودات AI حية في هذه الدفعة؛ جميع القيم الجديدة صادرة عن قواعد CDKS deterministic.

### تفسير الانتقال من 8 missing إلى 0 missing

هذا الانتقال لا يعني أن التكافؤ الدلالي النهائي تحقق تلقائيًا. جزء منه ناتج عن تصحيح false missing بسبب اختلاف المسار أو wrapper، والجزء الآخر ناتج عن إضافة حقول canonical صريحة. لذلك لا تزال حالة `16 partial` مهمة، ويجب استكمال الأوراق المرجعية والقيم branch-aware قبل إعلان 100%.

### المتبقي للوصول إلى 26/26 full

يجب الآن تحويل الأوراق الجزئية إلى assertions تفصيلية بدل الاكتفاء بوجود القسم. الأولويات هي:

1. استكمال أوراق `strategy_summary` و`recommended_funnel` و`launch_plan` و`budget_split` و`tracking_checklist` مع مقارنة leaf-by-leaf.
2. إثراء `monitoring` بإشعارات الميزانية والتكرار ومؤشرات التشغيل، مع مصدر وقابلية تطبيق حسب السوق.
3. استكمال `benchmarks` ببيانات freshness وmarket وcurrency وapplicability وstatus، ومنع عرض benchmark كحقيقة غير موثقة.
4. إثراء `platform_guides` بمتطلبات التتبع والإبداع والجمهور ومخاطر السياسات لكل قناة مختارة.
5. استكمال `budget_management` و`testing` و`market_context` و`compliance` و`technical_audit` و`offer_strategy` و`debug` بالأوراق المرجعية الناقصة.
6. إضافة semantic regression لكل قسم على ecommerce وlocal_service، ثم app وb2b، مع التحقق من اللغة والعملة وحالة `not_applicable`.

### معيار الإعلان النهائي

لا يُعلن التكافؤ 100% إلا عند تحقق `26/26 full`، مع بقاء اختبارات API وschema وsemantic وUI ناجحة، ووجود provenance وAI Reasoning لكل قرار، وبقاء `external_actions_allowed=false` و`budget_spend_allowed=false`.

> هذه الوثيقة تمثل خطة التنفيذ؛ أما الأرقام الرسمية لكل تشغيل فتوجد في `QUALITY_REFERENCE_COVERAGE_GATE.md`.
