import { WizardTemplate } from "../types";

const soundwalk: WizardTemplate = {
  key: "soundwalk",
  name: "Sound Walk",
  description:
    "Outdoor, geo-enabled project for guided audio walks. Participants contribute and listen to sounds tied to specific locations along a walking route.",
  icon: "DirectionsWalk",
  project: {
    listen_enabled: true,
    geo_listen_enabled: true,
    speak_enabled: true,
    geo_speak_enabled: true,
    max_recording_length_sec: 60,
    recording_radius: 30,
    auto_submit: true,
    ordering: "random",
    repeat_mode: "stop",
    out_of_range_distance: 500,
    recording_method: "standard",
  },
  // Walking is the point: default to the walking listen mode, tight zoom, and
  // bounds that follow the route rather than a fixed frame.
  config: {
    speak: { uploadAsSpeaker: false },
    listen: {
      availableListenModes: ["map", "walking"],
      geoListenMode: ["walking"],
      autoplay: true,
    },
    map: {
      bounds: "auto",
      assetDisplay: "pin",
      rangeCircleOverlayVisible: true,
      showListenerLocationMarker: true,
      speakerDisplay: "none",
    },
  },
  audiotrack: {
    min_volume: 0.6,
    max_volume: 1.0,
    min_duration: 15.0,
    max_duration: 45.0,
    min_dead_air: 2.0,
    max_dead_air: 8.0,
  },
  categories: [
    { name: "Sound Type", data: "" },
    { name: "Mood", data: "" },
  ],
  tags: [
    // Sound Type tags (categoryIndex 0)
    { value: "Nature", description: "Birds, wind, water, etc.", filter: "", data: "", categoryIndex: 0 },
    { value: "Urban", description: "Traffic, construction, crowds", filter: "", data: "", categoryIndex: 0 },
    { value: "Music", description: "Street musicians, singing, instruments", filter: "", data: "", categoryIndex: 0 },
    { value: "Voice", description: "Narration, conversation, storytelling", filter: "", data: "", categoryIndex: 0 },
    // Mood tags (categoryIndex 1)
    { value: "Peaceful", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Energetic", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Mysterious", description: "", filter: "", data: "", categoryIndex: 1 },
    { value: "Nostalgic", description: "", filter: "", data: "", categoryIndex: 1 },
  ],
  uiGroups: [
    {
      name: "Sound Type",
      header_text: "What kind of sound is this?",
      ui_mode: "speak",
      select_type: "single",
      is_active: true,
      categoryIndex: 0,
      tagIndices: [0, 1, 2, 3],
    },
    {
      name: "Mood",
      header_text: "What mood does this evoke?",
      ui_mode: "speak",
      select_type: "multi",
      is_active: true,
      categoryIndex: 1,
      tagIndices: [4, 5, 6, 7],
    },
  ],
  speakers: [],
};

export default soundwalk;
