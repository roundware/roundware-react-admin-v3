// ---------------------------------------------------------------------------
// Error reporting: Sentry, when the build has VITE_SENTRY_DSN (Netlify's
// environment for admin.roundware.app; server backlog, priority 2). Off
// without it — local development and any build made without the key.
//
// Nothing personal goes with an error: no user, cookies, headers, bodies or
// query parameters (Sentry 11's dataCollection, which collects all of those
// by default), no session replay or performance tracing, every address
// without its query string — the admin's email links carry a token
// (/reset-password, /verify-email, /accept-invite, /unsubscribe) — and no
// console breadcrumbs. The same rules as the web app's src/monitoring.ts,
// checked there with a capture server (2026-10-19). The Sentry project's
// "Prevent Storing of IP Addresses" covers the address it connects from.
// ---------------------------------------------------------------------------
import * as Sentry from "@sentry/react";

/** An address without its query string or fragment. */
export const scrubUrl = (url?: string): string | undefined => url?.replace(/[?#].*$/, "");

export function startErrorReporting(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment: window.location.hostname === "admin.roundware.app" ? "production" : "other",
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    tracesSampleRate: 0,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      /^Non-Error promise rejection captured/,
    ],
    denyUrls: [/extensions\//i, /^chrome(-extension)?:\/\//i, /^moz-extension:\/\//i, /^safari(-web)?-extension:/i],
    beforeBreadcrumb(crumb) {
      if (crumb.category === "console") return null;
      if (crumb.data) {
        for (const key of ["url", "from", "to"]) {
          if (typeof crumb.data[key] === "string") crumb.data[key] = scrubUrl(crumb.data[key]);
        }
      }
      return crumb;
    },
    beforeSend(event) {
      if (event.request) {
        event.request.url = scrubUrl(event.request.url);
        delete event.request.query_string;
        delete event.request.cookies;
        delete event.request.headers;
      }
      delete event.user;
      return event;
    },
  });
  return true;
}
