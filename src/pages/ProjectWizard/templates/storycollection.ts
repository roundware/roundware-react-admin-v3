import { WizardTemplate } from "../types";

const storycollection: WizardTemplate = {
  key: "storycollection",
  active: true,
  name: "Story Collection",
  description:
    "Interview-style project for collecting oral histories and personal narratives. Longer recordings with topic and emotion tagging.",
  icon: "RecordVoiceOver",
  project: {
    listen_enabled: true,
    geo_listen_enabled: false,
    speak_enabled: true,
    geo_speak_enabled: false,
    max_recording_length_sec: 300,
    recording_radius: 30,
    ordering: "random",
    repeat_mode: "stop",
    auto_submit: false,
    recording_method: "standard",
  },
  // Not a geographic project — long-form stories collected from anywhere. The
  // map is still available to browse the archive, but location is incidental.
  config: {
    listen: {
      availableListenModes: ["map"],
      geoListenMode: ["map"],
      autoplay: false,
    },
    map: {
      bounds: "auto",
      assetDisplay: "pin",
      rangeCircleOverlayVisible: false,
      showListenerLocationMarker: false,
      speakerDisplay: "none",
    },
    ui: {
      listenSidebar: { active: true, defaultOpen: true },
    },
  },
  audiotrack: {
    min_volume: 0.7,
    max_volume: 1.0,
    min_duration: 30.0,
    max_duration: 120.0,
    min_dead_air: 3.0,
    max_dead_air: 10.0,
  },
  categories: [
    { name: "Topic", data: "" },
    { name: "Emotion", data: "" },
  ],
  tags: [
    // Topic tags (categoryIndex 0)
    { value: "Childhood", description: "Early memories and growing up", filter: "", data: "", categoryIndex: 0 },
    { value: "Work", description: "Career, jobs, professional life", filter: "", data: "", categoryIndex: 0 },
    { value: "Family", description: "Relatives, home life, traditions", filter: "", data: "", categoryIndex: 0 },
    { value: "Community", description: "Neighborhood, belonging, civic life", filter: "", data: "", categoryIndex: 0 },
    { value: "Change", description: "Transitions, turning points", filter: "", data: "", categoryIndex: 0 },
    // Emotion tags (categoryIndex 1)
    { value: "Joyful", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Reflective", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Bittersweet", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Hopeful", description: "", filter: "", data: "", categoryIndex: 1 },
  ],
  uiGroups: [
    {
      name: "Topic",
      header_text: "What is your story about?",
      ui_mode: "speak",
      select_type: "multi",
      is_active: true,
      categoryIndex: 0,
      tagIndices: [0, 1, 2, 3, 4],
    },
    {
      name: "Emotion",
      header_text: "How does this story make you feel?",
      ui_mode: "speak",
      select_type: "multi",
      is_active: true,
      categoryIndex: 1,
      tagIndices: [5, 6, 7, 8],
    },
  ],
  speakers: [],
};

export default storycollection;
