/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Card, Divider, Typography } from "@mui/material";
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

const CardWithIcon = (props: Props): JSX.Element => {
  const { icon, title, subtitle, to, children, helperText } = props;

  const redirect = useRedirect();

  const handleClick = () => {
    if (to && typeof to == "string") redirect(to);
  };
  return (
    <Card
      sx={{ 
        minHeight: 52,
        display: "flex",
        flexDirection: "column",
        flex: "1",
        "& a": {
          textDecoration: "none",
          color: "inherit",
        },
        backgroundColor: "background.paper"
      }}
    >
      <Box 
        onClick={handleClick}
        sx={{
          overflow: "inherit",
          padding: 2,
          background: `url(https://github.dev/marmelab/react-admin/blob/44fd60acd706052b4fcabd0461fe143872949652/examples/demo/src/dashboard/cartouche.png) no-repeat`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          "& .icon": {
            color: "#dc2440",
          },
        }}
      >
        <Box 
          width="3em" 
          className="icon"
          sx={{
            color: "#dc2440",
          }}
        >
          {createElement(icon, { fontSize: "large" })}
        </Box>
        <Box textAlign="right">
          <Typography color="textSecondary">
            {title}
          </Typography>
          <Typography variant="h5" component="h2">
            {subtitle || " "}
          </Typography>
        </Box>
      </Box>

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
