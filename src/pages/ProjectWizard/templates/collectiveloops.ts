import { WizardTemplate } from "../types";

/**
 * Collective Loops — the "Invisible Choir" paradigm.
 *
 * The only template with `recording_method: "looping"`, which is what makes a
 * contribution become a *speaker* joining the continuous mix rather than an
 * asset pinned to the map. Everyone hears the accumulating result, synced to a shared
 * loop, rather than browsing individual recordings.
 *
 * Two things follow from that and are easy to miss:
 *
 *  - `recording_method: "looping"` is a project *column*, not config, so it
 *    lives in the `project` block below (docs/009 §7 decision 4). It carries
 *    the whole paradigm: `speak.uploadAsSpeaker` is derived from it, since
 *    synchronised looping only works through speakers.
 *  - The project needs at least one active speaker carrying audio before it is
 *    published — the base loop the first participant sings against. One is
 *    seeded here; the wizard's Speakers step is where its audio is uploaded.
 *    Publishing without it is what the Publish page warns about.
 *
 * The engine tuning in `listen.speaker` is deliberately absent: the web app's
 * config.ts defaults are already the Choir defaults, so overriding them here
 * would just be a second copy to keep in sync.
 */
const collectiveloops: WizardTemplate = {
  key: "collectiveloops",
  name: "Collective Loops",
  description:
    "Participants record over a shared looping base track, and each contribution joins a continuous collective mix that everyone hears. Best for installations and choral pieces rather than map browsing.",
  icon: "GraphicEq",
  project: {
    listen_enabled: true,
    geo_listen_enabled: true,
    speak_enabled: true,
    geo_speak_enabled: false,
    // One loop's worth. Longer recordings drift out of sync.
    max_recording_length_sec: 30,
    recording_radius: 30,
    auto_submit: true,
    ordering: "random",
    repeat_mode: "continuous",
    out_of_range_distance: 1000,
    // The paradigm's other half — a column, so it cannot go in config.
    recording_method: "looping",
  },
  config: {
    speak: {
      // The paradigm itself comes from recording_method: "looping" above —
      // uploads become speakers because that is the only way synchronised
      // looping works. Nothing to declare here.
      // A contributor should hear their own take enter the mix.
      baseRecordingLoopSelectionMethod: "all",
    },
    listen: {
      availableListenModes: ["map"],
      geoListenMode: ["map"],
      autoplay: true,
      speaker: {
        // Newly submitted loops get picked up sooner, so contributors hear
        // themselves join rather than waiting for a random rotation.
        prioritizeNewlySubmitted: true,
      },
    },
    map: {
      bounds: "auto",
      // Speakers are the content here, so they are what the map shows.
      speakerDisplay: "polygons",
      rangeCircleOverlayVisible: false,
      showListenerLocationMarker: true,
      showBoundsMarkers: false,
    },
    ui: {
      // There is no asset archive to browse — the mix is the experience.
      listenSidebar: { active: false, defaultOpen: false },
    },
  },
  audiotrack: {
    min_volume: 1.0,
    max_volume: 1.0,
    min_duration: 20.0,
    max_duration: 60.0,
    min_dead_air: 0.0,
    max_dead_air: 0.0,
  },
  categories: [{ name: "Part", data: "" }],
  tags: [
    { value: "Low", description: "Bass and low harmony", filter: "", data: "", categoryIndex: 0 },
    { value: "Middle", description: "Mid-range harmony", filter: "", data: "", categoryIndex: 0 },
    { value: "High", description: "Upper harmony and melody", filter: "", data: "", categoryIndex: 0 },
    { value: "Rhythm", description: "Percussive or rhythmic parts", filter: "", data: "", categoryIndex: 0 },
  ],
  uiGroups: [
    {
      name: "Part",
      header_text: "Which part are you singing?",
      ui_mode: "speak",
      select_type: "single",
      is_active: true,
      categoryIndex: 0,
      tagIndices: [0, 1, 2, 3],
    },
  ],
  speakers: [
    {
      code: "base-loop",
      is_active: true,
      attenuation_distance: 100,
      min_volume: 0.0,
      max_volume: 1.0,
      fill_color: "#3f51b5",
      border_color: "#1a237e",
    },
  ],
};

export default collectiveloops;
