/* eslint-disable @typescript-eslint/ban-ts-comment */
import FormToolbar from "components/common/FormToolbar";
import TranslatableField from "components/common/TranslatableField";
import { useBuildUI } from "context/BuildUIContext";
import { useProjects } from "context/ProjectsContext";
import React, { useMemo } from "react";
import {
    BooleanInput,
    Create,
    Edit,
    NumberInput,
    RadioButtonGroupInput,
    RaRecord,
    ReferenceInput,
    required,
    SelectInput,
    SimpleForm,
    TextInput,
    useRedirect,
    useRefresh,
} from "react-admin";
import { IUIGroup } from "types/uiGroups";
import { buildLocalizationsPayload } from "../../utils";
import UIItemFilterField from "./UIItemFilterField";
import UiModeField from "./UiModeField";

export const UiGroupEdit = (): JSX.Element => {
  const { refetchData } = useBuildUI();
  const transform = (record: RaRecord): RaRecord => {
    const data = { ...record } as Record<string, unknown> & {
      ui_items?: Array<{ id: number } | number>;
    };

    data.ui_items =
      data?.ui_items?.map(
        (i) =>
          // @ts-ignore
          i.id
      ) || [];

    data.localizations = buildLocalizationsPayload(
      data as Record<string, unknown>,
      { header_text_loc_admin: "header_text" },
    );
    delete data.header_text_loc_admin;
    delete data.header_text_loc;
    return data as RaRecord;
  };

  const refresh = useRefresh();
  const redirect = useRedirect();
  const refreshData = () => {
    refetchData();
    refresh();
    redirect(`list`, `/uigroups`);
  };

  return (
    <Edit
      transform={transform}
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: refreshData,
      }}
    >
      <SimpleForm warnWhenUnsavedChanges>
        {/* <ArrayInput label="UI Items" source="ui_items">
              <SimpleFormIterator>
                <BooleanInput label="Active" source="active" />
                <BooleanInput label="Default" source="default" />

                <ReferenceInput
                  label="Tag"
                  source="tag_id"
                  reference="tags"
                  filter={{
                    tag_category_id: record?.tag_category_id,
                  }}
                >
                  <SelectInput optionText="value" />
                </ReferenceInput>
              </SimpleFormIterator>
            </ArrayInput> */}

        <TextInput disabled fullWidth source="id" required />
        <NumberInput
          source="index"
          fullWidth
          required
          helperText="It is recommended to not modify this field here but use drag and drop feature instead."
        />

        <ReferenceInput
          source="tag_category_id"
          reference="tagcategories"
          label="Select Tag Category"
        >
          <SelectInput optionText="name" fullWidth />
        </ReferenceInput>
        <TextInput source="name" fullWidth validate={required()} />
        <TranslatableField source="header_text_loc_admin" label="Header Text" />
        <UiModeField />
        <RadioButtonGroupInput
          source="select"
          fullWidth
          defaultValue="single"
          choices={[
            { id: "single", name: "Single" },
            { id: "multi", name: "Multiple" },
            { id: "min_one", name: "Multiple Atleast One" },
          ]}
        />

        <UIItemFilterField />

        <BooleanInput source="active" />
      </SimpleForm>
    </Edit>
  );
};

export const UiGroupCreate = (): JSX.Element => {
  const { refetchData, uiGroups } = useBuildUI();
  const { selectedProject } = useProjects();

  const refresh = useRefresh();
  const redirect = useRedirect();
  const refreshData = () => {
    refetchData();
    refresh();
    redirect(`list`, `/uigroups`);
  };

  const newIndex = useMemo(() => {
    const lastIndex: number = uiGroups.reduce<number>((lastIndex, el) => {
      if (el.index > lastIndex) lastIndex = el.index;
      return lastIndex;
    }, 0);
    return lastIndex + 1;
  }, [uiGroups]);

  const transform = (record: RaRecord): RaRecord => {
    const data = { ...record } as Record<string, unknown> & {
      ui_items?: Array<{ id: number } | number>;
    };

    data.project_id = selectedProject?.id;

    // @ts-ignore
    data.ui_items = data?.ui_items?.map((i) => i.id) || [];

    data.localizations = buildLocalizationsPayload(
      data as Record<string, unknown>,
      { header_text_loc_admin: "header_text" },
    );
    data.index = newIndex;
    delete data.header_text_loc_admin;
    delete data.header_text_loc;
    return data as RaRecord;
  };
  return (
    <Create
      transform={transform}
      mutationOptions={{
        onSuccess: () => refreshData(),
      }}
      redirect="list"
    >
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <TextInput
          fullWidth
          required
          disabled
          variant="filled"
          type="number"
          label="Index"
          value={newIndex.toString()}
          source="index"
          helperText="It is recommended to not modify this field here but use drag and drop feature instead."
        />

        <ReferenceInput
          source="tag_category_id"
          reference="tagcategories"
          label="Select Tag Category"
          required
        >
          <SelectInput optionText="name" fullWidth />
        </ReferenceInput>
        <TextInput source="name" fullWidth validate={required()} />
        <TranslatableField source="header_text_loc_admin" label="Header Text" />
        <UiModeField />
        <RadioButtonGroupInput
          source="select"
          fullWidth
          defaultValue="single"
          choices={[
            { id: "single", name: "Single" },
            { id: "multi", name: "Multiple" },
            { id: "min_one", name: "Multiple Atleast One" },
          ]}
        />

        <UIItemFilterField />
        <BooleanInput source="active" defaultValue={true} />
      </SimpleForm>
    </Create>
  );
};
