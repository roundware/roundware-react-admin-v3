// API helpers for the Publish (deploy + branding + preview) page.
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";

export interface DeploymentState {
  deployed: boolean;
  subdomain: string | null;
  hostname: string | null;
  url: string | null;
  base_domain: string;
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
}

/** What a project has stored for a slot. Always lists, even for single slots —
 *  the schema says which are which. */
export interface SlotFiles {
  keys: string[];
  urls: string[];
}

export interface Branding {
  app_title: string;
  app_subtitle: string;
  theme_json: { palette?: { primary?: string; secondary?: string; background?: string } };
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

export async function uploadBrandingFile(
  projectId: number,
  slot: string,
  file: File
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
    `${import.meta.env.VITE_SERVER_URL}/api/3/projects/${projectId}/branding/files/${slot}/`,
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
  key?: string
): Promise<{ slot: string; files: Record<string, SlotFiles> }> {
  const query = key ? `?key=${encodeURIComponent(key)}` : "";
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
