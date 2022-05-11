import { createTheme, adaptV4Theme } from "@mui/material/styles";

const adminTheme = createTheme(adaptV4Theme({
  palette: {
    secondary: {
      main: "#6b96d8",
    },
    error: {
      main: "#dc004e",
    },
  },
  shape: {
        borderRadius: 8,
    },

  props: {
    MuiButtonBase: {
        disableRipple: true
      }
    }
}));

export default adminTheme;
