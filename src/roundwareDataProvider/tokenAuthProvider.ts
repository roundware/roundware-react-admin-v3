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
  if (typeof detail === "string" && detail) return detail;
  // A field that didn't validate: FastAPI sends a list, one per problem,
  // each with its message ("Value error, " and all). It showed as
  // "Unprocessable Content" (2026-10-19).
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (typeof d?.msg === "string" ? d.msg.replace(/^Value error, /, "") : ""))
      .filter(Boolean);
    if (msgs.length) return Array.from(new Set(msgs)).join(" ");
  }
  return null;
}

/** The keys a sign-in keeps (AuthProvider's login and logout). */
export const AUTH_KEYS = ["access_token", "tenant_slug", "tenants", "user"];

/** The stored sign-in's JWT claims, or null. */
function tokenClaims(): { exp?: number; iat?: number } | null {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/** When the stored sign-in runs out (ms), and how long it lasts (ms). */
export function tokenTimes(): { expiresAt: number; lasts: number | null } | null {
  const c = tokenClaims();
  if (typeof c?.exp !== "number") return null;
  return { expiresAt: c.exp * 1000, lasts: typeof c.iat === "number" ? (c.exp - c.iat) * 1000 : null };
}

/**
 * True when the stored sign-in has run out (its JWT's `exp`, 8 hours by
 * default). Signing in is the only renewal — there's no refresh — so an
 * admin left open overnight held a dead sign-in: pages kept what they had
 * loaded, and requests like the preview's failed with "Could not start
 * preview" instead of asking to sign in again (2026-10-15).
 */
export function accessTokenExpired(): boolean {
  const t = tokenTimes();
  return !!t && t.expiresAt <= Date.now();
}

// ---------------------------------------------------------------------------
// A sign-in that runs out mid-session (2026-10-21). It used to be dropped
// quietly by whichever request noticed first, and the page stayed as it was,
// signed out, refusing every save with nothing saying why. Now the page is
// kept and SessionExpiredDialog asks for the password again over it, so
// nothing unsaved is lost. The sign-in stays stored until then: what's on
// the page keeps its project, organization and name.
// ---------------------------------------------------------------------------
let sessionHasEnded = false;
export const SESSION_ENDED = "roundware-session-ended";

/** The stored sign-in has run out or was refused: ask for it again. */
export function sessionEnded(): void {
  if (sessionHasEnded || !localStorage.getItem("access_token")) return;
  sessionHasEnded = true;
  window.dispatchEvent(new Event(SESSION_ENDED));
}
export const isSessionEnded = () => sessionHasEnded;
/** Signed in again (SessionExpiredDialog). */
export function sessionRenewed(): void {
  sessionHasEnded = false;
}

/** The server refused the sign-in. Only for a stored sign-in — a wrong
 *  password is a 401 too. And only when the refused request carried that
 *  sign-in: one sent before signing in (the Sign In page asks for lists too)
 *  could be refused just after, and it signed the new session straight out
 *  (2026-10-19); one sent before signing in again, likewise. */
function endExpiredSession(e: unknown, sentWith: string | null): void {
  if (!(e instanceof HttpError) || e.status !== 401) return;
  if (!sentWith || localStorage.getItem("access_token") !== sentWith) return;
  sessionEnded();
}

/** The handler for a request's failure, knowing the sign-in it was sent with. */
const withServerMessage =
  (sentWith: string | null) =>
  (e: unknown): never => {
    endExpiredSession(e, sentWith);
    if (e instanceof HttpError) {
      const msg = serverMessage(e.body);
      if (msg) throw new HttpError(msg, e.status, e.body);
    }
    throw e;
  };

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
    .catch(withServerMessage(localStorage.getItem("access_token")));
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
  const sentWith = localStorage.getItem("access_token");

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
        if (request.status === 401 && sentWith && localStorage.getItem("access_token") === sentWith) {
          sessionEnded();
        }
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
  return fetchUtils
    .fetchJson(url, { ...options, ...authOpts })
    .catch(withServerMessage(localStorage.getItem("access_token")));
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
    .catch(withServerMessage(localStorage.getItem("access_token")));
}

// Default export kept for backward compat
function tokenAuthProvider() {
  return createOptionsFromToken();
}
export default tokenAuthProvider;
