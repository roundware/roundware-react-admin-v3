import { trim } from "lodash";
import { DataProvider, RaRecord } from "react-admin";
import { LocalizedString } from "types";
export const dateFormatter = (v: string): string | undefined => {
  if (!v) return;
  return new Date(v).toISOString();
};

export const handleLocalizedStrings = async (
  messages: LocalizedString[],
  dataProvider: DataProvider
): Promise<number[]> => {
  if (!messages) return [];
  // update, delete or create the localized string
  // if empty text then just delete
  // if no id then create
  // else update
  const promises = messages
    .filter((m) => !!m)
    .map((m) =>
      dataProvider[m.id ? (m.text ? `update` : `delete`) : `create`](
        `localizedstrings`,
        {
          id: m.id as RaRecord[`id`],
          data: m,
          previousData: m as RaRecord,
        }
      )
    );

  // execute requests  in parallel
  const responses = await Promise.all(promises);

  // filter ids that need to be deleted and sent what was create dor updated
  return responses
    .filter((r) => !messages.some((m) => m.text == "" && m.id == r.data.id))
    .map((r) => parseInt(r.data.id.toString()));
};

export const mapLibraries: ["places", "drawing"] = ["places", "drawing"];

export function csvToJSON<T>(csv: string): T[] {
  const lines = csv.split("\n");

  const result = [];

  const headers = lines[0].split(",");
  /* Iterate over the remaning data rows */
  for (let i = 1; i < lines.length - 1; i++) {
    /* Empty object to store result in key value pair */
    const jsonObject: any = {};
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
  return result; //JSON
}
