import TranslatableField from "components/common/TranslatableField";
import { useBuildUI } from "providers/BuildUIContext";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { useProjects } from "providers/ProjectsContext";
import React, { useMemo } from "react";
import {
  BooleanInput,
  Create,
  CreateProps,
  Edit,
  EditProps,
  NumberInput,
  RadioButtonGroupInput,
  Record,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
  UpdateResult,
  useRedirect,
  useRefresh,
} from "react-admin";
import { IUIGroup } from "types/uiGroups";

export const UiGroupEdit = (props: EditProps): JSX.Element => {
  const { refetchData } = useBuildUI();
  const dataProvider = useRoundwareDataProvider();
  const transform = async (record: Record): Promise<Record> => {
    const r = record as Omit<Partial<IUIGroup>, `header_text_loc`> & {
      header_text_loc: number[];
      ui_items: number[];
    };
    const promises: Promise<UpdateResult<Record>>[] = [];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    r.ui_items = r?.ui_items?.map((i) => i.id) || [];
    r.header_text_loc_admin?.forEach((h) => {
      const patchLocalizedStringProm = dataProvider[h.id ? `update` : `create`](
        `localizedstrings`,
        {
          id: h.id as Record[`id`],
          data: h,
          previousData: h as Record,
        }
      );
      promises.push(patchLocalizedStringProm);
    });
    const responses = await Promise.all(promises);
    r.header_text_loc = responses?.map((h) => Number(h.data.id)) || [];
    delete r.header_text_loc_admin;
    return r as Record;
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
      {...props}
      transform={transform}
      mutationMode="pessimistic"
      onSuccess={refreshData}
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
        <TextInput source="name" fullWidth required />
        <TranslatableField source="header_text_loc_admin" />
        <RadioButtonGroupInput
          source="ui_mode"
          key="ui-mode-filter"
          alwaysOn
          choices={[
            { id: "listen", name: "Listen" },
            { id: "speak", name: "Speak" },
            { id: "browse", name: "Browse" },
          ]}
        />
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

        <BooleanInput source="active" />
      </SimpleForm>
    </Edit>
  );
};

export const UiGroupCreate = (props: CreateProps): JSX.Element => {
  const { refetchData, uiGroups } = useBuildUI();
  const dataProvider = useRoundwareDataProvider();
  const { selectedProject } = useProjects();
  const transform = async (record: Record): Promise<Record> => {
    const r = record as Omit<Partial<IUIGroup>, `header_text_loc`> & {
      header_text_loc: number[];
      ui_items: number[];
    };
    const promises: Promise<UpdateResult<Record>>[] = [];
    r.project_id = selectedProject?.id;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    r.ui_items = r?.ui_items?.map((i) => i.id) || [];
    r.header_text_loc_admin?.forEach((h) => {
      const patchLocalizedStringProm = dataProvider.create(`localizedstrings`, {
        data: h,
      });
      promises.push(patchLocalizedStringProm);
    });

    const res = await Promise.all(promises);
    r.header_text_loc = res.map((r) => Number(r.data.id));

    delete r.header_text_loc_admin;
    return r as Record;
  };
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

  return (
    <Create {...props} transform={transform} onSuccess={refreshData}>
      <SimpleForm warnWhenUnsavedChanges>
        <NumberInput
          source="index"
          fullWidth
          required
          defaultValue={newIndex}
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
        <TextInput source="name" fullWidth required />
        <TranslatableField source="header_text_loc_admin" />
        <RadioButtonGroupInput
          source="ui_mode"
          key="ui-mode-filter"
          alwaysOn
          defaultValue="speak"
          choices={[
            { id: "listen", name: "Listen" },
            { id: "speak", name: "Speak" },
            { id: "browse", name: "Browse" },
          ]}
        />
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

        <BooleanInput source="active" defaultValue={true} />
      </SimpleForm>
    </Create>
  );
};
