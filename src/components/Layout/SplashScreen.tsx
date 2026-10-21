import React from "react";

import { Box, LinearProgress } from "@mui/material";

const SplashScreen = () => {
  return (
    <Box
      sx={() => ({
        display: "flex",
        justifyContent: `center`,
        alignItems: `center`,
        height: `100vh`,
        flexDirection: `column`,
      })}
    >
      <img src="/brand/roundware-logo-dark.png" alt="Roundware" width="200" />
      <LinearProgress sx={{ width: "200px", my: 2 }} />
    </Box>
  );
};

export default SplashScreen;
