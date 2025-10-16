import EnvelopeIdSelector from "components/common/EnvelopeIdSelector";
import FormToolbar from "components/common/FormToolbar";
import LocationSelector from "components/common/LocationSelector";
import TagIdSelector from "components/common/TagIdSelector";
import TranslatableField from "components/common/TranslatableField";
import {
    AutocompleteInput,
    BooleanInput,
    Create,
    RaRecord,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    TextInput,
    useDataProvider,
    useRedirect,
} from "react-admin";
import { useProjects } from "../../context/ProjectsContext";
import { handleLocalizedStrings } from "../../utils.tsx";
import AudioOptions from "../common/AudioOptions";
import AssetShape from "./AssetShape";

const AssetCreate = (): JSX.Element => {
  const dataProvider = useDataProvider();
  const { selectedProject } = useProjects();
  const redirect = useRedirect();
  const transform = async (data: RaRecord) => {
    try {
      // use the file blob as file property
      data.file = data.file.rawFile;
      // as it is being created via admin
      data.session_id = 1;
      // data.project = selectedProject?.id;
      data.project_id = selectedProject?.id;

      if (Number(data.envelope_ids) > 0) {
        // this means user wants to specify an existing envelope_ids
        // note though its plural, it doesn't want an array format
        data.envelope_ids = Number(data.envelope_ids);
      } else {
        // we need to create a new envelope here; and pass that id
        // using session_id = 1 for admin

        const res = await dataProvider.create(`envelopes`, {
          data: {
            session_id: 1,
          },
        });
        data.envelope_ids = Number(res.data.id);
      }

      if (data.loc_description_admin?.length)
        data.description_loc_ids = (
          await handleLocalizedStrings(data.loc_description_admin, dataProvider)
        )
          .reduce((acc: string, el) => acc.toString() + el.toString() + ",", "")
          .slice(0, -1);

      if (data.loc_alt_text_admin?.length)
        data.alt_text_loc_ids = (
          await handleLocalizedStrings(data.loc_alt_text_admin, dataProvider)
        )
          .reduce((acc: string, el) => acc.toString() + el.toString() + ",", "")
          .slice(0, -1);

      data.tag_ids = data.tag_ids
        ?.reduce((acc: string, el: string) => acc + el + ",", "")
        .slice(0, -1);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore it should be optional only in case of create but types say it isn't
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
        onSuccess: () => redirect(`list`, `/assets`),
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
        {/* <NumberInput source="latitude" />
        <NumberInput source="longitude" /> */}
        {/* <DateTimeInput source="created" />
        <DateTimeInput source="updated" /> */}
        <BooleanInput source="submitted" />
        {/* <NumberInput source="volume" /> */}

        <ReferenceInput
          label="Language"
          source="language_id"
          reference="languages"
          defaultValue={1}
        >
          <SelectInput optionText="name" />
        </ReferenceInput>
        <TagIdSelector source="tag_ids" multiple label="Tags" />
        {/* <NumberInput label="Audio Length(s)" source="audio_length_in_seconds" /> */}
        {/* <Divider /> */}
        <TranslatableField
          source="loc_description_admin"
          label="Description Localized"
        />

        <TranslatableField source="loc_alt_text_admin" label="Alt Text" />
        <ReferenceInput label="User" source="user.id" reference="users">
          <AutocompleteInput
            optionText={(r) =>
              `${r.first_name} ${r.last_name} (@${r.username})`
            }
            label="User"
            fullWidth
            filterToQuery={(s) => ({
              search_str: s,
            })}
          />
        </ReferenceInput>
        <EnvelopeIdSelector />
      </SimpleForm>
    </Create>
  );
};

export default AssetCreate;
