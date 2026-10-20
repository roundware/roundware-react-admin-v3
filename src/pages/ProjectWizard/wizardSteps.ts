// ---------------------------------------------------------------------------
// Project Setup Wizard — Which steps a project gets
// ---------------------------------------------------------------------------
// What people do in a project — Listen, Speak, or both — chosen on the first
// screen, decides the rest: a project nobody listens to needs no playback or
// speakers, one nobody records in needs no Speak menus. They act as toggles
// for the wizard, so changing them hides or brings back steps; nothing
// entered in a hidden step is lost, and the author stays on the step they're
// on.
import { WIZARD_STEPS, WizardState, WizardStepId } from "./types";
import { getTemplate } from "./templates";

export const listens = (s: WizardState): boolean => s.project.listen_enabled;
export const speaks = (s: WizardState): boolean => s.project.speak_enabled;
export const isLooping = (s: WizardState): boolean => s.project.recording_method === "looping";
/** Contributors are asked to tag their recordings: the Speak menus show. */
export const asksForTags = (s: WizardState): boolean => speaks(s) && s.project.allow_speak_tags;

/** The Filters & Menus tabs this project has: Listen's filters, Speak's
 *  questions. Speak's only when contributors are asked to tag. */
export function menuModes(s: WizardState): ("listen" | "speak")[] {
  const modes: ("listen" | "speak")[] = [];
  if (listens(s)) modes.push("listen");
  if (asksForTags(s)) modes.push("speak");
  return modes;
}

/** Whether the template offers the embed step. */
export const offersEmbed = (s: WizardState): boolean =>
  s.templateKey !== null && getTemplate(s.templateKey)?.optionalSteps?.embed !== undefined;

export function stepApplies(id: WizardStepId, s: WizardState): boolean {
  switch (id) {
    case "template":
    case "project":
      return true;
    // How contributions are mixed for listeners. Looping projects play
    // speakers, not contributions (they may have some, rarely).
    case "audiotrack":
      return listens(s) && !isLooping(s);
    case "tags":
    case "uibuilder":
      return menuModes(s).length > 0;
    // Speakers play to listeners; a looping project's recordings are made
    // over them, and it always listens.
    case "speakers":
      return listens(s);
    case "embed":
      return speaks(s) && offersEmbed(s);
  }
}

export const visibleSteps = (s: WizardState): WizardStepId[] =>
  WIZARD_STEPS.filter((id) => stepApplies(id, s));

/** The step to show: the one asked for, or — when it no longer applies —
 *  the nearest one before it that does. */
export function shownStep(s: WizardState): WizardStepId {
  if (stepApplies(s.activeStep, s)) return s.activeStep;
  const at = WIZARD_STEPS.indexOf(s.activeStep);
  for (let i = at - 1; i >= 0; i--) {
    if (stepApplies(WIZARD_STEPS[i], s)) return WIZARD_STEPS[i];
  }
  return "template";
}
