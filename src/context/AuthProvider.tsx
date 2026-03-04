import { AuthProvider } from "react-admin";
import { dataProvider } from "./DataProviderContext";

/**
 * Tenant info stored in localStorage.
 */
export interface StoredTenant {
  id: number;
  name: string;
  slug: string;
  role: string;
  project_ids: number[] | null;
  plan_name: string | null;
  project_count: number;
}

/**
 * JWT-based auth provider for Roundware Server v3.
 *
 * Login sends {email, password} to /api/3/auth/login/ and receives:
 *   { access_token, token_type, expires_in, user, tenants }
 *
 * The access_token (Bearer) and first tenant slug are stored in localStorage
 * and injected into every request via tokenAuthProvider helpers.
 */
const tokenAuthProvider: AuthProvider = {
  login: async ({ username: email, password }) => {
    const url = `${import.meta.env.VITE_SERVER_URL}/api/3/auth/login/`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        throw new Error(json.detail || json.non_field_errors || response.statusText);
      }
      throw new Error(response.statusText);
    }

    const json = await response.json();
    // IMPORTANT: Write tenant_slug and tenants BEFORE access_token.
    // Components check access_token to determine auth state; if it exists
    // they immediately fire API requests with X-Tenant-Slug from localStorage.
    // Writing the slug first eliminates the race window.
    if (json.tenants?.length) {
      localStorage.setItem("tenants", JSON.stringify(json.tenants));
      // Default to first tenant if no slug is already set
      if (!localStorage.getItem("tenant_slug")) {
        localStorage.setItem("tenant_slug", json.tenants[0].slug);
      }
    }
    // Store user info for getPermissions / getIdentity
    if (json.user) {
      localStorage.setItem("user", JSON.stringify(json.user));
    }
    // Store JWT access token LAST — this is the "auth gate" that signals
    // the app is authenticated and may start making API calls.
    localStorage.setItem("access_token", json.access_token);
    // Notify ProjectsContext (and other listeners) that auth state changed
    window.dispatchEvent(new Event("roundware-auth-change"));
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_slug");
    localStorage.removeItem("tenants");
    localStorage.removeItem("user");
    // Clear data provider cache so stale data doesn't bleed across sessions
    dataProvider.cachedProjectData.clear();
    dataProvider.currentProjectId = 0;
    dataProvider.revalidatingResources = [];
    window.dispatchEvent(new Event("roundware-auth-change"));
    return Promise.resolve();
  },

  checkAuth: () =>
    localStorage.getItem("access_token")
      ? Promise.resolve()
      : Promise.reject(),

  checkError: (error) => {
    const status = error.status;
    if (status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("tenant_slug");
      localStorage.removeItem("tenants");
      localStorage.removeItem("user");
      // Clear data provider cache so stale data doesn't bleed into re-login
      dataProvider.cachedProjectData.clear();
      dataProvider.currentProjectId = 0;
      dataProvider.revalidatingResources = [];
      return Promise.reject();
    }
    // 403 = authenticated but insufficient role — don't log out
    return Promise.resolve();
  },

  getPermissions: () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const isSuperuser = user?.is_superuser ?? false;
      const tenants: StoredTenant[] = JSON.parse(localStorage.getItem("tenants") || "[]");
      const currentSlug = localStorage.getItem("tenant_slug");
      const currentTenant = tenants.find((t) => t.slug === currentSlug);
      const role = isSuperuser
        ? "superuser"
        : currentTenant?.role ?? "user";
      const project_ids = currentTenant?.project_ids ?? null;
      return Promise.resolve({
        is_superuser: isSuperuser,
        isSuperuser,
        role,
        tenants,
        project_ids,
      });
    } catch {
      return Promise.resolve({ is_superuser: false, isSuperuser: false, role: "user", tenants: [], project_ids: null });
    }
  },

  getIdentity: () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user) {
        const displayName = [user.first_name, user.last_name]
          .filter(Boolean)
          .join(" ") || user.email;
        return Promise.resolve({
          id: user.id,
          fullName: displayName,
        });
      }
    } catch {
      // fall through
    }
    return Promise.resolve({ id: 0, fullName: "Unknown" });
  },
};

/**
 * Switch to a different tenant. Updates localStorage and reloads.
 */
export function switchTenant(slug: string): void {
  localStorage.setItem("tenant_slug", slug);
  window.location.href = "/#/projects";
  window.location.reload();
}

export default tokenAuthProvider;
