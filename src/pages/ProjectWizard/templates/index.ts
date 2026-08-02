import { WizardTemplate } from "../types";
import standard from "./standard";
import soundwalk from "./soundwalk";
import storycollection from "./storycollection";
import soundmap from "./soundmap";
import artinstallation from "./artinstallation";
import podcast from "./podcast";
import collectiveloops from "./collectiveloops";

/**
 * Every template that exists, including retired ones.
 *
 * `standard` comes first and is the neutral starting point — it replaced the
 * old "Start from Scratch" option, which was the wizard's initial state (so it
 * rendered pre-selected) and produced a project with no tags or UI groups.
 *
 * The rest are ordered asset-paradigm first, then the looping paradigm. The
 * paradigm is carried by the `recording_method` column, not by a separate type
 * field (roundware-server-v3/docs/009-configuration.md §7 decisions 2 and 8),
 * so the grouping is presentation only and free to change.
 *
 * To stop offering one, set `active: false` in its own file rather than
 * removing it from this list — see `ACTIVE_TEMPLATES`.
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

/**
 * The templates the wizard actually offers.
 *
 * Use this for anything user-facing; use `TEMPLATES` when you need the full
 * set. Keeping retired templates in the codebase rather than deleting them
 * means a narrowed list for user testing costs one boolean and is reversible.
 */
export const ACTIVE_TEMPLATES: WizardTemplate[] = TEMPLATES.filter((t) => t.active);

/** The template recommended to anyone unsure. Null if it has been retired. */
export const DEFAULT_TEMPLATE = standard.active ? standard : null;

/**
 * Look up a template by key.
 *
 * Deliberately searches **all** templates, not just active ones: a key can
 * outlive its template's visibility, and creation should still work if one is
 * retired mid-session.
 */
export function getTemplate(key: string): WizardTemplate | undefined {
  return TEMPLATES.find((t) => t.key === key);
}
