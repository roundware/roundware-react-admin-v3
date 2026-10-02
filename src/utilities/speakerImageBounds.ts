// TWIN of the web app's placement in
// roundware-web-app-v3/src/components/ListenPage/Map/Speakers/SpeakerImages.tsx.
// Map appearance draws speaker images exactly where the app will, so keep
// the two in step.
import getCenterOfMass from "@turf/center-of-mass";
import destination from "@turf/destination";
import distance from "@turf/distance";
import { MultiPolygon, point, Point, polygon, Polygon } from "@turf/helpers";
import midpoint from "@turf/midpoint";

/**
 * The square a speaker's image is drawn in: centered on the shape's center
 * of mass, its corners halfway between the nearest and farthest edge
 * midpoints. Null for a shape too small to have edges.
 */
export function speakerImageBounds(shape: MultiPolygon | Polygon): google.maps.LatLngBoundsLiteral | null {
  const rings = shape.type === "MultiPolygon" ? shape.coordinates[0] : shape.coordinates;
  if (!rings?.[0] || rings[0].length < 4) return null;
  const poly = polygon(rings);
  const coordinates = poly.geometry.coordinates[0];

  const midpoints: Point[] = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    midpoints.push(midpoint(point(coordinates[i]), point(coordinates[i + 1])).geometry);
  }

  const center = getCenterOfMass(poly).geometry.coordinates;
  const distances = midpoints.map((m) => distance(center, m.coordinates, { units: "degrees" }));
  const avgDistance = (Math.min(...distances) + Math.max(...distances)) / 2;

  const corners = [0, 1, 2, 3].map(
    (i) => destination(center, avgDistance, 90 * i + 45, { units: "degrees" }).geometry.coordinates
  );
  return {
    north: corners[0][1],
    south: corners[2][1],
    east: corners[0][0],
    west: corners[2][0],
  };
}
