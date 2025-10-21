import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { BuildUIContextProvider } from "./context/BuildUIContext";
import { RoundwareDataProviderContextProvider } from "./context/DataProviderContext";
import { ProjectsProvider } from "./context/ProjectsContext";
import { SpeakersProvider } from "./context/SpeakersContext";
import "./index.css";
import ProjectRoute from "./ProjectRoute";

const router = createBrowserRouter([
  {
    path: "/project/:projectId/*",
    element: (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <RoundwareDataProviderContextProvider>
          <ProjectsProvider>
            <SpeakersProvider>
              <BuildUIContextProvider>
                <ProjectRoute />
              </BuildUIContextProvider>
            </SpeakersProvider>
          </ProjectsProvider>
        </RoundwareDataProviderContextProvider>
      </LocalizationProvider>
    ),
  },
  {
    path: "/*",
    element: (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <RoundwareDataProviderContextProvider>
          <ProjectsProvider>
            <SpeakersProvider>
              <BuildUIContextProvider>
                <ProjectRoute />
              </BuildUIContextProvider>
            </SpeakersProvider>
          </ProjectsProvider>
        </RoundwareDataProviderContextProvider>
      </LocalizationProvider>
    ),
  },
], {
  future: {
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
