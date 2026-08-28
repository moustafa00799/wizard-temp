# دراسة نطاق التطوير المؤجل في Campaign Builder AI / CDKS

**التاريخ:** 2026-08-28
**الحالة:** دراسة بعد إغلاق دفعة إصلاحات Blueprint المحصورة
**النطاق:** العربية والإنجليزية، المصطلحات الاحترافية، Information Architecture، توسيع AI Strategy Builder وAI Reasoning

## الخلاصة التنفيذية

التعديلات المقترحة جوهرية من ناحية المنتج وتجربة العميل، لكنها لا تجبرنا على إعادة بناء CDKS أو Canonical Blueprint من الصفر. القرار المعماري الصحيح هو إبقاء Blueprint وعقود CDKS محايدة عن اللغة، ثم بناء طبقة عرض وترجمة وصياغة فوقها. يدعم Next.js هذا النمط من خلال locale routing وقواميس ترجمة تعتمد على مفاتيح مستقرة، كما تؤكد إرشادات Microsoft أهمية فصل النصوص القابلة للترجمة عن المنطق، ودعم Unicode وRTL/LTR والتنسيق المحلي [1] [2].

التوسع المقترح للذكاء الاصطناعي ممكن، لكن يجب ألا يتحول إلى سلطة قرار أو قناة تنفيذ. يمكنه تفسير قرارات CDKS بعمق أكبر، واقتراح أفكار ورسائل وسيناريوهات، وتحليل مصادر سوقية أو منافسين عند توفر evidence مطابق، وإنشاء مسودات إبداعية، ثم تمر كل مخرجاته عبر schemas وprovenance وقيود صلاحيات ومراجعة بشرية. لا يجوز له تحويل قيمة `unavailable` إلى حقيقة مرصودة، أو تعديل Rules Engine مباشرة، أو نشر حملة أو إنفاق ميزانية.

التوصية هي تنفيذ ذلك على مراحل: طبقة ثنائية اللغة ومصطلحات موحدة، ثم شرح AI Reasoning عميق مرتبط بالأدلة والقرارات، ثم وحدات AI متخصصة للبحث والإبداع وضبط الجودة، ثم تكاملات read-only وأدوات إنتاج منفصلة. هذا يخفض المخاطر ويحافظ على قابلية الاختبار.

## أولًا: دعم العربية والإنجليزية

### هل يتطلب إعادة برمجة كبيرة؟

ليس إذا فُصلت اللغة عن العقد. سيكون التغيير **متوسطًا في طبقة الواجهة**، لكنه محدود في قلب CDKS. يوجد أصلًا حقل `locale` في عقود Blueprint وAI Reasoning، وتدعم prompts الحالية `ar` و`en`، لكن صفحات Wizard وBlueprint تحتوي نصوصًا عربية مباشرة، وأسماء الأقسام والرسائل ليست كلها مفصولة في قاموس ترجمة. لذلك نحتاج إلى refactor منظم، لا إلى تغيير في قرارات CDKS.

يجب عدم ترجمة مفاتيح العقد مثل `budget_management` أو `industry_average_cvr` داخل البيانات نفسها. تبقى هذه مفاتيح مستقرة، وتُعرض بالعربية أو الإنجليزية من خلال قاموس:

```text
blueprint.sections.budget_management
blueprint.fields.industry_average_cvr
status.unavailable
status.check_manually
```

### التصميم المقترح

| الطبقة | ما يحدث فيها |
|---|---|
| Canonical data | قيم محايدة اللغة، enums ومفاتيح ثابتة، أرقام ووحدات معيارية |
| Locale preference | يختارها العميل من Wizard أو إعدادات الحساب، بقيم `ar` أو `en` |
| Translation dictionary | يترجم عناوين الأقسام والحالات والتعليمات ورسائل النظام |
| Formatting layer | ينسق العملة والأرقام والتاريخ حسب locale مع الحفاظ على القيمة الأصلية |
| Direction layer | يضبط `dir="rtl"` للعربية و`dir="ltr"` للإنجليزية |
| User-authored content | يُحفظ كما أدخله العميل، ولا يُستبدل تلقائيًا بترجمة غير مؤكدة |
| AI explanation | يُطلب بالـlocale المحدد، ثم يُتحقق من schema ويُعرض كطبقة استشارية |

