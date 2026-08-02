import { WizardTemplate } from "../types";
import standard from "./standard";
import soundwalk from "./soundwalk";
import storycollection from "./storycollection";
import soundmap from "./soundmap";
import artinstallation from "./artinstallation";
import podcast from "./podcast";
import collectiveloops from "./collectiveloops";

/**
 * All available wizard templates.
 *
 * `standard` comes first and is the neutral starting point — it replaced the
 * old "Start from Scratch" option, which was the wizard's initial state (so it
 * rendered pre-selected) and produced a project with no tags or UI groups.
 *
 * The rest are ordered asset-paradigm first, then the looping paradigm. The
 * paradigm is not a stored field — `config.speak.uploadAsSpeaker` *is* the
 * paradigm (roundware-server-v3/docs/009-configuration.md §7 decisions 2 and
 * 8), so the grouping is presentation only and free to change.
 */
export const TEMPLATES: WizardTemplate[] = [
  standard,
  soundwalk,
  soundmap,
  storycollection,
  podcast,
  artinstallation,
  collectiveloops,
];

/** The template used when nothing is selected. See `standard`. */
export const DEFAULT_TEMPLATE_KEY = standard.key;

export function getTemplate(key: string): WizardTemplate | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

/**
 * Fallback config seed, used only if project creation somehow runs with no
 * template selected. The wizard no longer allows that — the template step
 * requires a choice — but the paradigm is pinned here anyway rather than left
 * to the web app's defaults, which are Choir-flavoured (`uploadAsSpeaker: true`,
 * `recordingMethod: "looping"`, inherited from the Invisible Choir project the
 * app grew out of).
 *
 * That combination is inert rather than harmful — `uploadAsSpeaker` is only
 * read inside the looping recording flow, so with `recording_method: "standard"`
 * it is never consulted — but an explicit document is still the honest thing to
 * store. See roundware-server-v3/docs/010-backlog.md.
 */
export const FALLBACK_CONFIG = {
  speak: { uploadAsSpeaker: false },
};
