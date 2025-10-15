import { Box, Button, Divider, Typography } from "@mui/material";
import { InfoWindow } from "@react-google-maps/api";
import { useProjects } from "context/ProjectsContext";
import { useSesisonMap } from "context/SessionMapContext";
import { format } from "date-fns";
import { ChipField, ReferenceArrayField, SingleFieldList } from "react-admin";
import { Link } from "react-router-dom";

const EventInfoWindow = () => {
  const { selectedEvent, setSelectedEvent } = useSesisonMap();
  const sp = useProjects();
  if (!selectedEvent) return null;
  if (!selectedEvent.latitude || !selectedEvent.longitude) return null;
  return (
    <InfoWindow
      onCloseClick={() => setSelectedEvent(null)}
      position={{
        lat: selectedEvent.latitude,
        lng: selectedEvent.longitude,
      }}
    >
      <Box height="150px" width="200px">
        <Typography variant="subtitle2">{selectedEvent.event_type}</Typography>

        <Typography gutterBottom>
          {selectedEvent.client_time
            ? format(new Date(selectedEvent.client_time), "h:mm a - MMMM d, yyyy")
            : ""}
        </Typography>

        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1" gutterBottom>
          Tags
        </Typography>
        <ReferenceArrayField
          reference="tags"
          source="tag_ids"
          record={selectedEvent}
          label="Tags"
        >
          <SingleFieldList>
            <ChipField source="value" />
          </SingleFieldList>
        </ReferenceArrayField>
        <Divider sx={{ my: 1 }} />
        <Typography gutterBottom variant="subtitle1">
          Data
        </Typography>

        {selectedEvent.data}

        {selectedEvent.data?.includes(`asset_id:`) && (
          <Link
            to={`/project/${sp.selectedProject?.id}/assets/${
              selectedEvent.data
                ?.split(`asset_id:`)
                .filter((s) => !!s)[0]
                .split(`,`)[0]
            }`}
          >
            <Button>
              View Asset{" "}
              {selectedEvent.data?.split(`asset_id:`)[0].split(`,`)[0]}
            </Button>
          </Link>
        )}
      </Box>
    </InfoWindow>
  );
};

export default EventInfoWindow;
