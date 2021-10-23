export interface IAsset {
  id: number;
  description: string;
  latitude: number;
  longitude: number;
  shape: null;
  filename: string;
  file: string | Blob | null;
  volume: number;
  submitted: true;
  created: string;
  weight: number;
  project: number;
  language_id: number;
  description_loc_ids: number[];
  alt_text_loc_ids: number[];
  media_type: string;
  audio_length_in_seconds: number;
  tag_ids: number[];
  session_id: 1;
  envelope_ids: number[];
}
