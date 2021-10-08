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
import React, { useEffect, useState } from "react";
import { useProjects } from "../../../providers/ProjectsContext";
import CardWithIcon from "./CardWithIcon";
import { Hearing } from "@material-ui/icons";

import DashboardContent from "./DashboardContent";
import ProjectDetails from "./ProjectDetails";
import drfProvider, { fetchJsonWithAuthToken } from "ra-data-roundware-drf";
interface Props {}
const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(4),
  },
}));

const dataProvider = drfProvider(
  `${process.env.REACT_APP_SERVER_URL}/api/2`,
  fetchJsonWithAuthToken
);
const Dashboard = (props: Props) => {
  const classes = useStyles();
  const { selectedProject } = useProjects();

  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<GetListResult<Record> | null>(null);
  const [listenEvents, setListenEvents] =
    useState<GetListResult<Record> | null>(null);
  const [assets, setAssets] = useState<GetListResult<Record> | null>(null);
  const [users, setUsers] = useState<GetListResult<Record> | null>(null);

  // const dataProvider = useDataProvider();

  useEffect(() => {
    setLoading(true);
    setSession(null);
    setUsers(null);
    setListenEvents(null);
    setAssets(null);
    const params = {
      filter: {
        project_id: selectedProject?.id,
      },
      sort: {
        field: "id",
      },
      pagination: {
        page: 1,
        perPage: 1,
      },
    };

    const promises = [
      dataProvider
        .getList(
          `sessions`,
          // @ts-ignore
          params
        )
        .then((data) => setSession(data)),
      dataProvider
        .getList(
          `listenevents`,
          // @ts-ignore
          params
        )
        .then((data) => setListenEvents(data)),
      dataProvider
        .getList(
          `assets`,
          // @ts-ignore
          params,
          false
        )
        .then((data) => setAssets(data)),
      dataProvider
        .getList(
          `users`,
          // @ts-ignore
          params
        )
        .then((data) => setUsers(data)),
    ];

    Promise.all(promises).then(() => {
      setLoading(false);
    });
  }, [selectedProject]);

  useEffect(() => {
    if (Array.isArray(listenEvents?.data) && Array.isArray(assets?.data)) {
      setListenEvents((prev) => {
        const events = { ...prev };
        events.data = events.data?.filter((e) =>
          assets?.data.some((a) => a.id === e.asset_id)
        )!;
        events.total = events.data?.length || 0;
        return events as GetListResult<Record>;
      });
    }
  }, [loading]);

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
          selectedProject={selectedProject!}
          sessions={session!}
          users={users!}
          assets={assets!}
          listenEvents={listenEvents!}
        />
      )}
    </div>
  );
};

export default Dashboard;
