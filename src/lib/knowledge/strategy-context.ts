import {
  ScopedStrategySelectionSchema,
  StrategyRecommendationSchema,
  ScopedStrategyContextSchema,
  type ScopedStrategyContext,
  type StrategyRecommendation,
  type StrategyEvidenceFact,
  type ScopedStrategySelection,
  type ScopedValidationDecision,
  type IndustryProfileResolution,
} from "@/lib/contracts/knowledge-strategy-context";
import { resolveIndustryProfile } from "./industry-profiles";
import type { CanonicalBlueprint } from "@/lib/contracts/canonical-blueprint";
import type { CanonicalWizardInput } from "@/lib/contracts/wizard-input";
import type { MarketEvidenceSnapshot } from "@/lib/contracts/knowledge";

const UNAVAILABLE_BENCHMARK_CATEGORIES = ["cpc", "cpa", "cvr", "roas", "saturation"] as const;

export class StrategyContextScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StrategyContextScopeError";
  }
}

function assertExactScope(selection: ScopedStrategySelection): void {
  const { snapshot, validationDecision } = selection;
  if (snapshot.market !== selection.market || snapshot.industry !== selection.industry) {
    throw new StrategyContextScopeError("Snapshot scope does not exactly match the requested market and industry.");
  }
  if (validationDecision.market !== selection.market || validationDecision.industry !== selection.industry) {
    throw new StrategyContextScopeError("Validation decision scope does not exactly match the requested market and industry.");
  }
  if (validationDecision.packageId !== selection.packageId) {
    throw new StrategyContextScopeError("Validation decision packageId does not match the selected package.");
  }
  if (validationDecision.marketValidated && snapshot.freshnessStatus !== "fresh") {
    throw new StrategyContextScopeError("A scoped market-validated context must use a fresh snapshot.");
  }
  if (validationDecision.marketValidated && snapshot.contradictions.length > 0) {
    throw new StrategyContextScopeError("A scoped market-validated context cannot contain unresolved contradictions.");
  }
}

function resolveProfile(industry: string): IndustryProfileResolution {
  const result = resolveIndustryProfile({ industryKey: industry });
  return {
    status: result.status,
    requestedIndustry: industry,
    ...(result.profile ? {
      profileId: result.profile.profileId,
      resolvedIndustryKey: result.profile.industryKey,
    } : {}),
    confidence: result.confidence,
    matchedBy: result.matchedBy,
    reason: result.reason,
  };
}

function validationStatus(decision: ScopedValidationDecision): ScopedStrategyContext["scopedValidationStatus"] {
  if (decision.marketValidated) return "market_validated";
  return decision.contextDecision;
}

function activeFacts(snapshot: MarketEvidenceSnapshot): StrategyEvidenceFact[] {
  return snapshot.facts
    .filter((fact) => (fact.status === "evidence_backed" || fact.status === "limited_external_evidence" || fact.status === "directional") && fact.value !== null && fact.observedAt && fact.sourceIds.length > 0)
    .map((fact) => ({
      factId: fact.factId,
      name: fact.name,
      value: fact.value as string | number | boolean,
      ...(fact.unit ? { unit: fact.unit } : {}),
      status: fact.status as "evidence_backed" | "limited_external_evidence" | "directional",
      sourceIds: [...fact.sourceIds],
      observedAt: fact.observedAt!,
    }));
}

function unavailableCategories(snapshot: MarketEvidenceSnapshot, decision: ScopedValidationDecision): string[] {
  const categories = new Set<string>();
  const unavailableNames = snapshot.facts
    .filter((fact) => fact.status === "unavailable")
    .map((fact) => `${fact.name} ${fact.unavailableReason ?? ""}`.toLowerCase())
    .join(" ");

  if (unavailableNames.includes("paid_media") || unavailableNames.includes("cpc") || decision.dimensions.D6 === "unavailable") {
    for (const category of UNAVAILABLE_BENCHMARK_CATEGORIES) categories.add(category);
  }
  if (snapshot.competitorObservations.length === 0 || unavailableNames.includes("competitor")) {
    categories.add("competitor_performance");
  }
  if (snapshot.unknowns.some((item) => /demand|private tutoring|online-course|offer/i.test(item))) {
    categories.add("offer_level_demand");
  }
  if (snapshot.seasonalitySignals.length === 0 || decision.dimensions.D5 !== "ready") {
    categories.add("seasonality");
  }
  return [...categories];
}

