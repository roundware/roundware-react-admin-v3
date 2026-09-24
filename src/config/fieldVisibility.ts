// ---------------------------------------------------------------------------
// Which admin fields apply to which kind of project
// ---------------------------------------------------------------------------
//
// A holding pen, not a framework. Fields that only mean something for some
// projects have to be gated somewhere, and gating them inline spreads
// paradigm knowledge across every form that happens to touch one.
//
// There is only one real rule so far, so there is no point designing a
// declarative system around it — the shape would be a guess. The rule lives
// here instead so the next few land together, and once there are enough of
// them to see the pattern, this becomes the thing that gets generalised.
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
