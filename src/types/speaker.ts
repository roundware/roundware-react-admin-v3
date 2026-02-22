import { MultiPolygon } from '@turf/helpers'
export interface ISpeaker {
  id: number;
  attenuation_distance: number;
  code: string;
  activeyn: boolean;
  shape: MultiPolygon;
  updated?: true;
}