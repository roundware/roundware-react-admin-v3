import { Box, CircularProgress, Theme } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import React from "react";
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

  return (
    <div className={classes.container}>
      <ProjectDetails />

      <DashboardContent />
    </div>
  );
};

export default Dashboard;

export const CenteredLoading = () => (
  <Box display="flex" justifyContent="center" alignItems="center">
    <CircularProgress />
  </Box>
);
