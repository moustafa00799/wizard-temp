import { validateAdvisoryOutput, type AdvisoryCapability, type AdvisoryLocale, type AdvisorySafety, type AdvisoryScope, type CreativePlannerOutput, type EvidenceSynthesizerOutput, type ComplianceQAOutput, type RuleCandidateEvaluatorOutput, type ValidatedAdvisoryOutput } from "./contracts/advisory-capabilities";
import type { AiProvenance } from "./contracts/ai-provenance";

const SAFETY: AdvisorySafety = {
  advisory_only: true,
  draft_only: true,
  can_mutate_cdks: false,
  can_change_blueprint: false,
  can_authorize_launch: false,
  can_publish: false,
  can_spend_budget: false,
  external_actions_allowed: false,
  automated_rule_modification: false,
  human_review_required: true,
};

function provenance(capability: AdvisoryCapability): AiProvenance {
  return {
    provider: "mock",
    model: `mock-${capability}-v1`,
    endpoint: `mock://${capability}`,
    structuredMode: "strict_json_schema",
    schemaHash: `mock-${capability}-schema-v1`,
    promptVersion: `mock-${capability}-prompt-v1`,
    policyVersion: "cdks-advisory-policy-v1",
    dataPolicySnapshot: { trainingUse: "unknown", retention: "temporary", region: "sandbox" },
  };
}

function scope(dataPolicy: AdvisoryScope["data_policy"]): AdvisoryScope {
  return {
    markets: ["fixture-only"],
    industries: ["fixture-only"],
    source_refs: ["fixture:advisory-demo"],
    data_policy: dataPolicy,
  };
}

function base(capability: AdvisoryCapability, locale: AdvisoryLocale, dataPolicy: AdvisoryScope["data_policy"]) {
  return {
    contract_version: "1.0" as const,
    capability,
    status: "draft" as const,
    locale,
    generated_at: new Date().toISOString(),
    scope: scope(dataPolicy),
    provenance: provenance(capability),
    safety: SAFETY,
    unavailable_categories: ["market_benchmarks", "competitor_performance", "predicted_results"],
    warnings: locale === "ar"
      ? ["هذا مسودّة استشارية للاختبار فقط وتحتاج مراجعة بشرية.", "لا تمثل النصوص أو التوصيات ضمانًا للأداء."]
      : ["This is a test-only advisory draft and requires human review.", "Copy and recommendations are not performance guarantees."],
  };
}

