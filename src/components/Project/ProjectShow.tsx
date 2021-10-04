import { Show, ShowProps, SimpleShowLayout, TextField } from "react-admin";
import React from "react";

interface Props extends ShowProps {}

const ProjectShow = (props: Props) => {
  return (
    <Show {...props}>
      <SimpleShowLayout>
        <TextField source="title" />
      </SimpleShowLayout>
    </Show>
  );
};

export default ProjectShow;
