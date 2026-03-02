import { WizardTemplate } from "../types";

const artinstallation: WizardTemplate = {
  key: "artinstallation",
  name: "Art Installation",
  description:
    "Gallery or museum-based project with shorter recordings. Ideal for interactive sound art pieces where visitors contribute audio around specific themes.",
  icon: "Palette",
  project: {
    listen_enabled: true,
    geo_listen_enabled: false,
    speak_enabled: true,
    geo_speak_enabled: false,
    max_recording_length_sec: 45,
    recording_radius: 30,
    ordering: "random",
    repeat_mode: "continuous",
    auto_submit: true,
  },
  audiotrack: {
    min_volume: 0.4,
    max_volume: 0.9,
    min_duration: 5.0,
    max_duration: 30.0,
    min_dead_air: 0.5,
    max_dead_air: 3.0,
    min_fade_in_time: 1.0,
    max_fade_in_time: 3.0,
    min_fade_out_time: 1.0,
    max_fade_out_time: 3.0,
  },
  categories: [
    { name: "Theme", data: "" },
    { name: "Medium", data: "" },
  ],
  tags: [
    // Theme tags (categoryIndex 0)
    { value: "Memory", description: "Personal or collective memory", filter: "", data: "", categoryIndex: 0 },
    { value: "Identity", description: "Self, culture, belonging", filter: "", data: "", categoryIndex: 0 },
    { value: "Place", description: "Sense of location, environment", filter: "", data: "", categoryIndex: 0 },
    { value: "Time", description: "Temporality, change, duration", filter: "", data: "", categoryIndex: 0 },
    // Medium tags (categoryIndex 1)
    { value: "Voice", description: "Spoken word, narration", filter: "", data: "", categoryIndex: 1 },
    { value: "Sound Effect", description: "Found sounds, foley", filter: "", data: "", categoryIndex: 1 },
    { value: "Music", description: "Musical performance or composition", filter: "", data: "", categoryIndex: 1 },
    { value: "Ambient", description: "Environmental, atmospheric", filter: "", data: "", categoryIndex: 1 },
  ],
  uiGroups: [
    {
      name: "Theme",
      header_text: "What theme does this explore?",
      ui_mode: "speak",
      select_type: "multi",
      is_active: true,
      categoryIndex: 0,
      tagIndices: [0, 1, 2, 3],
    },
    {
      name: "Medium",
      header_text: "What is the primary medium?",
      ui_mode: "speak",
      select_type: "single",
      is_active: true,
      categoryIndex: 1,
      tagIndices: [4, 5, 6, 7],
    },
  ],
  speakers: [],
};

export default artinstallation;
