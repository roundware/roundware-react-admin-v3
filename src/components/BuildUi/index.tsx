import React, { useState, useEffect } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import {
  Box,
  Grid,
  Typography,
  CardHeader,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from "@material-ui/core";
import { Title } from "react-admin";
import UiGroupsList from "./UiGroupsList";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { IUIGroup } from "types/uiGroups";
import { useProjects } from "providers/ProjectsContext";
const BuildUI = (): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();
  const { selectedProject } = useProjects();
  const [uiGroups, setUiGroups] = useState<null | IUIGroup[]>(null);
  const [uiMode, setUiMode] = useState<IUIGroup[`ui_mode`]>("listen");
  useEffect(() => {
    if (!selectedProject) return;
    dataProvider
      .getList(`uigroups`, {
        pagination: {
          page: 0,
          perPage: 0,
        },
        filter: {
          project_id: selectedProject?.id,
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
        <Typography variant="h6">Build UI</Typography>
        <Box pb={2}>
          <FormLabel>Select UI Mode</FormLabel>
          <RadioGroup
            row
            name="UI Mode"
            value={uiMode}
            onChange={(e, v) => setUiMode(v as IUIGroup[`ui_mode`])}
          >
            <FormControlLabel
              value="listen"
              control={<Radio />}
              label="Listen"
            />
            <FormControlLabel value="speak" control={<Radio />} label="Speak" />
            <FormControlLabel
              value="browse"
              control={<Radio />}
              label="Browse"
            />
          </RadioGroup>
        </Box>
        <Box>
          <Grid container>
            <Grid item xs md={8}>
              <Card>
                <CardHeader title="UI Groups" />
                <CardContent>
                  {Array.isArray(uiGroups) && (
                    <UiGroupsList
                      data={uiGroups.filter((g) => g.ui_mode === uiMode)}
                      uiMode={uiMode}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BuildUI;
