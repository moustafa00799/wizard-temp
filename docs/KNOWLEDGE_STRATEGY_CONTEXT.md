# Knowledge Strategy Context

## الغرض

تضيف هذه الطبقة حدًا واضحًا بين **Knowledge Layer** و**Strategy Builder**. فهي تحول Snapshot سوقية موثقة، ومقيدة بسوق وصناعة محددين، إلى سياق قراءة فقط يمكن استخدامه في التوصيات والتفسير. لا تصبح هذه الطبقة سلطة قرار، ولا تستبدل `CDKSEngine` أو `CanonicalBlueprint`.

> **CDKS يقرر، Strategy Builder يقترح، Reasoning يفسر، والإنسان يعتمد.**

## التدفق المعتمد

```text
CanonicalWizardInput
        +
CDKS Engine → CanonicalBlueprint + BlueprintContractV3
        +
Scoped Market Evidence Selection
        ↓
ScopedStrategyContext
        ↓
Deterministic StrategyRecommendation / optional advisory Strategy Builder
        ↓
Human review
        ↓
Only an approved existing CDKS flow may produce a new Blueprint
```

يستقبل المحول `ScopedStrategySelection` التي تحتوي على `MarketEvidenceSnapshot` وحالة بوابة التحقق الخاصة بنفس `market` و`industry` و`packageId`. يرفض المحول أي عدم تطابق في النطاق، أو أي محاولة لاستخدام قرار تحقق يخص حزمة أخرى.

| المكوّن | دوره | سلطته |
|---|---|---|
| `MarketEvidenceSnapshot` | حقائق سوقية ومصادر ومجهولات وقيود | مصدر أدلة فقط |
| `ScopedValidationDecision` | نتيجة بوابة التحقق للنطاق المحدد | يحدد درجة الثقة المحلية فقط |
| `ScopedStrategyContext` | نسخة منقحة ومحدودة من المعرفة للاستراتيجية | قراءة فقط |
| `StrategyRecommendation` | تموضع ورسائل وفرضيات وتجارب وتحذيرات | advisory only |
| `CDKSEngine` | الهدف والقمع والقنوات والجاهزية والقرار التشغيلي | السلطة النهائية |
| `CanonicalBlueprint` | الشكل canonical الناتج من CDKS | لا يُعدّل بواسطة المعرفة أو AI |

## الحالات الحالية للنطاقات

توجد ثلاثة نطاقات تجريبية اجتازت بوابة التحقق السوقي على مستوى النطاق، مع بقاء `globalMarketValidated=false`. اجتياز النطاق لا يعني وجود benchmark إعلاني؛ فـD6 ما زال غير متاح في الحزم الثلاثة.

| النطاق | حالة التحقق scoped | IndustryProfile | القيد الرئيسي |
|---|---|---|---|
| `SA/ecommerce_general` | `market_validated` | matched إلى `ecommerce_general` | لا يوجد CPC/CPA/CVR/ROAS/saturation benchmark |
| `EG/education` | `market_validated` | unmatched | الأدلة تخص التعليم الرسمي ولا تقيس طلب العرض الخاص أو الإلكتروني |
| `SA/education` | `market_validated` | unmatched | الأدلة تخص النظام التعليمي ولا تقيس طلب العرض أو أداء الإعلان |

يتم تمثيل `education` عمدًا كصناعة سوقية مستقلة عن `IndustryProfile` الحالية. عدم وجود Profile لا يمنع السياق التفسيري، لكنه يضيف limitation إلزامية ويمنع تمرير افتراضات صناعة تعليمية على أنها Profile معتمد.

## عقد الأمان

كل `ScopedStrategyContext` يحتوي على القيود التالية:

| الحقل | القيمة أو المعنى |
|---|---|
| `globalMarketValidated` | دائمًا `false` |
| `rawReportsIncluded` | دائمًا `false` |
| `accountOwnedPerformanceMayBeUsedAsMarketBenchmark` | دائمًا `false` |
| `externalActionsAllowed` | دائمًا `false` |
| `budgetSpendAllowed` | دائمًا `false` |
| `scopedMarketValidated` | يعكس بوابة هذا النطاق فقط |
| `unavailableBenchmarkCategories` | تشمل على الأقل CPC وCPA وCVR وROAS وsaturation عند غياب D6 |

لا يسمح العقد بإنشاء fact متاح من قيمة `unavailable`، ولا يسمح بتمرير حقائق `rejected`. كما أن كل توصية تحمل `requiresHumanApproval=true` و`canChangeCanonicalBlueprint=false`.

## الاستعمال البرمجي

يُنشأ السياق من حزمة أو Snapshot مُتحقق منه كما يلي:

