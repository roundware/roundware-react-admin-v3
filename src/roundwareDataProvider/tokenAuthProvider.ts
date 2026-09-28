import { fetchUtils, HttpError, Options, RaRecord } from "react-admin";

/**
 * The server's own explanation, when it gave one as a sentence.
 *
 * FastAPI puts it in `detail`; react-admin's fetchJson only looks at
 * `message`, so without this every refusal reached the user as a bare
 * "Forbidden" — including the plan-limit ones written to be read ("Your Free
 * plan allows 1 project…"). Validation errors (`detail` as a list) keep the
 * original message.
 */
function serverMessage(body: unknown): string | null {
  const detail = (body as { detail?: unknown } | null)?.detail;
  return typeof detail === "string" && detail ? detail : null;
}

function withServerMessage(e: unknown): never {
  if (e instanceof HttpError) {
    const msg = serverMessage(e.body);
    if (msg) throw new HttpError(msg, e.status, e.body);
  }
  throw e;
}

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
  return fetchUtils
    .fetchJson(url, Object.assign(createOptionsFromToken(), options))
    .catch(withServerMessage);
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

  return new Promise((resolve, reject) => {
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
      let json: RaRecord;
      try {
        json = JSON.parse(request.response);
      } catch {
        json = {} as RaRecord;
      }
      // A refusal used to resolve like a success, so a refused upload
      // looked as if it had worked.
      if (request.status >= 400) {
        reject(
          new HttpError(
            serverMessage(json) || request.statusText || `Upload failed (${request.status})`,
            request.status,
            json
          )
        );
        return;
      }
      resolve({ json });
    };
    request.onerror = () => reject(new HttpError("Network error", 0));

    if (onprogress) request.upload.onprogress = onprogress;
    request.send(options.body as FormData);
  });
}

/**
 * Generic fetcher with auth — used by the data provider.
 */
export function fetcher(url: string, options: Options = {}) {
  const authOpts = createOptionsFromToken();
  return fetchUtils.fetchJson(url, { ...options, ...authOpts }).catch(withServerMessage);
}

/**
 * API-scoped fetcher — prepends the server URL + /api/3 base path.
 * Used by components for standalone API calls (upload-audio, counts, etc.).
 */
export function apiFetcher(url: string, options: Options = {}) {
  const authOpts = createOptionsFromToken();
  return fetchUtils
    .fetchJson(`${import.meta.env.VITE_SERVER_URL}/api/3` + url, {
      ...options,
      ...authOpts,
    })
    .catch(withServerMessage);
}

// Default export kept for backward compat
function tokenAuthProvider() {
  return createOptionsFromToken();
}
export default tokenAuthProvider;
