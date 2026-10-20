// ---------------------------------------------------------------------------
// Keep the wizard's answers across a reload, a stray navigation, or a crash
// ---------------------------------------------------------------------------
//
// The wizard holds twenty minutes of work in a `useReducer`, which is memory
// and nothing else. A render error anywhere in the tree unmounts it and the
// lot is gone — which is exactly what happened when the speaker audio preview
// threw: an unrelated bug three components deep cost a whole project setup.
//
// Persisting is not a substitute for not crashing, but it changes a crash from
// "start again" into "carry on".

import { INITIAL_STATE, NO_EMBED } from "./wizardReducer";
import { WIZARD_STEPS, WizardState, WizardStepId } from "./types";

/** The saved step: by name, or — in drafts from before steps came and went
 *  with Listen and Speak — by position. */
const savedStep = (raw: unknown): WizardStepId => {
  if (typeof raw === "number") return WIZARD_STEPS[raw] ?? "template";
  return WIZARD_STEPS.includes(raw as WizardStepId) ? (raw as WizardStepId) : "template";
};

const PREFIX = "roundware.wizard.v1";

/** One draft per person and organization. It was one key for the tab, so a
 *  new account signing up in it was handed the last account's draft, on
 *  its last step (2026-10-13). Signing out clears them all. */
const key = (): string => {
  try {
    const user = JSON.parse(localStorage.getItem("user") ?? "null") as { id?: number; email?: string } | null;
    const who = user?.id ?? user?.email ?? "anonymous";
    return `${PREFIX}:${who}:${localStorage.getItem("tenant_slug") ?? ""}`;
  } catch {
    return `${PREFIX}:anonymous:`;
  }
};

/** sessionStorage, not localStorage: this is one sitting's work, and a draft
 *  silently resurrected days later in another tab is worse than none. */
const store = (): Storage | null => {
  try {
    return window.sessionStorage;
  } catch {
    // Private mode, blocked site data — persistence is a nicety, never a
    // reason for the wizard itself to fail.
    return null;
  }
};

/** `File` cannot be serialized, so a chosen audio file does not survive.
 *  Everything else does; the speaker keeps its name, shape and settings and
 *  only the file needs picking again. */
const strip = (state: WizardState): WizardState => ({
  ...state,
  speakers: state.speakers.map((s) => ({ ...s, audioFile: null })),
});

export function saveWizardState(state: WizardState): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(key(), JSON.stringify(strip(state)));
  } catch {
    // Quota, or a value that will not serialize. Losing the draft is bad;
    // breaking the wizard to complain about it is worse.
  }
}

export function clearWizardState(): void {
  try {
    store()?.removeItem(key());
  } catch {
    /* nothing useful to do */
  }
}

/** Every draft in this tab, whoever's — on signing out. Includes the old
 *  unscoped one, which could be anybody's. */
export function clearAllWizardDrafts(): void {
  const s = store();
  if (!s) return;
  try {
    Object.keys(s)
      .filter((k) => k === PREFIX || k.startsWith(`${PREFIX}:`))
      .forEach((k) => s.removeItem(k));
  } catch {
    /* nothing useful to do */
  }
}

/**
 * Read a saved draft, or the initial state if there is none.
 *
 * Anything stored is merged over the current defaults rather than used as-is:
 * a draft written by an older build can be missing fields this one requires,
 * and a half-populated state crashes in a way that is much harder to explain
 * than a lost draft.
 */
export function loadWizardState(): WizardState {
  const s = store();
  if (!s) return INITIAL_STATE;
  try {
    const raw = s.getItem(key());
    if (!raw) return INITIAL_STATE;
    const saved = JSON.parse(raw) as Partial<WizardState>;
    if (!saved || typeof saved !== "object") return INITIAL_STATE;
    return {
      ...INITIAL_STATE,
      ...saved,
      activeStep: savedStep(saved.activeStep),
      embed: { ...NO_EMBED, ...(saved.embed ?? {}) },
      project: { ...INITIAL_STATE.project, ...(saved.project ?? {}) },
      audiotrack: { ...INITIAL_STATE.audiotrack, ...(saved.audiotrack ?? {}) },
      categories: saved.categories ?? [],
      tags: saved.tags ?? [],
      uiGroups: saved.uiGroups ?? [],
      speakers: (saved.speakers ?? []).map((spk) => ({
        ...spk,
        audioFile: null,
      })),
    };
  } catch {
    return INITIAL_STATE;
  }
}

/** True when a draft holds real work — used to decide whether to offer it. */
export function hasSavedDraft(): boolean {
  const s = store();
  if (!s) return false;
  try {
    const raw = s.getItem(key());
    if (!raw) return false;
    const saved = JSON.parse(raw) as Partial<WizardState>;
    return Boolean(saved?.templateKey) && savedStep(saved?.activeStep) !== "template";
  } catch {
    return false;
  }
}
