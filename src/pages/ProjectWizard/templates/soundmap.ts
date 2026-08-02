import { WizardTemplate } from "../types";

const soundmap: WizardTemplate = {
  key: "soundmap",
  active: true,
  name: "Sound Map",
  description:
    "Community sound mapping project where participants contribute geo-tagged audio recordings to build a collective sonic portrait of a place.",
  icon: "Map",
  project: {
    listen_enabled: true,
    geo_listen_enabled: true,
    speak_enabled: true,
    geo_speak_enabled: true,
    max_recording_length_sec: 90,
    recording_radius: 30,
    auto_submit: true,
    ordering: "random",
    repeat_mode: "stop",
    out_of_range_distance: 2000,
    recording_method: "standard",
  },
  // The map *is* the experience: browse a whole region from anywhere, so map
  // listen mode rather than walking, and the sidebar open by default.
  config: {
    listen: {
      availableListenModes: ["map", "walking"],
      geoListenMode: ["map"],
      autoplay: false,
    },
    map: {
      bounds: "auto",
      assetDisplay: "pin",
      rangeCircleOverlayVisible: true,
      showListenerLocationMarker: true,
      speakerDisplay: "none",
      assetTypeDisplay: ["audio", "photo", "text"],
    },
    ui: {
      listenSidebar: { active: true, defaultOpen: true },
    },
  },
  audiotrack: {
    min_volume: 0.5,
    max_volume: 1.0,
    min_duration: 10.0,
    max_duration: 60.0,
    min_dead_air: 1.0,
    max_dead_air: 5.0,
  },
  categories: [
    { name: "Sound Type", data: "" },
    { name: "Location Type", data: "" },
  ],
  tags: [
    // Sound Type tags (categoryIndex 0)
    { value: "Nature", description: "Natural environment sounds", filter: "", data: "", categoryIndex: 0 },
    { value: "Human", description: "Voices, footsteps, activities", filter: "", data: "", categoryIndex: 0 },
    { value: "Mechanical", description: "Machines, vehicles, construction", filter: "", data: "", categoryIndex: 0 },
    { value: "Music", description: "Performances, busking, instruments", filter: "", data: "", categoryIndex: 0 },
    { value: "Silence", description: "Quiet, ambient, stillness", filter: "", data: "", categoryIndex: 0 },
    // Location Type tags (categoryIndex 1)
    { value: "Park", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Street", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Indoor", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Waterfront", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Transit", description: "", filter: "", data: "", categoryIndex: 1 },
  ],
  uiGroups: [
    {
      name: "Sound Type",
      header_text: "What type of sound is this?",
      ui_mode: "speak",
      select_type: "single",
      is_active: true,
      categoryIndex: 0,
      tagIndices: [0, 1, 2, 3, 4],
    },
    {
      name: "Location Type",
      header_text: "Where did you record this?",
      ui_mode: "speak",
      select_type: "single",
      is_active: true,
      categoryIndex: 1,
      tagIndices: [5, 6, 7, 8, 9],
    },
  ],
  speakers: [],
};

export default soundmap;
