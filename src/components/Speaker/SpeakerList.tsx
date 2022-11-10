import { Edit } from "@mui/icons-material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import {
  Alert,
  AlertTitle,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
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
  const {
    fetchData,
    speakersWithoutShape,
    setSelectedSpeaker,
    selectedSpeaker,
  } = useSpeakers();
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
          <Stack spacing={2}>
            {!!speakersWithoutShape.filter((s) => s.isNewlyCreated == false)
              .length && (
              <Alert severity="warning">
                <AlertTitle>
                  There are some speakers with no shape assigned!
                </AlertTitle>
                Please assign a shape to following speakers:
                <Stack spacing={1} mt={1}>
                  {speakersWithoutShape
                    ?.filter((s) => s.isNewlyCreated == false)
                    .map((s) => (
                      <Stack
                        spacing={1}
                        direction={"row"}
                        key={s.id}
                        alignItems="center"
                      >
                        <Typography
                          textTransform={"uppercase"}
                          variant="subtitle2"
                        >
                          {s.id}: {s.code}
                        </Typography>
                        <Button
                          variant={
                            s.id == selectedSpeaker ? "contained" : "outlined"
                          }
                          size="small"
                          onClick={() =>
                            setSelectedSpeaker(
                              s.id == selectedSpeaker ? null : s.id
                            )
                          }
                          startIcon={<Edit />}
                        >
                          {selectedSpeaker == s.id
                            ? "Ready to Draw"
                            : "Click to Draw"}
                        </Button>
                      </Stack>
                    ))}
                </Stack>
              </Alert>
            )}

            {!!speakersWithoutShape.filter((s) => s.isNewlyCreated == true)
              .length && (
              <Alert severity="info">
                <AlertTitle>
                  Finish creating your new speakers by adding a shape on the
                  map.
                </AlertTitle>
                <Stack spacing={1} mt={1}>
                  {speakersWithoutShape
                    ?.filter((s) => s.isNewlyCreated == true)
                    .map((s) => (
                      <Stack
                        spacing={1}
                        direction={"row"}
                        key={s.id}
                        alignItems="center"
                      >
                        <Typography
                          textTransform={"uppercase"}
                          variant="subtitle2"
                        >
                          {s.id}: {s.code}
                        </Typography>
                        <Button
                          variant={
                            s.id == selectedSpeaker ? "contained" : "outlined"
                          }
                          size="small"
                          onClick={() =>
                            setSelectedSpeaker(
                              s.id == selectedSpeaker ? null : s.id
                            )
                          }
                          startIcon={<Edit />}
                        >
                          {s.id == selectedSpeaker
                            ? `Ready to Draw`
                            : `Click to Draw`}
                        </Button>
                      </Stack>
                    ))}
                </Stack>
              </Alert>
            )}
          </Stack>
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
