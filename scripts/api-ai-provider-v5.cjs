const fs = require("node:fs");
const path = require("node:path");

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const LIVE = process.argv.includes("--live");
const requestedProvider = process.argv.find((arg) => arg.startsWith("--provider="))?.split("=")[1];
const configuredProviders = [
  process.env.AI_STRATEGY_PROVIDER,
  process.env.AI_STRATEGY_FALLBACK_PROVIDER,
  process.env.AI_BENCHMARK_PROVIDER,
].filter((value) => ["groq", "mistral", "gemini"].includes(value));
const providers = requestedProvider
  ? [requestedProvider]
  : [...new Set(configuredProviders.length ? configuredProviders : ["groq", "mistral", "gemini"])]
    .filter((provider) => ["groq", "mistral", "gemini"].includes(provider));
const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "wizard-inputs-v1");
const resultPath = path.join(process.cwd(), "tests", "results", "ai-provider-benchmark-v1.json");
const DEFAULT_INTERVALS_MS = { groq: 20_000, mistral: 15_000, gemini: 15_000 };
const safePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
};
const intervals = {
  groq: safePositiveInt(process.env.AI_BENCHMARK_GROQ_INTERVAL_MS, DEFAULT_INTERVALS_MS.groq),
  mistral: safePositiveInt(process.env.AI_BENCHMARK_MISTRAL_INTERVAL_MS, DEFAULT_INTERVALS_MS.mistral),
  gemini: safePositiveInt(process.env.AI_BENCHMARK_GEMINI_INTERVAL_MS, DEFAULT_INTERVALS_MS.gemini),
};
const maxCases = safePositiveInt(process.env.AI_BENCHMARK_MAX_CASES, 0);
const stopOnRateLimit = process.env.AI_BENCHMARK_STOP_ON_RATE_LIMIT !== "false";
const stopOnNotFound = process.env.AI_BENCHMARK_STOP_ON_NOT_FOUND !== "false";

if (!LIVE) {
  console.log("AI provider benchmark is opt-in and makes live external requests.");
  console.log("Run the local server with .env.local, then use: npm run test:ai:providers -- --live");
  process.exit(0);
}

function readFixtures() {
  const fixtures = fs.readdirSync(fixtureDir)
    .filter((name) => /^EX-\d+_.*\.json$/.test(name))
    .sort()
    .map((name) => ({ name, data: JSON.parse(fs.readFileSync(path.join(fixtureDir, name), "utf8")) }));
  return maxCases > 0 ? fixtures.slice(0, maxCases) : fixtures;
}

function sleep(ms) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function assertContract(payload, provider) {
  const contract = payload?.data;
  const failures = [];
  if (payload?.status !== "success") failures.push("http_envelope_not_success");
  if (contract?.contract_version !== "3.0") failures.push("contract_version");
  if (contract?.generation_mode !== "blueprint_only") failures.push("generation_mode");
  if (contract?.decisions?.objective?.authority !== "DECISION_POLICY") failures.push("objective_authority");
  if (contract?.decisions?.funnel?.authority !== "DECISION_POLICY") failures.push("funnel_authority");
  if (contract?.decisions?.channels?.authority !== "DECISION_POLICY") failures.push("channels_authority");
  if (contract?.readiness?.authority !== "READINESS_POLICY") failures.push("readiness_authority");
  if (contract?.validation?.external_actions_allowed !== false) failures.push("external_actions_gate");
  if (contract?.validation?.budget_spend_allowed !== false) failures.push("budget_spend_gate");
  if (contract?.strategy?.status !== "completed") failures.push("strategy_not_completed");
  if (contract?.strategy?.status === "completed") {
    const actualProvider = contract?.strategy?.provenance?.provider;
    const fallbackAllowed = provider === "groq" && actualProvider === "mistral" && contract?.strategy?.provenance?.fallbackFrom === "groq";
    if (actualProvider !== provider && !fallbackAllowed) failures.push("strategy_provenance_provider");
  }
  return { ok: failures.length === 0, failures, contract };
}

