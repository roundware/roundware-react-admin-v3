import { useGoogleMap } from "@react-google-maps/api";
import React, { useEffect, useMemo } from "react";
import { ProjectPalette } from "../../hooks/useProjectPalette";
import { ISpeaker } from "../../types/speaker";
import { polygonToGoogleMapPaths } from "../../utilities";
import { speakerImageBounds } from "../../utilities/speakerImageBounds";

/**
 * A project's speakers as the listen map shows them before anything plays —
 * shapes, images or nothing — for Map appearance's map. Read-only: speakers
 * are edited on the Speakers page.
 *
 * Mirrors the web app's idle state (its SpeakerPolygons / SpeakerImages and
 * utils/speakerStyles.ts), from the project's merged map config, so a style
 * change in Advanced configuration shows here too.
 */

type Display = "polygons" | "images" | "none";

interface Props {
  speakers: ISpeaker[];
  display: Display;
  /** The project's effective `map` config: app defaults + its overrides. */
  mapConfig: Record<string, any>;
  palette: ProjectPalette;
  /** The project's speaker image, if it has uploaded one. */
  imageUrl: string | null;
}

const ROLE: Record<string, keyof ProjectPalette> = {
  brand: "primary",
  backdrop: "secondary",
  card: "background",
};

/** A config color — hex, or a theme role like "brand/25" — as #rrggbb. */
const resolveColor = (value: string | null | undefined, palette: ProjectPalette): string | null => {
  if (!value) return null;
  const role = /^(brand|backdrop|card)(\/\d+)?$/.exec(value);
  const hex = role ? palette[ROLE[role[1]]] : value;
  return /^#[0-9a-f]{6}/i.test(hex) ? hex.slice(0, 7) : null;
};

// The web app's built-in speaker icon: MUI's VolumeUp, as an image.
const VOLUME_UP_PATH =
  "M3 9v6h4l5 5V4L7 9zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77";
const speakerIconUrl = (color: string) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256"><path fill="${color}" d="${VOLUME_UP_PATH}"/></svg>`
  );

const SpeakerImages = ({ speakers, url, opacity }: { speakers: ISpeaker[]; url: string; opacity: number }) => {
  const map = useGoogleMap();
  useEffect(() => {
    if (!map) return;
    const overlays = speakers
      .map((s) => s.shape && speakerImageBounds(s.shape as any))
      .filter((b): b is google.maps.LatLngBoundsLiteral => !!b)
      .map((bounds) => {
        const o = new google.maps.GroundOverlay(url, bounds, { opacity, clickable: false });
        o.setMap(map);
        return o;
      });
    return () => overlays.forEach((o) => o.setMap(null));
  }, [map, speakers, url, opacity]);
  return null;
};

// Drawn with the Maps API directly, as the images are, rather than with
// PolygonF: its edit-listener effect throws when a polygon has no path yet
// (seen when the Maps key is refused), and the throw took the whole
// Customize page down with it. This layer is read-only and needs none of it.
const SpeakerShapes = ({ shapes }: { shapes: { paths: google.maps.LatLng[]; options: google.maps.PolygonOptions }[] }) => {
  const map = useGoogleMap();
  useEffect(() => {
    if (!map) return;
    const polygons = shapes.map(({ paths, options }) => new google.maps.Polygon({ ...options, paths, map }));
    return () => polygons.forEach((p) => p.setMap(null));
  }, [map, shapes]);
  return null;
};

const SpeakerMapLayer: React.FC<Props> = ({ speakers, display, mapConfig, palette, imageUrl }) => {
  // The idle style: the speaker's own colors, else the palette's first color;
  // opacities from the idle state where set, else the display defaults.
  const style = useMemo(() => {
    const defaults = mapConfig.speakerDisplayDefaults ?? {};
    const idle = mapConfig.speakerStateStyles?.idle ?? {};
    const pick = (stateValue: unknown, fallback: unknown) => (stateValue ?? fallback) as number;
    return {
      fallback: resolveColor(mapConfig.speakerPolygonColors?.[0]?.[0], palette) ?? palette.primary,
      idleFill: resolveColor(idle.fill_color, palette),
      idleStroke: resolveColor(idle.stroke_color, palette),
      fillOpacity: pick(idle.fill_opacity, defaults.fillOpacity),
      strokeOpacity: pick(idle.stroke_opacity, defaults.strokeOpacity),
      strokeWeight: pick(idle.stroke_weight, defaults.strokeWeight),
    };
  }, [mapConfig, palette]);

  const shapes = useMemo(
    () =>
      speakers
        .filter((s) => s.shape)
        .map((s) => {
          const fill = resolveColor(s.fill_color, palette) ?? style.fallback;
          const stroke = resolveColor(s.border_color, palette) ?? fill;
          return {
            paths: polygonToGoogleMapPaths(s.shape as any),
            options: {
              clickable: false,
              fillColor: style.idleFill ?? fill,
              fillOpacity: style.fillOpacity,
              strokeColor: style.idleStroke ?? stroke,
              strokeOpacity: style.strokeOpacity,
              strokeWeight: style.strokeWeight,
            },
          };
        }),
    [speakers, palette, style]
  );

  if (display === "none") return null;

  if (display === "images") {
    // The built-in icon is solid, so the app draws it faint; a project's own
    // image carries its own transparency and is drawn as made.
    return imageUrl ? (
      <SpeakerImages speakers={speakers} url={imageUrl} opacity={1} />
    ) : (
      <SpeakerImages speakers={speakers} url={speakerIconUrl(palette.primary)} opacity={0.2} />
    );
  }

  return <SpeakerShapes shapes={shapes} />;
};

export default SpeakerMapLayer;
