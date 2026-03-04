import { MultiPolygon } from '@turf/helpers';
export interface ISpeaker {
  id: number;
  project_id: number;
  attenuation_distance: number;
  code: string;
  is_active: boolean;
  min_volume: number;
  max_volume: number;
  uri: string;
  backup_uri: string;
  variant_uris: string[];
  fill_color: string;
  border_color: string;
  shape: MultiPolygon;
  boundary?: unknown;
  attenuation_border?: unknown;
  created_at?: string;
  updated_at?: string;
}