function stopReasonFrom(strategy) {
  const category = strategy?.provenance?.failureCategory;
  if (category === "rate_limited" || strategy?.provenance?.fallbackReason === "429") return "rate_limited";
  if (category === "not_found") return "not_found";
  return null;
}

async function runOne(provider, fixture) {
  const benchmark = provider === "gemini";
  const body = {
    ...fixture.data.input,
    _fixture: fixture.data._fixture,
    ai_strategy_builder: {
      enabled: true,
      provider,
      benchmark,
      fallbackProvider: provider === "groq" ? "mistral" : undefined,
    },
  };

  const startedAt = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/generate/v5`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    const checked = assertContract(payload, provider);
    const strategy = checked.contract?.strategy;
    const provenance = strategy?.provenance ?? {};
    const stopReason = stopReasonFrom(strategy);
    return {
      provider,
      fixture: fixture.name,
      httpStatus: response.status,
      ok: checked.ok,
      failures: checked.failures,
      strategyStatus: strategy?.status ?? null,
      model: strategy?.model ?? null,
      strategyProvider: provenance.provider ?? null,
      structuredMode: provenance.structuredMode ?? null,
      fallbackFrom: provenance.fallbackFrom ?? null,
      fallbackReason: provenance.fallbackReason ?? null,
      failureCategory: provenance.failureCategory ?? null,
      failureStatus: provenance.failureStatus ?? null,
      failureCode: provenance.failureCode ?? null,
      retryable: provenance.retryable ?? null,
      retryAfterMs: provenance.retryAfterMs ?? null,
      requestId: provenance.requestId ?? null,
      latencyMs: provenance.latencyMs ?? Date.now() - startedAt,
      stopReason,
    };
  } catch (error) {
    return {
      provider,
      fixture: fixture.name,
      httpStatus: null,
      ok: false,
      failures: [error instanceof Error ? error.message : "request_failed"],
      strategyStatus: null,
      model: null,
      strategyProvider: null,
      structuredMode: null,
      fallbackFrom: null,
      fallbackReason: null,
      failureCategory: "network",
      failureStatus: null,
      failureCode: null,
      retryable: true,
      retryAfterMs: null,
      requestId: null,
      latencyMs: Date.now() - startedAt,
      stopReason: null,
    };
  }
}

(async () => {
  const fixtures = readFixtures();
  const results = [];
  const providerRuns = [];
  const stoppedProviders = [];

  for (const provider of providers) {
    let stopped = false;
    let previousRequestAt = null;
    let casesRun = 0;
    for (const fixture of fixtures) {
      if (stopped) break;
      if (previousRequestAt !== null) {
        const elapsed = Date.now() - previousRequestAt;
        await sleep(Math.max(0, intervals[provider] - elapsed));
      }
      previousRequestAt = Date.now();
      const result = await runOne(provider, fixture);
      results.push(result);
      casesRun += 1;
      const shouldStop = (result.stopReason === "rate_limited" && stopOnRateLimit)
        || (result.stopReason === "not_found" && stopOnNotFound);
      if (shouldStop) {
        stopped = true;
        stoppedProviders.push({ provider, reason: result.stopReason, fixture: fixture.name });
      }
    }
    providerRuns.push({ provider, casesRequested: fixtures.length, casesRun, stopped });
  }

  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    providers,
    fixtureCount: fixtures.length,
    totalCases: results.length,
    passedCases: results.filter((result) => result.ok).length,
    failedCases: results.filter((result) => !result.ok).length,
    intervalsMs: intervals,
    maxCases: maxCases || null,
    stopOnRateLimit,
    stopOnNotFound,
    providerRuns,
    stoppedProviders,
    results,
    note: "Sanitized benchmark metadata only. No prompts, completions, or API keys are stored.",
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    totalCases: report.totalCases,
    passedCases: report.passedCases,
    failedCases: report.failedCases,
    stoppedProviders: report.stoppedProviders,
    resultPath,
  }, null, 2));
  process.exit(report.failedCases === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
