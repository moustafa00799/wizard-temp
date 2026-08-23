import { z } from "zod";
import {
  KnowledgeMarketSchema,
  type KnowledgeMarket,
} from "@/lib/contracts/knowledge";
import {
  PLATFORM_CONTRACT_VERSION,
  KnowledgeProviderSchema,
  PlatformEntityLevelSchema,
  type KnowledgeProvider,
  type PlatformEntityLevel,
} from "./provider-snapshot-contracts";

const NonEmptyStringSchema = z.string().trim().min(1);
const IsoDateTimeSchema = z.string().datetime({ offset: true });
const ConfidenceSchema = z.number().min(0).max(1);

export const ContentSignalTypeSchema = z.enum([
  "campaign_name",
  "ad_group_name",
  "ad_name",
  "creative_text",
  "headline",
  "description",
  "keyword",
  "landing_page",
  "app_name",
  "display_name",
]);
export type ContentSignalType = z.infer<typeof ContentSignalTypeSchema>;

export const ProviderContentSignalSchema = z.object({
  contractVersion: z.literal(PLATFORM_CONTRACT_VERSION),
  signalId: NonEmptyStringSchema,
  provider: KnowledgeProviderSchema,
  accountId: NonEmptyStringSchema,
  entityLevel: PlatformEntityLevelSchema,
  entityId: NonEmptyStringSchema.optional(),
  entityName: NonEmptyStringSchema.optional(),
  signalType: ContentSignalTypeSchema,
  text: NonEmptyStringSchema,
  sourceRef: NonEmptyStringSchema,
  observedAt: IsoDateTimeSchema,
});
export type ProviderContentSignal = z.infer<typeof ProviderContentSignalSchema>;

export const InferredIndustryKeySchema = z.enum([
  "ecommerce",
  "beauty_personal_care",
  "telecom",
  "app",
  "b2b_talent_marketplace",
  "education",
  "local_service",
  "immigration_consular_services",
  "unclassified",
  "mixed_or_multi_industry",
]);
export type InferredIndustryKey = z.infer<typeof InferredIndustryKeySchema>;

export const CandidateReviewStatusSchema = z.enum(["unreviewed", "accepted", "rejected"]);
export type CandidateReviewStatus = z.infer<typeof CandidateReviewStatusSchema>;

export const InferredIndustryCandidateSchema = z.object({
  candidateKey: InferredIndustryKeySchema,
  confidence: ConfidenceSchema,
  matchedTerms: z.array(NonEmptyStringSchema),
  evidenceSignalIds: z.array(NonEmptyStringSchema),
  reviewStatus: CandidateReviewStatusSchema,
  reviewNote: NonEmptyStringSchema.optional(),
});
export type InferredIndustryCandidate = z.infer<typeof InferredIndustryCandidateSchema>;

export const InferredMarketCandidateSchema = z.object({
  market: KnowledgeMarketSchema,
  confidence: ConfidenceSchema,
  matchedTerms: z.array(NonEmptyStringSchema),
  evidenceSignalIds: z.array(NonEmptyStringSchema),
  reviewStatus: CandidateReviewStatusSchema,
  reviewNote: NonEmptyStringSchema.optional(),
});
export type InferredMarketCandidate = z.infer<typeof InferredMarketCandidateSchema>;

export const ProviderContentClassificationSchema = z.object({
  contractVersion: z.literal(PLATFORM_CONTRACT_VERSION),
  classificationId: NonEmptyStringSchema,
  provider: KnowledgeProviderSchema,
  accountId: NonEmptyStringSchema,
  entityLevel: PlatformEntityLevelSchema,
  entityId: NonEmptyStringSchema.optional(),
  entityName: NonEmptyStringSchema.optional(),
  generatedAt: IsoDateTimeSchema,
  method: z.literal("deterministic_content_signal_rules"),
  industryCandidates: z.array(InferredIndustryCandidateSchema),
  marketCandidates: z.array(InferredMarketCandidateSchema),
  primaryIndustryKey: InferredIndustryKeySchema,
  reviewStatus: CandidateReviewStatusSchema,
  limitations: z.array(NonEmptyStringSchema),
}).superRefine((classification, context) => {
  if (classification.reviewStatus === "accepted" && classification.industryCandidates.some((candidate) => candidate.reviewStatus !== "accepted")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reviewStatus"],
      message: "An accepted classification requires every industry candidate to be explicitly accepted.",
    });
  }
  if (classification.marketCandidates.some((candidate) => candidate.reviewStatus === "accepted")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["marketCandidates"],
      message: "Content-derived market candidates cannot establish account or project scope.",
    });
  }
});
export type ProviderContentClassification = z.infer<typeof ProviderContentClassificationSchema>;

