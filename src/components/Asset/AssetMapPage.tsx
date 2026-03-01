import { Tab, Tabs } from "@mui/material";
import ListActions from "components/common/ListActions";
import TagIdSelector from "components/common/TagIdSelector";
import useBoolean from "hooks/useBoolean";
import React from "react";
import {
  BooleanInput,
  DateTimeInput,
  List,
  NumberInput,
  ResourceContextProvider,
  SelectInput,
} from "react-admin";
import { Navigate } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import AssetMap from "./AssetMap";

export const AssetMapPage = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const mapViewEnabled = useBoolean(true);

  return (
    <ResourceContextProvider value={"assets"}>
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
          order: "DESC",
        }}
        actions={<ListActions />}
      >
        <>
          <Tabs value={`map`} onChange={mapViewEnabled.toggle}>
            <Tab value="datagrid" label="List" />

            <Tab value="map" label="Map" />
          </Tabs>

          {!mapViewEnabled.value && (
            <Navigate to={`/project/${selectedProject?.id}/assets`} />
          )}
          <AssetMap />
        </>
      </List>
    </ResourceContextProvider>
  );
};

export default AssetMapPage;
