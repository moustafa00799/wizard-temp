# AI Reasoning Provider Diagnostics — 2026-08-28

## Scope

هذه الدفعة تعالج فشل Reasoning الحي دون تغيير سلطة CDKS أو Canonical Blueprint ودون إضافة أي إجراء خارجي. ما زال AI استشاريًا، وبيانات الطلب منقحة، وتظل النتيجة الحتمية صالحة عند فشل المزود.

## Changes

أصبح موصل Reasoning يستخدم `max_completion_tokens` مع Groq بدل `max_tokens`، ويطلب `reasoning_effort=low` للنموذج `openai/gpt-oss-120b` لتقليل استهلاك حد الإكمال وزمن الاستجابة في المخرج الاستشاري العميق. يظل Mistral على `max_tokens`.

تم توسيع تصنيف HTTP الآمن ليشمل حالات الصلاحية 403، وحدود الطلب 413، وصيغ الطلب 415 و422، وعبارات rate limit الشائعة. لا يتم حفظ response الخام. يُستخرج فقط `error.code` أو `error.type` بعد تنظيفه وتحديد طوله، وإذا لم يوجد يُستخدم رمز عام مثل `http_400`. ويُحفظ status وfailure category وretryability داخل provenance المنقحة.

## Fallback boundary

يبقى fallback إلى Mistral محصورًا في الحالات المؤقتة القابلة لإعادة المحاولة، مثل timeout و429 و5xx وnetwork. لا تتم إعادة محاولة auth أو schema rejection أو not-found تلقائيًا، حتى لا نكرر طلبًا غير صالح أو نخفي عيب الإعداد.

## Verification

نجح typecheck، واختبار provider schema/request، وعقد Reasoning، وباني Reasoning، وlive harness. الاختبار الحي الوهمي لا يرسل طلبات خارجية؛ أما الاختبار الحي الفعلي فيحتاج مفاتيح المستخدم المحلية ولا تُحفظ في المستودع.

## Governance

لا تمنح هذه التغييرات AI صلاحية تعديل CDKS أو Blueprint أو الميزانية أو الجاهزية، ولا صلاحية النشر أو الإنفاق أو الكتابة إلى منصات الإعلانات.
