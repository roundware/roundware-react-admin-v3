import { AuthProvider, Options } from "react-admin";

/**
 * JWT-based auth provider for Roundware Server v3.
 *
 * Login: POST /api/3/auth/login/ with {email, password}
 * Response: {access_token, refresh_token, expires_in, user, tenants}
 *
 * The first tenant slug from the login response is stored and sent as
 * the X-Tenant-Slug header on every authenticated request.
 *
 * getPermissions returns { isSuperuser: boolean } so components can
 * conditionally render superuser-only UI (e.g. the Tenants tab).
 */

const tokenAuthProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const loginUrl = `${process.env.REACT_APP_SERVER_URL}/api/3/auth/login/`;
    const request = new Request(loginUrl, {
      method: "POST",
      // v3 uses "email" field; React Admin login form sends "username"
      body: JSON.stringify({ email: username, password }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    const response = await fetch(request);
    if (response.ok) {
      const json = await response.json();
      localStorage.setItem("access_token", json.access_token);
      localStorage.setItem("refresh_token", json.refresh_token);

      // Store the first tenant slug for X-Tenant-Slug header
      if (json.tenants && json.tenants.length > 0) {
        localStorage.setItem("tenant_slug", json.tenants[0].slug);
      }

      // Store user info (including is_superuser) for getIdentity / getPermissions
      if (json.user) {
        localStorage.setItem("user_info", JSON.stringify(json.user));
      }
      return;
    }

    if (response.headers.get("content-type")?.includes("application/json")) {
      const json = await response.json();
      throw new Error(json.detail || json.non_field_errors || response.statusText);
    }
    throw new Error(response.statusText);
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    // Best-effort server-side logout
    if (refreshToken) {
      try {
        await fetch(
          `${process.env.REACT_APP_SERVER_URL}/api/3/auth/logout/`,
          {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
            headers: new Headers({ "Content-Type": "application/json" }),
          }
        );
      } catch {
        // Ignore errors — we're logging out regardless
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("tenant_slug");
    localStorage.removeItem("user_info");
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
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("tenant_slug");
      localStorage.removeItem("user_info");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    try {
      const userStr = localStorage.getItem("user_info");
      if (userStr) {
        const user = JSON.parse(userStr);
        return Promise.resolve({
          id: user.id,
          fullName: user.full_name || user.email,
        });
      }
    } catch {
      // Fall through
    }
    return Promise.reject();
  },

  getPermissions: () => {
    try {
      const userStr = localStorage.getItem("user_info");
      if (userStr) {
        const user = JSON.parse(userStr);
        return Promise.resolve({ isSuperuser: !!user.is_superuser });
      }
    } catch {
      // Fall through
    }
    return Promise.resolve({ isSuperuser: false });
  },
};

export function createOptionsFromToken(): Options {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return {};
  }
  return {
    user: {
      authenticated: true,
      token: "Bearer " + token,
    },
  };
}

export default tokenAuthProvider;
