import { WizardTemplate } from "../types";

/**
 * User Feedback (Halsey, 2026-10-20).
 *
 * The record-only template: a digital voicemail box. People leave a message
 * and only the team hears it — Listen is off, so there's no map, playback
 * or speakers, and the app opens straight on recording (server docs/025).
 * Usually it lives on the author's own site, so the recording embed step
 * is offered and starts on.
 */
const userfeedback: WizardTemplate = {
  key: "userfeedback",
  active: true,
  name: "User Feedback",
  description:
    "Gather recordings from your audience; like a digital voicemail box. Only your team hears them, and the recorder can sit on your own website.",
  icon: "Feedback",
  project: {
    listen_enabled: false,
    geo_listen_enabled: false,
    speak_enabled: true,
    // Where someone is rarely matters to their feedback.
    geo_speak_enabled: false,
    max_recording_length_sec: 180,
    // Reviewed by the team first: should Listen be turned on later, no
    // message goes public unreviewed.
    auto_submit: false,
    allow_speak_tags: true,
    allow_photos: false,
    allow_text: true,
    recording_method: "standard",
  },
  config: {},
  // Not shown (nobody listens); made from these if Listen is turned on later.
  audiotrack: {
    min_volume: 0.8,
    max_volume: 1.0,
    min_duration: 20.0,
    max_duration: 180.0,
    min_dead_air: 1.0,
    max_dead_air: 4.0,
  },
  categories: [{ name: "Feedback Type", data: "" }],
  tags: [
    { value: "Praise", description: "Something you liked", filter: "", data: "", categoryIndex: 0 },
    { value: "Suggestion", description: "An idea to make things better", filter: "", data: "", categoryIndex: 0 },
    { value: "Problem", description: "Something that went wrong", filter: "", data: "", categoryIndex: 0 },
    { value: "Question", description: "Something you'd like answered", filter: "", data: "", categoryIndex: 0 },
    { value: "Other", description: "Anything else on your mind", filter: "", data: "", categoryIndex: 0 },
  ],
  uiGroups: [
    {
      name: "Feedback Type",
      header_text: "What's your message about?",
      ui_mode: "speak",
      select_type: "single",
      is_active: true,
      categoryIndex: 0,
      tagIndices: [0, 1, 2, 3, 4],
    },
  ],
  speakers: [],
  skipSpeakers: true,
  optionalSteps: { embed: true },
};

export default userfeedback;
