import assert from "node:assert/strict";
import {
  ProviderContentClassificationSchema,
  ProviderContentSignalSchema,
  type ProviderContentSignal,
  classifyProviderContent,
  contentClassificationId,
} from "../src/lib/knowledge";

const capturedAt = "2026-08-23T19:00:00.000Z";

function signal(input: Partial<ProviderContentSignal> & Pick<ProviderContentSignal, "signalId" | "provider" | "accountId" | "entityLevel" | "signalType" | "text" | "sourceRef" | "observedAt">): ProviderContentSignal {
  return ProviderContentSignalSchema.parse({
    contractVersion: "1.0",
    ...input,
  });
}

const educationSignals = [
  signal({
    signalId: "google-428-campaign-education-name",
    provider: "google_ads",
    accountId: "4282900193",
    entityLevel: "campaign",
    entityId: "23860383978",
    entityName: "Algebra 3rd",
    signalType: "campaign_name",
    text: "Algebra 3rd",
    sourceRef: "google_ads_exports/4282900193/campaign-context-2026-08-23.json",
    observedAt: capturedAt,
  }),
  signal({
    signalId: "google-428-campaign-education-keyword",
    provider: "google_ads",
    accountId: "4282900193",
    entityLevel: "campaign",
    entityId: "23860383978",
    signalType: "keyword",
    text: "maths revision algebra",
    sourceRef: "google_ads_exports/4282900193/ad-creative-performance-2023-07-23-to-2026-08-22.json",
    observedAt: capturedAt,
  }),
];
const educationClassification = classifyProviderContent({
  classificationId: contentClassificationId("google_ads", "4282900193", "23860383978"),
  provider: "google_ads",
  accountId: "4282900193",
  entityLevel: "campaign",
  entityId: "23860383978",
  entityName: "Algebra 3rd",
  generatedAt: capturedAt,
  signals: educationSignals,
});
assert.equal(educationClassification.primaryIndustryKey, "education");
assert.equal(educationClassification.reviewStatus, "unreviewed");
assert.equal(educationClassification.industryCandidates[0]?.reviewStatus, "unreviewed");
assert.ok(educationClassification.industryCandidates[0]?.evidenceSignalIds.length);
assert.equal(educationClassification.marketCandidates.length, 0);
ProviderContentClassificationSchema.parse(educationClassification);

const mixedClassification = classifyProviderContent({
  classificationId: contentClassificationId("google_ads", "4282900193"),
  provider: "google_ads",
  accountId: "4282900193",
  entityLevel: "account",
  generatedAt: capturedAt,
  signals: [
    ...educationSignals,
    signal({
      signalId: "google-428-campaign-service-keyword",
      provider: "google_ads",
      accountId: "4282900193",
      entityLevel: "campaign",
      entityId: "16166233584",
      signalType: "keyword",
      text: "صيانة غسالات",
      sourceRef: "google_ads_exports/4282900193/ad-creative-performance-2023-07-23-to-2026-08-22.json",
      observedAt: capturedAt,
    }),
    signal({
      signalId: "google-428-campaign-service-creative",
      provider: "google_ads",
      accountId: "4282900193",
      entityLevel: "campaign",
      entityId: "16166233584",
      signalType: "creative_text",
      text: "خدمة صيانة منزلية",
      sourceRef: "google_ads_exports/4282900193/ad-creative-performance-2023-07-23-to-2026-08-22.json",
      observedAt: capturedAt,
    }),
  ],
});
assert.equal(mixedClassification.primaryIndustryKey, "mixed_or_multi_industry");
assert.ok(mixedClassification.industryCandidates.some((candidate) => candidate.candidateKey === "education"));
assert.ok(mixedClassification.industryCandidates.some((candidate) => candidate.candidateKey === "local_service"));

const marketCandidate = classifyProviderContent({
  classificationId: contentClassificationId("google_ads", "5805554566", "22216585646"),
  provider: "google_ads",
  accountId: "5805554566",
  entityLevel: "campaign",
  entityId: "22216585646",
  generatedAt: capturedAt,
  signals: [
    signal({
      signalId: "google-580-sa-keyword",
      provider: "google_ads",
      accountId: "5805554566",
      entityLevel: "campaign",
      entityId: "22216585646",
      signalType: "keyword",
      text: "وظائف في السعودية",
      sourceRef: "google_ads_exports/5805554566/keyword-view-2023-07-23-to-2026-08-22.json",
      observedAt: capturedAt,
    }),
  ],
});
assert.equal(marketCandidate.marketCandidates[0]?.market, "SA");
assert.equal(marketCandidate.marketCandidates[0]?.reviewStatus, "unreviewed");
assert.throws(() => ProviderContentClassificationSchema.parse({
  ...marketCandidate,
  marketCandidates: marketCandidate.marketCandidates.map((candidate) => ({ ...candidate, reviewStatus: "accepted" })),
}), /cannot establish account or project scope/);

const unknown = classifyProviderContent({
  classificationId: contentClassificationId("ga4", "471345574"),
  provider: "ga4",
  accountId: "471345574",
  entityLevel: "property",
  generatedAt: capturedAt,
  signals: [signal({
    signalId: "ga4-property-display-name",
    provider: "ga4",
    accountId: "471345574",
    entityLevel: "property",
    signalType: "display_name",
    text: "https://enfrad.mystrikingly.com/",
    sourceRef: "ga4-ui-account-tree-2026-08-23",
    observedAt: capturedAt,
  })],
});
assert.equal(unknown.primaryIndustryKey, "unclassified");
assert.equal(unknown.industryCandidates.length, 0);

console.log(JSON.stringify({
  test: "provider-content-classification-regression",
  status: "PASS",
  assertions: 13,
  liveAiCalls: 0,
  marketValidated: false,
  message: "Content signals produce reviewable industry candidates, mixed-account classification, and non-authoritative market candidates without scope escalation.",
}, null, 2));
