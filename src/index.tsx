import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { ProjectsProvider } from "./providers/ProjectsContext";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { RoundwareDataProviderContextProvider } from "providers/DataProviderContext";
import { SpeakersProvider } from "providers/SpeakersContext";
ReactDOM.render(
  <React.StrictMode>
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <RoundwareDataProviderContextProvider>
        <ProjectsProvider>
          <SpeakersProvider>
            <App />
          </SpeakersProvider>
        </ProjectsProvider>
      </RoundwareDataProviderContextProvider>
    </MuiPickersUtilsProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
