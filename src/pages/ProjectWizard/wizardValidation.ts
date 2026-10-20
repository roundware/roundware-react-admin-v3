// ---------------------------------------------------------------------------
// Project Setup Wizard — Per-step validation
// ---------------------------------------------------------------------------
import { WizardState, WizardStepId } from "./types";
import { isLooping, listens, menuModes, speaks, visibleSteps } from "./wizardSteps";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ok: ValidationResult = { valid: true, errors: [] };

function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

// ---- Per-step validators --------------------------------------------------

function validateTemplate(state: WizardState): ValidationResult {
  // A template is required. The old "Start from Scratch" option was the
  // wizard's initial state, so it rendered pre-selected before the user had
  // decided anything, and it produced a project with no tag categories, tags
  // or UI groups. The "Standard" template replaces it with a coherent minimum.
  if (state.templateKey === null) {
    return fail("Choose a template to continue.");
  }
  return ok;
}

function validateProject(state: WizardState): ValidationResult {
  const errors: string[] = [];
  const { project } = state;

  if (!project.name.trim()) {
    errors.push("Project name is required.");
  }
  if (!listens(state) && !speaks(state)) {
    errors.push("Turn on Listen, Speak or both: what will people do here?");
  }
  // The server refuses it too (docs/025).
  if (isLooping(state) && !listens(state)) {
    errors.push("A looping project needs Listen on: contributors record over what they hear.");
  }
  if (project.latitude === 0 && project.longitude === 0) {
    errors.push("Please set a project location (latitude and longitude).");
  }
  if (project.language_ids.length === 0) {
    errors.push("Select at least one language.");
  }
  // Only listening uses it (Project Basics shows it then).
  if (listens(state) && (project.recording_radius === null || project.recording_radius <= 0)) {
    errors.push("Listening radius is required (must be greater than 0).");
  }

  return errors.length ? fail(...errors) : ok;
}

function validateAudiotrack(_state: WizardState): ValidationResult {
  const errors: string[] = [];
  const { audiotrack } = _state;

  if (audiotrack.min_volume > audiotrack.max_volume) {
    errors.push("Min volume cannot exceed max volume.");
  }
  if (audiotrack.min_duration > audiotrack.max_duration) {
    errors.push("Min duration cannot exceed max duration.");
  }

  return errors.length ? fail(...errors) : ok;
}

function validateTags(state: WizardState): ValidationResult {
  const errors: string[] = [];

  if (state.categories.length === 0) {
    errors.push("Add at least one tag category.");
  }

  for (const cat of state.categories) {
    if (!cat.name.trim()) {
      errors.push("All tag categories must have a name.");
      break;
    }
  }

  const tagsExist = state.categories.some((cat) =>
    state.tags.some((t) => t.categoryTempId === cat.tempId)
  );
  if (state.categories.length > 0 && !tagsExist) {
    errors.push("Add at least one tag to a category.");
  }

  for (const tag of state.tags) {
    if (!tag.value.trim()) {
      errors.push("All tags must have a display value.");
      break;
    }
  }

  return errors.length ? fail(...errors) : ok;
}

function validateUIBuilder(state: WizardState): ValidationResult {
  const errors: string[] = [];

  // A category must appear in at least one mode — but which one is the
  // author's call. Speak-only and listen-only projects are both legitimate
  // (a radio show capturing submissions exposes no filters; an archive may
  // only be browsed), so this deliberately does not require both.
  for (const cat of state.categories) {
    const group = state.uiGroups.find((g) => g.categoryTempId === cat.tempId);
    if (!group) {
      const tabs = menuModes(state).map((m) => (m === "listen" ? "Listen" : "Speak"));
      errors.push(
        tabs.length > 1
          ? `Category "${cat.name}" is not used in either tab. Add it to Listen or Speak.`
          : `Category "${cat.name}" is not used. Add it to ${tabs[0] ?? "a tab"}, or remove it in Content Tags.`
      );
    }
  }

  // Only the tabs this project has: a hidden one's menus aren't created.
  const modes = menuModes(state) as string[];
  for (const group of state.uiGroups.filter((g) => modes.includes(g.ui_mode))) {
    if (!group.name.trim()) {
      errors.push("All UI groups must have a name.");
      break;
    }
    if (group.tagTempIds.length === 0) {
      const where = group.ui_mode === "listen" ? "Listen" : "Speak";
      errors.push(`"${group.name}" in the ${where} tab has no tags assigned.`);
    }
  }

  return errors.length ? fail(...errors) : ok;
}

function validateSpeakers(state: WizardState): ValidationResult {
  if (state.skipSpeakers) return ok;

  const errors: string[] = [];

  if (state.speakers.length === 0) {
    errors.push(
      "Add at least one speaker, or toggle \"Skip speakers\" to continue."
    );
  }

  for (const spk of state.speakers) {
    if (!spk.code.trim()) {
      errors.push("All speakers must have a code.");
      break;
    }
  }

  // A shapeless speaker is not merely incomplete — it crashes the published
  // app. Turf throws "polygon or multi-polygon is required" as soon as the
  // listener's location is set, which happens during boot, so the project never
  // becomes usable. Block it here rather than let someone discover it after
  // deploying.
  // A speaker that plays everywhere needs no area (server docs/027).
  const unshaped = state.speakers.filter((spk) => !spk.shape && !spk.is_global);
  if (unshaped.length > 0) {
    const which = unshaped
      .map((spk) => spk.code.trim() || "(unnamed)")
      .join(", ");
    errors.push(
      unshaped.length === 1
        ? `Draw a coverage area on the map for speaker "${which}".`
        : `Draw a coverage area on the map for these speakers: ${which}.`
    );
  }

  return errors.length ? fail(...errors) : ok;
}

// ---- Validators map -------------------------------------------------------

const validators: Record<WizardStepId, (s: WizardState) => ValidationResult> =
  {
    template: validateTemplate,
    project: validateProject,
    audiotrack: validateAudiotrack,
    tags: validateTags,
    uibuilder: validateUIBuilder,
    speakers: validateSpeakers,
    // Optional, and the sites can be added later; the server checks them.
    embed: () => ok,
  };

/** Validate a specific step */
export function validateStep(
  stepId: WizardStepId,
  state: WizardState
): ValidationResult {
  return validators[stepId](state);
}

/** Every step this project has, for the Create button. */
export function validateAll(state: WizardState): boolean {
  return visibleSteps(state).every((id) => validators[id](state).valid);
}
