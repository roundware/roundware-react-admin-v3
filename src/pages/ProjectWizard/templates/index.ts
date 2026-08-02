import { WizardTemplate } from "../types";
import soundwalk from "./soundwalk";
import storycollection from "./storycollection";
import soundmap from "./soundmap";
import artinstallation from "./artinstallation";
import podcast from "./podcast";
import collectiveloops from "./collectiveloops";

/**
 * All available wizard templates.
 *
 * Ordered asset-paradigm first, then the looping paradigm. The two paradigms
 * are not a stored field — `config.speak.uploadAsSpeaker` *is* the paradigm
 * (roundware-server-v3/docs/009-configuration.md §7 decisions 2 and 8), so the
 * grouping below is presentation only and free to change.
 */
export const TEMPLATES: WizardTemplate[] = [
  soundwalk,
  soundmap,
  storycollection,
  podcast,
  artinstallation,
  collectiveloops,
];

export function getTemplate(key: string): WizardTemplate | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

/**
 * Seed for "Start from Scratch", where no template is chosen.
 *
 * This is not merely an empty document, because the web app's own defaults are
 * Choir-flavoured: `config.ts` ships `uploadAsSpeaker: true` and
 * `recordingMethod: "looping"`, presumably inherited from the Invisible Choir
 * project it grew out of. The server's `recording_method` column, meanwhile,
 * defaults to `"standard"` — and the column wins.
 *
 * So a project created with an empty config lands in an incoherent hybrid:
 * contributions become speakers (`uploadAsSpeaker: true`, no column to
 * override it) while recording behaves as standard. Pinning the paradigm here
 * makes a from-scratch project coherent without changing the app-wide default,
 * which would affect every already-deployed project.
 *
 * The underlying mismatch is tracked in
 * roundware-server-v3/docs/010-backlog.md.
 */
export const SCRATCH_CONFIG = {
  speak: { uploadAsSpeaker: false },
};
