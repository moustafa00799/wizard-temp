import assert from "node:assert/strict";
import {
  AIReasoningContractValidationError,
  validateAIReasoningContract,
  type AIReasoningContract,
} from "../src/lib/contracts/ai-reasoning";

const baseline: AIReasoningContract = {
  contract_version: "1.0",
  source_contract_version: "3.0",
  reasoning_id: "11111111-1111-4111-8111-111111111111",
  blueprint_id: "22222222-2222-4222-8222-222222222222",
  generated_at: "2026-08-20T00:00:00.000Z",
  locale: "ar",
  purpose: "explain",
  status: "completed",
  authority: "AI_REASONING",
  model: "mock-reasoning-v1",
  summary: "القرار مدعوم بمدخلات العميل ونتائج CDKS، مع بقاء بعض الافتراضات غير مؤكدة.",
  claims: [
    {
      id: "claim-objective",
      statement: "الهدف المقترح هو توليد العملاء المحتملين وفق قرار CDKS.",
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
      statement: "لا يمكن اعتبار الحملة جاهزة للنشر قبل تأكيد المدخلات المطلوبة.",
      claim_type: "qualified_inference",
      status: "qualified",
      confidence: 0.86,
      evidence_refs: ["evidence-readiness"],
      decision_refs: ["readiness"],
      uncertainty_refs: ["uncertainty-confirmation"],
      limitations: ["الجاهزية النهائية تعتمد على تأكيد المستخدم."],
    },
    {
      id: "claim-gap",
      statement: "لا توجد بيانات كافية لإثبات benchmark تنافسي خاص بهذا النشاط.",
      claim_type: "unsupported",
      status: "unsupported",
      confidence: 0.2,
      evidence_refs: [],
      decision_refs: [],
      uncertainty_refs: ["uncertainty-benchmark"],
      limitations: ["لم يتم استخدام بيانات خارجية أو بيانات حقيقية."],
    },
  ],
  evidence: [
    {
      id: "evidence-objective",
      kind: "cdks_decision",
      path: "decisions.objective.value",
      source_ref: "fixture:EX-002.expected_v3",
      authority: "DECISION_POLICY",
      user_confirmed: true,
      relevance: "primary",
      limitations: [],
    },
    {
      id: "evidence-readiness",
      kind: "rule_output",
      path: "readiness.value",
      source_ref: "rule:CDKS-READINESS-UNCONFIRMED",
      authority: "READINESS_POLICY",
      user_confirmed: false,
      relevance: "primary",
      limitations: ["المدخلات النهائية غير مؤكدة."],
    },
  ],
  uncertainties: [
    {
      id: "uncertainty-confirmation",
      statement: "بعض الحقول مبنية على افتراضات ولم يعتمدها المستخدم بعد.",
      category: "unconfirmed_input",
      severity: "high",
      affects: ["readiness", "launch_authorization"],
      resolution: "اطلب تأكيد المستخدم قبل الانتقال من blueprint_only.",
    },
    {
      id: "uncertainty-benchmark",
      statement: "لا يوجد benchmark موثق داخل المدخلات أو نتائج CDKS الحالية.",
      category: "reference_gap",
      severity: "medium",
      affects: ["benchmark_claims"],
      resolution: "وسم النتيجة كفجوة وعدم تقديمها كحقيقة.",
    },
  ],
  decision_impacts: [
    {
      decision_ref: "decisions.objective",
      impact: "supports",
      rationale: "الاستدلال يشرح قرار السياسة ولا يغيره.",
      preserved_authority: "DECISION_POLICY",
      changed: false,
    },
    {
      decision_ref: "readiness",
      impact: "clarifies",
      rationale: "الاستدلال يوضح سبب استمرار blocker الخاص بالتأكيد.",
      preserved_authority: "READINESS_POLICY",
      changed: false,
    },
  ],
  limitations: [
    "الاستدلال لا يستخدم بيانات حقيقية أو مصادر خارجية في هذه المرحلة.",
    "AI Reasoning لا يمنح إذن نشر أو إنفاق.",
  ],
  grounding: {
    evidence_coverage_percent: 66.67,
    supported_claim_count: 1,
    qualified_claim_count: 1,
    unsupported_claim_count: 1,
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
};

const validated = validateAIReasoningContract(baseline);
assert.equal(validated.contract_version, "1.0");
assert.equal(validated.authority, "AI_REASONING");
assert.equal(validated.safety.external_actions_allowed, false);
assert.equal(validated.safety.budget_spend_allowed, false);
assert.equal(validated.decision_impacts.every((impact) => impact.changed === false), true);
assert.equal(validated.grounding.unsupported_claim_count, 1);

const unknownEvidence = structuredClone(baseline);
unknownEvidence.claims[0].evidence_refs = ["evidence-does-not-exist"];
assert.throws(
  () => validateAIReasoningContract(unknownEvidence),
  (error: unknown) => error instanceof AIReasoningContractValidationError && error.message.includes("unknown evidence refs"),
);

const mismatchedGrounding = structuredClone(baseline);
mismatchedGrounding.grounding.supported_claim_count = 0;
assert.throws(
  () => validateAIReasoningContract(mismatchedGrounding),
  (error: unknown) => error instanceof AIReasoningContractValidationError && error.message.includes("supported_claim_count"),
);

const failedWithoutFailure = structuredClone(baseline);
failedWithoutFailure.status = "failed";
delete failedWithoutFailure.failure;
assert.throws(
  () => validateAIReasoningContract(failedWithoutFailure),
  (error: unknown) => error instanceof AIReasoningContractValidationError && error.message.includes("failed reasoning requires failure"),
);

const forbiddenHumanChallenge = structuredClone(baseline);
forbiddenHumanChallenge.decision_impacts[0] = {
  decision_ref: "human_approval",
  impact: "challenges",
  rationale: "invalid authority challenge",
  preserved_authority: "HUMAN_APPROVAL",
  changed: false,
};
assert.throws(
  () => validateAIReasoningContract(forbiddenHumanChallenge),
  (error: unknown) => error instanceof AIReasoningContractValidationError && error.message.includes("cannot challenge human approval"),
);

console.log(JSON.stringify({ status: "PASS", assertions: 10, contractVersion: baseline.contract_version }, null, 2));
