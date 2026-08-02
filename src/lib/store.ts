// ============================================================
// Campaign Diagnosis Wizard - Zustand Store
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WizardState, CampaignBlueprint } from '@/types/wizard';

const initialState: Omit<WizardState, 'currentStep' | 'completedSteps' | 'draftSavedAt' | 'isSubmitting' | 'blueprint'> = {
  // Step 0
  build_mode: null,

  // Step 1
  business_type: null,
  offer_description: '',
  sales_motion: null,

  // Step 2
  customer_problem: '',
  key_value_drivers: [],
  usp: '',

  // Step 3
  primary_objective: null,
  secondary_objectives: [],
  north_star_kpi: null,

  // Step 4
  existing_assets: [],
  previous_campaigns_status: null,
  past_performance_notes: '',

  // Step 5
  ideal_customer: '',
  awareness_level: null,
  audience_segments: [],
  geo_scope: null,
  target_locations: [],

  // Step 6
  offer_type: null,
  core_message: '',
  objections: [],
  persuasion_angle: null,

  // Step 7
  conversion_destination: null,
  ad_channels: [],
  campaign_direction: null,

  // Step 8
  budget_band: null,
  budget_flexibility: null,
  average_order_value: null,
  profit_margin: null,
  max_cac: null,

  // Step 9
  tracking_status: null,
  tracking_tools: [],
  key_events: [],
  conversion_model: null,

  // Step 10
  creative_assets: [],
  content_capacity: null,
  constraints: [],
  response_speed: null,

  // Step 11
  top_priority: null,
  risk_tolerance: null,
};

interface WizardActions {
  // Navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  markStepComplete: (step: number) => void;

  // Field Updates
  setField: <K extends keyof WizardState>(field: K, value: WizardState[K]) => void;
  setFields: (fields: Partial<WizardState>) => void;
  toggleArrayField: (field: keyof WizardState, value: string) => void;

  // Submission
  setSubmitting: (isSubmitting: boolean) => void;
  setBlueprint: (blueprint: CampaignBlueprint | null) => void;

  // Reset
  resetWizard: () => void;
  clearDraft: () => void;
}

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      currentStep: 0,
      completedSteps: [],
      draftSavedAt: null,
      isSubmitting: false,
      blueprint: null,

      // Navigation
      setStep: (step) => set({ currentStep: step }),
      
      nextStep: () => {
        const { currentStep, completedSteps } = get();
        const newCompleted = [...new Set([...completedSteps, currentStep])];
        set({ 
          currentStep: Math.min(currentStep + 1, 12),
          completedSteps: newCompleted,
          draftSavedAt: new Date().toISOString(),
        });
      },
      
      prevStep: () => {
        const { currentStep } = get();
        set({ currentStep: Math.max(currentStep - 1, 0) });
      },
      
      goToStep: (step) => {
        const { completedSteps } = get();
        // Allow going to completed steps or current step
        if (step <= Math.max(...completedSteps, 0) + 1) {
          set({ currentStep: step });
        }
      },
      
      markStepComplete: (step) => {
        const { completedSteps } = get();
        set({ 
          completedSteps: [...new Set([...completedSteps, step])],
          draftSavedAt: new Date().toISOString(),
        });
      },

      // Field Updates
      setField: (field, value) => {
        set({ [field]: value, draftSavedAt: new Date().toISOString() } as Partial<WizardState>);
      },
      
      setFields: (fields) => {
        set({ ...fields, draftSavedAt: new Date().toISOString() });
      },
      
      toggleArrayField: (field, value) => {
        const state = get();
        const currentArray = (state[field] as string[]) || [];
        const newArray = currentArray.includes(value)
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value];
        set({ [field]: newArray, draftSavedAt: new Date().toISOString() } as Partial<WizardState>);
      },

      // Submission
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      setBlueprint: (blueprint) => set({ blueprint }),

      // Reset
      resetWizard: () => set({
        ...initialState,
        currentStep: 0,
        completedSteps: [],
        draftSavedAt: null,
        isSubmitting: false,
        blueprint: null,
      }),
      
      clearDraft: () => {
        set({
          ...initialState,
          currentStep: 0,
          completedSteps: [],
          draftSavedAt: null,
          isSubmitting: false,
          blueprint: null,
        });
      },
    }),
    {
      name: 'campaign-wizard-draft',
      partialize: (state) => ({
        ...initialState,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        draftSavedAt: state.draftSavedAt,
        // Persist all form fields
        build_mode: state.build_mode,
        business_type: state.business_type,
        offer_description: state.offer_description,
        sales_motion: state.sales_motion,
        customer_problem: state.customer_problem,
        key_value_drivers: state.key_value_drivers,
        usp: state.usp,
        primary_objective: state.primary_objective,
        secondary_objectives: state.secondary_objectives,
        north_star_kpi: state.north_star_kpi,
        existing_assets: state.existing_assets,
        previous_campaigns_status: state.previous_campaigns_status,
        past_performance_notes: state.past_performance_notes,
        ideal_customer: state.ideal_customer,
        awareness_level: state.awareness_level,
        audience_segments: state.audience_segments,
        geo_scope: state.geo_scope,
        target_locations: state.target_locations,
        offer_type: state.offer_type,
        core_message: state.core_message,
        objections: state.objections,
        persuasion_angle: state.persuasion_angle,
        conversion_destination: state.conversion_destination,
        ad_channels: state.ad_channels,
        campaign_direction: state.campaign_direction,
        budget_band: state.budget_band,
        budget_flexibility: state.budget_flexibility,
        average_order_value: state.average_order_value,
        profit_margin: state.profit_margin,
        max_cac: state.max_cac,
        tracking_status: state.tracking_status,
        tracking_tools: state.tracking_tools,
        key_events: state.key_events,
        conversion_model: state.conversion_model,
        creative_assets: state.creative_assets,
        content_capacity: state.content_capacity,
        constraints: state.constraints,
        response_speed: state.response_speed,
        top_priority: state.top_priority,
        risk_tolerance: state.risk_tolerance,
      }),
    }
  )
);

