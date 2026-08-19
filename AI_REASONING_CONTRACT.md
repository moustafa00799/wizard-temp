# AI Reasoning Contract v1.0

## 1. الغرض والنطاق

`AI Reasoning Contract v1.0` هو عقد مستقل يصف **كيف يفسر النظام قرارات CDKS**، وما الأدلة التي يستند إليها، وما الذي يبقى غير مؤكد، وما أثر الاستدلال على القرارات القائمة. لا يمثل العقد قرارًا جديدًا، ولا يسمح لـAI بتعديل Blueprint أو تغيير الجاهزية أو تنفيذ أي إجراء خارجي.

> **قاعدة السلطة:** AI Reasoning يشرح وينتقد ويكشف الفجوات، بينما تظل مدخلات المستخدم المؤكدة وسياسات CDKS ومحرك القواعد وسياسة الجاهزية أعلى سلطة منه.

العقد مصمم ليعمل فوق `Blueprint Contract v3.0`، ويستقبل `blueprint_id` وقرارات CDKS ومخرجات Strategy Builder وprovenance كمواد استدلال. لا يحتاج تشغيله إلى بيانات حقيقية أو اتصال حي بمزود AI في هذه المرحلة، ويمكن إنتاجه من mock أو مزود غير إنتاجي على fixtures مجهّلة فقط.

## 2. العلاقة مع Blueprint v3

| العقد | المسؤولية | مستوى السلطة |
|---|---|---|
| `CanonicalWizardInput` | حقائق ومدخلات المستخدم | مصدر الحقائق الأولي |
| `BlueprintContractV3` | قرارات CDKS والـBlueprint والجاهزية والتحذيرات | العقد التنفيذي المعياري |
| `AI Strategy Trace` | مقترحات الرسائل والجماهير والتجارب | اقتراح غير ملزم |
| `AI Reasoning Contract` | تفسير الأدلة والقرارات والشكوك والفجوات | تفسير واقتراح فقط |
| `Human Approval` | اعتماد الانتقال أو التصحيح أو النشر مستقبلًا | السلطة البشرية النهائية |

يُشار إلى العقد المصدر في الحقل `source_contract_version: "3.0"`، ويُحفظ `blueprint_id` نفسه لمنع انفصال reasoning عن الـBlueprint الذي يفسره.

## 3. ترتيب السلطة

ترتيب السلطة الملزم هو:

1. مدخلات Wizard المؤكدة من المستخدم.
2. القيود وسياسات القرار في CDKS.
3. مخرجات Rules Engine الحسابية.
4. مخرجات Strategy Builder بوصفها مقترحات.
5. AI Reasoning بوصفه تفسيرًا ونقدًا وتحليل فجوات.
6. الافتراضات والافتراضات الاصطناعية المعلّمة صراحةً.
7. اعتماد الإنسان عند توفره.

لا يجوز لـAI Reasoning أن يحول `review` أو `blocked` إلى `ready`، أو أن يغير الهدف أو القمع أو القنوات أو الميزانية، أو أن يعتبر حقيقة غير مؤكدة حقيقة معتمدة.

## 4. مكونات العقد

| المكوّن | الغرض |
|---|---|
| `claims` | عبارات الاستدلال مع نوعها وحالتها ودرجة الثقة ومراجع الأدلة والقرارات |
| `evidence` | سجل الأدلة القابلة للتتبع، مع path وsource_ref والسلطة وحالة تأكيد المستخدم |
| `uncertainties` | ما ينقص أو لم يؤكد أو يتعارض أو يقع ضمن حدود النموذج |
| `decision_impacts` | وصف أثر reasoning على القرار مع إثبات أن `changed=false` |
| `grounding` | مؤشرات تغطية الأدلة وعدّ الادعاءات المدعومة والمؤهلة وغير المدعومة |
| `limitations` | حدود واضحة تمنع تفسير النص كترخيص نشر أو إنفاق |
| `safety` | حواجز ثابتة تمنع تعديل CDKS أو Blueprint أو الجاهزية أو الإجراءات الخارجية |
| `provenance` | هوية المزود والنموذج والسياسة والـschema والـfallback عند استخدام AI فعلي |
| `failure` | فشل مغلق قابل للتشخيص دون إفساد Blueprint الحتمي |

## 5. تعريف الادعاءات

كل claim يجب أن يحمل نوعًا وحالة منفصلين؛ فدرجة الثقة وحدها لا تكفي لإثبات أن الادعاء مسند.

| `claim_type` | الاستخدام | المتطلب |
|---|---|---|
| `evidence_based` | استنتاج مباشر من evidence | يجب أن يحتوي `evidence_refs` |
| `qualified_inference` | استنتاج احتمالي مقيد | يجب عرض uncertainty أو limitation عند الحاجة |
| `assumption` | افتراض صريح غير مؤكد | لا يُعرض كحقيقة مستخدم |
| `recommendation` | اقتراح قابل للمراجعة | لا يعدل القرار أو ينفذ إجراءً |
| `unsupported` | ادعاء لا يملك النظام دليلًا كافيًا عليه | يجب أن تكون حالته `unsupported` أو `rejected` |

حالات الادعاء هي `supported` و`qualified` و`unsupported` و`rejected`. ويتحقق المدقق الدلالي من تطابق أعداد الحالات داخل `grounding` مع الادعاءات الفعلية، ومن أن كل مرجع evidence أو uncertainty موجود فعليًا في العقد.

