import { MultiPolygon } from '@turf/helpers'
export interface ISpeaker {
  id: number;
  attenuation_distance: number;
  shape: MultiPolygon;
  updated?: true;
}