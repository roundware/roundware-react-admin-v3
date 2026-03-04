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
import ProjectRoute from "./ProjectRoute";

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

const router = createBrowserRouter([
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/onboarding/plan",
    element: <OnboardingPlanPage />,
  },
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
