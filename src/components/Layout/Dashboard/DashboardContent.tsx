import React from "react";
import {
  Typography,
  Grid,
  Divider,
  Card,
  CardHeader,
  CardContent,
} from "@material-ui/core";
import {
  Hearing,
  RecordVoiceOver,
  WatchLater,
  Person,
} from "@material-ui/icons";
import { IProject } from "../../../providers/ProjectsContext";
import CardWithIcon from "./CardWithIcon";
import { GetListResult, Record } from "react-admin";

import SessionsChart from "./SessionsChart";
import AssetsChart from "./AssetsChart";
import ClientTypeChart from "./ClientTypeChart";
import BrowsersChart from "./BrowsersChart";
import ListenEventsChart from "./ListenEventsChart";

interface Props {
  selectedProject: IProject;
  sessions: GetListResult<Record>;
  assets: GetListResult<Record>;
  listenEvents: GetListResult<Record>;
  users: GetListResult<Record>;
}

const DashboardContent = (props: Props) => {
  const { selectedProject, assets, listenEvents, users, sessions } = props;
  return (
    <div>
      <Grid container spacing={4}>
        <Grid container item spacing={3} md={12} xs={12}>
          <Grid item md={2} xs={6}>
            <CardWithIcon
              icon={Hearing}
              title="Listens"
              subtitle={listenEvents.total || `0`}
              to="/listenevents"
            />
          </Grid>

          <Grid item md={2} xs={6}>
            <CardWithIcon
              icon={RecordVoiceOver}
              title="Recordings"
              subtitle={assets.total || `0`}
              to="/assets"
            />
          </Grid>

          <Grid item md={2} xs={12}>
            <CardWithIcon
              icon={WatchLater}
              title="Sessions"
              subtitle={sessions.total || `0`}
              to="/sessions"
            />
          </Grid>
          <Grid container item xs={6} md={3}>
            <div style={{ width: "100%", margin: 4 }}>
              <Typography style={{ textAlign: "center" }}>Platforms</Typography>
            </div>
            <ClientTypeChart sessions={sessions} />
          </Grid>

          <Grid container item xs={6} md={3}>
            <div style={{ width: "100%", margin: 4 }}>
              <Typography style={{ textAlign: "center" }}>Browsers</Typography>
            </div>
            <BrowsersChart sessions={sessions} />
          </Grid>
        </Grid>

        <Grid container item xs={12} md={12} spacing={3}>
          <Grid item xs={12} md={6} lg={8}>
            <ListenEventsChart events={listenEvents} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <SessionsChart sessions={sessions} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <AssetsChart assets={assets} />
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default DashboardContent;
