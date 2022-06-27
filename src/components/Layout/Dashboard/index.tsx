import { Box, CircularProgress, Grid, Theme } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { Skeleton } from "@mui/material";
import subDays from "date-fns/fp/subDays/index.js";
import { GetListParams } from "ra-core";
import React, { useCallback, useEffect, useState } from "react";
import {
  GetListResult,
  RaRecord,
  useDataProvider,
  useRedirect,
} from "react-admin";
import { useProjects } from "../../../context/ProjectsContext";
import DashboardContent from "./DashboardContent";
import ProjectDetails from "./ProjectDetails";

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    marginTop: theme.spacing(4),
  },
}));

export const initialDays = 365;
export const intervals = [
  15, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 365, 0,
];

const Dashboard = (): JSX.Element => {
  const classes = useStyles();
  const { selectedProject } = useProjects();

  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<GetListResult<RaRecord> | null>(null);
  const [listenEvents, setListenEvents] =
    useState<GetListResult<RaRecord> | null>(null);
  const [assets, setAssets] = useState<GetListResult<RaRecord> | null>(null);

  const dataProvider = useDataProvider();

  const [resourcesRanges, setResourcesRanges] = useState<{
    [resrouce: string]: string;
  }>({});

  const [busy, setBusy] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastProjectId, setLastProjectId] = useState(selectedProject?.id);

  const updateData = useCallback(
    (signal: AbortController[`signal`]) => {
      if (signal.aborted) return Promise.reject();
      return new Promise<void>((resolve, reject) => {
        const abortHandler = () => {
          reject("Aborted");
        };
        signal?.addEventListener("abort", abortHandler);

        if (!selectedProject) return;

        setLoading(true);
        setSession(null);
        setResourcesRanges({});
        setListenEvents(null);
        setAssets(null);

        const params: GetListParams = {
          filter: {
            project_id: selectedProject?.id,
          },
          sort: {
            field: "id",
            order: "ASC",
          },
          pagination: {
            page: 0,
            perPage: 0,
          },
        };
        setBusy(true);
        Promise.all([
          dataProvider
            .getList(`sessions`, params)
            .then((data: GetListResult<RaRecord>) => {
              setResourcesRanges((prev) => ({ ...prev, sessions: `Total` }));
              setSession(data);
            }),

          dataProvider
            .getList(`listenevents`, {
              ...params,
              filter: {
                ...params.filter,
                start_time__gte: subDays(30, new Date()).toISOString(),
              },
            })
            .then((data: GetListResult<RaRecord>) => {
              if (!data) return;
              setListenEvents((prev) => ({
                ...prev,
                data: [...(prev?.data || []), ...(data?.data || [])],
                total: [...(prev?.data || []), ...(data?.data || [])].length,
              }));
              setResourcesRanges((prev) => ({
                ...prev,
                listenEvents: `Total`,
              }));
            }),

          dataProvider
            .getList(`assets`, {
              ...params,
            })
            .then((data: GetListResult<RaRecord>) => {
              if (!data) return;
              setAssets((prev) => ({
                ...prev,
                data: [...(prev?.data || []), ...data.data],
                total: [...(prev?.data || []), ...data.data].length,
              }));
              setResourcesRanges((prev) => ({ ...prev, assets: `Total` }));
            }),
        ]).then(() => {
          setBusy(false);
          resolve();
          setLastProjectId(params.filter?.project_id);
          signal?.removeEventListener("abort", abortHandler);
        });
        setLoading(false);
      });
    },
    [selectedProject?.id]
  );

  const redirect = useRedirect();
  useEffect(() => {
    if (!selectedProject) return redirect(`list`, `/projects`);
    const controller = new AbortController();
    try {
      updateData(controller.signal);
    } catch (e) {
      console.error(e);
    }
    return () => controller.abort();
  }, [selectedProject]);

  return (
    <div className={classes.container}>
      <ProjectDetails />
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((e) => (
            <Grid item xs={6} md={3} key={e}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <DashboardContent
          sessions={session}
          // users={users}
          assets={assets}
          listenEvents={listenEvents}
          ranges={resourcesRanges}
        />
      )}
    </div>
  );
};

export default Dashboard;

export const CenteredLoading = () => (
  <Box display="flex" justifyContent="center" alignItems="center">
    <CircularProgress />
  </Box>
);
