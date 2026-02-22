import { createTheme } from "@mui/material/styles";

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
  typography: {
    fontFamily: "'Roboto', sans-serif",
  },
});

export default adminTheme;
