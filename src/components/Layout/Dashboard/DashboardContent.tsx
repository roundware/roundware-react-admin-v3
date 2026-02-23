import { Hearing, RecordVoiceOver, WatchLater } from "@mui/icons-material";
import { CircularProgress, Grid } from "@mui/material";
import AssetMediaTypesChart from "components/charts/AssetMediaTypesChart";
import AssetsChart from "components/charts/AssetsChart";
import BrowsersChart from "components/charts/BrowsersChart";
import { ChartsDataProvider } from "components/charts/ChartsData";
import ClientTypeChart from "components/charts/ClientTypeChart";
import ListenEventsChart from "components/charts/ListenEventsChart";
import SessionsChart from "components/charts/SessionsChart";
import { useProjects } from "context/ProjectsContext";
import React from "react";
import { useQuery } from "react-query";
import { apiFetcher } from "roundwareDataProvider/tokenAuthProvider";
import { ResourceList } from "../../../App";
import CardWithIcon from "./CardWithIcon";

const DashboardContent = () => {
  const project = useProjects();
  const projectId = project?.selectedProject?.id;

  const assetsCountQuery = useQuery(
    ["assetsCount", projectId],
    () => apiFetcher(`/assets/count/?project_id=${projectId}&submitted=true`),
    { enabled: projectId != null }
  );

  const listenEventsCountQuery = useQuery(
    ["listeneventsCount", projectId],
    () => apiFetcher(`/listenevents/count/?project_id=${projectId}`),
    { enabled: projectId != null }
  );

  const sessionsCountQuery = useQuery(
    ["sessionsCount", projectId],
    () => apiFetcher(`/sessions/count/?project_id=${projectId}`),
    { enabled: projectId != null }
  );

  return (
    <ChartsDataProvider>
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
                      listenEventsCountQuery.data?.json as unknown as {
                        count: number;
                      }
                    )?.count?.toLocaleString() || `0`
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
                      assetsCountQuery.data?.json as unknown as {
                        count: number;
                      }
                    )?.count?.toLocaleString() || `0`
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
                      sessionsCountQuery.data?.json as unknown as {
                        count: number;
                      }
                    )?.count?.toLocaleString() || `0`
                  )
                }
                to={ResourceList.includes(`sessions`) && "sessions"}
                helperText={`Total`}
              />
            </Grid>
          </Grid>

          <Grid container item xs={12} md={12} spacing={3}>
            <Grid item xs={12} md={4} lg={4}>
              <AssetMediaTypesChart />
            </Grid>

            <Grid container item xs={4} md={4}>
              <ClientTypeChart />
            </Grid>

            <Grid container item xs={4} md={4}>
              <BrowsersChart />
            </Grid>

            <Grid item xs={12} md={12} lg={12}>
              <AssetsChart />
            </Grid>

            <Grid item xs={12} md={12} lg={12}>
              <SessionsChart />
            </Grid>

            <Grid item xs={12} md={12} lg={12}>
              <ListenEventsChart />
            </Grid>

            {/* moved inseide listenevents chart */}
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
    </ChartsDataProvider>
  );
};

export default React.memo(DashboardContent);
