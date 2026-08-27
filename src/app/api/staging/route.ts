import { NextResponse } from "next/server";
import { z } from "zod";
import { getPersonalStagingOverview, runPersonalRandomizedSuite, runPersonalStagingScenario } from "@/lib/staging";
import { readJsonBody, RequestSecurityError } from "@/lib/api/request-security";
import { LocalAuthError, requireLocalSession } from "@/lib/auth/local-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RunSchema = z.union([
  z.object({
    scenarioId: z.enum(["sa-ecommerce", "sa-education", "eg-education"]),
  }),
  z.object({
    action: z.literal("run-suite"),
    seed: z.number().int().optional(),
    variantsPerCase: z.number().int().min(1).max(10).optional(),
  }),
]);

export async function GET(request: Request) {
  try {
    requireLocalSession(request);
    return NextResponse.json(await getPersonalStagingOverview());
  } catch (error) {
    if (error instanceof LocalAuthError) return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: error.code === "NOT_CONFIGURED" ? 503 : 401 });
    return NextResponse.json({ error: "STAGING_OVERVIEW_FAILED", message: error instanceof Error ? error.message : "Unable to load staging overview." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    requireLocalSession(request);
    const payload = RunSchema.parse(await readJsonBody(request, 16 * 1024));
    if ("action" in payload && payload.action === "run-suite") {
      return NextResponse.json(await runPersonalRandomizedSuite({ seed: payload.seed, variantsPerCase: payload.variantsPerCase }));
    }
    if ("scenarioId" in payload) {
      return NextResponse.json(await runPersonalStagingScenario(payload.scenarioId));
    }
    return NextResponse.json({ error: "INVALID_STAGING_ACTION" }, { status: 400 });
  } catch (error) {
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.code === "BODY_TOO_LARGE" ? "REQUEST_BODY_TOO_LARGE" : "INVALID_JSON" }, { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 });
    if (error instanceof LocalAuthError) return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: error.code === "NOT_CONFIGURED" ? 503 : 401 });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_STAGING_SCENARIO", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "STAGING_SCENARIO_FAILED", message: error instanceof Error ? error.message : "Unable to run staging scenario." }, { status: 500 });
  }
}
