import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface DataModel {
  build_mode: string | null;
  business_type: string | null;
  offer_description: string | null;
  sales_motion: string | null;
  customer_problem: string | null;
  key_value_drivers: string[];
  usp: string | null;
  primary_objective: string | null;
  secondary_objectives: string[];
  north_star_kpi: string | null;
  existing_assets: string[];
  previous_campaigns_status: string | null;
  past_performance_notes: string | null;
  ideal_customer: string | null;
  awareness_level: string | null;
  audience_segments: string[];
  geo_scope: string | null;
  target_locations: string[];
  offer_type: string | null;
  core_message: string | null;
  objections: string[];
  persuasion_angle: string | null;
  conversion_destination: string | null;
  ad_channels: string[];
  campaign_direction: string | null;
  budget_band: string | null;
  budget_flexibility: string | null;
  average_order_value: number | null;
  profit_margin: number | null;
  max_cac: number | null;
  tracking_status: string | null;
  tracking_tools: string[];
  key_events: string[];
  conversion_model: string | null;
  creative_assets: string[];
  content_capacity: string | null;
  constraints: string[];
  response_speed: string | null;
  top_priority: string | null;
  risk_tolerance: string | null;
  final_confirmed_inputs: boolean | null;
}

const EMPTY_DATA: DataModel = {
  build_mode: null,
  business_type: null,
  offer_description: null,
  sales_motion: null,
  customer_problem: null,
  key_value_drivers: [],
  usp: null,
  primary_objective: null,
  secondary_objectives: [],
  north_star_kpi: null,
  existing_assets: [],
  previous_campaigns_status: null,
  past_performance_notes: null,
  ideal_customer: null,
  awareness_level: null,
  audience_segments: [],
  geo_scope: null,
  target_locations: [],
  offer_type: null,
  core_message: null,
  objections: [],
  persuasion_angle: null,
  conversion_destination: null,
  ad_channels: [],
  campaign_direction: null,
  budget_band: null,
  budget_flexibility: null,
  average_order_value: null,
  profit_margin: null,
  max_cac: null,
  tracking_status: null,
  tracking_tools: [],
  key_events: [],
  conversion_model: null,
  creative_assets: [],
  content_capacity: null,
  constraints: [],
  response_speed: null,
  top_priority: null,
  risk_tolerance: null,
  final_confirmed_inputs: null,
};

interface WizardStore {
  // FIX E: currentStep and completedSteps are NOT persisted
  currentStep: number;
    completedSteps: number[];
  data: DataModel;
  setStep: (step: number) => void;
  markCompleted: (step: number) => void;
  setField: <K extends keyof DataModel>(key: K, value: DataModel[K]) => void;
  resetWizard: () => void;
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      // FIX E: runtime state - always starts fresh, not restored from storage
      currentStep: 0,
      completedSteps: new Set<number>(),
      data: { ...EMPTY_DATA },

      setStep: (step) => set({ currentStep: step }),

      markCompleted: (step) =>
        set((s) => ({
                    completedSteps: [...new Set([...s.completedSteps, step])],
        })),

      setField: (key, value) =>
        set((s) => ({ data: { ...s.data, [key]: value } })),

      resetWizard: () =>
        set({
          currentStep: 0,
          completedSteps: new Set<number>(),
          data: { ...EMPTY_DATA },
        }),
    }),
    {
      name: "wizard-draft",
      storage: createJSONStorage(() => localStorage),
      // FIX E: only persist form data, NOT navigation state
      partialize: (state) => ({ data: state.data }),
    }
  )
);
