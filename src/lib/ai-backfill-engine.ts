/**
 * Campaign Engine Builder — AI Backfill Engine
 *
 * ⚠️ DEPRECATED (v3): This module is deprecated in favor of the Multi-Phase pipeline.
 *
 * The Multi-Phase architecture (route.ts v3) handles structural backfill through:
 * 1. Per-phase validation (ai-validator.ts)
 * 2. Granular Rules fallback (blueprint-engine.ts generateSection())
 * 3. Rich shape adaptation (ai-adapter.ts adaptToRichShape())
 * 4. Final merge with Rules blueprint (blueprint-backfill.ts)
 *
 * This file is kept for backward compatibility only.
 * Do not import it in new code.
 */

import { AIWizardPayload } from "./ai-types";

/** @deprecated Use blueprint-engine.ts generateSection() instead */
export function backfillBlueprint(
  _aiBlueprint: Record<string, unknown>,
  _wizardData: AIWizardPayload
): Record<string, unknown> {
  console.warn(
    "[DEPRECATED] ai-backfill-engine.ts is deprecated. " +
    "Use the Multi-Phase pipeline in route.ts v3 instead."
  );
  return {};
}