function baseLimitations(snapshot: MarketEvidenceSnapshot, decision: ScopedValidationDecision, profile: IndustryProfileResolution): string[] {
  const limitations = [
    ...snapshot.limitations,
    ...snapshot.unknowns,
    ...decision.blockers.map((blocker) => `Validation gate blocker: ${blocker}.`),
    "This context is scoped to the selected market and industry; it does not establish global Market Validation.",
    "Account-owned provider performance is excluded from independent market evidence and cannot be used as a market benchmark.",
    "No paid-media benchmark is available; CPC, CPA, CVR, ROAS, and saturation must remain unavailable until directly measured by an approved independent source.",
  ];
  if (profile.status === "unmatched") {
    limitations.push(`No IndustryProfile matched the requested industry ${profile.requestedIndustry}; industry-specific profile assumptions must be reviewed by a human.`);
  }
  return [...new Set(limitations)];
}

export function buildScopedStrategyContext(input: unknown): ScopedStrategyContext {
  const selection = ScopedStrategySelectionSchema.parse(input);
  assertExactScope(selection);
  const profile = resolveProfile(selection.industry);
  const context: ScopedStrategyContext = {
    contractVersion: "1.0",
    contextId: `strategy-context-${selection.market.toLowerCase()}-${selection.industry}-${selection.snapshot.snapshotId}`,
    packageId: selection.packageId,
    snapshotId: selection.snapshot.snapshotId,
    market: selection.market,
    industry: selection.industry,
    evidenceLocale: selection.snapshot.locale,
    currency: selection.snapshot.currency,
    capturedAt: selection.snapshot.capturedAt,
    freshnessStatus: selection.snapshot.freshnessStatus,
    scopedValidationStatus: validationStatus(selection.validationDecision),
    scopedMarketValidated: selection.validationDecision.marketValidated,
    globalMarketValidated: false,
    validationDecision: selection.validationDecision,
    industryProfile: profile,
    approvedFacts: activeFacts(selection.snapshot),
    evidenceSourceIds: [...new Set(selection.snapshot.sourceIds)],
    evidenceIds: [...new Set(selection.evidenceIds)],
    unknowns: [...new Set(selection.snapshot.unknowns)],
    unavailableBenchmarkCategories: unavailableCategories(selection.snapshot, selection.validationDecision) as ScopedStrategyContext["unavailableBenchmarkCategories"],
    limitations: baseLimitations(selection.snapshot, selection.validationDecision, profile),
    dataPolicy: {
      rawReportsIncluded: false,
      accountOwnedPerformanceMayBeUsedAsMarketBenchmark: false,
      externalActionsAllowed: false,
      budgetSpendAllowed: false,
    },
  };
  return ScopedStrategyContextSchema.parse(context);
}

function evidenceRefs(context: ScopedStrategyContext): string[] {
  return [...new Set([
    `package:${context.packageId}`,
    `snapshot:${context.snapshotId}`,
    ...context.evidenceIds,
    ...context.evidenceSourceIds.map((sourceId) => `source:${sourceId}`),
    ...context.approvedFacts.map((fact) => `fact:${fact.factId}`),
  ])].slice(0, 32);
}

function marketLabel(market: ScopedStrategyContext["market"]): string {
  return market === "SA" ? "السعودية" : market === "EG" ? "مصر" : market;
}

function profileAudience(context: ScopedStrategyContext, input: CanonicalWizardInput): string[] {
  const profileAudienceSegments = context.industryProfile.status === "matched"
    ? (context.industry === "ecommerce_general"
      ? ["متسوقون ذوو نية شراء مرتفعة", "مستكشفو الفئات", "زائرو السلة غير المكتملة"]
      : [])
    : [];
  return [...new Set([
    ...profileAudienceSegments,
    ...(input.ideal_customer ? [`الجمهور الموصوف في Wizard: ${input.ideal_customer}`] : []),
    ...input.audience_segments.map((segment) => `شريحة اختبارية من Wizard: ${segment}`),
  ])].slice(0, 8);
}

