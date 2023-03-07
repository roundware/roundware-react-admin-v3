import { Hearing, RecordVoiceOver, WatchLater } from "@mui/icons-material";
import { CircularProgress, Grid } from "@mui/material";
import AssetListensChart from "components/charts/AssetListensChart";
import React from "react";
import { GetListResult, RaRecord } from "react-admin";
import { IAsset } from "types/asset";
import { IListenEvent } from "types/listenEvents";
import { ResourceList } from "../../../App";
import AssetMediaTypesChart from "../../charts/AssetMediaTypesChart";
import AssetsChart from "../../charts/AssetsChart";
import BrowsersChart from "../../charts/BrowsersChart";
import ClientTypeChart from "../../charts/ClientTypeChart";
import ListenEventsChart from "../../charts/ListenEventsChart";
import SessionsChart from "../../charts/SessionsChart";
import CardWithIcon from "./CardWithIcon";
interface Props {
  sessions: GetListResult<RaRecord> | null;
  assets: GetListResult<RaRecord> | null;
  listenEvents: GetListResult<RaRecord> | null;
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

          <Grid item xs={12}>
            {assets && listenEvents ? (
              <AssetListensChart
                assets={assets as GetListResult<IAsset>}
                listenEvents={listenEvents as GetListResult<IListenEvent>}
              />
            ) : (
              <CircularProgress />
            )}
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default React.memo(DashboardContent);
