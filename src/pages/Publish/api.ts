// API helpers for the Publish (deploy + branding + preview) page.
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";

export interface DeploymentState {
  deployed: boolean;
  subdomain: string | null;
  hostname: string | null;
  url: string | null;
  /** The test site: the project as it's being edited (server docs/021). */
  test_url?: string | null;
  base_domain: string;
}

/** How a published project's live and test sites stand (server docs/021). */
export interface LiveSiteState {
  published: boolean;
  live_url: string | null;
  test_url: string | null;
  /** The version the live site shows; its name is "" for an unnamed one. */
  live_version_id: number | null;
  live_version_name: string | null;
  /** When that version was saved. */
  live_version_created_at: string | null;
  /** Whether it shows only contributions made before it was saved. */
  live_version_freezes_contributions: boolean;
  /** When, and by whom, that version was made live. */
  updated_at: string | null;
  updated_by: string | null;
  /** Whether the test site differs from the live one; null when unpublished. */
  has_changes: boolean | null;
  test_contributions: number;
}

export interface SubdomainCheck {
  available: boolean;
  reason?: string | null;
}

/** One uploaded-file slot, as `GET /branding/schema/` declares it. */
export interface FileSlot {
  key: string;
  label: string;
  kind: "image" | "audio";
  multiple: boolean;
  description: string;
  recommended: string;
  extensions: string[];
  /** Stored as MP3 whatever is uploaded — so a browser recording (WebM) is fine. */
  convert_to_mp3?: boolean;
  /** Where the admin offers it: "files" (Images & audio) or "map" (Map appearance). */
  panel?: "files" | "map";
  /** A file per language (welcome audio), the default language's as the main one. */
  localized?: boolean;
}

/** What a project has stored for a slot. Always lists, even for single slots —
 *  the schema says which are which. */
export interface SlotFiles {
  keys: string[];
  urls: string[];
  /** Slots with a file per language: the non-default languages' files. */
  by_language?: Record<string, { keys: string[]; urls: string[] }>;
}

export interface Branding {
  app_title: string;
  app_subtitle: string;
  theme_json: {
    palette?: { primary?: string; secondary?: string; background?: string };
    /** Style choices by key, and headingFont (server core/theme.py). */
    style?: Record<string, string>;
  };
  google_font_family?: string;
  files: Record<string, SlotFiles>;
  [key: string]: unknown;
}

export async function getDeployment(projectId: number): Promise<DeploymentState> {
  const { json } = await apiFetcher(`/projects/${projectId}/deployment/`);
  return json as DeploymentState;
}

export async function deployProject(
  projectId: number,
  subdomain: string
): Promise<DeploymentState> {
  const { json } = await apiFetcher(`/projects/${projectId}/deployment/`, {
    method: "POST",
    body: JSON.stringify({ subdomain }),
  });
  return json as DeploymentState;
}

export async function undeployProject(projectId: number): Promise<void> {
  await apiFetcher(`/projects/${projectId}/deployment/`, { method: "DELETE" });
}

export async function getLiveSite(projectId: number): Promise<LiveSiteState> {
  const { json } = await apiFetcher(`/projects/${projectId}/live-site/`);
  return json as LiveSiteState;
}

/** "Update live site": save what the test site shows now as a version
 *  (named, optionally) and make it live. */
