import Divider from "@material-ui/core/Divider";
import LocationSelector from "components/common/LocationSelector";
import React from "react";
import {
  BooleanInput,
  Create,
  CreateProps,
  NumberInput,
  Record,
  ReferenceArrayInput,
  ReferenceInput,
  SelectArrayInput,
  SelectInput,
  SimpleForm,
  TextInput,
  useDataProvider,
} from "react-admin";
import { useProjects } from "../../providers/ProjectsContext";
import AudioOptions from "../common/AudioOptions";
import EnvelopeIdSelector from "components/common/EnvelopeIdSelector";

const AssetCreate = (props: CreateProps): JSX.Element => {
  const dataProvider = useDataProvider();
  const { selectedProject } = useProjects();
  const transform = async (data: Record) => {
    try {
      // use the file blob as file property
      data.file = data.file.rawFile;
      // as it is being created via admin
      data.session_id = 1;
      data.project_id = selectedProject?.id;

      console.log(data.envelope_ids);
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
      alert(
        `This is how data would be sent in form-data format, \n ${JSON.stringify(
          data,
          undefined,
          4
        )}`
      );
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
      {...props}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      transform={transform}
    >
      <SimpleForm>
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
        />
        <TextInput multiline source="description" fullWidth minRows={2} />
        <NumberInput source="latitude" />
        <NumberInput source="longitude" />
        {/* <DateTimeInput source="created" />
        <DateTimeInput source="updated" /> */}
        <BooleanInput source="submitted" />
        <NumberInput source="volume" />

        <ReferenceInput
          label="Language"
          source="language_id"
          reference="languages"
          defaultValue={1}
        >
          <SelectInput source="name" />
        </ReferenceInput>
        <ReferenceArrayInput source="tag_ids" reference="tags" fullWidth>
          <SelectArrayInput optionText="description" />
        </ReferenceArrayInput>
        <NumberInput label="Audio Length(s)" source="audio_length_in_seconds" />
        <Divider />
        <ReferenceArrayInput
          source="description_loc_ids"
          reference="localizedstrings"
          fullWidth
        >
          <SelectArrayInput optionText="text" />
        </ReferenceArrayInput>
        <ReferenceArrayInput
          source="alt_text_loc_ids"
          reference="localizedstrings"
          fullWidth
        >
          <SelectArrayInput optionText="text" />
        </ReferenceArrayInput>
        <EnvelopeIdSelector />
      </SimpleForm>
    </Create>
  );
};

export default AssetCreate;
