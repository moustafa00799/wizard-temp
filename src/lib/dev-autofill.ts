import type { DataModel } from "@/lib/store";
import { WIZARD_AUTOFILL_PROFILES } from "@/lib/wizard-autofill-profiles";

let shuffledQueue: number[] = [];
let lastProfileIndex = -1;

function refillQueue() {
  shuffledQueue = WIZARD_AUTOFILL_PROFILES.map((_, index) => index);
  for (let index = shuffledQueue.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledQueue[index], shuffledQueue[randomIndex]] = [shuffledQueue[randomIndex], shuffledQueue[index]];
  }

  // Avoid repeating the last profile across shuffle-bag boundaries when possible.
  if (shuffledQueue.length > 1 && shuffledQueue[0] === lastProfileIndex) {
    [shuffledQueue[0], shuffledQueue[1]] = [shuffledQueue[1], shuffledQueue[0]];
  }
}

/**
 * Returns every approved Wizard fixture exactly once per shuffled bag.
 * The profile order is random for each browser session and each completed bag.
 */
export function getDummyData(): DataModel {
  if (shuffledQueue.length === 0) refillQueue();
  const profileIndex = shuffledQueue.shift() ?? 0;
  lastProfileIndex = profileIndex;
  const { scenario_id: _scenarioId, title: _title, ...data } = WIZARD_AUTOFILL_PROFILES[profileIndex];
  return { ...data };
}

export const PROFILE_NAMES = WIZARD_AUTOFILL_PROFILES.map(
  (profile) => `${profile.scenario_id} — ${profile.title}`,
);

export function getCurrentProfileName(): string {
  return PROFILE_NAMES[lastProfileIndex] ?? "Wizard fixture";
}

export const AUTOFILL_PROFILE_COUNT = WIZARD_AUTOFILL_PROFILES.length;
