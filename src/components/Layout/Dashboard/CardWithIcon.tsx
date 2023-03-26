/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Card, Divider, Theme, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import * as React from "react";
import { createElement, FC, ReactNode } from "react";
import { useRedirect } from "react-admin";
interface Props {
  icon: FC<any>;
  to?: string | boolean;
  title?: string;
  subtitle?: string | number | React.ReactNode;
  helperText?: string;
  children?: ReactNode;
  bgColor?: string;
}

const useStyles = makeStyles((theme: Theme) => ({
  card: {
    minHeight: 52,
    display: "flex",
    flexDirection: "column",
    flex: "1",
    "& a": {
      textDecoration: "none",
      color: "inherit",
    },
  },
  main: () => ({
    overflow: "inherit",
    padding: 16,
    background: `url(https://github.dev/marmelab/react-admin/blob/44fd60acd706052b4fcabd0461fe143872949652/examples/demo/src/dashboard/cartouche.png) no-repeat`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    "& .icon": {
      color: theme.palette.mode === "dark" ? "inherit" : "#dc2440",
    },
  }),
  title: {},
}));

const CardWithIcon = (props: Props): JSX.Element => {
  const { icon, title, subtitle, to, children, helperText } = props;
  const classes = useStyles(props);

  const redirect = useRedirect();

  const handleClick = () => {
    if (to && typeof to == "string") redirect(to);
  };
  return (
    <Card
      className={classes.card}
      sx={(t) => ({ backgroundColor: t.palette.background.paper })}
    >
      <div className={classes.main} onClick={handleClick}>
        <Box width="3em" className="icon">
          {createElement(icon, { fontSize: "large" })}
        </Box>
        <Box textAlign="right">
          <Typography className={classes.title} color="textSecondary">
            {title}
          </Typography>
          <Typography variant="h5" component="h2">
            {subtitle || " "}
          </Typography>
        </Box>
      </div>

      {helperText && (
        <Typography variant="subtitle1" align="center" color="textSecondary">
          {helperText}
        </Typography>
      )}

      {children && <Divider />}
      {children}
    </Card>
  );
};

export default CardWithIcon;
