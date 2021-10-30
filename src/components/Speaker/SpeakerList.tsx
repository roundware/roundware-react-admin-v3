import {
  EditButton,
  DeleteButton,
  List,
  Datagrid,
  TextField,
  BooleanField,
  ListProps,
  NumberField,
  ReferenceField,
  useRecordContext,
  NumberInput,
  TextInput,
  SimpleForm,
} from "react-admin";
import { Grid, IconButton, Tooltip, Typography } from "@material-ui/core";
import { useSpeakers } from "providers/SpeakersContext";
import LocationOnOutlinedIcon from "@material-ui/icons/LocationOnOutlined";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import { SpeakerEdit } from ".";
import SpeakerShapesControl from "./SpeakerShapesControl";
const SpeakerList = (props: ListProps) => {
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
