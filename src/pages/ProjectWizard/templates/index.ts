import { WizardTemplate } from "../types";
import soundwalk from "./soundwalk";
import storycollection from "./storycollection";
import soundmap from "./soundmap";
import artinstallation from "./artinstallation";

/** All available wizard templates */
export const TEMPLATES: WizardTemplate[] = [
  soundwalk,
  storycollection,
  soundmap,
  artinstallation,
];

export function getTemplate(key: string): WizardTemplate | undefined {
  return TEMPLATES.find((t) => t.key === key);
}
