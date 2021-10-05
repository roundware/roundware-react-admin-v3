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
              title="Total Listens"
              subtitle={listenEvents.total}
              to="/listenevents"
            />
          </Grid>

          <Grid item md={2} xs={6}>
            <CardWithIcon
              icon={RecordVoiceOver}
              title="Total Recordings"
              subtitle={assets.total}
              to="/assets"
            />
          </Grid>

          <Grid item md={2} xs={12}>
            <CardWithIcon
              icon={WatchLater}
              title="Total Sessions"
              subtitle={sessions.total}
              to="/sessions"
            />
          </Grid>
          <Grid container item xs={6} md={4}>
            <div style={{ width: "100%", margin: 4 }}>
              <Typography style={{ textAlign: "center" }}>
                Types of Clients
              </Typography>
            </div>
            <ClientTypeChart sessions={sessions} />
          </Grid>
        </Grid>

        <Grid container item xs={12} md={12} spacing={3}>
          <Grid item xs={12} md={6}>
            <SessionsChart sessions={sessions} />
          </Grid>
          <Grid item xs={12} md={6}>
            <AssetsChart assets={assets} />
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default DashboardContent;
