import { Tab, Tabs } from "@mui/material";
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
  TextInput,
  useListContext,
} from "react-admin";
import { Navigate } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import AssetDatagrid from "./AssetDatagrid";
import { useProjectHasMovingAssets } from "./AssetPath";

export const AssetList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const mapViewEnabled = useBoolean(false);
  const hasMoving = useProjectHasMovingAssets();

  return (
    <List
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
        <BooleanInput key="is_test" source="is_test" label="Made on the test site" />,
        // Only in projects that have moving assets (server docs/030).
        ...(hasMoving ? [<BooleanInput key="moving" source="moving" label="Moving" />] : []),
        <BooleanInput key="has_contact" source="has_contact" label="Has contact details" />,
        <TextInput
          label="Description / Filename"
          key="contains_description|filename"
          source="contains_description+filename"
        />,
      ]}
      sort={{
        field: "id",
        order: "DESC",
      }}
      actions={<ListActions />}
    >
      <>
        <Tabs value={`datagrid`} onChange={mapViewEnabled.toggle}>
          <Tab value="datagrid" label="List" />

          <Tab value="map" label="Map" />
        </Tabs>

        {mapViewEnabled.value && (
          <Navigate to={`/project/${selectedProject?.id}/assets/map`} />
        )}
        <DropHiddenMovingFilter hasMoving={hasMoving} />
        <AssetDatagrid />
      </>
    </List>
  );
};

/** A Moving filter remembered from a project that has moving assets would
 *  still apply here, hidden, and could empty the list with no way to clear
 *  it: drop it once this project is known to have none. */
const DropHiddenMovingFilter = ({ hasMoving }: { hasMoving: boolean | undefined }): null => {
  const { filterValues, displayedFilters, setFilters } = useListContext();
  useEffect(() => {
    if (hasMoving === false && filterValues && "moving" in filterValues) {
      const { moving: _, ...rest } = filterValues;
      const { moving: __, ...shown } = displayedFilters ?? {};
      setFilters(rest, shown);
    }
  }, [hasMoving, filterValues]);
  return null;
};

export default AssetList;
