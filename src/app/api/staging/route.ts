import { NextResponse } from "next/server";
import { z } from "zod";
import { getPersonalStagingOverview, runPersonalRandomizedSuite, runPersonalStagingScenario } from "@/lib/staging";

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

export async function GET() {
  try {
    return NextResponse.json(await getPersonalStagingOverview());
  } catch (error) {
    return NextResponse.json({ error: "STAGING_OVERVIEW_FAILED", message: error instanceof Error ? error.message : "Unable to load staging overview." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = RunSchema.parse(await request.json());
    if ("action" in payload && payload.action === "run-suite") {
      return NextResponse.json(await runPersonalRandomizedSuite({ seed: payload.seed, variantsPerCase: payload.variantsPerCase }));
    }
    if ("scenarioId" in payload) {
      return NextResponse.json(await runPersonalStagingScenario(payload.scenarioId));
    }
    return NextResponse.json({ error: "INVALID_STAGING_ACTION" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_STAGING_SCENARIO", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "STAGING_SCENARIO_FAILED", message: error instanceof Error ? error.message : "Unable to run staging scenario." }, { status: 500 });
  }
}
