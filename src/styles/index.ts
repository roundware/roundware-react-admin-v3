import { createTheme } from "@material-ui/core/styles";

const adminTheme = createTheme({
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
});

export default adminTheme;
