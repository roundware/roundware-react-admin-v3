import { useGoogleMap } from "@react-google-maps/api";
import { useEffect, useRef } from "react";

interface UseDrawingManagerOptions {
  /** When false the DrawingManager is removed from the map (or never created). */
  enabled?: boolean;
  /** Drawing modes to show in the toolbar. */
  drawingModes?: google.maps.drawing.OverlayType[];
  /** Shared options applied to circle, polygon, and rectangle overlays. */
  shapeOptions?: google.maps.PolygonOptions &
    google.maps.CircleOptions &
    google.maps.RectangleOptions;
  onCircleComplete?: (circle: google.maps.Circle) => void;
  onPolygonComplete?: (polygon: google.maps.Polygon) => void;
  onRectangleComplete?: (rectangle: google.maps.Rectangle) => void;
  /** Called after the DrawingManager is created and added to the map. */
  onLoad?: (dm: google.maps.drawing.DrawingManager) => void;
}

/**
 * Imperative hook that manages a `google.maps.drawing.DrawingManager` directly,
 * bypassing @react-google-maps/api's `DrawingManagerF` which has a stale-closure
 * cleanup bug under React 18 StrictMode (double-mount creates two overlapping
 * DrawingManagers because the first is never removed from the map).
 *
 * The cleanup here captures the `dm` local variable (not React state), so it
 * always removes the correct instance on unmount.
 */
export function useDrawingManager({
  enabled = true,
  drawingModes,
  shapeOptions,
  onCircleComplete,
  onPolygonComplete,
  onRectangleComplete,
  onLoad,
}: UseDrawingManagerOptions) {
  const map = useGoogleMap();
  const dmRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  // Keep stable refs for callbacks so the effect doesn't re-run when they change
  const onCircleRef = useRef(onCircleComplete);
  const onPolygonRef = useRef(onPolygonComplete);
  const onRectangleRef = useRef(onRectangleComplete);
  const onLoadRef = useRef(onLoad);

  onCircleRef.current = onCircleComplete;
  onPolygonRef.current = onPolygonComplete;
  onRectangleRef.current = onRectangleComplete;
  onLoadRef.current = onLoad;

  useEffect(() => {
    if (!map || !enabled) return;

    const dm = new google.maps.drawing.DrawingManager({
      drawingControlOptions: {
        drawingModes: drawingModes ?? [],
      },
      circleOptions: shapeOptions,
      polygonOptions: shapeOptions,
      rectangleOptions: shapeOptions,
      map,
    });

    dmRef.current = dm;

    const listeners: google.maps.MapsEventListener[] = [];

    listeners.push(
      google.maps.event.addListener(dm, "circlecomplete", (c: google.maps.Circle) => {
        onCircleRef.current?.(c);
      })
    );
    listeners.push(
      google.maps.event.addListener(dm, "polygoncomplete", (p: google.maps.Polygon) => {
        onPolygonRef.current?.(p);
      })
    );
    listeners.push(
      google.maps.event.addListener(dm, "rectanglecomplete", (r: google.maps.Rectangle) => {
        onRectangleRef.current?.(r);
      })
    );

    onLoadRef.current?.(dm);

    // Cleanup captures `dm` directly — always valid, even in StrictMode.
    return () => {
      listeners.forEach((l) => google.maps.event.removeListener(l));
      dm.setMap(null);
      dmRef.current = null;
    };
  }, [map, enabled]); // re-run when map changes or enabled toggles

  // Apply mode changes to the existing manager rather than rebuilding it.
  //
  // The effect above deliberately does not depend on `drawingModes` — callers
  // pass a fresh array literal each render, and depending on it would tear
  // down and recreate the DrawingManager on every render. The cost of leaving
  // it out was that a caller who supplied its modes *after* first render (via
  // state, to defer touching the OverlayType enum) got a toolbar built from
  // the empty initial array, with no buttons and no error. Keying on the
  // contents rather than the array identity gets both.
  const modeKey = (drawingModes ?? []).join(",");
  useEffect(() => {
    const dm = dmRef.current;
    if (!dm) return;
    dm.setOptions({
      drawingControlOptions: { drawingModes: drawingModes ?? [] },
    });
    // drawingModes is intentionally tracked by content, not identity.
  }, [modeKey]);

  return dmRef;
}