const INDUSTRY_RULES: Readonly<Record<Exclude<InferredIndustryKey, "unclassified" | "mixed_or_multi_industry">, readonly string[]>> = {
  ecommerce: ["متجر", "شراء", "اشتر", "إشتري", "توصيل", "عرض خاص", "منتج", "بطانية", "تابلوهات", "ترابيزة اللابتوب", "شاحن", "باور بانك", "ملابس", "free delivery", "ecommerce", "تسوق", "سعر", "شحن مجاني"],
  beauty_personal_care: ["زيت الشعر", "الشعر الأفغاني", "العناية بالشعر", "ترطيب شعرك", "كثافة ولمعان شعرك", "hair oil", "hair care", "beauty", "عناية بالبشرة", "ماسك الوجه"],
  telecom: ["راوتر", "موبايلي", "5g", "4g", "انترنت هوائي", "باقة النت", "شريحة", "huawei cpe", "router", "telecom"],
  app: ["تطبيق", "ابلكيشن", "أبلكيشن", "اندرويد", "أندرويد", "ios", "android", "download", "تحميل الابلكيشن", "تطبيقك"],
  b2b_talent_marketplace: ["مطلوب", "مستقل", "مستقلين", "فري لانسر", "freelance", "freelancing", "وظائف", "وظيفة", "توظيف", "تسجيل على الموقع", "منصة", "مشاريع", "مشروع", "محترفين", "المواهب", "موظف", "talent", "marketplace", "hire", "hiring"],
  education: ["تعليم", "دورة", "دورات", "كورس", "كورسات", "مدرسة", "جامعة", "تدريب", "education", "course", "courses", "training", "academy", "school", "university", "math", "maths", "algebra", "geometry", "رياضيات", "ماث", "جبر", "هندسة", "middle school", "high school", "elementary", "gcse", "revision", "learning"],
  local_service: ["عيادة", "دكتور", "مطعم", "صالون", "صيانة", "تنظيف", "خدمات منزلية", "clinic", "doctor", "restaurant", "salon", "maintenance", "cleaning", "service"],
  immigration_consular_services: ["إقامة مستثمر", "الخدمات القنصلية", "التأشيرة", "تدخل مصر", "تأسيس", "المقر الرسمي", "سوريين في مصر", "visa", "residency", "consular", "immigration"],
};

const MARKET_RULES: Readonly<Record<KnowledgeMarket, readonly string[]>> = {
  EG: ["مصر", "مصري", "القاهرة", "اسكندرية", "الإسكندرية", "egypt", "cairo", "egp"],
  SA: ["السعودية", "سعودية", "الرياض", "جدة", "الدمام", "saudi", "riyadh", "jeddah"],
  AE: ["الإمارات", "امارات", "دبي", "أبوظبي", "الامارات", "uae", "dubai", "abu dhabi"],
  GCC: ["الخليج", "خليجي", "gcc"],
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .trim();
}

function safeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

type RuleMatch = {
  label: string;
  score: number;
  terms: string[];
  signalIds: string[];
};

function matchesForSignals(
  signals: ProviderContentSignal[],
  rules: Readonly<Record<string, readonly string[]>>,
): RuleMatch[] {
  const normalizedSignals = signals.map((signal) => ({
    signal,
    text: normalizeText(signal.text),
  }));
  return Object.entries(rules)
    .map(([label, terms]) => {
      const termsMatched: string[] = [];
      const signalIds: string[] = [];
      let score = 0;
      for (const term of terms) {
        const normalizedTerm = normalizeText(term);
        const matchedSignalIds = normalizedSignals
          .filter(({ text }) => text.includes(normalizedTerm))
          .map(({ signal }) => signal.signalId);
        if (matchedSignalIds.length > 0) {
          termsMatched.push(term);
          signalIds.push(...matchedSignalIds);
          score += Math.min(matchedSignalIds.length, 3);
        }
      }
      return { label, score, terms: unique(termsMatched), signalIds: unique(signalIds) };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}

function confidenceFor(score: number): number {
  return Number(Math.min(0.95, 0.45 + Math.min(score, 6) * 0.08).toFixed(2));
}

export type ClassifyProviderContentInput = {
  classificationId: string;
  provider: KnowledgeProvider;
  accountId: string;
  entityLevel: PlatformEntityLevel;
  entityId?: string;
  entityName?: string;
  generatedAt: string;
  signals: ProviderContentSignal[];
};

export function classifyProviderContent(input: ClassifyProviderContentInput): ProviderContentClassification {
  const industryMatches = matchesForSignals(input.signals, INDUSTRY_RULES);
  const marketMatches = matchesForSignals(input.signals, MARKET_RULES);
  const significantIndustryMatches = industryMatches.filter((match) => match.score >= 2);
  const primaryIndustryKey: InferredIndustryKey = significantIndustryMatches.length > 1
    ? "mixed_or_multi_industry"
    : (industryMatches[0]?.label as InferredIndustryKey | undefined) ?? "unclassified";

  return ProviderContentClassificationSchema.parse({
    contractVersion: PLATFORM_CONTRACT_VERSION,
    classificationId: input.classificationId,
    provider: input.provider,
    accountId: input.accountId,
    entityLevel: input.entityLevel,
    ...(input.entityId ? { entityId: input.entityId } : {}),
    ...(input.entityName ? { entityName: input.entityName } : {}),
    generatedAt: input.generatedAt,
    method: "deterministic_content_signal_rules",
    industryCandidates: industryMatches.map((match) => ({
      candidateKey: match.label,
      confidence: confidenceFor(match.score),
      matchedTerms: match.terms,
      evidenceSignalIds: match.signalIds,
      reviewStatus: "unreviewed",
    })),
    marketCandidates: marketMatches.map((match) => ({
      market: match.label as KnowledgeMarket,
      confidence: confidenceFor(match.score),
      matchedTerms: match.terms,
      evidenceSignalIds: match.signalIds,
      reviewStatus: "unreviewed",
    })),
    primaryIndustryKey,
    reviewStatus: "unreviewed",
    limitations: [
      "Content signals are classification hints, not proof of account ownership, project scope, or legal business registration.",
      "Market candidates are not scope verification and cannot establish a market benchmark or Market-Validated status.",
      "A human review is required before an inferred industry is attached to an industry profile or Evidence Package scope.",
    ],
  });
}

export function contentClassificationId(provider: KnowledgeProvider, accountId: string, entityId?: string): string {
  return `${provider}-content-classification-${safeToken(accountId)}-${safeToken(entityId ?? "account")}`;
}
