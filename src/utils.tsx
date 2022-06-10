import { LocalizedString } from "types";
import { DataProvider, RaRecord } from "react-admin";
export const dateFormatter = (v: string): string | undefined => {
  if (!v) return;
  return new Date(v).toISOString();
};

export const handleLocalizedStrings = async (
  messages: LocalizedString[],
  dataProvider: DataProvider
): Promise<number[]> => {
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