يدعم Next.js التوجيه حسب locale من خلال sub-path أو domain، وقواميس ترجمة بمفاتيح مستقرة، ويمكن وضع الصفحات تحت `app/[lang]` عند اعتماد routing كامل [1]. أما في Local Staging الحالي، فلا حاجة إلى نقل كل المسارات فورًا. البدء الأبسط هو حفظ `locale` في Wizard state، وتمريره إلى Blueprint view، واستخدام dictionary في الصفحات الحالية. يمكن إضافة `/ar/...` و`/en/...` لاحقًا عند الحاجة إلى روابط مستقلة.

### ترتيب التنفيذ

1. إضافة `locale: "ar" | "en"` إلى حالة Wizard وطلب generate مع default عربي.
2. إنشاء `src/lib/i18n/dictionaries/ar.ts` و`en.ts`، أو ملفات JSON مكافئة.
3. نقل عناوين Blueprint والحالات ورسائل الأخطاء إلى مفاتيح ترجمة.
4. إضافة locale-aware formatting للعملة والتاريخ والنسب.
5. إضافة RTL/LTR واختبار طول النصوص ومرآة التخطيط؛ Microsoft توصي بإخراج النصوص من الكود وتجنب concatenation واختبار pseudolocalization وbidirectional layouts [2].
6. ترجمة الواجهة الثابتة أولًا، ثم محتوى AI، ثم المحتوى الإعلاني الاختياري.
7. إبقاء identifiers وprovenance وraw diagnostics في طبقة تقنية مستقلة.

### ما لا ينبغي فعله

لا ينبغي استخدام AI لترجمة كل الواجهة وقت التشغيل؛ لأن ذلك يسبب عدم ثبات المصطلحات ويصعب الاختبار. ولا ينبغي ترجمة قيم العميل أو ادعاءات evidence دون الاحتفاظ بالقيمة الأصلية واللغة والمصدر. القواميس الثابتة هي المصدر المناسب للواجهة، وAI يستخدم فقط للمحتوى الإنشائي الذي يُراجع ويُثبت لغويًا.

## ثانيًا: المصطلحات الاحترافية

التعديل الصحيح هو بناء **قاموس مصطلحات تسويقي** قبل تغيير العناوين. يجب الفصل بين:

- **Contract key:** لا يتغير، مثل `recommended_funnel`.
- **Internal label:** يمكن أن يبقى للمطور.
- **Client label:** صياغة عربية أو إنجليزية مفهومة.
- **Help text:** شرح قصير لما يعنيه المصطلح.
- **Source/authority label:** يوضح هل القيمة من Wizard أو CDKS أو evidence أو unavailable.

مثال:

| Contract key | العربية المقترحة | English label | شرح العميل |
|---|---|---|---|
| `recommended_funnel` | المسار التسويقي المقترح | Recommended marketing funnel | كيف ينتقل العميل من التعرف إلى الإجراء |
| `audience_structure` | هيكل الجمهور المستهدف | Target audience structure | الشرائح التي ستوجه إليها الرسائل |
| `creative_strategy` | استراتيجية المحتوى والإبداع | Creative and content strategy | نوع الرسائل والأصول التي يقترح اختبارها |
| `budget_split` | توزيع الميزانية المقترح | Suggested budget allocation | توزيع تخطيطي لا يعني إنفاقًا فعليًا |
| `benchmarks` | المؤشرات المرجعية | Reference metrics | مؤشرات لا تظهر إلا عند وجود مصدر موثوق مطابق |
| `readiness` | جاهزية التجهيز | Preparation readiness | ما يجب مراجعته قبل أي إطلاق مستقبلي |

