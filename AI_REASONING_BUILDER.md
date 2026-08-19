# AI Reasoning Builder — Controlled Mock v1

## الغرض

`AI Reasoning Builder` هو طبقة تنفيذ محكومة تنتج `AI Reasoning Contract v1.0` فوق `Blueprint Contract v3.0`. في هذه المرحلة لا يوجد مزود حي للـreasoning؛ المسموح هو `controlled mock provider` فقط، مع اعتماد CDKS وBlueprint الحتمي كمصدر القرار النهائي.

> **القاعدة التشغيلية:** Builder يضيف تفسيرًا قابلًا للتتبع إلى envelope v5، لكنه لا يعيد حساب القرار ولا يكتب إلى `decisions` أو `readiness` أو `blueprint`.

## الملفات

| الملف | المسؤولية |
|---|---|
| `src/lib/ai-reasoning-builder.ts` | orchestration، التطبيع، التحقق، والفشل المغلق |
| `src/lib/ai-reasoning-builder-mock.ts` | Controlled Mock Provider وسيناريوهاته |
| `src/lib/contracts/ai-reasoning.ts` | schema والتحقق الدلالي للعقد |
| `src/app/api/generate/v5/route.ts` | نقطة التكامل الاختيارية داخل envelope v5 |
| `scripts/ai-reasoning-builder-regression.ts` | اختبار الوحدة الحتمي للباني والسيناريوهات |
| `scripts/api-reasoning-builder-v5.cjs` | اختبار route على fixture `EX-001` |

## طلب API

يمكن تفعيل الطبقة في `/api/generate/v5` عبر:

```json
{
  "input": {
    "...": "canonical wizard input"
  },
  "_fixture": {
    "scenario_id": "EX-001"
  },
  "ai_reasoning": {
    "enabled": true,
    "provider": "mock",
    "mockScenario": "baseline"
  }
}
```

القيمة الافتراضية هي `enabled: false`، وفي هذه الحالة يعود reasoning بحالة `not_requested` مع عقد كامل وآمن. وفي الوضع الحالي، أي provider غير `mock` لا يمر إلى مزود خارجي؛ Builder يعيد فشلًا محكومًا بعنوان `REASONING_PROVIDER_NOT_ALLOWED`.

## السيناريوهات

| السيناريو | السلوك المتوقع |
|---|---|
| `baseline` | عقد مكتمل يحتوي على claim مدعوم وclaim مؤهل، مع evidence وuncertainty وdecision impacts |
| `unsupported_claim` | عقد مكتمل يحتوي على claim معلّم `unsupported` ولا يعرضه كحقيقة |
| `override_attempt` | رفض مغلق عبر `REASONING_SAFETY_REJECTED`، دون تغيير readiness أو أي قرار |
| `malformed` | رفض schema عبر `REASONING_SCHEMA_INVALID` |
| `failure` | فشل مزود محكوم عبر `REASONING_PROVIDER_FAILURE` |

في حالات الفشل، يستمر endpoint في إعادة envelope v5 وBlueprint الحتمي. لا يتحول فشل reasoning إلى فشل CDKS ولا يمنح fallback أي صلاحيات إضافية.

## شكل المخرج داخل v5

يحافظ `reasoning` على حقول v3 المختصرة لأغراض التوافق، ويضيف العقد الكامل داخل `reasoning.contract`:

```json
{
  "reasoning": {
    "status": "completed",
    "authority": "AI_REASONING",
    "supported_claims": ["..."],
    "unsupported_claims": [],
    "limitations": ["..."],
    "contract": {
      "contract_version": "1.0",
      "source_contract_version": "3.0",
      "claims": [],
      "evidence": [],
      "uncertainties": [],
      "decision_impacts": [],
      "grounding": {},
      "safety": {}
    }
  }
}
```

يُعاد توليد `reasoning_id` و`generated_at` في طبقة Builder، بينما يُثبت `blueprint_id` مساويًا لمعرف Blueprint الفعلي لمنع انفصال التفسير عن المخرج الذي يشرحه.

## قواعد السلامة

يُطبّق Builder الحواجز التالية بعد schema validation وقبل إرجاع الناتج:

| الحاجز | القيمة الإلزامية |
|---|---:|
| `can_mutate_cdks` | `false` |
| `can_change_blueprint` | `false` |
| `can_authorize_launch` | `false` |
| `can_spend_budget` | `false` |
| `external_actions_allowed` | `false` |
| `budget_spend_allowed` | `false` |
| `readiness_override_attempted` | `false` |

كما يمنع التحقق الدلالي مراجع الأدلة غير المعروفة، وعدم تطابق grounding counts، والادعاءات غير المسندة المعروضة بحالة `supported`، وتحدي سلطة `HUMAN_APPROVAL`.

## الاختبارات

تشغيل اختبارات المرحلة:

```bash
npm run test:ai:reasoning:contract
npm run test:ai:reasoning:builder
npm run test:api:reasoning:v5
npx tsc --noEmit
```

اختبار Builder يغطي سبعة مسارات حتمية، واختبار route يثبت أن baseline وunsupported وoverride وmalformed وdisabled تعيد envelope ناجحًا مع بقاء readiness والـvalidation محكومين بواسطة CDKS.

## حدود المرحلة

لا يستدعي هذا التنفيذ Groq أو Mistral أو Gemini، ولا يستخدم بيانات حقيقية، ولا ينشئ نشرًا أو إنفاقًا أو OAuth. إضافة مزود reasoning حي لاحقًا تتطلب provider adapter منفصلًا، provenance خاصًا، timeout وfallback، prompt version، واختبارات إضافية لمحاولات override وتسريب البيانات وفشل schema.