export async function updateLiveSite(projectId: number, name = ""): Promise<LiveSiteState> {
  const { json } = await apiFetcher(`/projects/${projectId}/live-site/`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return json as LiveSiteState;
}

/** A saved version of what participants see (server docs/021). */
export interface SiteVersion {
  id: number;
  /** "" for one saved by "Update live site" without a name. */
  name: string;
  created_at: string;
  created_by: string | null;
  is_live: boolean;
  /** While live, shows only contributions made before it was saved. */
  freeze_contributions: boolean;
}

export async function listVersions(projectId: number): Promise<SiteVersion[]> {
  const { json } = await apiFetcher(`/projects/${projectId}/site-versions/`);
  return json as SiteVersion[];
}

/** Save what the test site shows now, without making it live. */
export async function saveVersion(
  projectId: number,
  name: string,
  freezeContributions = false
): Promise<SiteVersion> {
  const { json } = await apiFetcher(`/projects/${projectId}/site-versions/`, {
    method: "POST",
    body: JSON.stringify({ name, freeze_contributions: freezeContributions }),
  });
  return json as SiteVersion;
}

export async function editVersion(
  projectId: number,
  versionId: number,
  patch: { name?: string; freeze_contributions?: boolean }
): Promise<SiteVersion> {
  const { json } = await apiFetcher(`/projects/${projectId}/site-versions/${versionId}/`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return json as SiteVersion;
}

export async function makeVersionLive(
  projectId: number,
  versionId: number
): Promise<LiveSiteState> {
  const { json } = await apiFetcher(
    `/projects/${projectId}/site-versions/${versionId}/make-live/`,
    { method: "POST" }
  );
  return json as LiveSiteState;
}

export async function deleteVersion(projectId: number, versionId: number): Promise<void> {
  await apiFetcher(`/projects/${projectId}/site-versions/${versionId}/`, { method: "DELETE" });
}

/** Delete every contribution made on the test site. */
export async function clearTestContributions(projectId: number): Promise<number> {
  const { json } = await apiFetcher(`/projects/${projectId}/live-site/test-contributions/`, {
    method: "DELETE",
  });
  return (json as { deleted: number }).deleted;
}

export async function checkSubdomain(subdomain: string): Promise<SubdomainCheck> {
  const { json } = await apiFetcher(
    `/domains/check/?subdomain=${encodeURIComponent(subdomain)}`
  );
  return json as SubdomainCheck;
}

export async function getBranding(projectId: number): Promise<Branding> {
  const { json } = await apiFetcher(`/projects/${projectId}/branding/`);
  return json as Branding;
}

export async function patchBranding(
  projectId: number,
  data: Record<string, unknown>
): Promise<Branding> {
  const { json } = await apiFetcher(`/projects/${projectId}/branding/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json as Branding;
}

export async function mintPreviewToken(projectId: number): Promise<string> {
  const { json } = await apiFetcher(
    `/config/preview-token/?project_id=${projectId}`,
    { method: "POST" }
  );
  return (json as { token: string }).token;
}

/** The declared branding-file slots. Fetched rather than duplicated here: the
 *  server owns the list, so adding a slot needs no admin change at all. */
export async function getBrandingSchema(): Promise<FileSlot[]> {
  const { json } = await apiFetcher(`/branding/schema/`);
  return (json as { slots: FileSlot[] }).slots;
}

/** One of the theme's three colors, as the server describes it (docs/015). */
export interface ColorRole {
  key: "primary" | "secondary" | "background";
  label: string;
  description: string;
  default: string;
}

export interface StyleChoice {
  key: string;
  label: string;
  description: string;
  options: { value: string; label: string }[];
  default: string;
}

export interface ThemeSchema {
  colors: ColorRole[];
  default_font: string;
  fonts: string[];
  /** Corners, button shape, button text, text size. */
  styles: StyleChoice[];
}

/** The theme's colors, defaults and fonts — from the server, like the file
 *  slots, so the admin and the web app share one set of defaults. */
export async function getThemeSchema(): Promise<ThemeSchema> {
  const { json } = await apiFetcher(`/branding/schema/`);
  return (json as { theme: ThemeSchema }).theme;
}

export async function uploadBrandingFile(
  projectId: number,
  slot: string,
  file: File,
  /** For a slot with a file per language: which language's (server docs/017). */
  language?: string
): Promise<{ slot: string; files: Record<string, SlotFiles> }> {
  const token = localStorage.getItem("access_token");
  const slug = localStorage.getItem("tenant_slug");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (slug) headers["X-Tenant-Slug"] = slug;

  const form = new FormData();
  form.append("file", file);

  // Not apiFetcher: it sets a JSON content type, and a multipart body needs
  // the browser to set its own boundary.
  const resp = await fetch(
    `${import.meta.env.VITE_SERVER_URL}/api/3/projects/${projectId}/branding/files/${slot}/` +
      (language ? `?language=${encodeURIComponent(language)}` : ""),
    { method: "POST", headers, body: form }
  );
  if (!resp.ok) {
    const detail = await resp.json().catch(() => null);
    throw new Error(detail?.detail || `Upload failed (${resp.status})`);
  }
  return resp.json();
}

export async function deleteBrandingFile(
  projectId: number,
  slot: string,
  key?: string,
  language?: string
): Promise<{ slot: string; files: Record<string, SlotFiles> }> {
  const params = new URLSearchParams();
  if (key) params.set("key", key);
  if (language) params.set("language", language);
  const query = params.toString() ? `?${params}` : "";
  const { json } = await apiFetcher(
    `/projects/${projectId}/branding/files/${slot}/${query}`,
    { method: "DELETE" }
  );
  return json as { slot: string; files: Record<string, SlotFiles> };
}

/** Base URL of the white-label web app (for the preview iframe). */
export function webappUrl(): string {
  return (import.meta.env.VITE_WEBAPP_URL || "http://localhost:2345").replace(/\/$/, "");
}

/** Extract a human message from an apiFetcher/HttpError. */
export function errMessage(e: unknown): string {
  const anyErr = e as { body?: { detail?: string }; message?: string };
  return anyErr?.body?.detail || anyErr?.message || "Something went wrong.";
}