يجب أن يظهر لكل قيمة مصدرها الدلالي: «من مدخلاتك»، «مقترح من قواعد CDKS»، «غير متاح لغياب مصدر موثوق»، أو «يحتاج تحديدًا». هذا أكثر أهمية من الترجمة وحدها.

## ثالثًا: إعادة بناء المخرجات

تم في الدفعة السابقة إضافة ستة محاور عرض مع الحفاظ على الأقسام والـrenderers الستة والعشرين. هذا هو الاتجاه الصحيح، ويمكن تطويره إلى ثلاث طبقات قراءة:

| الطبقة | المستخدم | المحتوى |
|---|---|---|
| Executive view | العميل | القرار، الجمهور، المسار، القنوات، الخطوات التالية، المخاطر الواضحة |
| Review view | العميل والمراجع | الميزانية، القياس، الأدلة، سياق السوق، تفاصيل الاعتماد |
| Technical view | المراجع والمطور | IDs، provenance، provider/model، validation diagnostics، audit |

الصفحة يجب أن تبدأ بملخص يجيب عن أربعة أسئلة: ما الهدف؟ من الجمهور؟ ما الخطة؟ ما الذي يمنع الجاهزية؟ بعد ذلك تأتي المحاور الستة، ثم الأدلة والحوكمة. يجب أن تكون كل بطاقة قابلة للبحث والفتح، مع عناوين ثابتة ومراتب بصرية واضحة.

عند غياب قيمة، لا تعرض JSON keys أو رسائل تقنية طويلة. استخدم بطاقة موحدة تتضمن الحالة والسبب والإجراء التالي. مثال:

```text
المؤشر المرجعي: غير متاح حاليًا
السبب: لا يوجد مصدر موثوق يطابق السوق والصناعة والعملة والهدف.
الخطوة التالية: يمكن استكماله عند توفير evidence مطابق.
```

## رابعًا: توسيع دور AI

### ما يستطيع AI فعله بأمان

يمكن تقسيم القدرات إلى وحدات منفصلة بدل Agent واحد يمتلك صلاحيات واسعة:

| الوحدة | المهمة | مصدرها | المخرج |
|---|---|---|---|
| Evidence Synthesizer | تلخيص الأدلة الخاصة والمصادر العامة المطابقة | Evidence Package منقح | ملخص مع provenance وحدود |
| Strategy Advisor | اقتراح رسائل وزوايا وتجارب | Wizard + CDKS + evidence | اقتراحات غير ملزمة |
| Market/Competitor Analyst | تحليل سياق سوقي أو منافسين | مصادر عامة أو provider read-only | ملاحظات scoped لا benchmarks مخترعة |
| Creative Planner | اقتراح hooks ونسخ وscripts وأفكار carousel/video/image | brief وقيود العلامة | مسودات إبداعية |
| Compliance and QA Reviewer | فحص claims والمخاطر واللغة والسياسات | Blueprint وdrafts | تحذيرات ورفض آمن |
| Explanation Builder | شرح قرارات CDKS والأسباب والقيود | decision refs وevidence refs | تفسير متعمق قابل للتدقيق |

### علاقة AI بـRule Engine

لا ينبغي أن يكتب AI قواعد إنتاجية مباشرة. المسار الآمن هو:

```text
AI يقترح rule candidate أو exception
        ↓
تقييم offline على fixtures وgolden cases
        ↓
مراجعة بشرية وتوثيق version
        ↓
تحديث Rule Engine من خلال commit واضح
        ↓
تشغيل parity وsemantic وenterprise regressions
```

بذلك يمكن الاستفادة من AI في اكتشاف patterns أو اقتراح تحسينات، دون السماح له بتغيير القرار أثناء طلب العميل أو تغيير الميزانية تلقائيًا.

