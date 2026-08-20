/**
 * Campaign Engine Builder — Blueprint Display Page
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReasoningDashboard from "../../components/ReasoningDashboard";

type SectionKey =
  | "executive_summary"
  | "strategy_summary"
  | "recommended_funnel"
  | "campaign_structure"
  | "audience_structure"
  | "budget_split"
  | "creative_angles"
  | "tracking_checklist"
  | "risk_flags"
  | "first_14_days_plan"
  | "pre_launch_fixes";

const sections: { key: SectionKey; title: string; icon: string }[] = [
  { key: "executive_summary", title: "الملخص التنفيذي", icon: "📊" },
  { key: "strategy_summary", title: "ملخص الاستراتيجية", icon: "🎯" },
  { key: "recommended_funnel", title: "الـ Funnel المقترح", icon: "🔄" },
  { key: "campaign_structure", title: "هيكل الحملات", icon: "📢" },
  { key: "audience_structure", title: "هيكل الجمهور", icon: "👥" },
  { key: "budget_split", title: "توزيع الميزانية", icon: "💰" },
  { key: "creative_angles", title: "الزوايا الإبداعية", icon: "🎨" },
  { key: "tracking_checklist", title: "قائمة التتبع", icon: "📡" },
  { key: "risk_flags", title: "تحذيرات المخاطر", icon: "⚠️" },
  { key: "first_14_days_plan", title: "خطة أول 14 يوم", icon: "📅" },
  { key: "pre_launch_fixes", title: "إصلاحات ما قبل الإطلاق", icon: "🔧" },
];

/* -------------------------------------------------------------------------- */
/* Safe rendering helpers                                                     */
/* -------------------------------------------------------------------------- */

function unwrap(value: any): any {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, "value")
  ) {
    return value.value;
  }

  return value;
}

function displayValue(value: any, fallback = "غير محدد"): string {
  const unwrapped = unwrap(value);

  if (
    unwrapped === null ||
    unwrapped === undefined ||
    unwrapped === ""
  ) {
    return fallback;
  }

  if (typeof unwrapped === "string" || typeof unwrapped === "number") {
    return String(unwrapped);
  }

  if (typeof unwrapped === "boolean") {
    return unwrapped ? "نعم" : "لا";
  }

  if (Array.isArray(unwrapped)) {
    return unwrapped
      .map((item) => displayValue(item, ""))
      .filter(Boolean)
      .join("، ");
  }

  if (typeof unwrapped === "object") {
    if (unwrapped.name) return String(unwrapped.name);
    if (unwrapped.label) return String(unwrapped.label);
    if (unwrapped.description) return String(unwrapped.description);
    if (unwrapped.type) return String(unwrapped.type);
    return fallback;
  }

  return fallback;
}

