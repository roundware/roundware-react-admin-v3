import { WizardTemplate } from "../types";

/**
 * Standard — the neutral starting point, and the replacement for the old
 * "Start from Scratch" option.
 *
 * Scratch was the wizard's *initial* state, so it rendered pre-selected before
 * the user had chosen anything, and it produced a project with no tag
 * categories, no tags and no UI groups. Even an experienced Roundware author
 * has to rebuild that scaffolding by hand before the speak flow does anything
 * useful.
 *
 * This template is deliberately the plainest coherent project: listen and
 * speak both on, no geography to configure, standard recording, and one simple
 * tag category so the speak flow works end to end. Everything else stays at the
 * app defaults. It is the base the other five templates are opinionated
 * departures from.
 *
 * Its config is empty, and correctly so: the paradigm comes from
 * `recording_method`, and everything else here is already the app default.
 */
const standard: WizardTemplate = {
  key: "standard",
  active: true,
  name: "Standard",
  description:
    "A plain, general-purpose project with listening and recording enabled and no location setup required. Start here if you are not sure — you can change anything later.",
  icon: "Tune",
  project: {
    listen_enabled: true,
    geo_listen_enabled: false,
    speak_enabled: true,
    geo_speak_enabled: false,
    max_recording_length_sec: 120,
    recording_radius: 30,
    auto_submit: false,
    ordering: "random",
    repeat_mode: "stop",
    out_of_range_distance: 1000,
    recording_method: "standard",
  },
  // Minimal on purpose: everything stays at the app defaults so this template
  // does not quietly become opinionated over time. The paradigm is not set
  // here — it is derived from recording_method above.
  config: {},
  audiotrack: {
    min_volume: 0.7,
    max_volume: 1.0,
    min_duration: 20.0,
    max_duration: 60.0,
    min_dead_air: 1.0,
    max_dead_air: 5.0,
  },
  categories: [{ name: "Topic", data: "" }],
  tags: [
    { value: "General", description: "Anything that does not fit the others", filter: "", data: "", categoryIndex: 0 },
    { value: "Story", description: "A personal account", filter: "", data: "", categoryIndex: 0 },
    { value: "Sound", description: "A sound or field recording", filter: "", data: "", categoryIndex: 0 },
  ],
  uiGroups: [
    {
      name: "Topic",
      header_text: "What are you recording?",
      ui_mode: "speak",
      select_type: "single",
      is_active: true,
      categoryIndex: 0,
      tagIndices: [0, 1, 2],
    },
    {
      name: "Topic",
      header_text: "Filter by topic",
      ui_mode: "listen",
      select_type: "multi",
      is_active: true,
      categoryIndex: 0,
      tagIndices: [0, 1, 2],
    },
  ],
  speakers: [],
};

export default standard;