### التعامل مع القيم غير المحددة

يمكن للـAI أن يقدّم **فرضية أو خيارًا مشروطًا**، لكنه لا يجوز أن يحول `unavailable` إلى observation. يجب التفريق بين:

```text
Observed fact: مدعوم بدليل
Qualified inference: استنتاج مشروط مع مصدر وحدود
Assumption: افتراض معلن يحتاج تأكيدًا
Recommendation: اقتراح غير ملزم
Unavailable: لا يوجد دليل كافٍ
```

مثال آمن:

> لا يتوفر CPC موثق. إذا كانت القناة تهدف إلى جمع leads، يمكن اختبار رسالتين مختلفتين، لكن لا يمكن توقع CPA قبل وصول بيانات فعلية.

مثال غير آمن:

> سيكون CPA المتوقع 40 ريالًا.

## خامسًا: AI Reasoning بشكل أعمق

العقد الحالي قادر مبدئيًا على شرح أعمق؛ فهو يحتوي على `summary` و`claims` و`evidence` و`uncertainties` و`decision_impacts` و`limitations`. المشكلة الحالية أن prompt يطلب إخراجًا مختصرًا، وأن الواجهة تعرض التفاصيل التقنية والمخرجات الفارغة بطريقة مربكة.

التطوير المقترح هو إضافة بنية تفسيرية منظمة لكل قرار، مثل:

```text
decision_ref
what_decided
recommendation
why_this_fits
expected_effect
tradeoffs
risks
what_would_change_this
next_validation_step
confidence
 evidence_refs
uncertainty_refs
```

ويجب أن يشرح AI كل توصية بهذا الأسلوب:

> **القرار:** استخدام مسار جمع leads.
> **لماذا:** لأن هدف Wizard هو leads، ووجهة التحويل تعتمد على تواصل مباشر، بينما لا توجد إشارة مؤكدة إلى checkout مكتمل.
> **الأثر المتوقع:** تقليل الاحتكاك في الخطوة الأولى، لكن لا يمكن إثبات معدل التحويل قبل وصول بيانات فعلية.
> **المخاطر:** إذا كانت سرعة الرد ضعيفة فقد تتراجع جودة العملاء المحتملين.
> **ما يجب التحقق منه:** زمن الرد، تعريف qualified lead، وربط الحدث بالتحويل.

يجب أن يرتبط كل ادعاء بـ`decision_refs` و`evidence_refs` و`uncertainty_refs`. وإذا لم يوجد evidence، تظهر الصياغة كفرضية أو قيد، لا كحقيقة. يجب أن تبقى `decision_impacts.changed=false`، وأن تظل سلطة `DECISION_POLICY` و`READINESS_POLICY` و`RULE_ENGINE` و`HUMAN_APPROVAL` محفوظة.

## سادسًا: الحوكمة عند التوسع

إضافة أدوات تحليل السوق والمنافسين أو توليد الصور والفيديو والكاروسيل توسع سطح المخاطر. تؤكد NIST أهمية إدخال اعتبارات الثقة وإدارة المخاطر في تصميم وتطوير واستخدام وتقييم أنظمة الذكاء الاصطناعي التوليدي [3]. كما أن OWASP حدّث مشروعه إلى GenAI Security Project وأصدر نسخة 2026 من Top 10، ما يدعم التعامل مع prompt injection، تسريب البيانات، tool permissions، والتحقق من المخرجات كمتطلبات هندسية وليست تحسينات اختيارية [4].

لذلك يجب أن تكون كل أداة مستقبلية خلف عقد مستقل يتضمن:

- input schema ومنع PII والـraw credentials.
- allowlist للمصادر والنطاق والفترة.
- read-only connector في البداية.
- timeout وretry وrate limit وcircuit breaker.
- output schema وcontent safety وprovenance.
- audit event منقح.
- صلاحيات منفصلة عن صلاحية AI نفسه.
- human approval قبل أي تغيير أو تصدير قابل للتنفيذ.

