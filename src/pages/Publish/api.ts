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

export interface Branding {
  app_title: string;
  app_subtitle: string;
  theme_json: { palette?: { primary?: string; secondary?: string; background?: string } };
  logo_url: string | null;
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

export async function uploadLogo(
  projectId: number,
  file: File
): Promise<{ logo_file_key: string; logo_url: string }> {
  const token = localStorage.getItem("access_token");
  const slug = localStorage.getItem("tenant_slug");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (slug) headers["X-Tenant-Slug"] = slug;

  const form = new FormData();
  form.append("file", file);

  const resp = await fetch(
    `${import.meta.env.VITE_SERVER_URL}/api/3/projects/${projectId}/branding/logo/`,
    { method: "POST", headers, body: form }
  );
  if (!resp.ok) throw new Error(`Logo upload failed (${resp.status})`);
  return resp.json();
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
