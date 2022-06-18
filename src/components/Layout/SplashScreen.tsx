import React from "react";

import { Box, LinearProgress } from "@mui/material";

const SplashScreen = () => {
  return (
    <Box
      sx={(t) => ({
        display: "flex",
        justifyContent: `center`,
        alignItems: `center`,
        height: `100vh`,
        flexDirection: `column`,
      })}
    >
      <img src={`/logo.png`} width="200px" />
      <LinearProgress sx={{ width: "200px", my: 2 }} />
    </Box>
  );
};

export default SplashScreen;
