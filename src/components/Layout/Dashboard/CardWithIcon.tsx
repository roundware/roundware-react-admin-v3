import * as React from "react";
import { FC, createElement } from "react";
import { Card, Box, Typography, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface Props {
  icon: FC<any>;
  to: string;
  title?: string;
  subtitle?: string | number;
  children?: ReactNode;
  bgColor?: string;
}

const useStyles = makeStyles((theme) => ({
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
  main: (props: Props) => ({
    overflow: "inherit",
    padding: 16,
    background: `url(https://github.dev/marmelab/react-admin/blob/44fd60acd706052b4fcabd0461fe143872949652/examples/demo/src/dashboard/cartouche.png) no-repeat`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    "& .icon": {
      color: theme.palette.type === "dark" ? "inherit" : "#dc2440",
    },
  }),
  title: {},
}));

const CardWithIcon = (props: Props) => {
  const { icon, title, subtitle, to, children, bgColor = "#ffffff" } = props;
  const classes = useStyles(props);
  return (
    <Card className={classes.card} style={{ backgroundColor: bgColor }}>
      <Link to={to}>
        <div className={classes.main}>
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
      </Link>
      {children && <Divider />}
      {children}
    </Card>
  );
};

export default CardWithIcon;
