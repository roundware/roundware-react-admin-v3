import React, { useState, useEffect } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { Box, Grid } from "@material-ui/core";
import { Title } from "react-admin";
import UiGroupsList from "./UiGroupsList";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { IUIGroup } from "types/uiGroups";
import { useProjects } from "providers/ProjectsContext";
const BuildUI = (): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();
  const { selectedProject } = useProjects();
  const [uiGroups, setUiGroups] = useState<null | IUIGroup[]>(null);

  useEffect(() => {
    if (!selectedProject) return;
    dataProvider
      .getList(`uigroups`, {
        pagination: {
          page: 0,
          perPage: 0,
        },
        filter: {
          admin: 1,
          project_id: selectedProject.id,
        },
        sort: {
          field: "id",
          order: "ASC",
        },
      })
      .then((res) => setUiGroups(res.data as IUIGroup[]));
  }, [selectedProject]);
  return (
    <Card style={{ marginTop: "5vh" }}>
      <Title title="Build UI" />
      <CardContent>
        UI Groups and UI Items
        <Box>
          <Grid container>
            <Grid item>
              {Array.isArray(uiGroups) && <UiGroupsList data={uiGroups} />}
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BuildUI;
