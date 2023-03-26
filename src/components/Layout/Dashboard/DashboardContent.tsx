import { Hearing, RecordVoiceOver, WatchLater } from "@mui/icons-material";
import { CircularProgress, Grid } from "@mui/material";
import AssetMediaTypesChart from "components/charts/AssetMediaTypesChart";
import ListenEventsChart from "components/charts/ListenEventsChart";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import React from "react";
import { GetListResult, RaRecord } from "react-admin";
import { useQuery } from "react-query";
import { ResourceList } from "../../../App";
import AssetsChart from "../../charts/AssetsChart";
import BrowsersChart from "../../charts/BrowsersChart";
import ClientTypeChart from "../../charts/ClientTypeChart";
import SessionsChart from "../../charts/SessionsChart";
import CardWithIcon from "./CardWithIcon";
interface Props {
  sessions: GetListResult<RaRecord> | null;
  assets: GetListResult<RaRecord> | null;
  ranges: { [resrouce: string]: string };
}

const DashboardContent = (props: Props) => {
  const { assets, sessions } = props;

  const dataProvider = useRoundwareDataProvider();

  const assetsCountQuery = useQuery(["assetsCount"], () =>
    dataProvider.getOne(`assets`, { id: `count` })
  );

  const listenEventsCountQuery = useQuery(["listeneventsCount"], () =>
    dataProvider.getOne(`listenevents`, { id: `count` })
  );
  const sessionsCountQuery = useQuery(["sessionsCount"], () =>
    dataProvider.getOne(`sessions`, { id: `count` })
  );

  return (
    <div>
      <Grid container spacing={4} mb={10}>
        <Grid container item spacing={3} md={12} xs={12}>
          <Grid item md={2} xs={6}>
            <CardWithIcon
              icon={Hearing}
              title="Listens"
              subtitle={
                listenEventsCountQuery.isLoading ? (
                  <CircularProgress
                    size={20}
                    sx={{
                      margin: "0 auto",
                    }}
                  />
                ) : (
                  (
                    listenEventsCountQuery.data?.data as unknown as {
                      count: number;
                    }
                  )?.count || `0`
                )
              }
              to={ResourceList.includes(`listenevents`) && "listenevents"}
              helperText={`Total`}
            />
          </Grid>

          <Grid item md={2} xs={6}>
            <CardWithIcon
              icon={RecordVoiceOver}
              title="Recordings"
              subtitle={
                assetsCountQuery.isLoading ? (
                  <CircularProgress
                    size={20}
                    sx={{
                      margin: "0 auto",
                    }}
                  />
                ) : (
                  (
                    assetsCountQuery.data?.data as unknown as {
                      count: number;
                    }
                  )?.count || `0`
                )
              }
              to={ResourceList.includes(`assets`) && "assets"}
              helperText={`Total`}
            />
          </Grid>

          <Grid item md={2} xs={12}>
            <CardWithIcon
              icon={WatchLater}
              title="Sessions"
              subtitle={
                sessionsCountQuery.isLoading ? (
                  <CircularProgress
                    size={20}
                    sx={{
                      margin: "0 auto",
                    }}
                  />
                ) : (
                  (
                    sessionsCountQuery.data?.data as unknown as {
                      count: number;
                    }
                  )?.count || `0`
                )
              }
              to={ResourceList.includes(`sessions`) && "sessions"}
              helperText={`Total`}
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
            <ListenEventsChart />
          </Grid>

          {/* <Grid item xs={12}>
            {assets && listenEvents ? (
              <AssetListensChart
                assets={assets as GetListResult<IAsset>}
                listenEvents={listenEvents as GetListResult<IListenEvent>}
              />
            ) : (
              <CircularProgress />
            )}
          </Grid> */}
        </Grid>
      </Grid>
    </div>
  );
};

export default React.memo(DashboardContent);
