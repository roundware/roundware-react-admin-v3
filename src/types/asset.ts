import { MultiPolygon } from "@turf/helpers";
import { IAssetData } from "roundware-web-framework/dist/types/asset";
import { LocalizedString } from "types";

/**
 * Strip index signatures from a type, keeping only named properties.
 * This lets us extend IAssetData without inheriting its broad index signature.
 */
type KnownKeys<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: T[K];
};

export interface IAsset
  extends Omit<
    KnownKeys<IAssetData>,
    | "filename"
    | "file"
    | "user"
    | "envelope_ids"
    | "description_loc_ids"
    | "alt_text_loc_ids"
  > {
  id: number;
  description: string;
  latitude: number;
  longitude: number;
  shape: MultiPolygon | null;
  filename?: string;
  file: string | { src: string } | Blob | null;
  volume: number;
  submitted: true;
  created: string;
  weight: number;
  project: number;
  language_id: number;
  description_loc_ids: number[] | string;
  alt_text_loc_ids: number[] | string;
  media_type: string;
  audio_length_in_seconds: number;
  tag_ids: number[];
  session_id: 1;
  envelope_ids: number[] | number;
  user_id?: number;
  user?: {
    id: number;
  };
  loc_description_admin?: LocalizedString[];
  loc_alt_text_admin?: LocalizedString[];
}
