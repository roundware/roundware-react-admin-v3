import centerOfMass from '@turf/center-of-mass';
import { featureCollection, multiPolygon } from '@turf/helpers';
import { getCoord } from '@turf/invariant';
import { ISpeaker } from 'types/speaker';
export const getGoogleMapsCenter = (speakers: ISpeaker[]): google.maps.LatLng => {
  
    // get polygons from all speakers
    const polygons = speakers.map((s) =>
      multiPolygon(s.shape.coordinates)
    );
  
      // create a feature collection
    let polygonCollection = featureCollection(polygons);

  // now get the center of it

  const center = centerOfMass(polygonCollection);
  const [lat,lng] = getCoord(center)
  return new window.google.maps.LatLng(lng,lat)
}
