import { AuthProvider, fetchUtils, Options, RaRecord } from "ra-core";

/**
 * Token auth provider factory — kept for backward compatibility.
 * The actual AuthProvider is in context/AuthProvider.tsx.
 * This module provides the fetcher functions used by RoundwareDataProvider.
 */

function tokenAuthProvider(options: Options = {}): AuthProvider {
  const opts = {
    obtainAuthTokenUrl: `${process.env.REACT_APP_SERVER_URL}/api/3/auth/login/`,
    ...options,
  };
  return {
    login: async ({ username, password }) => {
      const request = new Request(opts.obtainAuthTokenUrl, {
        method: "POST",
        body: JSON.stringify({ email: username, password }),
        headers: new Headers({ "Content-Type": "application/json" }),
      });
      const response = await fetch(request);
      if (response.ok) {
        const json = await response.json();
        localStorage.setItem("access_token", json.access_token);
        localStorage.setItem("refresh_token", json.refresh_token);
        if (json.tenants && json.tenants.length > 0) {
          localStorage.setItem("tenant_slug", json.tenants[0].slug);
        }
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
    logout: () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("tenant_slug");
      localStorage.removeItem("user_info");
      return Promise.resolve();
    },
    checkAuth: () =>
      localStorage.getItem("access_token") ? Promise.resolve() : Promise.reject(),
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
    getPermissions: () => {
      return Promise.resolve();
    },
  };
}

export function createOptionsFromToken() {
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

/**
 * Add X-Tenant-Slug header to request options if a tenant slug is stored.
 */
function addTenantSlugHeader(options: Options): Options {
  const slug = localStorage.getItem("tenant_slug");
  if (slug) {
    const headers = new Headers(options.headers || {});
    headers.set("X-Tenant-Slug", slug);
    return { ...options, headers };
  }
  return options;
}

export function fetchJsonWithAuthToken(url: string, options: object) {
  return fetchUtils.fetchJson(
    url,
    addTenantSlugHeader(Object.assign(createOptionsFromToken(), options))
  );
}

export function XMLHttpRequestWithAuthToken(
  uri: string,
  options: Options,
  onprogress:
    | ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => void)
    | null
): Promise<{
  json: RaRecord;
}> {
  options = { ...options, ...createOptionsFromToken() };
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open(options.method || "GET", uri);

    // Set any existing headers
    Object.keys(options.headers || {}).forEach((h) =>
      request.setRequestHeader(
        h,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        options?.headers?.[h]
      )
    );

    // Set auth header
    if (options.user?.authenticated) {
      request.setRequestHeader(`Authorization`, options.user.token as string);
    }

    // Set X-Tenant-Slug header
    const slug = localStorage.getItem("tenant_slug");
    if (slug) {
      request.setRequestHeader("X-Tenant-Slug", slug);
    }

    request.onload = () => {
      resolve({
        json: JSON.parse(request.response),
      });
    };

    if (onprogress) request.upload.onprogress = onprogress;
    request.send(options.body as FormData);
  });
}

export function fetcher(url: string, options: Options = {}) {
  options.user = createOptionsFromToken().user;
  return fetchUtils.fetchJson(url, addTenantSlugHeader(options));
}

export function apiFetcher(url: string, options: Options = {}) {
  options.user = createOptionsFromToken().user;
  return fetchUtils.fetchJson(
    `${process.env.REACT_APP_SERVER_URL}/api/3` + url,
    addTenantSlugHeader(options)
  );
}

export default tokenAuthProvider;
