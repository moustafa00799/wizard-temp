import { runRandomizedWizardFixtureSuite } from "../src/lib/staging/randomized-suite";

async function main() {
  const seedArg = Number(process.argv[2]);
  const variantsArg = Number(process.argv[3]);
  const result = await runRandomizedWizardFixtureSuite({
    seed: Number.isInteger(seedArg) ? seedArg : 20260824,
    variantsPerCase: Number.isInteger(variantsArg) ? variantsArg : 3,
  });
  console.log(JSON.stringify({
    suite: result.suite,
    status: result.status,
    seed: result.seed,
    corpusCount: result.corpusCount,
    variantsPerCase: result.variantsPerCase,
    totalRuns: result.totalRuns,
    summary: result.summary,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