```ts
const context = buildScopedStrategyContext({
  packageId,
  market: "SA",
  industry: "ecommerce_general",
  snapshot,
  evidenceIds,
  validationDecision,
});

const recommendation = buildStrategyRecommendation(
  canonicalWizardInput,
  canonicalBlueprint,
  context,
);
```

في API v5 يمكن تمرير الاختيار بصورة اختيارية في `knowledge_strategy_selection`. يتم التحقق منه قبل تمرير `knowledgeContext` إلى Strategy Builder. عند غياب الحقل لا يتغير السلوك السابق. وعند وجوده لا يغير `CDKSEngine` أو `CanonicalBlueprint`; بل يضيف نطاق الأدلة وقيودها إلى استراتيجية الاقتراح فقط.

```json
{
  "input": "CanonicalWizardInput",
  "knowledge_strategy_selection": {
    "packageId": "market-selected-sa-ecommerce-2026-08-23",
    "market": "SA",
    "industry": "ecommerce_general",
    "snapshot": "validated MarketEvidenceSnapshot",
    "evidenceIds": ["evidence-selected-sa-ecommerce-monshaat-2024"],
    "validationDecision": "matching scoped gate decision"
  },
  "ai_strategy_builder": {
    "enabled": false
  }
}
```

## التوصيات التجريبية الأولى

### السعودية — التجارة الإلكترونية

التموضع المقترح هو اختبار قيمة محلية يركز على وضوح تجربة الشراء والثقة والتوصيل والإرجاع، مع مقارنة زاوية الثقة والتوصيل بزاوية القيمة. لا يُسمح بتحويل مؤشرات التسجيل أو التسوق الرقمي إلى توقعات مبيعات أو تحويل أو عائد إعلاني.

يظل دور القنوات هو دور الاختبار داخل القنوات التي قررها CDKS. يمكن اختبار الرسائل والشرائح، لكن لا يجوز للتوصية تعديل القنوات أو توزيع الميزانية. قبل أي قرار لاحق يجب تأكيد أحداث `view_content` و`add_to_cart` و`purchase` وقيمة الطلب والعملة، ومراجعة ادعاءات العرض وسياسة الإرجاع والتوصيل.

### مصر — التعليم

التموضع المقترح هو عرض تعليمي موجه إلى نتيجة تعلم محددة، مع اختبار رسالة النتيجة مقابل رسالة الاعتماد أو الثقة. لا تُستخدم أرقام الالتحاق الرسمي لإثبات طلب الدورات أو الدروس الخاصة أو تحسين معدل التحويل.

يجب تحديد نوع التعليم والعمر والشريحة قبل اعتماد الرسائل، وتعريف `qualified_lead`، والتحقق من أحداث `lead` و`submit_form` و`course_signup`. وتظل الشهادة والاعتماد والنتائج والخصوصية خاضعة للمراجعة البشرية والتنظيمية.

### السعودية — التعليم

يتبع النطاق السعودي للتعليم نفس المبدأ، مع إبقاء المؤشرات النظامية والتنظيمية في دور السياق وعدم استخدامها كبديل عن بيانات العرض التجاري. تكون التجارب الأولى مرتبطة بالنتيجة التعليمية وإثبات المنهج والملاءمة، لا بادعاءات عامة أو أرقام أداء غير متاحة.

## الاختبارات

يتم تشغيل الاختبار الحتمي بواسطة:

```bash
npm run test:knowledge:strategy-context
```

ويتحقق من اختيار النطاقات الثلاثة، ومطابقة `market` و`industry` و`packageId`، وحالة `market_validated` المحلية، وعدم وجود IndustryProfile للتعليم، وعدم اختلاق benchmarks، ورفض النطاق غير المتطابق، وعدم تغيير Canonical Blueprint، وعدم إجراء استدعاء AI حي.

ينتج runner التجريبي التقرير الخارجي التالي دون إضافته إلى Git:

```bash
npm run generate:knowledge:strategy-recommendations
```

المخرج الافتراضي هو `/home/ubuntu/selected_market_strategy_recommendations_2026-08-23.json`. وهو artifact تجريبي من fixtures منقحة، وليس أمر إطلاق أو نشر.

## حدود المرحلة

لا تمثل هذه الطبقة اعتمادًا عالميًا للسوق، ولا تفتح موصلات Meta أو Google أو TikTok، ولا تنفذ إنشاء أو تعديل أو نشر حملات. لا تستخدم بيانات الحسابات المملوكة لإنتاج benchmark سوقي، ولا تملأ الفئات غير المتاحة بقيم تقديرية.

الخطوة التالية بعد تثبيت هذا العقد هي إضافة `Education IndustryProfile` بصورة منفصلة ومراجعة مستقلة، ثم بناء client-specific Wizard briefs حقيقية غير سرية للنطاقات المعتمدة. أما `local_service` فيبقى خارج التوصيات المجتازة إلى أن تتوافر أدلة مباشرة على الطلب المحلي.
