# Strategy Builder Client View and Locale Fix — 2026-08-28

## Scope

هذه الدفعة تحسن طريقة عرض المخرجات الاستشارية وتزيل خلط حالات lifecycle بين العربية والإنجليزية. لا تغيّر الدفعة قرارات CDKS أو بنية Canonical Blueprint، ولا تمنح AI صلاحية تنفيذ أو نشر أو إنفاق.

## Strategy Builder output

أصبح `BlueprintStrategyTrace` يحتفظ، إلى جانب الحقول السابقة، بالملخص الاستراتيجي وزوايا الرسائل وفرضيات الجمهور وأفكار الاختبار كحقول اختيارية متوافقة مع السجلات القديمة. يقوم Strategy Builder بملء هذه الحقول بعد التحقق من المخرج وتنقيحه.

تظهر الحقول الآن في بطاقة `Reviewable strategy suggestions` داخل Executive وReview عندما تكون الحالة `completed`. البطاقة موسومة بأنها `AI draft` وتوضح صراحة أنها لا تعدل CDKS ولا تمنح صلاحية الإطلاق. أما القيود فتظهر في منطقة مطوية، ولا يعرض العميل بيانات المزود أو request identifiers أو response الخام.

## Locale and lifecycle

تمت إضافة الحالات `draft` و`approved` و`rejected` و`pending` و`locked` و`not_requested` إلى طبقة العرض العربية والإنجليزية. تعتمد لوحة lifecycle على الحالة canonical بدل `stateLabel` العربي المرسل من السجل، وتعرض انتقالات الحالة بلغة الواجهة المختارة.

كما اكتمل توطين بطاقة اختيار اللغة في Step 0، بما في ذلك العنوان والوصف وARIA label والمحاذاة، بحيث لا يبقى النص العربي الثابت في English mode.

## Verification

نجح typecheck، وprovider fallback regression، وBlueprint display regression بعد رفع الاختبارات إلى 31 assertion، وlint موجّه للملفات المعدلة. يجب إعادة اختبار التوليد الحي على جهاز المستخدم بعد سحب commit، لأن خادم Local Staging وحده لا يثبت نجاح مزود AI الخارجي.
