// ---------------------------------------------------------------------------
// Project Setup Wizard — Type Definitions
// ---------------------------------------------------------------------------

/** Temporary IDs used for local state before API creation */
export type TempId = string;

let _nextTempId = 1;
export function makeTempId(prefix = "tmp"): TempId {
  return `${prefix}_${_nextTempId++}`;
}

// ---- Wizard-level types ---------------------------------------------------

export const WIZARD_STEPS = [
  "template",
  "project",
  "audiotrack",
  "tags",
  "uibuilder",
  "speakers",
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number];

export const STEP_LABELS: Record<WizardStepId, string> = {
  template: "Choose Template",
  project: "Project Basics",
  audiotrack: "Audiotrack",
  tags: "Content Tags",
  uibuilder: "UI Builder",
  speakers: "Speakers",
};

// ---- Per-resource wizard data ---------------------------------------------

export interface WizardProject {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  language_ids: number[];
  audio_format: string;
  max_recording_length_sec: number;
  auto_submit: boolean;
  listen_enabled: boolean;
  geo_listen_enabled: boolean;
  speak_enabled: boolean;
  geo_speak_enabled: boolean;
  recording_radius: number | null;
  out_of_range_distance: number;
  repeat_mode: string;
  ordering: string;
  sharing_url: string;
  legal_agreement: string;
  /** Per-language localizations: { lang_code: { field: text } } */
  localizations: Record<string, Record<string, string | null>> | null;
}

export interface WizardAudiotrack {
  is_active: boolean;
  min_volume: number;
  max_volume: number;
  min_duration: number;
  max_duration: number;
  min_dead_air: number;
  max_dead_air: number;
  min_fade_in_time: number;
  max_fade_in_time: number;
  min_fade_out_time: number;
  max_fade_out_time: number;
  min_pan_pos: number;
  max_pan_pos: number;
  min_pan_duration: number;
  max_pan_duration: number;
  repeat_recordings: boolean;
  start_with_silence: boolean;
  banned_duration: number;
  fadeout_when_filtered: boolean;
  timed_asset_priority: string;
}

export interface WizardTag {
  tempId: TempId;
  value: string;
  description: string;
  filter: string;
  data: string;
  /** Links this tag to a WizardTagCategory via tempId */
  categoryTempId: TempId;
}

export interface WizardTagCategory {
  tempId: TempId;
  name: string;
  data: string;
}

export interface WizardUIGroup {
  tempId: TempId;
  name: string;
  header_text: string;
  ui_mode: string;
  select_type: string;
  is_active: boolean;
  /** Links this UIGroup to a WizardTagCategory via tempId */
  categoryTempId: TempId;
  /** Ordered list of tag tempIds selected for this group */
  tagTempIds: TempId[];
}

export interface WizardSpeaker {
  tempId: TempId;
  code: string;
  is_active: boolean;
  attenuation_distance: number;
  min_volume: number;
  max_volume: number;
  fill_color: string;
  border_color: string;
}

// ---- Top-level wizard state -----------------------------------------------

export interface WizardState {
  /** Currently active step index (0-based) */
  activeStep: number;
  /** Selected template key, or null for "Start from Scratch" */
  templateKey: string | null;

  project: WizardProject;
  audiotrack: WizardAudiotrack;
  categories: WizardTagCategory[];
  tags: WizardTag[];
  uiGroups: WizardUIGroup[];
  speakers: WizardSpeaker[];
  skipSpeakers: boolean;
}

// ---- Template type --------------------------------------------------------

export interface WizardTemplate {
  key: string;
  name: string;
  description: string;
  icon: string; // MUI icon name hint (rendered in TemplateStep)
  project: Partial<WizardProject>;
  audiotrack: Partial<WizardAudiotrack>;
  categories: Omit<WizardTagCategory, "tempId">[];
  /** Tags reference categories by index in the categories array above */
  tags: (Omit<WizardTag, "tempId" | "categoryTempId"> & {
    categoryIndex: number;
  })[];
  uiGroups: (Omit<WizardUIGroup, "tempId" | "categoryTempId" | "tagTempIds"> & {
    categoryIndex: number;
    /** Tag indices (within the tags array above) to include in this group */
    tagIndices: number[];
  })[];
  speakers: Omit<WizardSpeaker, "tempId">[];
}

// ---- Creation progress ----------------------------------------------------

export interface CreationStep {
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
  error?: string;
}