تظل الصور والفيديو والكاروسيل **creative drafts** لا حملات منشورة. يمكن حفظها كأصول منفصلة مع metadata، لكن لا يجوز أن تمنح AI صلاحية إنشاء ad set أو تحديد spend أو تنفيذ publish.

## البدائل العملية

| البديل | الوصف | التقييم |
|---|---|---|
| Minimum viable localization | locale + dictionaries + RTL/LTR + labels عربية/إنجليزية | الأقل مخاطرة والأسرع لإثبات تجربة العميل |
| Recommended product path | localization ثم deep reasoning ثم creative drafts ثم read-only market tools | الأنسب لمشروع CDKS الحالي |
| Full agent platform | agent orchestration، tools، connectors، asset generation، evaluations، approvals | مناسب لاحقًا بعد استضافة وهوية ومراقبة وقاعدة بيانات دائمة |
| AI-only rewriting | جعل AI يعيد صياغة كل Blueprint وقت التشغيل | غير موصى به؛ يسبب عدم ثبات ومشاكل تدقيق ولا يعالج بنية المخرجات |

## خطة التنفيذ المقترحة بعد هذه الدراسة

1. اعتماد قاموس المصطلحات العربي والإنجليزي وتحديد labels العميل مقابل identifiers الداخلية.
2. إضافة locale إلى Wizard وBlueprint مع default عربي واختبار تبديل اللغة.
3. نقل العناوين والحالات والرسائل إلى dictionaries وإضافة RTL/LTR وتنسيق العملة والتاريخ.
4. تحسين AI Reasoning schema وprompt والواجهة لعرض «القرار، السبب، الدليل، الأثر، المخاطر، والخطوة التالية».
5. إضافة evaluator يقيس grounding ووضوح الشرح وعدم اختراع benchmarks.
6. بناء Creative Planner كطبقة اقتراحية منفصلة تنتج drafts فقط.
7. بناء Evidence/Market Analyst read-only عند توفر مصادر مطابقة، مع quarantine للمخرجات غير المؤكدة.
8. إنشاء مسار offline لاقتراحات Rule Engine، مع مراجعة وversioning وregressions قبل أي اعتماد.
9. تأجيل تكاملات الكتابة أو النشر وأي صلاحيات provider write إلى ما بعد Authentication مستضاف ومراقبة ونسخ احتياطية.

## الخلاصة

اللغة الثنائية وإعادة بناء العرض **ليستا إعادة بناء للمشروع**، بل refactor presentation and localization layer يجب تنفيذه مبكرًا قبل تضخم الواجهة. توسيع AI ممكن ومفيد، لكنه يجب أن يكون مجموعة capabilities مقيدة لا Agentًا عامًا يقرر وينفذ. أما AI Reasoning فيمكن ترقيته من عبارات مختصرة إلى شرح مهني عميق باستخدام الحقول الموجودة أصلًا، مع توسيع العقد فقط عند الحاجة، بشرط بقاء كل فقرة مرتبطة بقرار ودليل وقيد.

يبقى CDKS وCanonical Blueprint المصدر الحاكم. AI يقترح ويفسر وينشئ مسودات، والإنسان يراجع ويعتمد، ولا توجد Market Validation عامة أو Launch أو Publish أو Spend من هذه التوسعة.

## References

[1]: https://nextjs.org/docs/app/guides/internationalization "Next.js — Internationalization"

[2]: https://learn.microsoft.com/en-us/globalization/methodology/software-internationalization "Microsoft Learn — Software Internationalization"

[3]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence "NIST — AI RMF: Generative AI Profile"

[4]: https://owasp.org/www-project-top-10-for-large-language-model-applications/ "OWASP — Top 10 for Large Language Model Applications / GenAI Security Project"
