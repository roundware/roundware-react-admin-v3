import { LocalizationProvider } from "@mui/lab";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import ProjectRoute from "ProjectRoute";
import { BuildUIContextProvider } from "providers/BuildUIContext";
import { RoundwareDataProviderContextProvider } from "providers/DataProviderContext";
import { SpeakersProvider } from "providers/SpeakersContext";
import React from "react";
import ReactDOM from "react-dom";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { ProjectsProvider } from "./providers/ProjectsContext";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <RoundwareDataProviderContextProvider>
          <ProjectsProvider>
            <SpeakersProvider>
              <BuildUIContextProvider>
                <Routes>
                  <Route
                    path={`/project/:projectId/*`}
                    element={<ProjectRoute />}
                  />
                  <Route path={`/*`} element={<ProjectRoute />} />
                </Routes>
              </BuildUIContextProvider>
            </SpeakersProvider>
          </ProjectsProvider>
        </RoundwareDataProviderContextProvider>
      </LocalizationProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
