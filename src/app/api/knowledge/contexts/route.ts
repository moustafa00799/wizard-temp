import { NextResponse } from "next/server";
import { listAvailableStrategyContexts } from "@/lib/knowledge/available-strategy-contexts";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    status: "success",
    contexts: listAvailableStrategyContexts(),
    policy: {
      readOnly: true,
      marketValidated: false,
      rawEvidenceIncluded: false,
      externalActionsAllowed: false,
      humanReviewRequired: true,
    },
  });
}
