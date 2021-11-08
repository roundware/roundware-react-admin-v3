import React from "react";
import { IconButton, Tooltip, Grid, Paper } from "@material-ui/core";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import LocationOnOutlinedIcon from "@material-ui/icons/LocationOnOutlined";
import { useSpeakers } from "providers/SpeakersContext";
import {
  BooleanField,
  Datagrid,
  DeleteButton,
  EditButton,
  List,
  ListProps,
  TextField,
  useRecordContext,
} from "react-admin";
import { SpeakerEdit } from ".";
import SpeakerShapesControl from "./SpeakerShapesControl";
const SpeakerList = (props: ListProps): JSX.Element => {
  return (
    <Grid
      spacing={3}
      container
      direction="row"
      wrap="nowrap"
      style={{ marginTop: 28 }}
      component={Paper}
    >
      <Grid item xs={12} md={6} sm={6} style={{ flexShrink: 1, flexGrow: 0 }}>
        <List
          {...props}
          title="Speakers"
          component="div"
          bulkActionButtons={false}
        >
          <Datagrid
            expand={<SpeakerEdit />}
            hasBulkActions={false}
            style={{ flexShrink: 1 }}
          >
            <SpeakerHighter />

            <TextField source="id" />
            <BooleanField source="activeyn" label="Active" />
            <TextField source="code" />

            {/* <TextField source="backupuri" />
      <TextField source="shape.type" />
      <TextField source="boundary.type" /> */}

            <EditButton label="" style={{ margin: 0 }} basePath="/speakers" />
            <DeleteButton label="" basePath="/speakers" />
          </Datagrid>
        </List>
      </Grid>
      <Grid xs={12} style={{ flexShrink: 1, flexGrow: 1 }}>
        <SpeakerShapesControl />
      </Grid>
    </Grid>
  );
};

const SpeakerHighter = () => {
  const { id } = useRecordContext();
  const { setSelectedSpeaker, selectedSpeaker } = useSpeakers();

  const isSelected = id == selectedSpeaker;
  return (
    <Tooltip title={isSelected ? "Unselect" : `Select On Map`} placement="left">
      <IconButton
        onClick={() =>
          setSelectedSpeaker((prev) => (prev == id ? null : Number(id)))
        }
      >
        {isSelected ? <LocationOnIcon /> : <LocationOnOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default SpeakerList;
