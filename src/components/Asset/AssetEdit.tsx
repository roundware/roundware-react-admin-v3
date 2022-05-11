/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import EnvelopeIdSelector from "components/common/EnvelopeIdSelector";
import LocationSelector from "components/common/LocationSelector";
import TagIdSelector from "components/common/TagIdSelector";
import TranslatableField from "components/common/TranslatableField";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import React, { useEffect } from "react";
import {
  BooleanInput,
  DateTimeInput,
  Edit,
  EditProps,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
  useRedirect,
  Record,
  useEditController,
  Identifier,
} from "react-admin";
import { handleLocalizedStrings } from "utils";
import { IAsset } from "../../types/asset";
import AudioOptions from "../common/AudioOptions";

const AssetEdit = (props: EditProps): JSX.Element => {
  const redirect = useRedirect();
  const editControl = useEditController(props);
  const dataProvider = useRoundwareDataProvider();

  useEffect(() => {
    // revalidate to get the localized strings
    dataProvider
      .getOneJson(`assets`, props.id!, { admin: 1 }, true)
      .then(() => editControl.refetch());
  }, []);

  const transform = async (data: Partial<IAsset>) => {
    if (!data.file) {
      // wants to remove file
      data.file = null;
    } else if (typeof data.file === "string") {
      // not edited; no need to include in PATCH request;
      delete data.file;
    } else {
      // pass the file blob
      // @ts-ignore
      if (data.file?.src) {
        // @ts-ignore
        data.file = data.file?.rawFile;
        // @ts-ignore
        data.filename = data.file?.name;
      }
    }
    if (data?.user) {
      data.user_id = data?.user?.id;
      delete data.user;
    }

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
      data.description_loc_ids = await handleLocalizedStrings(
        data.loc_description_admin,
        dataProvider
      );

    if (data.loc_alt_text_admin?.length)
      data.alt_text_loc_ids = await handleLocalizedStrings(
        data.loc_alt_text_admin,
        dataProvider
      );

    if (data.file) {
      data.tag_ids = data.tag_ids
        // @ts-ignore
        ?.reduce((acc: string, el: string) => acc + el + ",", "")
        // @ts-ignore
        .slice(0, -1);

      if (Array.isArray(data.alt_text_loc_ids))
        data.alt_text_loc_ids = data.alt_text_loc_ids
          ?.reduce(
            (acc: string, el: number) => acc.toString() + el.toString() + ",",
            ""
          )
          .slice(0, -1);

      if (Array.isArray(data.description_loc_ids))
        data.description_loc_ids = data.description_loc_ids
          ?.reduce(
            (acc: string, el: number) => acc.toString() + el.toString() + ",",
            ""
          )
          .slice(0, -1);
    }
    return data;
  };
  return (
    <Edit
      title="Edit an asset"
      // @ts-ignore
      transform={transform}
      mutationMode="optimistic"
      mutationOptions={{
        onSuccess: () => redirect(`list`, `/assets`),
      }}
    >
      <SimpleForm redirect={false} warnWhenUnsavedChanges>
        <TextInput source="id" disabled fullWidth />
        <ReferenceInput
          label="Project"
          source="project_id"
          reference="projects"
        >
          <SelectInput source="name" fullWidth />
        </ReferenceInput>

        <SelectInput
          source="media_type"
          choices={[
            { id: "audio", name: "audio" },
            { id: "photo", name: "photo" },
            { id: "text", name: "text" },
            // { id: "video", name: "video" },
          ]}
          fullWidth
        />

        <AudioOptions />
        <LocationSelector
          fieldNames={{
            latitude: `latitude`,
            longitude: `longitude`,
          }}
        />

        <NumberInput source="session_id" fullWidth />
        <ReferenceInput label="User" source="user.id" reference="users">
          <SelectInput optionText="username" fullWidth />
        </ReferenceInput>
        <TextInput multiline source="description" fullWidth />
        <DateTimeInput source="created" fullWidth />
        <DateTimeInput source="updated" fullWidth />
        <BooleanInput source="submitted" fullWidth />
        <ReferenceInput
          label="Language"
          source="language_id"
          reference="languages"
        >
          <SelectInput source="name" fullWidth />
        </ReferenceInput>
        <TagIdSelector source="tag_ids" multiple label="Tags" />
        <TranslatableField
          source="loc_description_admin"
          label="Description Localized"
        />

        <TranslatableField source="loc_alt_text_admin" label="Alt Text" />

        <EnvelopeIdSelector />
      </SimpleForm>
    </Edit>
  );
};

export default AssetEdit;
