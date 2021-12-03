import centerOfMass from "@turf/center-of-mass";
import {
  featureCollection,
  MultiPolygon,
  multiPolygon,
  Polygon,
  multiLineString,
  polygon,
  MultiLineString,
  LineString,  
} from "@turf/helpers";
import { polygonToLine } from "@turf/polygon-to-line";
import area from "@turf/area";
import buffer from "@turf/buffer";
import { getCoord } from "@turf/invariant";
import { ISpeaker } from "types/speaker";
export const getGoogleMapsCenter = (
  speakers: ISpeaker[]
): google.maps.LatLng => {
  // get polygons from all speakers
  const polygons = speakers.map((s) => multiPolygon(s.shape.coordinates));

  // create a feature collection
  const polygonCollection = featureCollection(polygons);

  // now get the center of it

  const center = centerOfMass(polygonCollection);
  const [lat, lng] = getCoord(center);
  return new window.google.maps.LatLng(lng, lat);
};

/** gets google map paths from geojson polygon */
export const polygonToGoogleMapPaths = (polygon: MultiPolygon | Polygon): google.maps.LatLng[] => {
  let coordinates;
  if (polygon.type == "MultiPolygon") coordinates = polygon.coordinates[0][0];
  else coordinates = polygon.coordinates[0];
  return coordinates?.map((p) => new window.google.maps.LatLng(p[1], p[0]));
};

/** converts googleMap LatLng paths to GeoJSON paths (reverses the coordinates) */
export const googleMapPathToGeoJSONPath = (paths: google.maps.LatLng[]): number[][] =>   paths.map((p) => [p.lng(), p.lat()]);

/** return calculated speaker.shape, boundary, attenuation_border objects */
export const getSpeakerGeoJSONObjectsForPath = (path: number[][], attenuation_distance: number): {
    shape: MultiPolygon;
    attenuation_border: LineString | MultiLineString;
    boundary: MultiLineString;
} => {

  
  /** form a closed ring first */
  path = [...path, path[0]];

  /** get multipolygon with single polygon forom the path */
  const shape = multiPolygon([[path]]).geometry;
  
  /** boundary */
  const boundary = multiLineString([path]).geometry;

  /** line string by subtracting attenuation distance */
  const attenuation_border = polygonToLine(buffer(polygon([path]).geometry, -attenuation_distance, { units: 'meters' }).geometry).geometry;
  
  /** if area is becoming zero, alert the user about it */
  const speakerArea = area(polygon([path]));
  if(speakerArea <= 0) alert(`Speaker area has become zero. Please use a smaller attenuation radius or increase the polygon shape!`)
  
  return {shape, attenuation_border, boundary }
}