## 6. نموذج الأدلة

كل دليل يحتوي على `path` قابل للتنقل داخل envelope أو الـBlueprint، و`source_ref` يحدد مصدره، و`authority` يثبت من يملك القرار. يمكن أن يكون الدليل من مدخلات Wizard، قرار CDKS، مخرج قاعدة، حقل Blueprint، تحذير، provenance، Strategy Builder، أو افتراض.

لا ينبغي أن يحمل `excerpt` بيانات حساسة أو نصًا كاملًا غير ضروري. في هذه المرحلة يفضل استخدام paths وsource references وملخصات قصيرة على نقل بيانات العميل إلى طبقة reasoning.

## 7. decision impacts

يمثل `decision_impacts` علاقة تفسيرية فقط:

| الأثر | المعنى |
|---|---|
| `supports` | الأدلة تدعم القرار القائم |
| `clarifies` | reasoning يشرح القرار أو blocker بصورة أوضح |
| `challenges` | يلفت إلى سؤال أو تناقض دون تغيير القرار |
| `no_change` | لا ينتج أثرًا على القرار |

كل impact يحتوي على `preserved_authority` و`changed: false`. يمنع المدقق دلاليًا تحدي `HUMAN_APPROVAL`، لأن الاستدلال لا يملك سلطة نقض اعتماد بشري.

## 8. حواجز السلامة

حقول السلامة التالية literals ثابتة وليست قيمًا قابلة لتعديل المزود:

```json
{
  "can_mutate_cdks": false,
  "can_change_blueprint": false,
  "can_authorize_launch": false,
  "can_spend_budget": false,
  "external_actions_allowed": false,
  "budget_spend_allowed": false,
  "readiness_override_attempted": false
}
```

إذا حاول مزود reasoning توليد override أو إجراء خارجي، يجب رفض المخرج أو وسمه `rejected`، وتظل المخرجات الحتمية لـCDKS هي المصدر المعتمد. فشل reasoning لا يفشل Blueprint؛ بل ينتج trace بحالة `failed` مع `failure` واضح، ويستمر النظام في إرجاع الـBlueprint الحتمي.

## 9. دورة الحياة

| الحالة | المعنى | المخرجات الدنيا |
|---|---|---|
| `not_requested` | طبقة reasoning غير مفعلة | safety ثابتة وlimitations |
| `pending` | الطلب قيد التنفيذ | provenance اختياري وقيود السلامة |
| `completed` | reasoning اجتاز schema والتحقق الدلالي | summary وclaims وevidence وgrounding |
| `failed` | المزود أو التحقق فشل | `failure` إلزامي وBlueprint حتمي غير متأثر |

الحالة `completed` تتطلب `summary`، والحالة `failed` تتطلب `failure`. ولا يجوز وجود `failure` في حالة غير `failed`.

## 10. الحقول القانونية

يُعرّف المخطط البرمجي في:

```text
src/lib/contracts/ai-reasoning.ts
```

وتوجد دالتان رئيسيتان:

```ts
AIReasoningContractSchema
validateAIReasoningContract(data)
```

الأولى تتحقق من الشكل والأنواع والحدود، والثانية تضيف تحققًا دلاليًا من مراجع الأدلة، ومراجع الشكوك، وعدّ grounding، وحالات الفشل، وسلطة القرار.

## 11. ما لا يفعله العقد في هذه المرحلة

لا ينفذ العقد استدعاءً حيًا لمزود AI، ولا يبني prompt نهائيًا، ولا يقرر أفضل استراتيجية، ولا يكتب مباشرةً إلى `blueprint`، ولا ينشر على Meta أو Google أو TikTok، ولا يدير OAuth أو الميزانية. هذه وظائف لاحقة يجب أن تمر عبر طبقات منفصلة مع موافقة صريحة وحواجز إضافية.

## 12. الاختبار الحتمي

أُضيف اختبار regression في:

```text
scripts/ai-reasoning-contract-regression.ts
```

ويُشغّل عبر:

```bash
npm run test:ai:reasoning:contract
```

يغطي الاختبار عقدًا عربيًا كاملًا، وادعاءً مدعومًا، واستنتاجًا مؤهلًا، وادعاءً غير مدعوم، وحواجز السلامة، ثم يثبت فشل الحالات التالية:

1. مرجع evidence غير موجود.
2. عدم تطابق عدّ grounding مع claims.
3. حالة `failed` دون كائن `failure`.
4. محاولة تحدي سلطة `HUMAN_APPROVAL`.

## 13. المرحلة التالية

بعد اعتماد هذه المسودة، تكون الخطوة التالية هي إنشاء `AI Reasoning Builder` محكوم على نمط Strategy Builder. سيستقبل envelope v3، ويولد reasoning فقط، ثم يمرر الناتج عبر `AIReasoningContractSchema` و`validateAIReasoningContract`، وبعد ذلك يدمجه في `reasoning` دون تغيير `decisions` أو `readiness` أو `blueprint`.

يجب أن تبدأ أول نسخة بالـmock controlled provider، ثم تضيف مزودًا غير إنتاجي على fixtures مجهّلة فقط. ولا يتم إدخال reasoning الحي إلى Dashboard قبل إكمال اختبارات override، malformed output، provider failure، وpreserved CDKS authority.
