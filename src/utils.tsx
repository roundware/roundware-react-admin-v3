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

export function csvToJSON<T>(csv: string): T[] {
  const lines = csv.split("\r\n");

  const result = [];

  const headers = lines[0].split(",");
  /* Iterate over the remaning data rows */
  for (let i = 1; i < lines.length; i++) {
    /* Empty object to store result in key value pair */
    const jsonObject: Record<string, unknown> = {};
    /* Store the current array element */
    const currentArrayString = lines[i];
    let string = "";

    let quoteFlag = 0;
    let arrayOpenFlag = false;
    let objectOpen = false;
    for (let character of currentArrayString) {
      if (character === "[" && !arrayOpenFlag) {
        arrayOpenFlag = true;
      } else if (character === "]" && arrayOpenFlag) {
        arrayOpenFlag = false;
      }

      if (character === "{") {
        objectOpen = true;
      } else if (character === "}") {
        objectOpen = false;
      }

      if (character === '"' && quoteFlag === 0 && !arrayOpenFlag) {
        quoteFlag = 1;
      } else if (character === '"' && quoteFlag == 1 && !arrayOpenFlag)
        quoteFlag = 0;
      if (character === "," && quoteFlag === 0 && !arrayOpenFlag)
        character = "|";
      if (
        character === "," &&
        quoteFlag === 0 &&
        arrayOpenFlag &&
        !objectOpen
      ) {
        character = `||`;
      }
      if ([`[`, `]`].includes(character)) continue;
      if (character == `"` && !objectOpen) continue;
      if (character == `"` && string[string.length - 1] == `"`) continue;
      string += character;
    }

    const jsonProperties = string.split("|");

    for (let j = 0; j < headers.length; j++) {
      if (jsonProperties[j].includes(",") && jsonProperties[j].includes(`{`)) {
        jsonObject[headers[j]] = jsonProperties[j].split("||").map((item) => {
          const s =
            "[" +
            item.trim().replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ') +
            "]";

          return JSON.parse(s);
        });
      } else if (jsonProperties[j].includes(`,`)) {
        jsonObject[headers[j]] = jsonProperties[j]
          .split(`,`)
          .map((i) => trim(i));
      } else if (jsonProperties[j] == `TRUE`) {
        jsonObject[headers[j]] = true;
      } else if (jsonProperties[j] == `FALSE`) {
        jsonObject[headers[j]] = false;
      } else {
        jsonObject[headers[j]] = jsonProperties[j];
      }
    }
    /* Push the genearted JSON object to resultant array */
    result.push(jsonObject);
  }
  return result as unknown as T[]; //JSON
}

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
