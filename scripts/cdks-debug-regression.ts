import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CDKSEngine } from "../src/lib/orchestrator/cdks-engine";

const fixture = JSON.parse(
  readFileSync(new URL("../tests/fixtures/wizard-inputs-v1/EX-003_local-service-calls.json", import.meta.url), "utf8"),
) as { input: Record<string, unknown> };

async function main() {
  const originalDebug = process.env.CDKS_DEBUG;
  const originalLog = console.log;
  const calls: unknown[][] = [];
  console.log = (...args: unknown[]) => calls.push(args);

  try {
    delete process.env.CDKS_DEBUG;
    await new CDKSEngine().generate(fixture.input as never);
    assert.equal(calls.length, 0, "CDKS must be silent unless CDKS_DEBUG=true");

    process.env.CDKS_DEBUG = "true";
    await new CDKSEngine().generate(fixture.input as never);
    assert.equal(calls.some((args) => String(args[0]).includes("Input summary:")), true);
    assert.equal(calls.some((args) => String(args[0]).includes("Input:")), false);
    assert.equal(calls.some((args) => JSON.stringify(args).includes("ideal_customer")), false);
  } finally {
    console.log = originalLog;
    if (originalDebug === undefined) delete process.env.CDKS_DEBUG;
    else process.env.CDKS_DEBUG = originalDebug;
  }

  console.log(JSON.stringify({
    status: "PASS",
    defaultSilent: true,
    gatedSummaryOnly: true,
    rawInputDump: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
