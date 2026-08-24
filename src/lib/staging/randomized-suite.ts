import fs from "node:fs";
import path from "node:path";
import { buildBlueprintContractV3 } from "../contracts/build-blueprint-contract-v3";
import { canonicalizeWizardInput, type CanonicalWizardInput } from "../contracts/wizard-input";
import { CDKSEngine } from "../orchestrator/cdks-engine";
import { sha256Json } from "../db";

type FixtureMetadata = {
  scenario_id?: unknown;
  assumptions?: unknown[];
  output_language?: unknown;
  currency?: unknown;
};

type Fixture = {
  input: unknown;
  _fixture?: FixtureMetadata;
};

type RandomizedOptions = {
  seed?: number;
  variantsPerCase?: number;
};

type VariantResult = {
  caseId: string;
  fileName: string;
  variant: number;
  seed: number;
  objective: unknown;
  funnel: unknown;
  channels: unknown;
  readiness: unknown;
  decisionDigest: string;
  checks: {
    canonicalInput: "pass";
    blueprintGenerated: "pass";
    contractGenerated: "pass";
    noSecretMaterial: "pass";
    externalActionsBlocked: "pass";
    budgetSpendBlocked: "pass";
  };
};

export type RandomizedSuiteResult = {
  suite: "wizard-fixtures-v1";
  status: "PASS" | "FAIL";
  seed: number;
  variantsPerCase: number;
  corpusCount: number;
  totalRuns: number;
  results: VariantResult[];
  summary: {
    pass: number;
    fail: number;
    uniqueDecisionDigests: number;
    canonicalBlueprintMutation: false;
    externalActions: false;
    budgetSpend: false;
  };
};

const CORPUS_DIR = path.join(process.cwd(), "tests", "fixtures", "wizard-inputs-v1");
const SECRET_PATTERN = /(?:password|access[_-]?token|refresh[_-]?token|api[_-]?key|secret)\s*[:=]/i;
const TRACKING_OPTIONS = ["ready", "partial", "issues"] as const;
const CONTENT_OPTIONS = ["easy", "slow", "hard"] as const;
const RESPONSE_OPTIONS = ["immediate", "within_hour", "within_day", "slow"] as const;
const RISK_OPTIONS = ["low", "medium", "high"] as const;

function loadCorpus(): Array<{ fileName: string; caseId: string; fixture: Fixture }> {
  if (!fs.existsSync(CORPUS_DIR)) throw new Error(`Wizard fixture corpus was not found at ${CORPUS_DIR}`);
  return fs.readdirSync(CORPUS_DIR)
    .filter((fileName) => /^EX-\d+_.*\.json$/.test(fileName))
    .sort()
    .map((fileName) => {
      const fixture = JSON.parse(fs.readFileSync(path.join(CORPUS_DIR, fileName), "utf8")) as Fixture;
      return { fileName, caseId: fileName.split("_")[0], fixture };
    });
}

function createPrng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
}

function variantInput(base: CanonicalWizardInput, seed: number): CanonicalWizardInput {
  const random = createPrng(seed);
  const note = base.past_performance_notes ? `${base.past_performance_notes} | staging-variant-${seed}` : `staging-variant-${seed}`;
  return {
    ...base,
    past_performance_notes: note,
    tracking_status: pick(random, TRACKING_OPTIONS),
    content_capacity: pick(random, CONTENT_OPTIONS),
    response_speed: pick(random, RESPONSE_OPTIONS),
    risk_tolerance: pick(random, RISK_OPTIONS),
    final_confirmed_inputs: random() >= 0.5,
  };
}

function assertNoSecrets(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (SECRET_PATTERN.test(serialized)) throw new Error("Randomized fixture contains secret-like material.");
}

async function generateQuietly(engine: CDKSEngine, input: CanonicalWizardInput) {
  const originalLog = console.log;
  console.log = () => undefined;
  try {
    return await engine.generate(input);
  } finally {
    console.log = originalLog;
  }
}

export async function runRandomizedWizardFixtureSuite(options: RandomizedOptions = {}): Promise<RandomizedSuiteResult> {
  const seed = Number.isInteger(options.seed) ? Number(options.seed) : 20260824;
  const variantsPerCase = Math.min(10, Math.max(1, Number.isInteger(options.variantsPerCase) ? Number(options.variantsPerCase) : 3));
  const corpus = loadCorpus();
  const engine = new CDKSEngine();
  const results: VariantResult[] = [];

  for (const corpusCase of corpus) {
    const baseInput = canonicalizeWizardInput(corpusCase.fixture.input);
    assertNoSecrets(corpusCase.fixture);
    for (let variant = 0; variant < variantsPerCase; variant += 1) {
      const variantSeed = seed + (Number(corpusCase.caseId.slice(3)) * 1000) + variant;
      const input = variantInput(baseInput, variantSeed);
      assertNoSecrets(input);
      const blueprint = await generateQuietly(engine, input);
      const blueprintBefore = sha256Json(blueprint);
      const contract = buildBlueprintContractV3(input, blueprint, corpusCase.fixture as Fixture & { _fixture?: FixtureMetadata });
      const blueprintAfter = sha256Json(blueprint);
      if (blueprintBefore !== blueprintAfter) throw new Error(`Canonical Blueprint mutated for ${corpusCase.caseId}/${variant}.`);
      if (contract.validation.external_actions_allowed !== false) throw new Error(`External actions were not blocked for ${corpusCase.caseId}/${variant}.`);
      if (contract.validation.budget_spend_allowed !== false) throw new Error(`Budget spend was not blocked for ${corpusCase.caseId}/${variant}.`);
      const decisionDigest = sha256Json({
        objective: contract.decisions.objective,
        funnel: contract.decisions.funnel,
        channels: contract.decisions.channels,
        readiness: contract.readiness,
      });
      results.push({
        caseId: corpusCase.caseId,
        fileName: corpusCase.fileName,
        variant,
        seed: variantSeed,
        objective: contract.decisions.objective,
        funnel: contract.decisions.funnel,
        channels: contract.decisions.channels,
        readiness: contract.readiness,
        decisionDigest,
        checks: {
          canonicalInput: "pass",
          blueprintGenerated: "pass",
          contractGenerated: "pass",
          noSecretMaterial: "pass",
          externalActionsBlocked: "pass",
          budgetSpendBlocked: "pass",
        },
      });
    }
  }

  const digests = new Set(results.map((result) => result.decisionDigest));
  return {
    suite: "wizard-fixtures-v1",
    status: "PASS",
    seed,
    variantsPerCase,
    corpusCount: corpus.length,
    totalRuns: results.length,
    results,
    summary: {
      pass: results.length,
      fail: 0,
      uniqueDecisionDigests: digests.size,
      canonicalBlueprintMutation: false,
      externalActions: false,
      budgetSpend: false,
    },
  };
}
