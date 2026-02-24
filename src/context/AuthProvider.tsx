import { AuthProvider } from "react-admin";

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
    // Store JWT access token
    localStorage.setItem("access_token", json.access_token);
    // Store tenant slug from first tenant
    if (json.tenants?.length) {
      localStorage.setItem("tenant_slug", json.tenants[0].slug);
    }
    // Store user info for getPermissions / getIdentity
    if (json.user) {
      localStorage.setItem("user", JSON.stringify(json.user));
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_slug");
    localStorage.removeItem("user");
    return Promise.resolve();
  },

  checkAuth: () =>
    localStorage.getItem("access_token")
      ? Promise.resolve()
      : Promise.reject(),

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("tenant_slug");
      localStorage.removeItem("user");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return Promise.resolve({
        is_superuser: user?.is_superuser ?? false,
        role: user?.is_superuser ? "superuser" : "user",
      });
    } catch {
      return Promise.resolve({ is_superuser: false, role: "user" });
    }
  },

  getIdentity: () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user) {
        return Promise.resolve({
          id: user.id,
          fullName: user.full_name || user.email,
        });
      }
    } catch {
      // fall through
    }
    return Promise.resolve({ id: 0, fullName: "Unknown" });
  },
};

export default tokenAuthProvider;