function recommendationsForIndustry(
  context: ScopedStrategyContext,
  input: CanonicalWizardInput,
): Pick<StrategyRecommendation, "strategicPositioning" | "primaryHypothesis" | "messageAngles" | "audienceHypotheses" | "channelRoles" | "experimentIdeas" | "requiredValidations"> {
  const market = marketLabel(context.market);
  const evidenceCaveat = context.scopedMarketValidated
    ? "السياق مؤيد على مستوى هذا النطاق فقط"
    : "السياق متاح للاستخدام التفسيري دون اعتماد تحقق سوقي كامل";

  if (context.industry === "ecommerce_general") {
    return {
      strategicPositioning: `اختبار تموضع تجارة إلكترونية محلية في ${market} يركز على القيمة والثقة ووضوح تجربة الشراء؛ ${evidenceCaveat}. لا يتضمن ذلك وعدًا بمعدل تحويل أو عائد إعلاني.`,
      primaryHypothesis: "إذا جُمعت رسالة القيمة مع إثبات واضح للتوصيل والإرجاع والثقة، فقد تزيد جودة نية الشراء مقارنة برسالة السعر وحدها؛ هذه فرضية اختبارية وليست benchmark.",
      messageAngles: [
        "القيمة العملية والسعر الواضح دون ادعاء أن السعر هو سبب الطلب في السوق.",
        "وضوح التوصيل والإرجاع وخطوات الشراء لتقليل اعتراضات الثقة.",
        "إثبات المنتج والملاءمة قبل الدفع بدل استخدام خصم غير مبرر.",
      ],
      audienceHypotheses: profileAudience(context, input),
      channelRoles: [
        "الحفاظ على القنوات التي قررها CDKS؛ استخدام Meta لاختبار زوايا الرسالة والجمهور، وليس لتغيير قرار القنوات.",
        "استخدام Google Ads لالتقاط نية البحث عندما يسمح إعداد القياس والصفحة المقصودة بذلك.",
        "ترك أي قرار توزيع ميزانية أو توسع لمخرجات CDKS ومراجعة الإنسان؛ لا يوجد benchmark مدفوع معتمد.",
      ],
      experimentIdeas: [
        "اختبار زاوية الثقة والتوصيل مقابل زاوية القيمة مع ثبات المنتج والصفحة.",
        "اختبار صفحة/رسالة تبرز الإرجاع والضمان مقابل صفحة تبرز العرض، مع قياس الأحداث المؤكدة فقط.",
        "اختبار شرائح high-intent مقابل category explorers دون استنتاج حجم السوق من النتائج الأولية.",
      ],
      requiredValidations: [
        "مراجعة السعر والعرض وسياسة التوصيل والإرجاع والادعاءات التجارية للسوق المستهدف.",
        "تأكيد firing لأحداث view_content وadd_to_cart وpurchase وقيمة الطلب والعملة.",
        "تأكيد عدم استخدام CPC أو CPA أو CVR أو ROAS أو saturation كخط أساس؛ هذه الفئات unavailable حاليًا.",
      ],
    };
  }

  return {
    strategicPositioning: `اختبار عرض تعليمي موجه إلى شريحة ونتيجة تعلم محددة في ${market}، مع إبقاء مؤشرات النظام التعليمي في دور السياق فقط؛ ${evidenceCaveat}. لا تُستخدم أرقام الالتحاق لإثبات الطلب على الدورات أو الدروس الخاصة.`,
    primaryHypothesis: "إذا ارتبطت الرسالة بنتيجة تعلم قابلة للتحقق وإثبات مناسب للعرض، فقد تتحسن جودة lead مقارنة برسالة عامة؛ لا يوجد في الحزمة دليل مباشر على الطلب على هذا العرض بعينه.",
    messageAngles: [
      "نتيجة تعلم محددة ومسار واضح بدل عبارة عامة مثل تعلم من الأفضل.",
      "إثبات الخبرة أو المنهج أو الشهادة بصياغة قابلة للتحقق دون ادعاءات غير موثقة.",
      "تقليل اعتراض الوقت والثقة عبر توضيح البرنامج والخطوة التالية، لا عبر وعد بنتيجة مضمونة.",
    ],
    audienceHypotheses: profileAudience(context, input).length > 0
      ? profileAudience(context, input)
      : ["طلاب أو مهنيون يطابقون وصف الجمهور الذي يقدمه العميل", "شريحة اختبارية يحددها العرض ومرحلة الوعي"],
    channelRoles: [
      "الحفاظ على القنوات التي قررها CDKS، مع استخدام كل قناة لاختبار الرسالة لا لتغيير القنوات أو الميزانية.",
      "توجيه الإعلان إلى صفحة أو نموذج يشرح النتيجة والمنهج وشروط العرض قبل طلب lead.",
      "عدم استخدام بيانات التعليم الرسمي كبديل لبيانات lead quality أو conversion الخاصة بالعرض.",
    ],
    experimentIdeas: [
      "اختبار رسالة النتيجة التعليمية مقابل رسالة الاعتماد/الثقة مع ثبات العرض.",
      "اختبار نموذج قصير مقابل صفحة شرح أطول وقياس qualified lead لا عدد النماذج فقط.",
      "اختبار شرائح الطلاب والمهنيين فقط إذا كان العرض يدعم الفرق بينهما، مع توثيق تعريف qualified lead.",
    ],
    requiredValidations: [
      "تحديد نوع التعليم والعمر والشريحة بدقة قبل اعتماد الرسائل أو الجمهور.",
      "مراجعة ادعاءات الشهادة والاعتماد والنتائج والخصوصية وأي متطلبات تنظيمية محلية.",
      "تأكيد أحداث lead وsubmit_form وcourse_signup وتعريف qualified lead قبل أي مقارنة أداء.",
      "تأكيد أن بيانات الالتحاق الرسمية لا تُستخدم كـCPC أو CPA أو CVR أو ROAS أو saturation benchmark.",
    ],
  };
}

