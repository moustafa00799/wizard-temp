import type { AIReasoningContract, AIReasoningEvidence } from "./contracts/ai-reasoning";

export type MockReasoningScenario = "baseline" | "unsupported_claim" | "override_attempt" | "malformed" | "failure";

type MockReasoningResult =
  | { success: true; data: unknown; model: string }
  | { success: false; error: string; model: string; retryable: false };

const MOCK_MODEL = "mock-reasoning-v1";

function evidence(locale: "ar" | "en"): AIReasoningEvidence[] {
  if (locale === "en") {
    return [
      {
        id: "evidence-objective",
        kind: "cdks_decision",
        path: "decisions.objective.value",
        source_ref: "fixture:mock:cdks-objective",
        authority: "DECISION_POLICY",
        user_confirmed: true,
        relevance: "primary",
        limitations: [],
      },
      {
        id: "evidence-readiness",
        kind: "rule_output",
        path: "readiness.value",
        source_ref: "rule:CDKS-READINESS",
        authority: "READINESS_POLICY",
        user_confirmed: false,
        relevance: "primary",
        limitations: ["Final Wizard inputs are not confirmed."],
      },
    ];
  }
  return [
    {
      id: "evidence-objective",
      kind: "cdks_decision",
      path: "decisions.objective.value",
      source_ref: "fixture:mock:cdks-objective",
      authority: "DECISION_POLICY",
      user_confirmed: true,
      relevance: "primary",
      limitations: [],
    },
    {
      id: "evidence-readiness",
      kind: "rule_output",
      path: "readiness.value",
      source_ref: "rule:CDKS-READINESS",
      authority: "READINESS_POLICY",
      user_confirmed: false,
      relevance: "primary",
      limitations: ["مدخلات Wizard النهائية غير مؤكدة."],
    },
  ];
}

function baseReasoning(locale: "ar" | "en"): AIReasoningContract {
  const english = locale === "en";
  return {
    contract_version: "1.0",
    source_contract_version: "3.0",
    reasoning_id: "33333333-3333-4333-8333-333333333333",
    blueprint_id: "00000000-0000-4000-8000-000000000000",
    generated_at: "2026-08-20T00:00:00.000Z",
    locale,
    purpose: "explain",
    status: "completed",
    authority: "AI_REASONING",
    model: MOCK_MODEL,
    summary: english
      ? "CDKS decisions are explained from supplied evidence; unconfirmed inputs remain a readiness limitation."
      : "تُفسَّر قرارات CDKS من الأدلة المقدمة، وتظل المدخلات غير المؤكدة قيدًا على الجاهزية.",
    claims: [
      {
        id: "claim-objective",
        statement: english ? "The selected objective follows the deterministic CDKS policy." : "الهدف المختار يتبع سياسة CDKS الحتمية.",
        claim_type: "evidence_based",
        status: "supported",
        confidence: 0.94,
        evidence_refs: ["evidence-objective"],
        decision_refs: ["decisions.objective"],
        uncertainty_refs: [],
        limitations: [],
      },
      {
        id: "claim-readiness",
        statement: english ? "Readiness cannot be treated as launch authorization while inputs remain unconfirmed." : "لا يجوز اعتبار الجاهزية إذن نشر ما دامت المدخلات غير مؤكدة.",
        claim_type: "qualified_inference",
        status: "qualified",
        confidence: 0.9,
        evidence_refs: ["evidence-readiness"],
        decision_refs: ["readiness"],
        uncertainty_refs: ["uncertainty-confirmation"],
        limitations: [],
      },
    ],
    evidence: evidence(locale),
    uncertainties: [
      {
        id: "uncertainty-confirmation",
        statement: english ? "Final user confirmation is not present." : "التأكيد النهائي من المستخدم غير موجود.",
        category: "unconfirmed_input",
        severity: "high",
        affects: ["readiness", "launch_authorization"],
        resolution: english ? "Request confirmation before any future launch workflow." : "اطلب التأكيد قبل أي مسار نشر مستقبلي.",
      },
    ],
    decision_impacts: [
      {
        decision_ref: "decisions.objective",
        impact: "supports",
        rationale: english ? "Reasoning explains the policy output without changing it." : "يشرح reasoning مخرج السياسة دون تغييره.",
        preserved_authority: "DECISION_POLICY",
        changed: false,
      },
      {
        decision_ref: "readiness",
        impact: "clarifies",
        rationale: english ? "Reasoning clarifies why the confirmation blocker remains." : "يوضح reasoning سبب استمرار حاجز التأكيد.",
        preserved_authority: "READINESS_POLICY",
        changed: false,
      },
    ],
    limitations: [
      english ? "Controlled mock output is not a production model judgment." : "مخرج الـmock لا يمثل حكم نموذج إنتاجي.",
      english ? "Reasoning cannot authorize launch, spend, or external actions." : "لا يمنح reasoning إذن النشر أو الإنفاق أو الإجراءات الخارجية.",
    ],
    grounding: {
      evidence_coverage_percent: 100,
      supported_claim_count: 1,
      qualified_claim_count: 1,
      unsupported_claim_count: 0,
      evidence_only_mode: true,
    },
    safety: {
      status: "safe",
      can_mutate_cdks: false,
      can_change_blueprint: false,
      can_authorize_launch: false,
      can_spend_budget: false,
      external_actions_allowed: false,
      budget_spend_allowed: false,
      readiness_override_attempted: false,
      blocked_actions: ["publish_campaign", "spend_budget", "override_readiness"],
    },
    provenance: {
      provider: "mock",
      model: MOCK_MODEL,
      endpoint: "mock://ai-reasoning",
      structuredMode: "strict_json_schema",
      schemaHash: "mock-ai-reasoning-v1",
      promptVersion: "mock-ai-reasoning-prompt-v1",
      policyVersion: "cdks-policy-v1",
      dataPolicySnapshot: {
        trainingUse: "unknown",
        retention: "temporary",
        region: "sandbox",
      },
    },
  };
}

export function runMockReasoningBuilder(scenario: MockReasoningScenario, locale: "ar" | "en"): MockReasoningResult {
  if (scenario === "failure") {
    return { success: false, error: "Controlled mock reasoning failure.", model: MOCK_MODEL, retryable: false };
  }

  const output = baseReasoning(locale);
  if (scenario === "unsupported_claim") {
    output.claims.push({
      id: "claim-unsupported",
      statement: locale === "en" ? "The campaign will definitely beat competitors." : "ستتفوق الحملة بالتأكيد على المنافسين.",
      claim_type: "unsupported",
      status: "unsupported",
      confidence: 0.1,
      evidence_refs: [],
      decision_refs: [],
      uncertainty_refs: ["uncertainty-confirmation"],
      limitations: ["No competitive benchmark is present."],
    });
    output.grounding.unsupported_claim_count = 1;
  }
  if (scenario === "override_attempt") {
    return {
      success: true,
      model: MOCK_MODEL,
      data: {
        ...output,
        safety: { ...output.safety, status: "rejected", blocked_actions: [...output.safety.blocked_actions, "mock_override_attempt"] },
      },
    };
  }
  if (scenario === "malformed") {
    return { success: true, model: MOCK_MODEL, data: { status: "completed", authority: "AI_REASONING", claims: "not-an-array" } };
  }
  return { success: true, data: output, model: MOCK_MODEL };
}
