import { Box, FormHelperText, Typography } from "@mui/material";
import ShapeDrawInput from "components/common/ShapeDrawInput";
import { useProjects } from "context/ProjectsContext";
import { MultiPolygon } from "@turf/helpers";
import React from "react";
import { required, useInput, Validator } from "react-admin";

/**
 * react-admin adapter around {@link ShapeDrawInput}, for the speaker Create
 * form.
 *
 * A speaker's coverage area used to be drawn only on the Speakers map, after
 * the speaker existed — so "add a speaker" produced something that could not
 * play anywhere, and a shapeless speaker crashes the published web app. The
 * server accepts `shape` on POST (the wizard has always sent it), so there is
 * no reason to split the two.
 *
 * Refining an existing shape — rotate, scale, drag vertices — still belongs to
 * the Speakers map, which has the tools for it.
 */
const SpeakerShapeInput: React.FC<{
  source?: string;
  validate?: Validator | Validator[];
}> = ({ source = "shape", validate = required("Draw a coverage area") }) => {
  const { selectedProject } = useProjects();
  const { field, fieldState } = useInput({ source, validate });

  const center = {
    lat: selectedProject?.latitude ?? 0,
    lng: selectedProject?.longitude ?? 0,
  };

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Coverage area
      </Typography>
      <ShapeDrawInput
        value={(field.value as MultiPolygon) ?? null}
        onChange={(shape) => field.onChange(shape)}
        center={center}
      />
      <FormHelperText error={Boolean(fieldState.error)}>
        {fieldState.error
          ? fieldState.error.message
          : "Where this speaker can be heard. Refine the shape later on the Speakers map."}
      </FormHelperText>
    </Box>
  );
};

export default SpeakerShapeInput;
