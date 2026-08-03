// ---------------------------------------------------------------------------
// Project Setup Wizard — Reducer (useReducer)
// ---------------------------------------------------------------------------
import {
  makeTempId,
  WizardAudiotrack,
  WizardProject,
  WizardSpeaker,
  WizardState,
  WizardTag,
  WizardTagCategory,
  WizardTemplate,
  WizardUIGroup,
  TempId,
} from "./types";

// ---- Default values -------------------------------------------------------

export const DEFAULT_PROJECT: WizardProject = {
  name: "",
  description: "",
  latitude: 42.3601,
  longitude: -71.0589,
  language_ids: [],
  audio_format: "mp3",
  max_recording_length_sec: 120,
  auto_submit: true,
  listen_enabled: true,
  geo_listen_enabled: false,
  speak_enabled: true,
  geo_speak_enabled: false,
  // True so the UI Builder's Speak groups are actually shown; the server
  // column defaults to false, which silently skipped the whole tag step.
  allow_speak_tags: true,
  allow_photos: true,
  allow_text: true,
  recording_radius: 30,
  out_of_range_distance: 1000,
  repeat_mode: "stop",
  ordering: "random",
  recording_method: "standard",
  sharing_url: "",
  legal_agreement:
    "I agree that any content I upload to this project can be used freely by the project owners for any project-related artistic or educational purpose.",
  localizations: null,
};

export const DEFAULT_AUDIOTRACK: WizardAudiotrack = {
  is_active: true,
  min_volume: 0.5,
  max_volume: 1.0,
  min_duration: 10.0,
  max_duration: 30.0,
  min_dead_air: 1.0,
  max_dead_air: 5.0,
  min_fade_in_time: 0.5,
  max_fade_in_time: 2.0,
  min_fade_out_time: 0.5,
  max_fade_out_time: 2.0,
  min_pan_pos: -1.0,
  max_pan_pos: 1.0,
  min_pan_duration: 5.0,
  max_pan_duration: 10.0,
  repeat_recordings: false,
  start_with_silence: false,
  banned_duration: 0,
  fadeout_when_filtered: false,
  timed_asset_priority: "normal",
};

export const INITIAL_STATE: WizardState = {
  activeStep: 0,
  templateKey: null,
  project: { ...DEFAULT_PROJECT },
  audiotrack: { ...DEFAULT_AUDIOTRACK },
  categories: [],
  tags: [],
  uiGroups: [],
  speakers: [],
  skipSpeakers: false,
};

// ---- Actions --------------------------------------------------------------

export type WizardAction =
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "APPLY_TEMPLATE"; template: WizardTemplate }
  | { type: "UPDATE_PROJECT"; patch: Partial<WizardProject> }
  | { type: "UPDATE_AUDIOTRACK"; patch: Partial<WizardAudiotrack> }
  // Categories
  | { type: "ADD_CATEGORY"; category: Omit<WizardTagCategory, "tempId"> }
  | { type: "UPDATE_CATEGORY"; tempId: TempId; patch: Partial<WizardTagCategory> }
  | { type: "REMOVE_CATEGORY"; tempId: TempId }
  // Tags
  | { type: "ADD_TAG"; tag: Omit<WizardTag, "tempId"> }
  | { type: "UPDATE_TAG"; tempId: TempId; patch: Partial<WizardTag> }
  | { type: "REMOVE_TAG"; tempId: TempId }
  // UI Groups
  | { type: "ADD_UI_GROUP"; group: Omit<WizardUIGroup, "tempId"> }
  | { type: "UPDATE_UI_GROUP"; tempId: TempId; patch: Partial<WizardUIGroup> }
  | { type: "REMOVE_UI_GROUP"; tempId: TempId }
  // Speakers
  | { type: "ADD_SPEAKER"; speaker: Omit<WizardSpeaker, "tempId"> }
  | { type: "UPDATE_SPEAKER"; tempId: TempId; patch: Partial<WizardSpeaker> }
  | { type: "REMOVE_SPEAKER"; tempId: TempId }
  | { type: "SET_SKIP_SPEAKERS"; skip: boolean }
  // Reset
  | { type: "RESET" };