function asArray(value: any): any[] {
  const unwrapped = unwrap(value);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

function numberValue(value: any, fallback = 0): number {
  const unwrapped = unwrap(value);

  if (typeof unwrapped === "number") {
    return unwrapped;
  }

  const parsed = Number(unwrapped);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function reasoningFrom(...values: any[]): string {
  for (const value of values) {
    if (
      value &&
      typeof value === "object" &&
      typeof value.reasoning === "string" &&
      value.reasoning.trim()
    ) {
      return value.reasoning;
    }
  }

  return "";
}

function getObject(value: any): Record<string, any> {
  const unwrapped = unwrap(value);

  return unwrapped &&
    typeof unwrapped === "object" &&
    !Array.isArray(unwrapped)
    ? unwrapped
    : {};
}

/* -------------------------------------------------------------------------- */
/* Shared components                                                          */
/* -------------------------------------------------------------------------- */

function ReasoningBadge({ reasoning }: { reasoning?: any }) {
  const text = displayValue(reasoning, "");

  if (!text || text.length < 5) return null;

  return (
    <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
      <div className="flex gap-3 items-start">
        <span className="text-lg">💡</span>

        <div>
          <p className="text-xs font-bold text-indigo-700 mb-1">
            منطق القرار
          </p>

          <p className="text-sm text-indigo-800 leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function SourceBadge({
  aiGenerated,
  backfilled,
}: {
  aiGenerated?: boolean;
  backfilled?: boolean;
}) {
  if (aiGenerated) {
    return (
      <div className="flex items-center gap-2">
        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
          🤖 مُولد بالـ AI
        </span>

        {backfilled && (
          <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full text-xs">
            + Rules Backfill
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
      ⚙️ Rules Engine
    </span>
  );
}

function DataCard({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-gray-900 break-words">
        {displayValue(value)}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Executive Summary                                                          */
/* -------------------------------------------------------------------------- */

function ExecutiveSummarySection({ data }: { data: any }) {
  const readiness = numberValue(data?.readiness_score);
  const risk = numberValue(data?.risk_score);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
          <p className="text-3xl font-bold text-green-700">{readiness}%</p>
          <p className="text-sm text-green-600">درجة الجاهزية</p>
        </div>

        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
          <p className="text-3xl font-bold text-red-700">{risk}%</p>
          <p className="text-sm text-red-600">درجة المخاطرة</p>
        </div>
      </div>

      <DataCard label="التوصية" value={data?.launch_recommendation} />
      <DataCard label="مستوى الجاهزية" value={data?.readiness_level} />
      <DataCard
        label="تاريخ الإطلاق المتوقع"
        value={data?.estimated_launch_date}
      />
      <DataCard label="مستوى المخاطرة" value={data?.risk_level} />

      <ReasoningBadge reasoning={data?.reasoning} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Strategy Summary                                                           */
/* -------------------------------------------------------------------------- */

function StrategySummarySection({ data }: { data: any }) {
  const objective = unwrap(data?.recommended_objective);
  const channels = asArray(
    data?.recommended_channels?.value ??
      data?.recommended_channels
  );
  const funnel = unwrap(data?.funnel_type);
  const confidence = unwrap(data?.confidence_score);

  const confidenceValue =
    typeof confidence === "object" ? confidence?.value : confidence;

  const reasoning = reasoningFrom(
    data?.recommended_objective,
    data?.recommended_channels,
    data?.funnel_type,
    data?.confidence_score
  );

  return (
    <div className="space-y-4">
      <DataCard label="الهدف الموصى به" value={objective} />

      <div className="bg-white rounded-xl p-4 border">
        <p className="text-sm text-gray-500 mb-2">القنوات الموصى بها</p>

        <div className="flex flex-wrap gap-2">
          {channels.length > 0 ? (
            channels.map((channel, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {displayValue(channel)}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">
              لا توجد قنوات محددة
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DataCard label="نوع الـ Funnel" value={funnel} />
        <DataCard
          label="درجة الثقة"
          value={`${numberValue(confidenceValue)}%`}
        />
      </div>

      <ReasoningBadge reasoning={reasoning} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recommended Funnel                                                         */
/* -------------------------------------------------------------------------- */

function RecommendedFunnelSection({ data }: { data: any }) {
  const stages = asArray(data?.stages);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm text-blue-700">نوع الـ Funnel</p>

        <p className="font-bold text-blue-900 text-lg">
          {displayValue(data?.funnel_type)}
        </p>

        <p className="text-sm text-blue-700 mt-1">
          {numberValue(data?.total_stages)} مراحل
        </p>
      </div>

      <div className="space-y-3">
        {stages.map((stage: any, index: number) => {
          const budget =
            stage?.budget_percentage ?? stage?.budget_ratio;

          return (
            <div
              key={index}
              className="bg-white rounded-xl p-4 border space-y-3"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900">
                  {displayValue(stage?.name, `المرحلة ${index + 1}`)}
                </h4>

                {budget !== undefined && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {numberValue(budget) <= 1
                      ? Math.round(numberValue(budget) * 100)
                      : numberValue(budget)}
                    %
                  </span>
                )}
              </div>

              <DataCard
                label="الهدف"
                value={stage?.goal ?? stage?.objective}
              />

              <DataCard
                label="المحتوى"
                value={stage?.content ?? stage?.content_template}
              />

              <DataCard label="KPI" value={stage?.kpi} />
            </div>
          );
        })}
      </div>

      <ReasoningBadge reasoning={data?.reasoning} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Campaign Structure                                                         */
/* -------------------------------------------------------------------------- */

function CampaignStructureSection({ data }: { data: any }) {
  const campaigns = asArray(data?.campaigns);
  const structure = getObject(data?.ad_set_structure);

  const perCampaign =
    structure?.per_campaign ??
    structure?.perCampaign ??
    0;

  const totalAdSets =
    structure?.total ??
    structure?.total_ad_sets ??
    structure?.totalAdSets ??
    0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <DataCard
          label="عدد الحملات"
          value={data?.campaign_count ?? campaigns.length}
        />

        <DataCard label="Ad Sets لكل حملة" value={perCampaign} />

        <DataCard label="إجمالي Ad Sets" value={totalAdSets} />
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-4 border text-sm text-gray-500">
            لا توجد حملات متاحة.
          </div>
        ) : (
          campaigns.map((camp: any, index: number) => {
            const adSets =
              typeof camp?.ad_sets === "number"
                ? camp.ad_sets
                : asArray(camp?.ad_sets).length;

            const creatives =
              camp?.creatives_per_ad_set ??
              camp?.creativesPerAdSet ??
              0;

            const budgetShare =
              typeof camp?.budget_share === "number"
                ? `${Math.round(camp.budget_share * 100)}%`
                : displayValue(camp?.budget_share, "غير محدد");

            return (
              <div
                key={camp?.id || index}
                className="bg-white rounded-xl p-4 border"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-gray-900">
                    {displayValue(camp?.name, `Campaign ${index + 1}`)}
                  </h4>

                  <span className="text-sm font-medium text-green-700">
                    {budgetShare}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  {displayValue(camp?.platform)} —{" "}
                  {displayValue(camp?.objective)}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <DataCard label="عدد Ad Sets" value={adSets} />
                  <DataCard
                    label="Creatives لكل Ad Set"
                    value={creatives}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <ReasoningBadge reasoning={data?.reasoning} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Audience Structure                                                         */
/* -------------------------------------------------------------------------- */

function AudienceStructureSection({ data }: { data: any }) {
  const primary = getObject(data?.primary_audience);
  const segments = asArray(data?.segments);
  const exclusions = asArray(data?.exclusions);
  const lookalike = getObject(data?.lookalike);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm text-blue-700 mb-1">الجمهور الأساسي</p>

        <h3 className="font-bold text-blue-900">
          {displayValue(primary?.name, "Primary Audience")}
        </h3>

        <p className="text-sm text-blue-800 mt-1">
          {displayValue(primary?.description)}
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          {primary?.targeting_type && (
            <span className="bg-white px-2 py-1 rounded text-xs border">
              {displayValue(primary.targeting_type)}
            </span>
          )}

          {primary?.size_estimate && (
            <span className="bg-white px-2 py-1 rounded text-xs border">
              {displayValue(primary.size_estimate)}
            </span>
          )}
        </div>

        {asArray(primary?.interests).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {asArray(primary.interests).map((interest, index) => (
              <span
                key={index}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                {displayValue(interest)}
              </span>
            ))}
          </div>
        )}
      </div>

      {segments.length > 0 && (
        <div className="space-y-3">
          <p className="font-bold text-gray-800">الشرائح</p>

          {segments.map((segment: any, index: number) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 border"
            >
              <h4 className="font-bold text-gray-900">
                {displayValue(
                  segment?.name,
                  `Segment ${index + 1}`
                )}
              </h4>

              <p className="text-sm text-gray-600 mt-1">
                {displayValue(segment?.description)}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {segment?.targeting_type && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {displayValue(segment.targeting_type)}
                  </span>
                )}

                {segment?.size_estimate && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {displayValue(segment.size_estimate)}
                  </span>
                )}
              </div>

              {asArray(segment?.interests).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {asArray(segment.interests).map((interest, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {displayValue(interest)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {Object.keys(lookalike).length > 0 && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-xs text-purple-600 mb-1">Lookalike</p>

          <p className="font-medium text-purple-900">
            {lookalike.recommended ? "موصى به" : "غير موصى به"}
          </p>

          {lookalike.source && (
            <p className="text-sm text-purple-700 mt-1">
              المصدر: {displayValue(lookalike.source)}
            </p>
          )}

          {lookalike.priority && (
            <p className="text-sm text-purple-700">
              الأولوية: {displayValue(lookalike.priority)}
            </p>
          )}
        </div>
      )}

      {exclusions.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <p className="text-xs text-yellow-800 font-medium mb-1">
            الاستبعادات
          </p>

          <div className="flex flex-wrap gap-2">
            {exclusions.map((item, index) => (
              <span
                key={index}
                className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
              >
                {displayValue(item)}
              </span>
            ))}
          </div>
        </div>
      )}

      <ReasoningBadge reasoning={data?.reasoning} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Budget Split                                                               */
/* -------------------------------------------------------------------------- */

function BudgetSplitSection({ data }: { data: any }) {
  const daily = getObject(data?.daily_budget);
  const monthly = unwrap(data?.monthly_budget);
  const cacValue =
    data?.cac_target?.value ??
    unwrap(data?.cac_target);
  const channelAllocation = getObject(
    data?.channel_allocation?.value ??
      data?.channel_allocation
  );
  const testBudget = getObject(data?.test_budget);
  const scaleBudget = getObject(data?.scale_budget);

  const allocationEntries = Object.entries(channelAllocation);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <DataCard
          label="الميزانية اليومية"
          value={
            daily.recommended !== undefined
              ? `${daily.recommended} EGP / يوم`
              : daily
          }
        />

        <DataCard
          label="نطاق الميزانية اليومية"
          value={
            daily.min !== undefined || daily.max !== undefined
              ? `${daily.min ?? "—"} – ${daily.max ?? "—"} EGP`
              : monthly
          }
        />

        <DataCard
          label="هدف CAC"
          value={
            cacValue !== undefined &&
            cacValue !== null
              ? `${cacValue} EGP`
              : cacValue
          }
        />
      </div>

      {allocationEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-800">
            توزيع الميزانية حسب القناة
          </p>

          {allocationEntries.map(([channel, percentage]) => (
            <div
              key={channel}
              className="flex items-center gap-3 bg-white rounded-lg p-3 border"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                {numberValue(percentage)}%
              </div>

              <div className="flex-1">
                <p className="font-medium">
                  {displayValue(channel)}
                </p>

                <p className="text-sm text-gray-500">
                  {numberValue(percentage)}% من الميزانية
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <DataCard
          label="ميزانية الاختبار"
          value={
            testBudget.amount !== undefined
              ? `${testBudget.amount} EGP (${numberValue(
                  testBudget.percentage
                )}%)`
              : data?.test_budget
          }
        />

        <DataCard
          label="ميزانية التوسع"
          value={
            scaleBudget.max !== undefined
              ? `حتى ${scaleBudget.max} EGP — ${displayValue(
                  scaleBudget.increment
                )}`
              : data?.scale_budget
          }
        />
      </div>

      <ReasoningBadge
        reasoning={reasoningFrom(
          data?.daily_budget,
          data?.channel_allocation,
          data?.test_budget,
          data?.scale_budget,
          data?.cac_target
        )}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Creative Angles                                                            */
/* -------------------------------------------------------------------------- */

function CreativeAnglesSection({ data }: { data: any }) {
  const primary = getObject(data?.primary_angle);

  /*
   * Normalize alternative angles.
   *
   * Supported:
   * Array:
   * [
   *   {
   *     name: "trust",
   *     ...
   *   }
   * ]
   *
   * Object:
   * {
   *   trust: {...},
   *   social_proof: {...}
   * }
   */
  const rawAlternatives = unwrap(
    data?.alternative_angles
  );

  const alternatives: any[] = Array.isArray(
    rawAlternatives
  )
    ? rawAlternatives
    : rawAlternatives &&
      typeof rawAlternatives === "object"
    ? Object.entries(rawAlternatives).map(
        ([key, value]) => {
          if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
          ) {
            return {
              ...value,
              name:
                (value as Record<string, any>).name ??
                (value as Record<string, any>).type ??
                key,
            };
          }

          return {
            name: key,
            value,
          };
        }
      )
    : [];

  /*
   * Normalize creative formats.
   *
   * Supported:
   *
   * Array:
   * [
   *   {
   *     type: "image",
   *     platforms: [
   *       "meta",
   *       "google_ads",
   *       "tiktok_ads"
   *     ]
   *   }
   * ]
   *
   * Object:
   * {
   *   image: [
   *     "meta",
   *     "google_ads",
   *     "tiktok_ads"
   *   ],
   *   carousel: ["meta"],
   *   video: ["meta", "tiktok_ads"]
   * }
   */
  const rawFormats = unwrap(data?.formats);

  const formats: any[] = Array.isArray(
    rawFormats
  )
    ? rawFormats
    : rawFormats &&
      typeof rawFormats === "object"
    ? Object.entries(rawFormats).map(
        ([key, value]) => {
          if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
          ) {
            return {
              ...value,
              type:
                (value as Record<string, any>).type ??
                (value as Record<string, any>).name ??
                key,
            };
          }

          return {
            type: key,
            platforms: value,
          };
        }
      )
    : [];

  function normalizeList(value: any): any[] {
    const unwrapped = unwrap(value);

    if (Array.isArray(unwrapped)) {
      return unwrapped;
    }

    if (
      unwrapped &&
      typeof unwrapped === "object"
    ) {
      return Object.entries(unwrapped).map(
        ([key, value]) => ({
          name: key,
          value,
        })
      );
    }

    if (
      unwrapped !== null &&
      unwrapped !== undefined &&
      unwrapped !== ""
    ) {
      return [unwrapped];
    }

    return [];
  }

  function renderFlexibleValue(
    value: any
  ): React.ReactNode {
    const unwrapped = unwrap(value);

    if (
      unwrapped === null ||
      unwrapped === undefined ||
      unwrapped === ""
    ) {
      return null;
    }

    if (
      typeof unwrapped === "string" ||
      typeof unwrapped === "number" ||
      typeof unwrapped === "boolean"
    ) {
      return displayValue(unwrapped);
    }

    if (Array.isArray(unwrapped)) {
      return (
        <div className="flex flex-wrap gap-1">
          {unwrapped.map(
            (item, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 px-2 py-1 rounded text-sm border"
              >
                {displayValue(item)}
              </span>
            )
          )}
        </div>
      );
    }

    if (
      typeof unwrapped === "object"
    ) {
      return (
        <div className="space-y-1">
          {Object.entries(unwrapped).map(
            ([key, value]) => (
              <div
                key={key}
                className="flex items-start gap-2 text-sm"
              >
                <span className="font-medium text-gray-700">
                  {key}:
                </span>

                <span className="text-gray-800">
                  {renderFlexibleValue(value)}
                </span>
              </div>
            )
          )}
        </div>
      );
    }

    return displayValue(unwrapped);
  }

  function renderPlatforms(
    format: any
  ): React.ReactNode {
    const rawPlatforms =
      format?.platforms ??
      format?.recommended_platforms ??
      format?.recommendedPlatforms ??
      format?.channels ??
      format?.channel;

    if (
      rawPlatforms === null ||
      rawPlatforms === undefined ||
      rawPlatforms === ""
    ) {
      return null;
    }

    /*
     * Normalize platforms into a clean string[].
     *
     * Supported formats:
     *
     * ["meta", "google_ads", "tiktok_ads"]
     *
     * {
     *   meta: true,
     *   google_ads: true,
     *   tiktok_ads: true
     * }
     *
     * {
     *   meta: "recommended",
     *   google_ads: "recommended"
     * }
     *
     * "meta"
     *
     * "meta,google_ads,tiktok_ads"
     *
     * "metagoogle_adstiktok_ads"
     */
    const platformLabels: string[] = [];

    const addPlatform = (value: any) => {
      const unwrapped = unwrap(value);

      if (
        unwrapped === null ||
        unwrapped === undefined ||
        unwrapped === ""
      ) {
        return;
      }

      /* Object platform */
      if (
        typeof unwrapped === "object" &&
        !Array.isArray(unwrapped)
      ) {
        const obj =
          unwrapped as Record<string, any>;

        const label =
          obj.name ??
          obj.label ??
          obj.platform ??
          obj.channel ??
          obj.type ??
          obj.value;

        if (
          label !== null &&
          label !== undefined &&
          label !== ""
        ) {
          addPlatform(label);
        }

        return;
      }

      /* Array platform */
      if (Array.isArray(unwrapped)) {
        unwrapped.forEach(addPlatform);
        return;
      }

      const text = String(unwrapped).trim();

      if (!text) return;

      /*
       * Handle normal separated strings.
       */
      if (
        text.includes(",") ||
        text.includes("|") ||
        text.includes("/") ||
        text.includes("،")
      ) {
        text
          .split(/[,|/،]+/)
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach(addPlatform);

        return;
      }

      /*
       * Handle concatenated platform names such as:
       *
       * metagoogle_adstiktok_ads
       */
      const knownPlatforms = [
        "meta",
        "google_ads",
        "tiktok_ads",
        "facebook",
        "instagram",
        "google",
        "tiktok",
      ];

      let remaining = text;

      const detected: string[] = [];

      let found = true;

      while (remaining && found) {
        found = false;

        for (const platform of knownPlatforms) {
          if (
            remaining.startsWith(platform)
          ) {
            detected.push(platform);

            remaining = remaining.slice(
              platform.length
            );

            found = true;

            break;
          }
        }
      }

      if (
        detected.length > 0 &&
        remaining === ""
      ) {
        detected.forEach((item) => {
          if (
            !platformLabels.includes(item)
          ) {
            platformLabels.push(item);
          }
        });

        return;
      }

      /*
       * Fallback:
       * keep the original value if it could not
       * be recognized.
       */
      if (
        !platformLabels.includes(text)
      ) {
        platformLabels.push(text);
      }
    };

    /*
     * Object form:
     *
     * {
     *   meta: true,
     *   google_ads: true,
     *   tiktok_ads: true
     * }
     */
    const unwrappedPlatforms =
      unwrap(rawPlatforms);

    if (
      unwrappedPlatforms &&
      typeof unwrappedPlatforms === "object" &&
      !Array.isArray(unwrappedPlatforms)
    ) {
      const objectValue =
        unwrappedPlatforms as Record<
          string,
          any
        >;

      Object.entries(objectValue).forEach(
        ([key, value]) => {
          /*
           * If the value is explicitly false/null,
           * do not display the platform.
           */
          if (
            value === false ||
            value === null ||
            value === undefined
          ) {
            return;
          }

          addPlatform(key);
        }
      );
    } else {
      addPlatform(unwrappedPlatforms);
    }

    if (platformLabels.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        <p className="text-sm font-bold text-gray-800">
          المنصات
        </p>

        <div className="flex flex-wrap gap-2">
          {platformLabels.map(
            (platform, index) => (
              <span
                key={`${platform}-${index}`}
                className="inline-flex items-center bg-white text-gray-700 px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium"
              >
                {displayValue(platform)}
              </span>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-xs font-bold text-blue-700 mb-2">
          الزاوية الإبداعية الأساسية
        </p>

        <h3 className="text-lg font-bold text-blue-900">
          {displayValue(
            primary?.name ??
              primary?.type ??
              primary?.angle,
            "الزاوية الأساسية"
          )}
        </h3>

        {primary?.description && (
          <p className="text-sm text-blue-800 mt-2 leading-relaxed">
            {displayValue(
              primary.description
            )}
          </p>
        )}

        {primary?.message && (
          <div className="mt-3 bg-white/70 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-700 mb-1">
              الرسالة الأساسية
            </p>

            <p className="text-sm text-gray-800">
              {displayValue(
                primary.message
              )}
            </p>
          </div>
        )}

        {primary?.hook && (
          <div className="mt-3 bg-white/70 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-700 mb-1">
              Hook
            </p>

            <p className="text-sm text-gray-800">
              {displayValue(
                primary.hook
              )}
            </p>
          </div>
        )}

        {primary?.reasoning && (
          <div className="mt-3">
            <ReasoningBadge
              reasoning={
                primary.reasoning
              }
            />
          </div>
        )}
      </div>

      {alternatives.length > 0 && (
        <div className="space-y-3">
          <p className="font-bold text-gray-800">
            الزوايا البديلة
          </p>

          {alternatives.map(
            (angle: any, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 border"
              >
                <h4 className="font-bold text-gray-900">
                  {displayValue(
                    angle?.name,
                    `زاوية بديلة ${index + 1}`
                  )}
                </h4>

                {angle?.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {displayValue(
                      angle.description
                    )}
                  </p>
                )}

                {angle?.message && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      الرسالة
                    </p>

                    <p className="text-sm text-gray-800">
                      {displayValue(
                        angle.message
                      )}
                    </p>
                  </div>
                )}

                {angle?.hook && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Hook
                    </p>

                    <p className="text-sm text-gray-800">
                      {displayValue(
                        angle.hook
                      )}
                    </p>
                  </div>
                )}

                {!angle?.description &&
                  !angle?.message &&
                  !angle?.hook &&
                  angle?.value !== undefined && (
                    <div className="mt-2">
                      {renderFlexibleValue(
                        angle.value
                      )}
                    </div>
                  )}

                {angle?.reasoning && (
                  <div className="mt-3">
                    <ReasoningBadge
                      reasoning={
                        angle.reasoning
                      }
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {formats.length > 0 && (
        <div className="space-y-3">
          <p className="font-bold text-gray-800">
            صيغ المحتوى الإبداعي
          </p>

          {formats.map(
            (format: any, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 border"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-gray-900">
                    {displayValue(
                      format?.type ??
                        format?.name,
                      `Format ${index + 1}`
                    )}
                  </h4>
                </div>

                {format?.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {displayValue(
                      format.description
                    )}
                  </p>
                )}

                {format?.examples && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      أمثلة
                    </p>

                    {renderFlexibleValue(
                      format.examples
                    )}
                  </div>
                )}

                {format?.recommended_platforms ||
                format?.recommendedPlatforms ||
                format?.platforms ||
                format?.channels ||
                format?.channel
                  ? (
                      <div className="mt-3">
                        {renderPlatforms(
                          format
                        )}
                      </div>
                    )
                  : null}
              </div>
            )
          )}
        </div>
      )}

      {data?.content_pillars && (
        <div className="bg-gray-50 rounded-xl p-4 border">
          <p className="font-bold text-gray-800 mb-3">
            محاور المحتوى
          </p>

          {normalizeList(
            data.content_pillars
          ).map(
            (pillar: any, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 border mb-2 last:mb-0"
              >
                <p className="font-medium text-gray-900">
                  {displayValue(
                    pillar?.name ??
                      pillar?.title ??
                      pillar
                  )}
                </p>

                {pillar?.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {displayValue(
                      pillar.description
                    )}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}

      {data?.cta && (
        <DataCard
          label="Call To Action"
          value={data.cta}
        />
      )}

      {data?.reasoning && (
        <ReasoningBadge
          reasoning={data.reasoning}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tracking Checklist                                                         */
/* -------------------------------------------------------------------------- */

function TrackingChecklistSection({ data }: { data: any }) {
  const setup = getObject(data?.setup_status);
  const requiredEvents = asArray(data?.required_events);
  const missingItems = asArray(data?.missing_items);
  const guide = getObject(data?.implementation_guide);
  const guideSteps = asArray(guide?.steps);

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <p className="text-sm text-yellow-700">حالة التتبع</p>

        <p className="font-bold text-yellow-900 text-lg">
          {displayValue(setup?.overall)}
        </p>

        {setup?.score !== undefined && (
          <p className="text-sm text-yellow-700">
            النتيجة: {numberValue(setup.score)}%
          </p>
        )}
      </div>

      {asArray(setup?.items).length > 0 && (
        <div className="space-y-2">
          <p className="font-bold text-gray-800">حالة الأحداث</p>

          {asArray(setup.items).map((item: any, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-3 border flex items-center justify-between"
            >
              <span className="font-medium text-sm">
                {displayValue(item?.event)}
              </span>

              <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                {displayValue(item?.status)}
              </span>
            </div>
          ))}
        </div>
      )}

      {requiredEvents.length > 0 && (
        <div className="space-y-2">
          <p className="font-bold text-gray-800">الأحداث المطلوبة</p>

          <div className="flex flex-wrap gap-2">
            {requiredEvents.map((event: any, index) => (
              <span
                key={index}
                className="text-sm bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-full"
              >
                {displayValue(
                  event?.event_name ??
                    event?.name ??
                    event
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingItems.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-xs font-bold text-red-700 mb-2">
            عناصر مفقودة
          </p>

          <div className="space-y-2">
            {missingItems.map((item: any, index) => (
              <div
                key={index}
                className="bg-white/60 rounded p-2"
              >
                <p className="text-sm font-medium text-red-800">
                  {displayValue(item?.item ?? item)}
                </p>

                {item?.reason && (
                  <p className="text-xs text-red-700 mt-1">
                    {displayValue(item.reason)}
                  </p>
                )}

                {item?.priority && (
                  <span className="text-xs text-red-600">
                    الأولوية: {displayValue(item.priority)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {guideSteps.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border">
          <p className="text-xs font-bold text-gray-700 mb-2">
            دليل التنفيذ
          </p>

          <ul className="text-sm text-gray-600 list-decimal list-inside space-y-1">
            {guideSteps.map((step, index) => (
              <li key={index}>{displayValue(step)}</li>
            ))}
          </ul>

          {(guide.estimated_time || guide.complexity) && (
            <p className="text-xs text-gray-500 mt-2">
              {guide.estimated_time &&
                `الوقت: ${displayValue(
                  guide.estimated_time
                )}`}
              {guide.estimated_time &&
                guide.complexity &&
                " — "}
              {guide.complexity &&
                `التعقيد: ${displayValue(
                  guide.complexity
                )}`}
            </p>
          )}
        </div>
      )}

      <ReasoningBadge reasoning={data?.reasoning} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Risk Flags                                                                 */
/* -------------------------------------------------------------------------- */

function RiskFlagsSection({ data }: { data: any }) {
  const riskScore = unwrap(data?.risk_score);

  const critical = asArray(data?.critical);
  const warnings = asArray(data?.warnings);
  const recommendations = asArray(data?.recommendations);

  const renderItems = (
    items: any[],
    bg: string,
    border: string,
    text: string
  ) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className={`${bg} rounded-lg p-3 border ${border} text-sm ${text}`}
        >
          {displayValue(
            item?.description ??
              item?.message ??
              item?.item ??
              item
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
        <p className="text-3xl font-bold text-red-700">
          {numberValue(
            typeof riskScore === "object"
              ? riskScore?.value
              : riskScore
          )}
          %
        </p>

        <p className="text-sm text-red-600">
          درجة المخاطرة الإجمالية
        </p>
      </div>

      {critical.length > 0 && (
        <>
          <p className="text-sm font-bold text-red-700">
            ⚠️ تحذيرات حرجة
          </p>

          {renderItems(
            critical,
            "bg-red-50",
            "border-red-200",
            "text-red-800"
          )}
        </>
      )}

      {warnings.length > 0 && (
        <>
          <p className="text-sm font-bold text-yellow-700">
            ⚡ تحذيرات
          </p>

          {renderItems(
            warnings,
            "bg-yellow-50",
            "border-yellow-200",
            "text-yellow-800"
          )}
        </>
      )}

      {recommendations.length > 0 && (
        <>
          <p className="text-sm font-bold text-blue-700">
            💡 توصيات
          </p>

          {renderItems(
            recommendations,
            "bg-blue-50",
            "border-blue-200",
            "text-blue-800"
          )}
        </>
      )}

      <ReasoningBadge reasoning={data?.reasoning} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* First 14 Days                                                              */
/* -------------------------------------------------------------------------- */

function First14DaysPlanSection({ data }: { data: any }) {
  const milestones = asArray(
    data?.milestones ??
      data?.detailed_timeline?.milestones
  );
  const week1 = asArray(data?.week_1);
  const week2 = asArray(data?.week_2);
  const schedule = asArray(data?.daily_budget_schedule);
  const launch = asArray(data?.launch_sequence);
  const detailedTimeline = getObject(data?.detailed_timeline);

  const renderDay = (item: any, index: number) => (
    <div
      key={index}
      className="bg-white rounded-lg p-3 border"
    >
      <p className="font-bold text-gray-900">
        {displayValue(item?.day, String(index + 1))}
      </p>

      <p className="text-sm text-gray-700 mt-1">
        {displayValue(
          item?.task ??
            item?.action ??
            item
        )}
      </p>

      {(item?.priority ||
        item?.owner ||
        item?.blocker !== undefined) && (
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
          {item?.priority && (
            <span>
              الأولوية: {displayValue(item.priority)}
            </span>
          )}

          {item?.owner && (
            <span>
              المسؤول: {displayValue(item.owner)}
            </span>
          )}

          {item?.blocker !== undefined && (
            <span>
              {item.blocker
                ? "مُعطِّل"
                : "غير مُعطِّل"}
            </span>
          )}
        </div>
      )}
    </div>
  );

  const renderMilestone = (milestone: any, index: number) => {
    const tasks = asArray(milestone?.tasks);

    return (
      <div
        key={index}
        className="rounded-xl border bg-white p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">
              {displayValue(
                milestone?.phase,
                `المرحلة ${index + 1}`
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              الأيام: {displayValue(milestone?.days)}
            </p>
          </div>
          {milestone?.critical !== undefined && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                milestone.critical
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {milestone.critical
                ? "مسار حرج"
                : "غير حرج"}
            </span>
          )}
        </div>

        {tasks.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-gray-700 list-disc list-inside">
            {tasks.map((task: any, taskIndex: number) => (
              <li key={taskIndex}>{displayValue(task)}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {milestones.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DataCard
              label="إجمالي الأيام"
              value={data?.total_days ?? data?.detailed_timeline?.total_days}
            />
            <DataCard
              label="تاريخ الجاهزية"
              value={data?.launch_ready_date ?? data?.detailed_timeline?.launch_ready_date}
            />
            <DataCard
              label="مستوى الثقة"
              value={data?.detailed_timeline?.confidence}
            />
            <DataCard
              label="عدد المراحل"
              value={milestones.length}
            />
          </div>
          <div className="space-y-2">
            {milestones.map(renderMilestone)}
          </div>
        </div>
      )}

      {(week1.length > 0 || week2.length > 0) && (
        <>
          {week1.length > 0 && (
            <div className="space-y-2">
              <p className="font-bold text-gray-800">
                الأسبوع الأول
              </p>

              {week1.map(renderDay)}
            </div>
          )}

          {week2.length > 0 && (
            <div className="space-y-2">
              <p className="font-bold text-gray-800">
                الأسبوع الثاني
              </p>

              {week2.map(renderDay)}
            </div>
          )}
        </>
      )}

      {schedule.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            جدول الميزانية
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {schedule.map((item: any, index) => (
              <div
                key={index}
                className="rounded-lg p-3 bg-blue-50 text-blue-800 border border-blue-100"
              >
                <p className="font-bold">
                  اليوم{" "}
                  {displayValue(
                    item?.day,
                    `${index + 1}`
                  )}
                </p>

                <p className="text-xs mt-1">
                  {displayValue(item?.budget)}
                </p>

                {item?.note && (
                  <p className="text-xs mt-1 text-blue-700">
                    {displayValue(item.note)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {launch.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            تسلسل الإطلاق
          </p>

          {launch.map((item: any, index) => (
            <div
              key={index}
              className="flex items-start gap-3 bg-white rounded-lg p-3 border"
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {displayValue(
                  item?.step,
                  String(index + 1)
                )}
              </div>

              <div className="min-w-0">
                <p className="font-medium text-sm">
                  {displayValue(
                    item?.action ??
                      item?.task ??
                      item
                  )}
                </p>

                {item?.duration && (
                  <p className="text-xs text-gray-500 mt-1">
                    المدة:{" "}
                    {displayValue(
                      item.duration
                    )}
                  </p>
                )}

                {Array.isArray(item?.depends_on) &&
                  item.depends_on.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      يعتمد على:{" "}
                      {item.depends_on.join("، ")}
                    </p>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {milestones.length === 0 &&
        week1.length === 0 &&
        week2.length === 0 &&
        schedule.length === 0 &&
        launch.length === 0 &&
        Object.keys(detailedTimeline).length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DataCard
                label="إجمالي الأيام"
                value={detailedTimeline.total_days}
              />
              <DataCard
                label="تاريخ الجاهزية"
                value={detailedTimeline.launch_ready_date}
              />
              <DataCard
                label="مستوى الثقة"
                value={detailedTimeline.confidence}
              />
              <DataCard
                label="معرف القاعدة"
                value={detailedTimeline.rule_id}
              />
            </div>

            {Object.entries(detailedTimeline)
              .filter(
                ([key]) =>
                  ![
                    "total_days",
                    "launch_ready_date",
                    "confidence",
                    "rule_id",
                  ].includes(key)
              )
              .map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border bg-gray-50 p-4"
                >
                  <p className="text-sm font-bold text-gray-800 mb-2">
                    {key}
                  </p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto" dir="ltr">
                    {typeof value === "string"
                      ? value
                      : JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              ))}
          </div>
        )}

      <ReasoningBadge reasoning={data?.reasoning} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pre Launch Fixes                                                           */
/* -------------------------------------------------------------------------- */

function PreLaunchFixesSection({ data }: { data: any }) {
  const statusStyles: Record<string, string> = {
    pass: "bg-green-50 border-green-200 text-green-800",
    fail: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    check_manually: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const statusLabels: Record<string, string> = {
    pass: "اجتاز الفحص",
    fail: "يحتاج إصلاحًا",
    warning: "تحذير",
    check_manually: "يتطلب مراجعة يدوية",
  };

  const items = asArray(
    data?.items ?? data?.checklist_items
  );
  const summary = getObject(
    data?.summary ?? data?.checklist_summary
  );

  const renderItem = (item: any, index: number) => {
    const status = String(item?.status ?? "check_manually");
    const style =
      statusStyles[status] ??
      statusStyles.check_manually;
    const label =
      statusLabels[status] ??
      statusLabels.check_manually;

    return (
      <div
        key={index}
        className={`rounded-lg p-3 border text-sm ${style}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium">
            {displayValue(
              item?.item ??
                item?.description ??
                item?.action ??
                item
            )}
          </p>
          <span className="shrink-0 text-xs font-bold">
            {label}
          </span>
        </div>

        {(item?.category ||
          item?.required !== undefined) && (
          <div className="flex gap-3 mt-1 text-xs opacity-80">
            {item?.category && (
              <span>{displayValue(item.category)}</span>
            )}
            {item?.required !== undefined && (
              <span>
                {item.required
                  ? "إلزامي"
                  : "غير إلزامي"}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const legacyGroups = [
    {
      key: "must_fix",
      title: "يجب إصلاحه",
      icon: "🔴",
      style: statusStyles.fail,
    },
    {
      key: "should_fix",
      title: "يفضل إصلاحه",
      icon: "🟡",
      style: statusStyles.warning,
    },
    {
      key: "nice_to_have",
      title: "للتحسين",
      icon: "🔵",
      style: statusStyles.check_manually,
    },
  ] as const;

  return (
    <div className="space-y-4">
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DataCard label="الإجمالي" value={summary.total} />
          <DataCard label="اجتاز" value={summary.passed} />
          <DataCard label="فشل" value={summary.failed} />
          <DataCard label="نسبة الاكتمال" value={summary.completion_percentage !== undefined ? `${summary.completion_percentage}%` : undefined} />
        </div>
      )}

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map(renderItem)}
        </div>
      ) : (
        legacyGroups.map((group) => {
          const legacyItems = asArray(data?.[group.key]);
          if (legacyItems.length === 0) return null;

          return (
            <div key={group.key} className="space-y-2">
              <p className="text-sm font-bold">
                {group.icon} {group.title}
              </p>
              {legacyItems.map((item: any, index: number) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 border text-sm ${group.style}`}
                >
                  <p className="font-medium">
                    {displayValue(
                      item?.item ??
                        item?.description ??
                        item?.action ??
                        item
                    )}
                  </p>
                </div>
              ))}
            </div>
          );
        })
      )}

      <ReasoningBadge reasoning={data?.reasoning} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Renderer Map                                                               */
/* -------------------------------------------------------------------------- */

function toBlueprintDisplayModel(raw: any): any {
  const strategy = raw?.strategy ?? {};
  const execution = raw?.execution ?? {};
  const governance = raw?.governance ?? {};
  const campaignStructure = execution?.campaign_structure ?? {};
  const launchPlan = execution?.launch_plan ?? {};
  const timeline = launchPlan?.detailed_timeline ?? {};
  const checklist = launchPlan?.pre_launch_checklist ?? {};
  const campaigns = asArray(campaignStructure?.campaigns);

  const funnelType = strategy?.funnel_type;
  const funnelStages = campaigns.map((campaign: any, index: number) => ({
    name: campaign?.name ?? campaign?.campaign_name ?? `حملة ${index + 1}`,
    goal: campaign?.objective ?? campaign?.goal ?? campaign?.purpose,
    content:
      campaign?.message ??
      campaign?.creative_direction ??
      campaign?.description,
    kpi: campaign?.primary_kpi ?? campaign?.kpi ?? campaign?.success_metric,
    budget_percentage:
      campaign?.budget_share ??
      campaign?.budget_percentage ??
      campaign?.budget_ratio,
  }));

  return {
    ...raw,
    strategy_summary: raw?.strategy_summary ?? strategy,
    recommended_funnel: raw?.recommended_funnel ?? {
      funnel_type: funnelType,
      total_stages: funnelStages.length,
      stages: funnelStages,
      reasoning: funnelType?.reasoning,
    },
    campaign_structure:
      raw?.campaign_structure ?? campaignStructure,
    audience_structure:
      raw?.audience_structure ?? execution?.audience_structure,
    budget_split: raw?.budget_split ?? execution?.budget_split,
    creative_angles: raw?.creative_angles ?? execution?.creative_angles,
    tracking_checklist:
      raw?.tracking_checklist ?? execution?.tracking_checklist,
    risk_flags: raw?.risk_flags ?? governance?.risk_flags,
    first_14_days_plan: raw?.first_14_days_plan ?? {
      ...launchPlan,
      detailed_timeline: timeline,
      total_days: timeline?.total_days,
      launch_ready_date: timeline?.launch_ready_date,
      milestones: asArray(timeline?.milestones),
      critical_path: asArray(timeline?.critical_path),
    },
    pre_launch_fixes: raw?.pre_launch_fixes ?? {
      items: asArray(checklist?.items),
      summary: checklist?.summary,
    },
  };
}

const sectionRenderers: Record<
  SectionKey,
  React.FC<{ data: any }>
> = {
  executive_summary: ExecutiveSummarySection,
  strategy_summary: StrategySummarySection,
  recommended_funnel: RecommendedFunnelSection,
  campaign_structure: CampaignStructureSection,
  audience_structure: AudienceStructureSection,
  budget_split: BudgetSplitSection,
  creative_angles: CreativeAnglesSection,
  tracking_checklist: TrackingChecklistSection,
  risk_flags: RiskFlagsSection,
  first_14_days_plan: First14DaysPlanSection,
  pre_launch_fixes: PreLaunchFixesSection,
};

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function BlueprintPage() {
  const router = useRouter();

  const [blueprint, setBlueprint] =
    useState<any>(null);

  const [generationEnvelope, setGenerationEnvelope] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [activeSection, setActiveSection] =
    useState<SectionKey>(
      "executive_summary"
    );

  useEffect(() => {
    const stored = sessionStorage.getItem("blueprint_data");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const isV5Envelope =
          parsed &&
          typeof parsed === "object" &&
          parsed.status === "success" &&
          parsed.version === "v5" &&
          parsed.data &&
          typeof parsed.data === "object";

        if (isV5Envelope) {
          setGenerationEnvelope(parsed);
          // v5 stores the rich 11-section CanonicalBlueprint under
          // data.blueprint; the surrounding data object is BlueprintContractV3.
          setBlueprint(
            toBlueprintDisplayModel(
              parsed.data?.blueprint ?? parsed.data
            )
          );
        } else {
          // Backward compatibility for older locally generated records.
          setGenerationEnvelope({
            status: "legacy",
            version: "legacy",
            data: parsed?.data ?? parsed,
          });
          setBlueprint(
            toBlueprintDisplayModel(
              parsed?.data ?? parsed
            )
          );
        }
      } catch (error) {
        console.error("[Blueprint] Failed to parse blueprint_data", error);
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border p-8">
          <p className="text-gray-600">
            جاري التحميل...
          </p>
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border p-8 text-center max-w-md">
          <div className="text-4xl mb-4">📭</div>

          <h2 className="text-xl font-bold text-gray-900">
            لا يوجد Blueprint
          </h2>

          <p className="text-gray-600 mt-2">
            لم يتم العثور على بيانات Blueprint.
            يرجى إكمال الـ Wizard أولاً.
          </p>

          <button
            onClick={() =>
              router.push("/wizard")
            }
            className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            بدء الـ Wizard
          </button>
        </div>
      </div>
    );
  }

  const SectionRenderer =
    sectionRenderers[activeSection];

  const wizardInput = getObject(
    generationEnvelope?.data?.wizard_input ??
      generationEnvelope?.wizard_input ??
      blueprint?.raw_input_summary
  );

  return (
    <div
      className="min-h-screen bg-gray-50"
      dir="rtl"
    >
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Campaign Blueprint
            </h1>

            <p className="text-sm text-gray-500">
              {displayValue(
                wizardInput?.business_type,
                "Campaign Blueprint"
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {generationEnvelope?.version === "v5"
                ? `مصدر البيانات: دورة Wizard كاملة عبر /api/generate/v5${
                    generationEnvelope.processingTimeMs
                      ? ` · ${generationEnvelope.processingTimeMs}ms`
                      : ""
                  }`
                : "مصدر البيانات: سجل محلي قديم"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SourceBadge
              aiGenerated={
                blueprint?.metadata
                  ?.aiGenerated ??
                blueprint?.aiGenerated ??
                false
              }
              backfilled={
                blueprint?.metadata
                  ?.backfilled ??
                blueprint?.backfilled ??
                false
              }
            />

            <button
              onClick={() =>
                router.push("/wizard")
              }
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Wizard جديد
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <ReasoningDashboard
          reasoning={
            generationEnvelope?.data?.reasoning?.contract ??
            generationEnvelope?.data?.reasoning ??
            blueprint?.reasoning?.contract ??
            blueprint?.reasoning ??
            null
          }
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-6 flex gap-6">
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="bg-white rounded-xl border overflow-hidden sticky top-24">
            <div className="p-4 border-b bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase">
                الأقسام
              </p>
            </div>

            <nav className="divide-y">
              {sections.map(
                (section) => (
                  <button
                    key={section.key}
                    onClick={() =>
                      setActiveSection(
                        section.key
                      )
                    }
                    className={`w-full text-right px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeSection ===
                      section.key
                        ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>
                      {section.icon}
                    </span>

                    {section.title}
                  </button>
                )
              )}
            </nav>
          </div>
        </aside>

        <div className="md:hidden w-full mb-4">
          <select
            value={activeSection}
            onChange={(event) =>
              setActiveSection(
                event.target
                  .value as SectionKey
              )
            }
            className="w-full p-3 bg-white border rounded-xl text-sm font-medium"
          >
            {sections.map(
              (section) => (
                <option
                  key={section.key}
                  value={section.key}
                >
                  {section.icon}{" "}
                  {section.title}
                </option>
              )
            )}
          </select>
        </div>

        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <span className="text-2xl">
                {
                  sections.find(
                    (section) =>
                      section.key ===
                      activeSection
                  )?.icon
                }
              </span>

              <h2 className="text-xl font-bold text-gray-900">
                {
                  sections.find(
                    (section) =>
                      section.key ===
                      activeSection
                  )?.title
                }
              </h2>
            </div>

            <SectionRenderer
              data={blueprint?.[activeSection]}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 px-2">
            <p>
              تم الإنشاء:{" "}
              {blueprint?.generated_at
                ? new Date(
                    blueprint.generated_at
                  ).toLocaleString(
                    "ar-SA"
                  )
                : "غير معروف"}
            </p>

            {blueprint?.rule_engine_version && (
              <p>
                Rule Engine: v
                {
                  blueprint.rule_engine_version
                }
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
