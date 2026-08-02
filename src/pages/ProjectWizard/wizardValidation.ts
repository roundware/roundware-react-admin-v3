// ---------------------------------------------------------------------------
// Project Setup Wizard — Per-step validation
// ---------------------------------------------------------------------------
import { WizardState, WizardStepId, WIZARD_STEPS } from "./types";

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
  if (project.latitude === 0 && project.longitude === 0) {
    errors.push("Please set a project location (latitude and longitude).");
  }
  if (project.language_ids.length === 0) {
    errors.push("Select at least one language.");
  }
  if (project.recording_radius === null || project.recording_radius <= 0) {
    errors.push("Recording radius is required (must be greater than 0).");
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

  // Each category should have a corresponding UI group
  for (const cat of state.categories) {
    const group = state.uiGroups.find((g) => g.categoryTempId === cat.tempId);
    if (!group) {
      errors.push(`Category "${cat.name}" needs a UI group configuration.`);
    }
  }

  for (const group of state.uiGroups) {
    if (!group.name.trim()) {
      errors.push("All UI groups must have a name.");
      break;
    }
    if (group.tagTempIds.length === 0) {
      errors.push(`UI group "${group.name}" has no tags assigned.`);
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
  };

/** Validate a specific step */
export function validateStep(
  stepId: WizardStepId,
  state: WizardState
): ValidationResult {
  return validators[stepId](state);
}

/** Validate all steps up to (and including) the given step index */
export function validateUpTo(
  stepIndex: number,
  state: WizardState
): ValidationResult {
  const allErrors: string[] = [];
  for (let i = 0; i <= stepIndex; i++) {
    const result = validators[WIZARD_STEPS[i]](state);
    allErrors.push(...result.errors);
  }
  return allErrors.length ? fail(...allErrors) : ok;
}
