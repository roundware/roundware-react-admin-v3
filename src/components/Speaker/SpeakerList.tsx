import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { Grid, IconButton, Paper, Tooltip } from "@mui/material";
import CopyResourceButton from "components/common/CopyResource";
import { useProjects } from "context/ProjectsContext";
import { useSpeakers } from "context/SpeakersContext";
import React from "react";
import {
  BooleanField,
  Datagrid,
  DeleteButton,
  EditButton,
  List,
  TextField,
  useRecordContext,
} from "react-admin";
import SpeakerShapesControl from "./SpeakerShapesControl";
const SpeakerList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const { fetchData } = useSpeakers();
  if (!selectedProject) return <>No Project Selected.</>;
  return (
    <>
      <Grid
        spacing={3}
        container
        direction="row"
        wrap="nowrap"
        style={{ marginTop: 28 }}
        component={Paper}
      >
        <Grid
          item
          xs={12}
          md={6}
          style={{
            flexShrink: 1,
            flexGrow: 0,
            overflowY: "scroll",
            overflowX: "visible",
            width: "100%",
            height: "80vh",
          }}
        >
          <List title="Speakers" component="div">
            <Datagrid bulkActionButtons={false} style={{ flexShrink: 1 }}>
              <SpeakerHighter />

              <TextField source="id" />
              <BooleanField source="activeyn" label="Active" />
              <TextField source="code" />

              {/* <TextField source="backupuri" />
      <TextField source="shape.type" />
      <TextField source="boundary.type" /> */}

              <EditButton label="" style={{ margin: 0 }} />
              <CopyResourceButton onSuccess={() => fetchData()} />
              <DeleteButton label="" />
            </Datagrid>
          </List>
        </Grid>
        <Grid xs={12} md={6} item style={{ flexShrink: 1, flexGrow: 1 }}>
          <SpeakerShapesControl />
        </Grid>
      </Grid>
    </>
  );
};

const SpeakerHighter = () => {
  const { id } = useRecordContext();
  const { setSelectedSpeaker, selectedSpeaker } = useSpeakers();

  const isSelected = id == selectedSpeaker;
  return (
    <Tooltip title={isSelected ? "Unselect" : `Select On Map`} placement="left">
      <IconButton
        onClick={() => setSelectedSpeaker(isSelected ? null : Number(id))}
        size="large"
      >
        {isSelected ? <LocationOnIcon /> : <LocationOnOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default SpeakerList;
