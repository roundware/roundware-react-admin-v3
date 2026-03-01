// Turf.js modules — their package.json "exports" don't resolve types
// correctly with moduleResolution: "bundler". Declaring them here
// allows tsc to find the types via the .d.ts files that DO exist
// in each package's dist/js/ folder.
declare module "@turf/helpers" {
  export type Position = number[];
  export type BBox = [number, number, number, number];

  export interface GeoJSONObject {
    type: string;
    bbox?: BBox;
  }

  export interface Geometry extends GeoJSONObject {
    coordinates: any;
  }

  export interface MultiPolygon extends Geometry {
    type: "MultiPolygon";
    coordinates: Position[][][];
  }

  export interface Polygon extends Geometry {
    type: "Polygon";
    coordinates: Position[][];
  }

  export interface LineString extends Geometry {
    type: "LineString";
    coordinates: Position[];
  }

  export interface MultiLineString extends Geometry {
    type: "MultiLineString";
    coordinates: Position[][];
  }

  export interface Point extends Geometry {
    type: "Point";
    coordinates: Position;
  }

  export interface Feature<G extends Geometry = Geometry, P = Record<string, any>> {
    type: "Feature";
    geometry: G;
    properties: P;
    bbox?: BBox;
  }

  export interface FeatureCollection<G extends Geometry = Geometry> {
    type: "FeatureCollection";
    features: Feature<G>[];
  }

  export type Units = "meters" | "kilometers" | "miles" | "degrees" | "radians";

  export function multiPolygon(
    coordinates: Position[][][][],
    properties?: Record<string, any>
  ): Feature<MultiPolygon>;

  export function polygon(
    coordinates: Position[][],
    properties?: Record<string, any>
  ): Feature<Polygon>;

  export function point(
    coordinates: Position,
    properties?: Record<string, any>
  ): Feature<Point>;

  export function lineString(
    coordinates: Position[],
    properties?: Record<string, any>
  ): Feature;

  export function multiLineString(
    coordinates: Position[][],
    properties?: Record<string, any>
  ): Feature<MultiLineString>;

  export function featureCollection<G extends Geometry = Geometry>(
    features: Feature<G>[]
  ): FeatureCollection<G>;
}

declare module "@turf/area" {
  import { Feature, Geometry } from "@turf/helpers";
  export default function area(geojson: Feature<Geometry> | Geometry): number;
}

declare module "@turf/bbox" {
  import { Feature, Geometry, BBox } from "@turf/helpers";
  export default function bbox(geojson: Feature<Geometry> | Geometry): BBox;
}

declare module "@turf/boolean-equal" {
  import { Feature, Geometry } from "@turf/helpers";
  export default function booleanEqual(
    feature1: Feature<Geometry> | Geometry,
    feature2: Feature<Geometry> | Geometry
  ): boolean;
}

declare module "@turf/buffer" {
  import { Feature, Geometry, Units } from "@turf/helpers";
  export default function buffer(
    geojson: Feature<Geometry> | Geometry,
    radius: number,
    options?: { units?: Units; steps?: number }
  ): Feature<Geometry>;
}

declare module "@turf/center-of-mass" {
  import { Feature, Geometry, Point } from "@turf/helpers";
  export default function centerOfMass(
    geojson: Feature<Geometry> | Geometry
  ): Feature<Point>;
}

declare module "@turf/invariant" {
  import { Feature, Geometry, Position } from "@turf/helpers";
  export function getCoord(coord: Feature | Geometry | Position): Position;
  export function getCoords(coords: Feature | Geometry): any;
}

declare module "@turf/line-to-polygon" {
  import { Feature, Geometry, Polygon } from "@turf/helpers";
  export default function lineToPolygon(
    lines: Feature<Geometry> | Geometry
  ): Feature<Polygon>;
}

declare module "@turf/polygon-to-line" {
  import { Feature, Polygon, Geometry } from "@turf/helpers";
  export function polygonToLine(
    polygon: Feature<Polygon> | Polygon
  ): Feature<Geometry>;
}