export function runAdvisoryMock(capability: "creative_planner", locale?: AdvisoryLocale): CreativePlannerOutput;
export function runAdvisoryMock(capability: "evidence_synthesizer", locale?: AdvisoryLocale): EvidenceSynthesizerOutput;
export function runAdvisoryMock(capability: "compliance_qa", locale?: AdvisoryLocale): ComplianceQAOutput;
export function runAdvisoryMock(capability: "rule_candidate_evaluator", locale?: AdvisoryLocale): RuleCandidateEvaluatorOutput;
export function runAdvisoryMock(capability: AdvisoryCapability, locale?: AdvisoryLocale): ValidatedAdvisoryOutput;
export function runAdvisoryMock(capability: AdvisoryCapability, locale: AdvisoryLocale = "ar") {
  const english = locale === "en";
  if (capability === "creative_planner") {
    return validateAdvisoryOutput({
      ...base(capability, locale, "sanitized_wizard_only"),
      drafts: [{
        draft_id: "creative-draft-001",
        format: "short_video",
        hook: english ? "Show the problem clearly before presenting the next step." : "اعرض المشكلة بوضوح قبل تقديم الخطوة التالية.",
        primary_copy: english ? "A reviewable draft message based on the supplied brief." : "مسودة رسالة قابلة للمراجعة مبنية على الملخص المدخل.",
        script_or_frames: english ? ["Frame 1: user problem", "Frame 2: proposed approach", "Frame 3: reviewable call to action"] : ["المشهد 1: مشكلة العميل", "المشهد 2: النهج المقترح", "المشهد 3: دعوة إجراء قابلة للمراجعة"],
        visual_direction: english ? "Clear, readable, product-context visuals; no unsupported proof or exaggerated result." : "مشاهد واضحة ومقروءة في سياق المنتج؛ دون إثبات غير مسند أو مبالغة في النتيجة.",
        call_to_action: english ? "Review the details" : "راجع التفاصيل",
        evidence_refs: ["fixture:ad-brief"],
        unsupported_claims: [english ? "No verified performance claim supplied." : "لا يوجد ادعاء أداء موثوق مقدم."],
      }],
    }) as CreativePlannerOutput;
  }
  if (capability === "evidence_synthesizer") {
    return validateAdvisoryOutput({
      ...base(capability, locale, "evidence_package_only"),
      facts: [{
        fact_id: "fact-unavailable-001",
        statement: english ? "No verified market-performance benchmark was supplied in this fixture." : "لا يوجد معيار أداء سوقي موثوق مقدم في هذا الـfixture.",
        source_ref: "fixture:advisory-demo",
        observed_at: "2026-08-28",
        scope: english ? "Fixture-only demonstration" : "عرض تجريبي خاص بالـfixture فقط",
        confirmation: "unavailable",
        limitations: [english ? "Do not infer CPC, CPA, CVR, ROAS, saturation, or competitor performance." : "لا تستنتج CPC أو CPA أو CVR أو ROAS أو التشبع أو أداء المنافسين."],
      }],
      evidence_package_status: "insufficient_evidence",
    }) as EvidenceSynthesizerOutput;
  }
  if (capability === "compliance_qa") {
    return validateAdvisoryOutput({
      ...base(capability, locale, "sanitized_wizard_only"),
      findings: [{
        finding_id: "qa-review-001",
        severity: "medium",
        category: "claim",
        statement: english ? "Review every outcome statement because no verified performance evidence is attached." : "راجع كل عبارة عن النتيجة لأنه لا يوجد دليل أداء موثوق مرفق.",
        remediation: english ? "Keep the wording qualified and attach an approved evidence reference before use." : "أبقِ الصياغة مشروطة وأرفق مرجع دليل معتمد قبل الاستخدام.",
        evidence_refs: ["fixture:ad-brief"],
      }],
      review_outcome: "needs_review",
    }) as ComplianceQAOutput;
  }
  return validateAdvisoryOutput({
    ...base(capability, locale, "offline_fixture_only"),
    candidates: [{
      candidate_id: "rule-candidate-001",
      rule_name: english ? "Require evidence before performance language" : "اشتراط الدليل قبل صياغة الأداء",
      condition: english ? "When a draft contains an outcome claim without an approved evidence reference." : "عندما تحتوي المسودة على ادعاء نتيجة دون مرجع دليل معتمد.",
      advisory_recommendation: english ? "Flag the draft for human review; do not change the canonical rule automatically." : "ضع المسودة للمراجعة البشرية؛ لا تغير القاعدة canonical تلقائيًا.",
      rationale: english ? "The candidate is evaluated against fixtures only and preserves CDKS authority." : "يُقيّم المرشح على fixtures فقط ويحافظ على سلطة CDKS.",
      evidence_refs: ["fixture:ad-brief"],
      evaluation_status: "offline_fixture_only",
      requires_human_review: true,
      canonical_impact: "none_until_versioned_human_approval",
    }],
    evaluation_scope: "offline_fixture_only",
    canonical_rules_changed: false,
  }) as RuleCandidateEvaluatorOutput;
}

export function runAdvisoryMockFailure(capability: AdvisoryCapability, locale: AdvisoryLocale = "ar") {
  return validateAdvisoryOutput({
    ...base(capability, locale, capability === "rule_candidate_evaluator" ? "offline_fixture_only" : "sanitized_wizard_only"),
    status: "failed",
    failure: { code: "ADVISORY_MOCK_FAILURE", message: "Controlled advisory mock failure.", retryable: false },
    ...(capability === "creative_planner" ? { drafts: [] } : {}),
    ...(capability === "evidence_synthesizer" ? { facts: [], evidence_package_status: "insufficient_evidence" } : {}),
    ...(capability === "compliance_qa" ? { findings: [], review_outcome: "blocked_pending_human_review" } : {}),
    ...(capability === "rule_candidate_evaluator" ? { candidates: [], evaluation_scope: "offline_fixture_only", canonical_rules_changed: false } : {}),
  });
}