// ============================================================
// Readiness Score Calculator
// ============================================================

export const calculateReadinessScore = (state: Partial<WizardState>): number => {
  let score = 0;

  // Assets Readiness (25%)
  const assetsCount = state.existing_assets?.length || 0;
  score += Math.min(assetsCount * 2, 25);

  // Tracking Readiness (25%)
  if (state.tracking_status === 'ready') score += 25;
  else if (state.tracking_status === 'partial') score += 15;
  else if (state.tracking_status === 'issues') score += 10;
  else if (state.tracking_status === 'unknown') score += 5;

  // Content Readiness (20%)
  const hasAssets = (state.creative_assets?.length || 0) > 0;
  const canProduce = state.content_capacity && state.content_capacity !== 'no';
  if (hasAssets && canProduce) score += 20;
  else if (hasAssets || canProduce) score += 10;

  // Conversion Path (15%)
  if (state.conversion_destination && state.existing_assets?.includes(state.conversion_destination)) {
    score += 15;
  } else if (state.conversion_destination) {
    score += 8;
  }

  // Data Completeness (15%)
  const allFields = [
    state.build_mode, state.business_type, state.offer_description, state.sales_motion,
    state.customer_problem, state.key_value_drivers?.length, state.usp,
    state.primary_objective, state.north_star_kpi,
    state.previous_campaigns_status,
    state.ideal_customer, state.awareness_level, state.geo_scope,
    state.offer_type, state.core_message, state.persuasion_angle,
    state.conversion_destination, state.ad_channels?.length,
    state.budget_band, state.budget_flexibility,
    state.tracking_status, state.key_events?.length, state.conversion_model,
    state.content_capacity, state.response_speed,
    state.top_priority, state.risk_tolerance,
  ];
  const filledFields = allFields.filter(f => f !== null && f !== undefined && f !== '' && f !== 0).length;
  score += Math.round((filledFields / allFields.length) * 15);

  return Math.min(100, score);
};

export const getReadinessLevel = (score: number): { label: string; color: string } => {
  if (score >= 80) return { label: 'ممتاز', color: 'text-green-500' };
  if (score >= 60) return { label: 'جيد', color: 'text-blue-500' };
  if (score >= 40) return { label: 'متوسط', color: 'text-yellow-500' };
  if (score >= 20) return { label: 'ضعيف', color: 'text-orange-500' };
  return { label: 'حرج', color: 'text-red-500' };
};
