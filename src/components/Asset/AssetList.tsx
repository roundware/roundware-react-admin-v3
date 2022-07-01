import { Fade, Tab, Tabs } from "@mui/material";
import ListActions from "components/common/ListActions";
import TagIdSelector from "components/common/TagIdSelector";
import useBoolean from "hooks/useBoolean";
import React, { useEffect } from "react";
import {
  BooleanInput,
  DateTimeInput,
  List,
  NumberInput,
  SelectInput,
  useListController,
} from "react-admin";
import { useProjects } from "../../context/ProjectsContext";
import AssetDatagrid from "./AssetDatagrid";
import AssetMap from "./AssetMap";

export const AssetList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const mapViewEnabled = useBoolean(false);
  useEffect(() => {
    if (mapViewEnabled.value) {
    }
  }, [mapViewEnabled.value]);

  return (
    <List
      filter={{ project_id: selectedProject?.id }}
      filters={[
        <DateTimeInput
          key="after"
          label="Created After"
          source="created__gte"
        />,
        <DateTimeInput
          key="before"
          label="Created Before"
          source="created__lte"
        />,
        <NumberInput
          key="audiolengthgte"
          label="Audio Length Greater Than"
          source="audio_length_in_seconds__gte"
        />,
        <NumberInput
          key="audiolengthlte"
          label="Audio Length Lesser Than"
          source="audio_length_in_seconds__lte"
        />,
        <TagIdSelector
          multiple
          source="tag_ids"
          key="tag_ids"
          label="Includes Tags"
        />,
        <SelectInput
          source="media_type"
          key="media_type"
          label="Media Type"
          choices={[
            { id: "audio", name: "audio" },
            { id: "photo", name: "photo" },
            { id: "text", name: "text" },
            // { id: "video", name: "video" },
          ]}
          fullWidth
        />,
        <BooleanInput key="submitted" source="submitted" label="Submitted" />,
      ]}
      sort={{
        field: "id",
        order: "DSC",
      }}
      actions={<ListActions />}
    >
      <>
        <Tabs
          value={!mapViewEnabled.value ? `datagrid` : `map`}
          onChange={mapViewEnabled.toggle}
        >
          <Tab value="datagrid" label="List" />

          <Tab value="map" label="Map" />
        </Tabs>

        <Fade in={mapViewEnabled.value}>
          <div style={{ height: "0" }}>
            <AssetMap />
          </div>
        </Fade>
        <Fade in={!mapViewEnabled.value}>
          <div style={{ height: "0" }}>
            <AssetDatagrid />
          </div>
        </Fade>
        <SyncPerPage mapView={mapViewEnabled.value} />
      </>
    </List>
  );
};

const SyncPerPage = (props: { mapView: boolean }) => {
  const lc = useListController();
  useEffect(() => {
    if (props.mapView) {
      lc.setPerPage(lc.total);
      lc.setPage(0);
    } else {
      lc.setPerPage(10);
      lc.setPage(0);
    }
  }, [props.mapView]);

  return null;
};
export default AssetList;
