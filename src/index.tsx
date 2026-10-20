// The admin's font, served with it rather than from Google Fonts (which saw
// every visitor's IP address): MUI's weights.
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useLocation } from "react-router-dom";
import { BuildUIContextProvider } from "./context/BuildUIContext";
import { RoundwareDataProviderContextProvider } from "./context/DataProviderContext";
import { ProjectsProvider } from "./context/ProjectsContext";
import { SpeakersProvider } from "./context/SpeakersContext";
import "./index.css";
import LandingPage from "./pages/LandingPage";
import OnboardingPlanPage from "./pages/OnboardingPlanPage";
import RegisterPage from "./pages/RegisterPage";
import UnsubscribePage from "./pages/UnsubscribePage";
import AcceptInvitePage from "./pages/public/AcceptInvitePage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import ResetPasswordPage from "./pages/public/ResetPasswordPage";
import VerifyEmailPage from "./pages/public/VerifyEmailPage";
import ProjectRoute from "./ProjectRoute";
import { startErrorReporting } from "./monitoring";

// Before anything renders (off without VITE_SENTRY_DSN).
startErrorReporting();

const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <RoundwareDataProviderContextProvider>
      <ProjectsProvider>
        <SpeakersProvider>
          <BuildUIContextProvider>
            {children}
          </BuildUIContextProvider>
        </SpeakersProvider>
      </ProjectsProvider>
    </RoundwareDataProviderContextProvider>
  </LocalizationProvider>
);

/**
 * Gatekeeper: shows the landing page for unauthenticated visitors at "/",
 * or falls through to the Admin app for all other cases.
 *
 * - "/" + no token → landing page
 * - "/" + token → admin (ProjectRoute)
 * - "/login", "/wizard", etc. + no token → admin (which redirects to login)
 * - "/login", "/wizard", etc. + token → admin (normal authenticated route)
 */
const LandingOrAdmin: React.FC = () => {
  const location = useLocation();
  const hasToken = !!localStorage.getItem("access_token");

  // Only show the landing page for the root path when unauthenticated.
  // All other paths (e.g. /login, /wizard, /projects) should be handled
  // by the Admin app — it will redirect to the login page if needed.
  if (!hasToken && location.pathname === "/") {
    return <LandingPage />;
  }

  return (
    <AppProviders>
      <ProjectRoute />
    </AppProviders>
  );
};

// A link from a platform email (server docs/026) names the organization the
// page is in, `?tenant=slug`: switch to it before anything loads, so a
// superuser lands in the right one. Only signed in, and only to an
// organization they're on or as a superuser (the server refuses others).
(function switchTenantFromLink() {
  try {
    const url = new URL(window.location.href);
    const slug = url.searchParams.get("tenant");
    if (!slug || !localStorage.getItem("access_token")) return;
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const tenants: { slug: string }[] = JSON.parse(localStorage.getItem("tenants") || "[]");
    if (user?.is_superuser || tenants.some((t) => t.slug === slug)) {
      localStorage.setItem("tenant_slug", slug);
    }
    url.searchParams.delete("tenant");
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    // Without storage, the page opens in the current organization.
  }
})();

const router = createBrowserRouter([
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/onboarding/plan",
    element: <OnboardingPlanPage />,
  },
  // Public pages that emails link to — no sign-in (server services/email.py).
  {
    // From a notification email (server docs/019).
    path: "/unsubscribe",
    element: <UnsubscribePage />,
  },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/accept-invite", element: <AcceptInvitePage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  {
    path: "/project/:projectId/*",
    element: (
      <AppProviders>
        <ProjectRoute />
      </AppProviders>
    ),
  },
  {
    path: "/*",
    element: <LandingOrAdmin />,
  },
], {
  future: {
    // @ts-expect-error React Router v6→v7 migration flag
    v7_startTransition: true,
  },
});

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find the root element");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
