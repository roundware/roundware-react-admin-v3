import { fetchUtils, Options, RaRecord } from "react-admin";

/**
 * Build fetch options with JWT Bearer token + X-Tenant-Slug header.
 * Used by the data provider, fetcher, apiFetcher, and XMLHttpRequest helper.
 */
export function createOptionsFromToken(): Options {
  const token = localStorage.getItem("access_token");
  const slug = localStorage.getItem("tenant_slug");
  if (!token) {
    return {};
  }
  return {
    user: {
      authenticated: true,
      token: "Bearer " + token,
    },
    headers: new Headers({
      Accept: "application/json",
      ...(slug ? { "X-Tenant-Slug": slug } : {}),
    }),
  };
}

/**
 * fetchJson wrapper that injects auth headers.
 * Used by the RoundwareDataProvider constructor.
 */
export function fetchJsonWithAuthToken(url: string, options: object) {
  return fetchUtils.fetchJson(
    url,
    Object.assign(createOptionsFromToken(), options)
  );
}

/**
 * XHR-based upload with auth headers and progress callback.
 * Used for multipart form data uploads (speakers, etc.) via the data provider.
 */
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
  const slug = localStorage.getItem("tenant_slug");

  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open(options.method || "GET", uri);

    // Set auth headers
    if (options.user?.authenticated) {
      request.setRequestHeader(`Authorization`, options.user.token as string);
    }
    if (slug) {
      request.setRequestHeader("X-Tenant-Slug", slug);
    }

    // Set any additional headers (skip Content-Type for FormData)
    const headers = options.headers as Headers | undefined;
    if (headers) {
      headers.forEach((value, key) => {
        if (key.toLowerCase() !== "authorization" && key.toLowerCase() !== "x-tenant-slug") {
          request.setRequestHeader(key, value);
        }
      });
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

/**
 * Generic fetcher with auth — used by the data provider.
 */
export function fetcher(url: string, options: Options = {}) {
  const authOpts = createOptionsFromToken();
  return fetchUtils.fetchJson(url, { ...options, ...authOpts });
}

/**
 * API-scoped fetcher — prepends the server URL + /api/3 base path.
 * Used by components for standalone API calls (upload-audio, counts, etc.).
 */
export function apiFetcher(url: string, options: Options = {}) {
  const authOpts = createOptionsFromToken();
  return fetchUtils.fetchJson(
    `${import.meta.env.VITE_SERVER_URL}/api/3` + url,
    { ...options, ...authOpts }
  );
}

// Default export kept for backward compat
function tokenAuthProvider() {
  return createOptionsFromToken();
}
export default tokenAuthProvider;