// ---- Reducer --------------------------------------------------------------

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    // -- Navigation --
    case "SET_STEP":
      return { ...state, activeStep: action.step };
    case "NEXT_STEP":
      return { ...state, activeStep: Math.min(state.activeStep + 1, 5) };
    case "PREV_STEP":
      return { ...state, activeStep: Math.max(state.activeStep - 1, 0) };

    // -- Template --
    case "APPLY_TEMPLATE": {
      const t = action.template;
      // Build categories with tempIds
      const categories: WizardTagCategory[] = t.categories.map((c) => ({
        ...c,
        tempId: makeTempId("cat"),
      }));
      // Build tags linked to category tempIds
      const tags: WizardTag[] = t.tags.map((tg) => ({
        value: tg.value,
        description: tg.description,
        filter: tg.filter,
        data: tg.data,
        categoryTempId: categories[tg.categoryIndex].tempId,
        tempId: makeTempId("tag"),
      }));
      // Build UI groups linked to category tempIds + tag tempIds
      const uiGroups: WizardUIGroup[] = t.uiGroups.map((g) => ({
        name: g.name,
        header_text: g.header_text,
        ui_mode: g.ui_mode,
        select_type: g.select_type,
        is_active: g.is_active,
        categoryTempId: categories[g.categoryIndex].tempId,
        tagTempIds: g.tagIndices.map((i) => tags[i].tempId),
        tempId: makeTempId("uig"),
      }));
      // Build speakers
      const speakers: WizardSpeaker[] = t.speakers.map((s) => ({
        ...s,
        tempId: makeTempId("spk"),
      }));
      return {
        ...state,
        templateKey: t.key,
        activeStep: 1, // advance to project basics
        project: { ...DEFAULT_PROJECT, ...t.project },
        audiotrack: { ...DEFAULT_AUDIOTRACK, ...t.audiotrack },
        categories,
        tags,
        uiGroups,
        speakers,
        skipSpeakers: speakers.length === 0,
      };
    }
    // -- Project --
    case "UPDATE_PROJECT":
      return { ...state, project: { ...state.project, ...action.patch } };

    // -- Audiotrack --
    case "UPDATE_AUDIOTRACK":
      return { ...state, audiotrack: { ...state.audiotrack, ...action.patch } };

    // -- Categories --
    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [
          ...state.categories,
          { ...action.category, tempId: makeTempId("cat") },
        ],
      };
    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.tempId === action.tempId ? { ...c, ...action.patch } : c
        ),
      };
    case "REMOVE_CATEGORY": {
      // Also remove tags and UI groups associated with this category
      const catId = action.tempId;
      const removedTagIds = new Set(
        state.tags.filter((t) => t.categoryTempId === catId).map((t) => t.tempId)
      );
      return {
        ...state,
        categories: state.categories.filter((c) => c.tempId !== catId),
        tags: state.tags.filter((t) => t.categoryTempId !== catId),
        uiGroups: state.uiGroups
          .filter((g) => g.categoryTempId !== catId)
          .map((g) => ({
            ...g,
            tagTempIds: g.tagTempIds.filter((id) => !removedTagIds.has(id)),
          })),
      };
    }

    // -- Tags --
    case "ADD_TAG":
      return {
        ...state,
        tags: [...state.tags, { ...action.tag, tempId: makeTempId("tag") }],
      };
    case "UPDATE_TAG":
      return {
        ...state,
        tags: state.tags.map((t) =>
          t.tempId === action.tempId ? { ...t, ...action.patch } : t
        ),
      };
    case "REMOVE_TAG": {
      const tagId = action.tempId;
      return {
        ...state,
        tags: state.tags.filter((t) => t.tempId !== tagId),
        // Remove from any UI group's tagTempIds
        uiGroups: state.uiGroups.map((g) => ({
          ...g,
          tagTempIds: g.tagTempIds.filter((id) => id !== tagId),
        })),
      };
    }

    // -- UI Groups --
    case "ADD_UI_GROUP":
      return {
        ...state,
        uiGroups: [
          ...state.uiGroups,
          { ...action.group, tempId: makeTempId("uig") },
        ],
      };
    case "UPDATE_UI_GROUP":
      return {
        ...state,
        uiGroups: state.uiGroups.map((g) =>
          g.tempId === action.tempId ? { ...g, ...action.patch } : g
        ),
      };
    case "REMOVE_UI_GROUP":
      return {
        ...state,
        uiGroups: state.uiGroups.filter((g) => g.tempId !== action.tempId),
      };

    // -- Speakers --
    case "ADD_SPEAKER":
      return {
        ...state,
        speakers: [
          ...state.speakers,
          { ...action.speaker, tempId: makeTempId("spk") },
        ],
      };
    case "UPDATE_SPEAKER":
      return {
        ...state,
        speakers: state.speakers.map((s) =>
          s.tempId === action.tempId ? { ...s, ...action.patch } : s
        ),
      };
    case "REMOVE_SPEAKER":
      return {
        ...state,
        speakers: state.speakers.filter((s) => s.tempId !== action.tempId),
      };
    case "SET_SKIP_SPEAKERS":
      return { ...state, skipSpeakers: action.skip };

    // -- Reset --
    case "RESET":
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}
