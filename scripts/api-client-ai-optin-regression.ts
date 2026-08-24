import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/generate/v5/route";

const fixturePath = path.join(process.cwd(), "tests/fixtures/wizard-inputs-v1/EX-001_ecommerce-sales.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

async function call(payload: unknown) {
  const response = await POST(new NextRequest("http://localhost/api/generate/v5", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }));
  return { status: response.status, body: await response.json() };
}

async function main() {
  process.env.AI_LIVE_ENABLED = "false";
  process.env.AI_PROVIDER_MODE = "nonprod";
  process.env.AI_DATA_POLICY = "sanitized_wizard_only";

  const disabled = await call({ ...fixture, ai_advisory: { enabled: false } });
  assert.equal(disabled.status, 200);
  assert.equal(disabled.body.data.strategy.status, "not_requested");
  assert.equal(disabled.body.data.reasoning.status, "not_requested");
  assert.equal(disabled.body.data.validation.external_actions_allowed, false);
  assert.equal(disabled.body.data.validation.budget_spend_allowed, false);

  const optedInButServerOff = await call({ ...fixture, ai_advisory: { enabled: true } });
  assert.equal(optedInButServerOff.status, 200);
  assert.equal(optedInButServerOff.body.data.strategy.status, "failed");
  assert.equal(optedInButServerOff.body.data.reasoning.status, "failed");
  assert.match(optedInButServerOff.body.data.reasoning.contract.failure.code, /LIVE_NOT_ENABLED/);
  assert.ok(optedInButServerOff.body.data.blueprint);
  assert.equal(optedInButServerOff.body.data.validation.external_actions_allowed, false);
  assert.equal(optedInButServerOff.body.data.validation.budget_spend_allowed, false);

  console.log(JSON.stringify({ status: "PASS", assertions: 10, defaultOff: true, optInWithoutServerMode: "failed_closed", externalRequests: 0 }, null, 2));
}

void main();
