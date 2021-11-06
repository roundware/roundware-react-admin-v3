import { IconButton, Tooltip } from "@material-ui/core";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import LocationOnOutlinedIcon from "@material-ui/icons/LocationOnOutlined";
import { useSpeakers } from "providers/SpeakersContext";
import React from "react";
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
    <>
      <List
        {...props}
        aside={
          <div style={{ width: "60%", margin: "0 18px" }}>
            <SpeakerShapesControl />
          </div>
        }
        title="Speakers"
      >
        <Datagrid
          rowClick=""
          expand={<SpeakerEdit />}
          style={{ flexShrink: 1 }}
        >
          <SpeakerHighter />

          <TextField source="id" />
          <BooleanField source="activeyn" label="Active" />
          <TextField source="code" />

          {/* <TextField source="backupuri" />
      <TextField source="shape.type" />
      <TextField source="boundary.type" /> */}

          <EditButton basePath="/speakers" />
          <DeleteButton basePath="/speakers" />
        </Datagrid>
      </List>
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
