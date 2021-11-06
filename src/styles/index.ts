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
  props: {
    // Name of the component
    MuiButtonBase: {
      // The properties to apply
      disableRipple: true, // No more ripple, on the whole application!
    },
  },
});

export default adminTheme;