export function buildStrategyRecommendation(
  input: CanonicalWizardInput,
  blueprint: CanonicalBlueprint,
  contextInput: unknown,
): StrategyRecommendation {
  const context = ScopedStrategyContextSchema.parse(contextInput);
  const content = recommendationsForIndustry(context, input);
  const recommendation: StrategyRecommendation = {
    contractVersion: "1.0",
    recommendationId: `recommendation-${context.market.toLowerCase()}-${context.industry}-${blueprint.blueprint_id}`,
    blueprintId: blueprint.blueprint_id,
    contextId: context.contextId,
    outputLocale: "ar",
    market: context.market,
    industry: context.industry,
    currency: context.currency,
    status: "advisory_only",
    ...content,
    evidenceRefs: evidenceRefs(context),
    limitations: [
      ...context.limitations,
      "This recommendation is a deterministic advisory fixture; it is not a live AI output and does not authorize launch.",
      "The recommendation does not mutate the canonical Blueprint; any accepted change requires the existing CDKS and human-approval flow.",
    ].slice(0, 24),
    governance: {
      generationMode: "blueprint_only",
      externalActionsAllowed: false,
      budgetSpendAllowed: false,
      canMutateCdks: false,
      canChangeCanonicalBlueprint: false,
      requiresHumanApproval: true,
      globalMarketValidated: false,
      preservedDecisionPaths: ["objective", "funnel", "channels", "readiness", "budget", "launch", "publish"],
    },
  };
  return StrategyRecommendationSchema.parse(recommendation);
}

export function buildStrategyExperimentEnvelope(
  input: CanonicalWizardInput,
  blueprint: CanonicalBlueprint,
  contextInput: unknown,
) {
  const context = ScopedStrategyContextSchema.parse(contextInput);
  const recommendation = buildStrategyRecommendation(input, blueprint, context);
  return {
    envelopeVersion: "1.0" as const,
    blueprintId: blueprint.blueprint_id,
    canonicalBlueprintUnchanged: true as const,
    context,
    recommendation,
  };
}
