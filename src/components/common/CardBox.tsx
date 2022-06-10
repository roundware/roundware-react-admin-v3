import { Card, CardContent, CardHeader } from "@mui/material";
import React from "react";
interface Props {
  title: string;
  children: React.ReactNode;
}

const CardBox = ({ title, children }: Props): JSX.Element => {
  return (
    <Card variant="elevation" style={{ margin: "8px 0", width: "100%" }}>
      <CardHeader title={title} />

      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default CardBox;
