// ---------------------------------------------------------------------------
// Project Setup Wizard — Type Definitions
// ---------------------------------------------------------------------------
import type { MultiPolygon } from "@turf/helpers";

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
  /**
   * Whether contributors are asked to tag their recording.
   *
   * Defaults true here, unlike the server column which defaults false. With it
   * off, TagSelectForm skips straight past the tag step, so every Speak group
   * configured in the UI Builder is silently never shown.
   */
  allow_speak_tags: boolean;
  allow_photos: boolean;
  allow_text: boolean;
  recording_radius: number | null;
  out_of_range_distance: number;
  repeat_mode: string;
  ordering: string;
  /** "standard" | "looping" — a column, so it is set here rather than in config */
  recording_method: string;
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
  /**
   * Coverage area as a GeoJSON MultiPolygon.
   *
   * Required, not optional: the web app crashes on a speaker with no shape
   * (Turf throws "polygon or multi-polygon is required" during location
   * updates, before the app finishes booting). The wizard used to omit this
   * entirely and tell users to draw shapes later, which made every project it
   * created unusable.
   */
  shape: MultiPolygon | null;
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
  /** Selected template key. Null only before a choice is made — the template
   *  step requires one before the wizard can proceed. */
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

/**
 * A template's seed for the project's `ui_config_json`.
 *
 * The section names are the ones the server accepts — they mirror
 * `KNOWN_SECTIONS` in the server's `src/app/core/ui_config.py`, so a typo like
 * `speek` fails to compile here rather than 422-ing at the last step of the
 * wizard. Section *contents* are deliberately loose: the whole point of the
 * JSONB home is that adding a setting needs no schema change anywhere.
 *
 * Two rules the compiler cannot enforce, both from
 * roundware-server-v3/docs/009-configuration.md:
 *
 *  1. Do not set a key that a project column owns — the server rejects those
 *     (§7 decision 4). In practice: nothing under `speak` except
 *     `uploadAsSpeaker`, `defaultSpeakTags`, `baseRecordingLoopSelectionMethod`,
 *     the clickTrack/looping keys; and nothing in `features` except
 *     `autoConcludeDuration`, `concludeDuration`, `speakerToggleIds`.
 *     Column-backed settings go in the template's `project` block instead.
 *  2. Keys must match the web app's `configTypes.ts` exactly. An unrecognised
 *     nested key is *not* an error — it simply never matches anything and is
 *     silently ignored.
 */
export interface TemplateConfig {
  project?: Record<string, unknown>;
  listen?: Record<string, unknown>;
  speak?: Record<string, unknown>;
  map?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  features?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  locale?: string;
}

export interface WizardTemplate {
  key: string;
  /**
   * Whether this template is offered in the wizard.
   *
   * Set `false` to retire or park a template without deleting it — useful when
   * narrowing the choices for a round of user testing. Required rather than
   * optional so adding a template is a conscious decision either way.
   *
   * Hiding is always safe: `getTemplate()` searches every template regardless,
   * so nothing that references an inactive key breaks. Templates are applied
   * once at creation and never looked up again, so existing projects are
   * unaffected.
   */
  active: boolean;
  name: string;
  description: string;
  icon: string; // MUI icon name hint (rendered in TemplateStep)
  project: Partial<WizardProject>;
  /** Seeds the project's ui_config_json. See TemplateConfig. */
  config: TemplateConfig;
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
