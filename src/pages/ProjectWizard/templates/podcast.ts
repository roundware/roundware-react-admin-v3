import { WizardTemplate } from "../types";

/**
 * Podcast / Radio Show.
 *
 * The one template whose purpose is *capturing* rather than listening. A show
 * points its audience here to leave audio; the alternative today is "record a
 * voice memo and email it to us", which loses most people. Geography is
 * irrelevant, so the map is stripped back as far as the app allows and the
 * tags are about the show rather than about place.
 *
 * Listening stays on so contributors can hear what others sent — for a show
 * that is part of the draw. A submission-only variant is one config edit away
 * (`listen_enabled: false`).
 */
const podcast: WizardTemplate = {
  key: "podcast",
  name: "Podcast / Radio Show",
  description:
    "Collect audio from your listeners. Built for capturing contributions rather than exploring a map — no location required, with a speak-first interface and prompts tied to your show.",
  icon: "Podcasts",
  project: {
    listen_enabled: true,
    geo_listen_enabled: false,
    speak_enabled: true,
    geo_speak_enabled: false,
    // Voicemail length. Long enough for a real answer, short enough to edit.
    max_recording_length_sec: 120,
    recording_radius: 30,
    auto_submit: false,
    ordering: "by_weight",
    repeat_mode: "stop",
    out_of_range_distance: 1000,
    recording_method: "standard",
  },
  // Geography is off, not merely de-emphasised: no range circle, no listener
  // marker, no bounds markers, no map overlay on the listen page. The sidebar
  // carries browsing instead, since the map cannot.
  config: {
    speak: { uploadAsSpeaker: false },
    listen: {
      availableListenModes: ["map"],
      geoListenMode: ["map"],
      autoplay: true,
    },
    map: {
      bounds: "auto",
      assetDisplay: "pin",
      rangeCircleOverlayVisible: false,
      showListenerLocationMarker: false,
      showBoundsMarkers: false,
      listenMapOverlayDisplay: false,
      speakerDisplay: "none",
      assetTypeDisplay: ["audio"],
    },
    ui: {
      listenSidebar: {
        active: true,
        defaultOpen: true,
        history: { active: true, infoCardDefaultCollapsed: false },
      },
    },
  },
  audiotrack: {
    min_volume: 0.8,
    max_volume: 1.0,
    min_duration: 20.0,
    max_duration: 120.0,
    min_dead_air: 1.0,
    max_dead_air: 4.0,
  },
  categories: [
    { name: "Segment", data: "" },
    { name: "Format", data: "" },
  ],
  tags: [
    // Segment tags (categoryIndex 0)
    { value: "Listener Question", description: "Something to ask the hosts", filter: "", data: "", categoryIndex: 0 },
    { value: "Story", description: "A personal story for the show", filter: "", data: "", categoryIndex: 0 },
    { value: "Correction", description: "Something we got wrong", filter: "", data: "", categoryIndex: 0 },
    { value: "Response to Episode", description: "Reacting to something we aired", filter: "", data: "", categoryIndex: 0 },
    { value: "Voicemail", description: "Anything else on your mind", filter: "", data: "", categoryIndex: 0 },
    // Format tags (categoryIndex 1)
    { value: "Short", description: "Under a minute", filter: "", data: "", categoryIndex: 1 },
    { value: "Full Length", description: "Take your time", filter: "", data: "", categoryIndex: 1 },
  ],
  uiGroups: [
    {
      name: "Segment",
      header_text: "What are you sending in?",
      ui_mode: "speak",
      select_type: "single",
      is_active: true,
      categoryIndex: 0,
      tagIndices: [0, 1, 2, 3, 4],
    },
    {
      name: "Format",
      header_text: "How long is it?",
      ui_mode: "speak",
      select_type: "single",
      is_active: true,
      categoryIndex: 1,
      tagIndices: [5, 6],
    },
  ],
  speakers: [],
};

export default podcast;
