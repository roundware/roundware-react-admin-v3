import {
  makeStyles,
  Container,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  Divider,
  Grid,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useDataProvider, GetListResult, Record } from "react-admin";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useProjects } from "../../../providers/ProjectsContext";
import CardWithIcon from "./CardWithIcon";
import { Hearing } from "@material-ui/icons";
import subDays from "date-fns/fp/subDays/index.js";
import DashboardContent from "./DashboardContent";
import ProjectDetails from "./ProjectDetails";
import { GetListParams } from "ra-core";

interface Props {}
const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(4),
  },
}));

export const initialDays = 365;
export const intervals = [
  15, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 365, 0,
];

async function resolvePromises(promises: Promise<void>[]) {
  for (const p of promises) {
    await Promise.resolve(p);
  }
}

const Dashboard = (props: Props) => {
  const classes = useStyles();
  const { selectedProject } = useProjects();

  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<GetListResult<Record> | null>(null);
  const [listenEvents, setListenEvents] =
    useState<GetListResult<Record> | null>(null);
  const [assets, setAssets] = useState<GetListResult<Record> | null>(null);

  const dataProvider = useDataProvider();

  const [resourcesRanges, setResourcesRanges] = useState<{
    [resrouce: string]: string;
  }>({});

  const [busy, setBusy] = useState(false);
  const [lastProjectId, setLastProjectId] = useState(selectedProject?.id);
  useEffect(() => {
    if (!selectedProject) return;
    const controller = new AbortController();
    try {
      updateData(controller.signal);
    } catch (e) {
      console.log(e);
    }
    return () => controller.abort();
  }, [selectedProject]);

  const updateData = useCallback(
    (signal: AbortController[`signal`]) => {
      if (signal.aborted) return Promise.reject();
      return new Promise<void>((resolve, reject) => {
        const abortHandler = () => {
          reject("Aborted");
        };
        signal?.addEventListener("abort", abortHandler);

        setLoading(true);
        setSession(null);
        setResourcesRanges({});
        setListenEvents(null);
        setAssets(null);

        let params: GetListParams = {
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
            .then((data: GetListResult<Record>) => {
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
            .then((data: GetListResult<Record>) => {
              setListenEvents((prev) => ({
                ...prev,
                data: [...(prev?.data || []), ...data.data],
                total: [...(prev?.data || []), ...data.data].length,
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
            .then((data: GetListResult<Record>) => {
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
  return (
    <div className={classes.container}>
      <ProjectDetails />
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((e) => (
            <Grid item xs={6} md={3} key={e}>
              <Skeleton variant="rect" height={200} />
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
