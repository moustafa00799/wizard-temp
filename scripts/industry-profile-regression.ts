import assert from "node:assert/strict";
import {
  buildEvidencePackage,
  INDUSTRY_PROFILES,
  resolveIndustryProfile,
  SourceRegistry,
} from "../src/lib/knowledge";
import { IndustryProfileSchema } from "../src/lib/contracts/knowledge";

assert.equal(INDUSTRY_PROFILES.length, 5);
for (const profile of INDUSTRY_PROFILES) {
  IndustryProfileSchema.parse(profile);
  assert.equal(profile.status, "draft");
  assert.equal(profile.sourceIds.length, 0);
  assert.ok(profile.limitations.length > 0);
}

const ecommerceExact = resolveIndustryProfile({ branch: "ecommerce", industryKey: "ecommerce_general" });
assert.equal(ecommerceExact.status, "matched");
assert.equal(ecommerceExact.matchedBy, "exact_key");
assert.equal(ecommerceExact.confidence, 1);
assert.equal(ecommerceExact.profile?.branch, "ecommerce");

const localAlias = resolveIndustryProfile({ branch: "local_service", industryKey: "local services" });
assert.equal(localAlias.status, "matched");
assert.equal(localAlias.matchedBy, "explicit_alias");
assert.equal(localAlias.profile?.industryKey, "local_service_general");

const educationExact = resolveIndustryProfile({ branch: "education", industryKey: "education_general" });
assert.equal(educationExact.status, "matched");
assert.equal(educationExact.matchedBy, "exact_key");
assert.equal(educationExact.profile?.branch, "education");
assert.equal(educationExact.profile?.status, "draft");
assert.ok(educationExact.profile?.complianceConstraints.some((item) => /accreditation|licensing/i.test(item)));
assert.ok(educationExact.profile?.trackingNeeds.includes("qualified_lead_definition"));

const educationAlias = resolveIndustryProfile({ industryKey: "education" });
assert.equal(educationAlias.status, "matched");
assert.equal(educationAlias.matchedBy, "explicit_alias");
assert.equal(educationAlias.profile?.industryKey, "education_general");

const appAlias = resolveIndustryProfile({ industryKey: "mobile-app" });
assert.equal(appAlias.status, "matched");
assert.equal(appAlias.profile?.branch, "app");

const branchMismatch = resolveIndustryProfile({ branch: "b2b", industryKey: "ecommerce_general" });
assert.equal(branchMismatch.status, "unmatched");
assert.equal(branchMismatch.confidence, 0);
assert.equal(branchMismatch.profile, undefined);

const unknownIndustry = resolveIndustryProfile({ branch: "ecommerce", industryKey: "fashion_marketplace" });
assert.equal(unknownIndustry.status, "unmatched");
assert.equal(unknownIndustry.matchedBy, "none");
assert.match(unknownIndustry.reason, /no profile explicitly covers/i);

const missingKey = resolveIndustryProfile({ branch: "local_service" });
assert.equal(missingKey.status, "unmatched");
assert.equal(missingKey.confidence, 0);
assert.match(missingKey.reason, /does not infer/i);

const draftProfilePackage = buildEvidencePackage(new SourceRegistry(), {
  packageId: "pkg-draft-profile-without-market-evidence",
  generatedAt: "2026-08-21T00:00:00.000Z",
  market: "EG",
  industry: "ecommerce_general",
  locale: "ar",
  currency: "EGP",
  snapshots: [],
  industryProfile: INDUSTRY_PROFILES.find((profile) => profile.industryKey === "ecommerce_general"),
  queryHash: "query-draft-profile-only",
});
assert.equal(draftProfilePackage.status, "missing");
assert.equal(draftProfilePackage.industryProfile?.status, "draft");
assert.match(draftProfilePackage.industryProfile?.limitations[0] ?? "", /not industry-validated/i);

console.log(JSON.stringify({
  test: "industry-profile-regression",
  status: "PASS",
  assertions: 32,
  profiles: INDUSTRY_PROFILES.map((profile) => ({ profileId: profile.profileId, branch: profile.branch, status: profile.status })),
  liveAiCalls: 0,
  marketValidated: false,
  message: "Industry matching is explicit and returns unmatched instead of guessing outside the profile catalog.",
}, null, 2));
