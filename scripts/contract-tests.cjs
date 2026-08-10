const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const required = [
  "src/lib/contracts/strategy-ai.ts",
  "src/lib/contracts/execution-ai.ts",
  "src/lib/contracts/blueprint-compiler.ts",
  "src/lib/contracts/ai-provider.ts",
  "src/lib/contracts/two-ai-pipeline.ts",
  "src/lib/contracts/ai-boundary-tests.ts",
  "src/lib/contracts/blueprint-compiler.test.ts",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Contract tests FAILED: missing files");
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

const checks = [
  ["Strategy contract", "src/lib/contracts/strategy-ai.ts", ["StrategyAIInput", "StrategyDecision", "validateStrategyDecision"]],
  ["Execution contract", "src/lib/contracts/execution-ai.ts", ["ExecutionAIInput", "ExecutionDecision", "validateExecutionDecision"]],
  ["Provider adapter", "src/lib/contracts/ai-provider.ts", ["generateStructuredAI"]],
  ["Two-AI pipeline", "src/lib/contracts/two-ai-pipeline.ts", ["runTwoAIPipeline"]],
  ["Blueprint compiler", "src/lib/contracts/blueprint-compiler.ts", ["compileBlueprint", "generation_mode: \"hybrid\"", "wizard_input: input.canonical"]],
];

const errors = [];
for (const [name, file, tokens] of checks) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  for (const token of tokens) {
    if (!content.includes(token)) errors.push(`${name}: missing ${token}`);
  }
}

if (errors.length) {
  console.error("Contract tests FAILED");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Contract boundary checks PASSED");
console.log(`Verified ${checks.length} contract boundaries.`);
