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
