import { NextResponse } from "next/server";
import { z } from "zod";
import { getPersonalStagingOverview, runPersonalStagingScenario } from "@/lib/staging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RunSchema = z.object({
  scenarioId: z.enum(["sa-ecommerce", "sa-education", "eg-education"]),
});

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
    return NextResponse.json(await runPersonalStagingScenario(payload.scenarioId));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_STAGING_SCENARIO", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "STAGING_SCENARIO_FAILED", message: error instanceof Error ? error.message : "Unable to run staging scenario." }, { status: 500 });
  }
}
