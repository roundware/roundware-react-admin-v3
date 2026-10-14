// ---------------------------------------------------------------------------
// Which admin fields apply to which kind of project
// ---------------------------------------------------------------------------
//
// A holding pen, not a framework. Fields that only mean something for some
// projects have to be gated somewhere, and gating them inline spreads
// paradigm knowledge across every form that happens to touch one.
//
// The rules so far are all one question — is the project looping? — asked
// of speaker fields, a project field, and Advanced configuration's settings
// (2026-10-14). Pages that differ more than field by field (Audio Lab, App
// wording, the live-site card) ask isLooping themselves. Once rules depend
// on more than the recording method, this becomes the thing that gets
// generalized.
// See docs/010-backlog.md, "A general mechanism for conditional admin fields".

import { IProject } from "context/ProjectsContext";

type MaybeProject = Pick<IProject, "recording_method"> | null | undefined;

/** The looping paradigm: a contribution becomes a speaker in a synced mix,
 *  rather than an asset on the map. See docs/009 §7 decision 1. */
export const isLooping = (project: MaybeProject): boolean =>
  project?.recording_method === "looping";

/** Speaker parent/child. Hierarchy only exists to layer a contribution over a
 *  base loop, so in a standard project the two pickers are noise. */
export const showsSpeakerHierarchy = isLooping;

/** A speaker's variant recordings. Only looping mode's player switches
 *  between them; classic plays each speaker's one recording. */
export const showsSpeakerVariants = isLooping;

/** The project's default attenuation distance, for the speakers its web app
 *  creates — looping contributions. A standard project's speakers are made
 *  in the admin, each with its own. */
export const showsDefaultAttenuation = isLooping;

/**
 * Settings (ui_config_json paths) only looping projects use: looping mode's
 * speaker player, loop recording, and drawing loops on the map. Advanced
 * configuration leaves them out of its reference for other projects, unless
 * the project has set one (docs/009).
 */
const LOOPING_ONLY_SETTINGS = [
  // Looping mode's player (the framework's speaker engine; classic ignores them)
  "listen.speaker.replaceWithNoneProbability",
  "listen.speaker.loopPointUpdateProbability",
  "listen.speaker.slotConsiderationProbability",
  "listen.speaker.speakerRotationProbability",
  "listen.speaker.loopFractions",
  "listen.speaker.minVariantLoops",
  "listen.speaker.maxVariantLoops",
  "listen.speaker.variantCrossfadeDurationMs",
  "listen.speaker.newSpeakerFadeInDurationMs",
  "listen.speaker.alwaysOnWhenAvailable",
  "listen.speaker.prioritizeNewlySubmitted",
  "listen.speaker.newlySubmittedPriorityDurationMs",
  // Recording a loop
  "speak.baseRecordingLoopSelectionMethod",
  "speak.beatsPerLoop",
  "speak.clickTrack",
  "speak.micRecordingEffects",
  "speak.loopingRecordingVolumes",
  "speak.loopingRecordingPlaybackEffects",
  "speak.speakerShape",
  "speak.speakerShapeScale",
  "speak.attenuationDistance",
  // Loops on the map
  "map.speakerStateStyles.current_session",
  "map.speakerStateStyles.recent",
  "map.sessionCreatedRenderEffects",
  "map.recentSpeakerCount",
  "map.speakerConnectorStyles",
];

export const isLoopingOnlySetting = (path: string): boolean =>
  LOOPING_ONLY_SETTINGS.some((p) => path === p || path.startsWith(`${p}.`));
