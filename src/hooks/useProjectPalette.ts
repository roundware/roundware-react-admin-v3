import { useEffect, useState } from "react";
import { getBranding, getThemeSchema } from "../pages/Publish/api";

export interface ProjectPalette {
  primary: string;
  secondary: string;
  background: string;
}

// Per project, for the session: the palette changes only on Customize &
// Publish, and a stale swatch until reload is harmless.
const cache = new Map<number, Promise<ProjectPalette>>();

function load(projectId: number): Promise<ProjectPalette> {
  if (!cache.has(projectId)) {
    cache.set(
      projectId,
      Promise.all([getThemeSchema(), getBranding(projectId)]).then(([schema, branding]) => {
        const saved = branding.theme_json?.palette ?? {};
        const out = {} as ProjectPalette;
        for (const role of schema.colours) out[role.key] = saved[role.key] || role.default;
        return out;
      })
    );
  }
  return cache.get(projectId)!;
}

/**
 * The web app's effective colours for a project — what it saved over the
 * Roundware defaults (server docs/015) — so the admin can draw things as
 * the app will, e.g. a speaker with no colour of its own in the Brand colour.
 * Null until loaded.
 */
export function useProjectPalette(projectId: number | undefined): ProjectPalette | null {
  const [palette, setPalette] = useState<ProjectPalette | null>(null);
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    load(projectId)
      .then((p) => !cancelled && setPalette(p))
      .catch(() => cache.delete(projectId));
    return () => {
      cancelled = true;
    };
  }, [projectId]);
  return palette;
}
