import { Box, CircularProgress } from "@mui/material";
import React from "react";
import DashboardContent from "./DashboardContent";
import ProjectDetails from "./ProjectDetails";

export const initialDays = 365;
export const intervals = [
  15, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 365, 0,
];

const Dashboard = (): JSX.Element => {

  return (
    <Box sx={{ marginTop: 4 }}>
      <ProjectDetails />
      <DashboardContent />
    </Box>
  );
};

export default Dashboard;

export const CenteredLoading = () => (
  <Box display="flex" justifyContent="center" alignItems="center">
    <CircularProgress />
  </Box>
);
