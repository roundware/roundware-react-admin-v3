import { Card, CardContent, CardHeader } from "@material-ui/core";
import React from "react";
interface Props {
  title: string;
  children: React.ReactNode;
}

const CardBox = ({ title, children }: Props): JSX.Element => {
  return (
    <Card variant="outlined" style={{ margin: "8px 0" }}>
      <CardHeader title={title} />

      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default CardBox;
