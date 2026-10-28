import { addDays, isAfter, isBefore, subDays } from "date-fns";
import { trim } from "lodash";
import { LocalizedString } from "types";
export const dateFormatter = (v: string): string | undefined => {
  if (!v) return;
  return new Date(v).toISOString();
};

/**
 * Convert per-field `_loc_admin` arrays (from backend admin response) into
 * an inline `localizations` dict for PATCH/POST.
 *
 * @param record  The form record containing `_loc_admin` arrays.
 * @param fieldMap  Maps admin field names to backend field_name values, e.g.
 *   `{"loc_msg_admin": "value", "loc_description_admin": "description"}`.
 * @returns `{lang_code: {field_name: text | null}}` dict ready for the API.
 */
export function buildLocalizationsPayload(
  record: Record<string, unknown>,
  fieldMap: Record<string, string>,
): Record<string, Record<string, string | null>> {
  const localizations: Record<string, Record<string, string | null>> = {};

  for (const [adminField, backendField] of Object.entries(fieldMap)) {
    const entries = record[adminField] as LocalizedString[] | undefined;
    if (!entries || !Array.isArray(entries)) continue;

    for (const entry of entries) {
      const langCode = entry.language_code;
      if (!langCode) continue;
      if (!localizations[langCode]) localizations[langCode] = {};
      localizations[langCode][backendField] = entry.text || null;
    }
  }

  return localizations;
}

export const mapLibraries: ["places", "drawing"] = ["places", "drawing"];

// Pin the Maps JS API version: Google removed DrawingManager (used for speaker
// shapes) as of v3.65. 3.64 is the last version that still includes it.
// TODO: replace DrawingManager with a custom polygon editor and drop this pin.
export const mapsApiVersion = "3.64";

export const isWithinRange = (date: Date, range: Date[]) => {
  range = range.sort((a, b) => (a > b ? 1 : -1));

  if (
    isAfter(date, subDays(range[0], 1)) &&
    isBefore(date, addDays(range[1], 1))
  )
    return true;

  return false;
};

export type DateRange = [Date, Date];
