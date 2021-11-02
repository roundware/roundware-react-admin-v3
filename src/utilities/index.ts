import centerOfMass from "@turf/center-of-mass";
import {
  featureCollection,
  MultiPolygon,
  multiPolygon,
  Polygon,
  multiLineString,
  lineString,
  polygon,
  
} from "@turf/helpers";
import buffer from "@turf/buffer";
import { getCoord } from "@turf/invariant";
import { ISpeaker } from "types/speaker";
export const getGoogleMapsCenter = (
  speakers: ISpeaker[]
): google.maps.LatLng => {
  // get polygons from all speakers
  const polygons = speakers.map((s) => multiPolygon(s.shape.coordinates));

  // create a feature collection
  let polygonCollection = featureCollection(polygons);

  // now get the center of it

  const center = centerOfMass(polygonCollection);
  const [lat, lng] = getCoord(center);
  return new window.google.maps.LatLng(lng, lat);
};

/** gets google map paths from geojson polygon */
export const polygonToGoogleMapPaths = (polygon: MultiPolygon | Polygon) => {
  let coordinates;
  if (polygon.type == "MultiPolygon") coordinates = polygon.coordinates[0][0];
  else coordinates = polygon.coordinates[0];
  return coordinates?.map((p) => new window.google.maps.LatLng(p[1], p[0]));
};

/** converts googleMap LatLng paths to GeoJSON paths (reverses the coordinates) */
export const googleMapPathToGeoJSONPath = (paths: google.maps.LatLng[]) =>   paths.map((p) => [p.lng(), p.lat()]);

/** return calculated speaker.shape, boundary, attenuation_border objects */
export const getSpeakerGeoJSONObjectsForPath = (path: number[][], attenuation_distance: number) => {

  

  /** get multipolygon with single polygon forom the path */
  let shape = multiPolygon([[path]]).geometry;
  
  /** boundary */
  const boundary = multiLineString([path]).geometry;

  /** line string by subtracting attenuation distance */
  const attenuation_border = buffer(shape, -attenuation_distance, { units: 'meters' });
  
  

  console.info(shape, boundary, attenuation_border);
  return {shape, attenuation_border, boundary }
}