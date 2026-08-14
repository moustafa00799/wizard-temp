const fs = require("fs");
const route = fs.readFileSync("src/app/api/generate/route.ts", "utf8");
const policy = fs.readFileSync("src/lib/cdks-policy.ts", "utf8");

const checks = [
  ["CDKS policy imported", route.includes("@/lib/cdks-policy")],
  ["Canonical input resolves CDKS decisions", route.includes("resolveCDKSDecisions(canonicalWizard)")],
  ["Objective authority gate", route.includes("cdksDecisions.objective.value")],
  ["Funnel authority gate", route.includes("cdksDecisions.funnel.value")],
  ["Channel authority gate", route.includes("cdksDecisions.channels.value")],
  ["Decision envelope returned", route.includes("cdks_decisions: cdksDecisions")],
  ["Policy version frozen", policy.includes('policy_version: \"v1.0\"')],
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);
