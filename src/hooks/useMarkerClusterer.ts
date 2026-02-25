import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { useEffect, useState } from "react";

interface UseMarkerClustererOptions {
  /** Maximum zoom level at which clustering is enabled (default 16). */
  maxZoom?: number;
  /** Minimum number of markers to form a cluster (SuperCluster minPoints, default 3). */
  minimumClusterSize?: number;
}

/**
 * React 18 StrictMode-safe hook that creates a MarkerClusterer instance
 * from @googlemaps/markerclusterer.  The cleanup function properly tears
 * down the old instance on the first (phantom) unmount, and a fresh
 * instance is created on the real remount.
 *
 * Uses useState (not useRef) so that when the clusterer is created,
 * consuming components re-render and receive the instance.
 */
export function useMarkerClusterer(
  map: google.maps.Map | null,
  options: UseMarkerClustererOptions = {}
): MarkerClusterer | null {
  const { maxZoom = 16, minimumClusterSize = 3 } = options;
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map) return;

    const mc = new MarkerClusterer({
      map,
      markers: [],
      algorithm: new SuperClusterAlgorithm({
        maxZoom,
        minPoints: minimumClusterSize,
      }),
    });

    setClusterer(mc);

    return () => {
      mc.clearMarkers(true);
      mc.setMap(null);
      setClusterer(null);
    };
  }, [map, maxZoom, minimumClusterSize]);

  return clusterer;
}
