import assert from "node:assert/strict";
import { AUTOFILL_PROFILE_COUNT, PROFILE_NAMES, getCurrentProfileName, getDummyData } from "../src/lib/dev-autofill";

function main() {
  assert.equal(AUTOFILL_PROFILE_COUNT, 10);
  assert.equal(PROFILE_NAMES.length, 10);

  const firstBag: string[] = [];
  for (let index = 0; index < AUTOFILL_PROFILE_COUNT; index += 1) {
    const data = getDummyData();
    assert.equal(data.ai_advisory_enabled, false);
    assert.equal(PROFILE_NAMES.includes(getCurrentProfileName()), true);
    firstBag.push(getCurrentProfileName());
  }
  assert.equal(new Set(firstBag).size, 10);

  const nextProfile = getCurrentProfileName();
  getDummyData();
  assert.notEqual(getCurrentProfileName(), nextProfile);

  console.log(JSON.stringify({ status: "PASS", assertions: 5 + AUTOFILL_PROFILE_COUNT, profileCount: AUTOFILL_PROFILE_COUNT, uniqueFirstBag: new Set(firstBag).size, noRepeatWithinBag: true }, null, 2));
}

main();
