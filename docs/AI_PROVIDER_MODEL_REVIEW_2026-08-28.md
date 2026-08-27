# مراجعة نماذج Gemini وGroq — 2026-08-28

## خلاصة القرار

تمت مراجعة الوثائق الرسمية الحالية لـGemini وGroq قبل اعتماد قالب `.env.local`. لا يوجد تغيير مطلوب في أسماء النماذج الحالية في القالب:

| المزود | الاستخدام في CDKS | القيمة المعتمدة | نتيجة المراجعة |
|---|---|---|---|
| Groq | Strategy Builder وAI Reasoning | `openai/gpt-oss-120b` | مطابق لقائمة Groq الحالية كنموذج Production |
| Gemini | Benchmark فقط | `gemini-3.6-flash` | مطابق لوثيقة Google الخاصة بأحدث نماذج Gemini |
| Mistral | fallback | `mistral-small-latest` | خارج نطاق هذه المراجعة، ولم يُغيّر |

## Groq

تسرد صفحة النماذج الرسمية في Groq النموذج `openai/gpt-oss-120b` ضمن Production Models، وتعرض له نافذة سياق قدرها 131,072 token وحدًا أقصى للإخراج قدره 65,536 token. كما تؤكد الصفحة أن النماذج المستضافة متاحة عبر endpoint النماذج الرسمي باستخدام model IDs المعروضة.[1]

وتؤكد وثيقة Groq الخاصة بالتوافق مع OpenAI أن base URL هو `https://api.groq.com/openai/v1`، وأن استخدام مكتبات OpenAI يتطلب تمرير `GROQ_API_KEY`. كما توضح أن التوافق ليس كاملًا؛ فالحقول `logprobs` و`logit_bias` و`top_logprobs` و`messages[].name` غير مدعومة، وإذا أُرسل `N` فيجب أن يساوي 1.[2]

كود CDKS يستخدم endpoint `https://api.groq.com/openai/v1/chat/completions`، وmodel `openai/gpt-oss-120b`، ولا يرسل الحقول المحظورة التي ذكرتها الوثيقة. إرسال `temperature=0.2` لا يطابق حالة التحذير الخاصة بقيمة صفر في وثيقة Groq.

## Gemini

توضح وثيقة Google الخاصة بأحدث نماذج Gemini أن `Gemini 3.6 Flash` بمعرّف `gemini-3.6-flash` متاح للجمهور العام وجاهز للاستخدام في الإنتاج. وتذكر الوثيقة أن النموذج يملك مستوى تفكير تلقائيًا متوسطًا، وسياقًا يبلغ مليون token، وحدًا أقصى للإخراج يبلغ 64 ألف token.[3]

وتؤكد وثيقة Google الخاصة بالتوافق مع OpenAI أن base URL الصحيح هو `https://generativelanguage.googleapis.com/v1beta/openai/` وأن اسم متغير المفتاح هو `GEMINI_API_KEY`. كما تنبه إلى أن طبقة OpenAI compatibility ما زالت تجريبية مقارنة بالاستدعاء الأصلي لـGemini.[4]

تذكر وثيقة أحدث نماذج Gemini أن `temperature` و`top_p` و`top_k` أُوقفت لنماذج Gemini 3.6 Flash وGemini 3.5 Flash-Lite، وأن إرسالها قد يؤدي إلى HTTP 400 في أجيال لاحقة. كما توصي بإزالة `candidate_count`، وعدم إنهاء payload بدور `model` مُعبأ مسبقًا، واستخدام system instruction وstructured output بدل ذلك.[3]

## التعديل البرمجي المنفذ

كان `src/lib/ai-strategy-provider.ts` يرسل `temperature=0.2` إلى جميع المزودين، بما في ذلك Gemini. تم تعديل body ليحذف `temperature` عند اختيار `provider=gemini` مع إبقائه لـGroq وMistral. كما أضيف regression يلتقط request body ويثبت أن Gemini لا يستقبل `temperature`، بينما يحتفظ Groq به.

لم يتم تغيير `GEMINI_BENCHMARK_MODEL` لأنه صحيح رسميًا، ولم يتم تغيير model ID الخاص بـGroq لأنه صحيح رسميًا. لا توجد إضافة إلى قالب البيئة لحقول `temperature` أو `top_p` أو `top_k` أو `candidate_count`.

## حدود الاستخدام داخل المشروع

Gemini في الإعداد الحالي Benchmark فقط وليس fallback تلقائيًا في رحلة العميل. وStrategy Builder وAI Reasoning استشاريان، ولا يملكان سلطة تعديل Canonical Blueprint أو CDKS أو الميزانية أو الحملات. تبقى البيانات المرسلة منقحة، ولا تُرسل المفاتيح أو الأسرار داخل payload.

> **الحالة التشغيلية:** `AI_PROVIDER_MODE=nonprod` و`blueprint_only=true`. لا يوجد provider write أو Publish أو Spend، ولا تعني `approved` إلا review/preparation/export. ما يزال `marketValidated=false`.

## References

[1]: https://console.groq.com/docs/models "GroqDocs — Supported Models"

[2]: https://console.groq.com/docs/openai "GroqDocs — OpenAI Compatibility"

[3]: https://ai.google.dev/gemini-api/docs/latest-model "Google AI for Developers — Use the latest Gemini models"

[4]: https://ai.google.dev/gemini-api/docs/openai "Google AI for Developers — OpenAI compatibility"
