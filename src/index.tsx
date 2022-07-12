import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { BuildUIContextProvider } from "context/BuildUIContext";
import { RoundwareDataProviderContextProvider } from "context/DataProviderContext";
import { SpeakersProvider } from "context/SpeakersContext";
import ProjectRoute from "ProjectRoute";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProjectsProvider } from "./context/ProjectsContext";
import "./index.css";

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
