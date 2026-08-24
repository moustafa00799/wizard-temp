import type { DataModel } from "@/lib/store";

export function buildWizardGenerationPayload(wizardData: DataModel) {
  return {
    ...wizardData,
    ai_advisory: {
      enabled: wizardData.ai_advisory_enabled === true,
    },
  };
}

export function preserveWizardConsent(
  current: DataModel,
  incoming: DataModel,
): DataModel {
  return {
    ...incoming,
    ai_advisory_enabled:
      current.ai_advisory_enabled || incoming.ai_advisory_enabled,
  };
}

export type WizardGenerationPayload = ReturnType<typeof buildWizardGenerationPayload>;
