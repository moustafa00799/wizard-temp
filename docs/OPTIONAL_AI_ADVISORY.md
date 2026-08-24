# AI الاستشاري الاختياري

## السلوك الافتراضي

يبدأ Wizard وAI الاستشاري مغلقًا. يحصل العميل عندها على Blueprint مبني على مدخلات Wizard وCDKS وRules Engine فقط. لا يتغير Canonical Blueprint ولا تُفتح أي صلاحية خارجية بسبب هذا الخيار.

## موافقة العميل

في الخطوة الأولى يظهر مفتاح واحد باسم **هل تريد استخدام AI الاستشاري؟**. تشغيل المفتاح هو موافقة العميل على إرسال نسخة منقحة من مدخلات Wizard إلى مزود AI الذي يحدده مسؤول الخادم. لا يرى العميل اسم المزود أو النموذج ولا يستطيع تغييره.

عند إيقاف المفتاح لا يرسل مسار Wizard طلبات AI. وعند تشغيله لا يصبح الاستخدام مسموحًا تلقائيًا؛ يجب أن يكون الخادم مفعّلًا صراحة بوضع Non-Production عبر `AI_LIVE_ENABLED=true` و`AI_PROVIDER_MODE=nonprod`.

## تنقيح البيانات

يمر كل طلب AI عبر `sanitizeWizardInputForAI`. تحتفظ النسخة المنقحة بالسياق التجاري اللازم للتوصية، وتحد طول النصوص والقوائم، وتستبدل أنماط البريد والهاتف والرموز السرية وJWT والروابط بقيمة `[REDACTED]`. لا تُرسل مفاتيح البيئة أو جلسات المتصفح أو بيانات منصات الإعلانات إلى مزود AI عبر هذا المسار.

التنقيح دفاع وقائي وليس بديلًا عن عدم إدخال أسرار في Wizard. يجب على مسؤول النظام إبقاء بيانات العملاء الحساسة خارج حقول Wizard وعدم اعتبار Redaction ضمانًا قانونيًا مطلقًا.

## تفعيل الخادم محليًا

ضع القيم الحقيقية في `.env.local` فقط، ولا ترفع الملف إلى Git:

```env
AI_LIVE_ENABLED=true
AI_PROVIDER_MODE=nonprod
AI_DATA_POLICY=sanitized_wizard_only
AI_STRATEGY_PROVIDER=groq
AI_STRATEGY_FALLBACK_PROVIDER=mistral
AI_REASONING_PROVIDER=groq

GROQ_API_KEY=your_local_key
MISTRAL_API_KEY=your_local_fallback_key
```

يظل اختيار المزود إداريًا. تستخدم استراتيجية AI مزود Strategy Builder، ويستخدم Reasoning المزود نفسه افتراضيًا إذا لم يُحدد `AI_REASONING_PROVIDER`. في هذه المرحلة يدعم Reasoning الحي Groq وMistral، بينما Gemini يظل مخصصًا لمسار Benchmark الموجود مسبقًا. يستخدم Groq wire schema متوافقًا مع strict Structured Outputs، ثم يتحقق الخادم محليًا من عقد Reasoning وقيود السلامة قبل عرض أي نتيجة.

نماذج الاختيار قابلة للضبط من الخادم:

```env
GROQ_STRATEGY_MODEL=openai/gpt-oss-120b
MISTRAL_STRATEGY_MODEL=mistral-small-latest
GROQ_REASONING_MODEL=openai/gpt-oss-120b
MISTRAL_REASONING_MODEL=mistral-small-latest
GROQ_AI_TIMEOUT_MS=15000
MISTRAL_AI_TIMEOUT_MS=30000
```

## ما يضمنه المسار

يتم تشغيل Strategy Builder وReasoning بعد أن يبني CDKS الـBlueprint الأساسي. لا يسمح أي منهما بتغيير الهدف أو Funnel أو القنوات أو الجاهزية أو الميزانية أو الإطلاق. يتم التحقق محليًا من JSON Schema وعقد Reasoning، وتُرفض المخرجات التي تشير إلى دليل غير معروف أو تغيير قرار أو `changed=true` أو محاولة تجاوز الاعتماد البشري.

عند انتهاء المهلة أو rate limit أو فشل الشبكة، يمكن الانتقال من Groq إلى Mistral للطبقة نفسها إذا كان الفشل قابلًا لإعادة المحاولة. أما فشل المصادقة أو النموذج غير الموجود أو رفض الـschema فيُغلق المسار دون إعادة خطرة. وفي كل الحالات يبقى Blueprint الحتمي متاحًا، وتظهر حالة AI في النتيجة باعتبارها مكتملة أو فشلًا مغلقًا أو غير مشغّلة.

## provenance والخصوصية

تُحفظ في النتيجة بيانات وصفية منقحة فقط: المزود، النموذج، endpoint، نوع structured output، hash للـschema، إصدارات prompt والسياسة، زمن الطلب، token usage إن أعاده المزود، request ID إن توفر، وبيانات fallback والفشل. لا تُحفظ prompts أو completions أو response bodies أو مفاتيح API في تقارير benchmark أو ملفات المستودع. سجلات CDKS التفصيلية مغلقة افتراضيًا؛ لا تُفعّل `CDKS_DEBUG=true` إلا في بيئة تطوير مضبوطة، وعند تفعيلها يُسجل ملخص حقول محدود بدل مدخلات Wizard الكاملة. يرسل مزود Reasoning حقول الاستدلال فقط؛ أما `reasoning_id` و`blueprint_id` و`authority` وحواجز السلامة وprovenance فيضيفها الخادم بعد التحقق ولا يثق بقيم يرسلها المزود.

## الاختبارات

```bash
npm run test:ai:reasoning:live
npm run test:strategy:gate
npm run test:provider:fallback
npm run test:provider:schema
npm run test:personal-staging
npm run test:database:foundation
npm run test:randomized:wizard -- 20260824 3
```

اختبار `test:ai:reasoning:live` لا يتصل بالإنترنت؛ إنه يحقن مزودًا تجريبيًا للتحقق من contract وfallback والفشل الآمن. أما الطلب الحي الفعلي فلا يُشغّل إلا بعد إعداد `.env.local` وتشغيل الخادم بوضع Non-Production وموافقة العميل من داخل Wizard.
