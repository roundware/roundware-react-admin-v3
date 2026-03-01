import FormToolbar from "components/common/FormToolbar";
import LocationSelector from "components/common/LocationSelector";
import TagIdSelector from "components/common/TagIdSelector";
import {
    AutocompleteInput,
    BooleanInput,
    Create,
    RaRecord,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    TextInput,
    useRedirect,
} from "react-admin";
import { useProjects } from "../../context/ProjectsContext";
import AudioOptions from "../common/AudioOptions";
import AssetShape from "./AssetShape";

const AssetCreate = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const redirect = useRedirect();

  const transform = async (data: RaRecord) => {
    try {
      // Use the raw File object for upload
      if (data.file?.rawFile) {
        data.file = data.file.rawFile;
      }
      data.session_id = 1;
      data.project_id = selectedProject?.id;

      // Convert tag_ids array to comma-separated string for multipart form
      if (Array.isArray(data.tag_ids)) {
        data.tag_ids = data.tag_ids.join(",");
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete data.id;
      return data;
    } catch (e) {
      console.error(e);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      alert(e?.message || `Something went wrong!`);
    }
  };

  return (
    <Create
      title="Create an asset"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      transform={transform}
      mutationOptions={{
        onSuccess: () => {
          redirect(`list`, `/assets`);
        },
      }}
    >
      <SimpleForm toolbar={<FormToolbar />}>
        <SelectInput
          source="media_type"
          choices={[
            { id: "audio", name: "audio" },
            { id: "photo", name: "photo" },
            { id: "text", name: "text" },
          ]}
          defaultValue="audio"
        />
        <AudioOptions />
        <LocationSelector
          fieldNames={{ latitude: `latitude`, longitude: `longitude` }}
        >
          <AssetShape />
        </LocationSelector>
        <TextInput multiline source="description" fullWidth minRows={2} />
        <BooleanInput source="submitted" />

        <ReferenceInput
          label="Language"
          source="language_id"
          reference="languages"
        >
          <SelectInput optionText="name" />
        </ReferenceInput>

        <ReferenceInput label="User" source="user_id" reference="users">
          <AutocompleteInput
            optionText={(r) => `${r.first_name} ${r.last_name} (${r.email})`}
            label="User"
            fullWidth
            filterToQuery={(s) => ({ search_str: s })}
          />
        </ReferenceInput>

        <TagIdSelector source="tag_ids" multiple label="Tags" />
      </SimpleForm>
    </Create>
  );
};

export default AssetCreate;
