import React from "react";
import {
  Typography,
  Grid,
  Divider,
  Card,
  CardHeader,
  CardContent,
} from "@mui/material";
import {
  Hearing,
  RecordVoiceOver,
  WatchLater,
  Person,
} from "@mui/icons-material";
import { IProject } from "../../../providers/ProjectsContext";
import CardWithIcon from "./CardWithIcon";
import { GetListResult, Record } from "react-admin";
import { ResourceList } from "../../../App";
import SessionsChart from "./SessionsChart";
import AssetsChart from "./AssetsChart";
import ClientTypeChart from "./ClientTypeChart";
import BrowsersChart from "./BrowsersChart";
import ListenEventsChart from "./ListenEventsChart";
import AssetMediaTypesChart from "./AssetMediaTypesChart";

interface Props {
  sessions: GetListResult<Record> | null;
  assets: GetListResult<Record> | null;
  listenEvents: GetListResult<Record> | null;
  ranges: { [resrouce: string]: string };
}

const DashboardContent = (props: Props) => {
  const { ranges, assets, listenEvents, sessions } = props;
  return (
    <div>
      <Grid container spacing={4}>
        <Grid container item spacing={3} md={12} xs={12}>
          <Grid item md={2} xs={6}>
            <CardWithIcon
              icon={Hearing}
              title="Listens"
              subtitle={
                listenEvents === null ? `Loading..` : listenEvents?.total || `0`
              }
              to={ResourceList.includes(`listenevents`) && "listenevents"}
              helperText={ranges[`listenEvents`]}
            />
          </Grid>

          <Grid item md={2} xs={6}>
            <CardWithIcon
              icon={RecordVoiceOver}
              title="Recordings"
              subtitle={assets === null ? `Loading..` : assets?.total || `0`}
              to={ResourceList.includes(`assets`) && "assets"}
              helperText={ranges[`assets`]}
            />
          </Grid>

          <Grid item md={2} xs={12}>
            <CardWithIcon
              icon={WatchLater}
              title="Sessions"
              subtitle={
                sessions === null ? `Loading..` : sessions?.total || `0`
              }
              to={ResourceList.includes(`sessions`) && "sessions"}
              helperText={ranges[`sessions`]}
            />
          </Grid>
        </Grid>

        <Grid container item xs={12} md={12} spacing={3}>
          <Grid item xs={12} md={4} lg={4}>
            <AssetMediaTypesChart assets={assets} />
          </Grid>

          <Grid container item xs={4} md={4}>
            <ClientTypeChart sessions={sessions} />
          </Grid>

          <Grid container item xs={4} md={4}>
            <BrowsersChart sessions={sessions} />
          </Grid>

          <Grid item xs={12} md={12} lg={12}>
            <AssetsChart assets={assets} />
          </Grid>

          <Grid item xs={12} md={12} lg={12}>
            <SessionsChart sessions={sessions} />
          </Grid>

          <Grid item xs={12} md={12} lg={12}>
            <ListenEventsChart events={listenEvents} />
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default React.memo(DashboardContent);
