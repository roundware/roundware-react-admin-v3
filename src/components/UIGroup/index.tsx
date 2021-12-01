import {
  Box,
  Card,
  LinearProgress,
  Tab,
  Tabs,
  TextField,
} from "@material-ui/core";
import useFieldValue from "hooks/useFieldValue";
import { useBuildUI } from "providers/BuildUIContext";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { useProjects } from "providers/ProjectsContext";
import React, { useEffect, useState, useMemo } from "react";
import {
  BooleanInput,
  Create,
  CreateProps,
  Edit,
  EditProps,
  NumberInput,
  RadioButtonGroupInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
  Record,
  UpdateResult,
  useRefresh,
  useRedirect,
} from "react-admin";
import { ILanguage } from "types";
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

    r.header_text_loc = r?.header_text_loc_admin?.map((h) => h.id) || [];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    r.ui_items = r?.ui_items?.map((i) => i.id) || [];
    r.header_text_loc_admin?.forEach((h) => {
      const patchLocalizedStringProm = dataProvider.update(`localizedstrings`, {
        id: h.id,
        data: h,
        previousData: h,
      });
      promises.push(patchLocalizedStringProm);
    });
    await Promise.all(promises);

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
      <SimpleForm>
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
        <TranslatableHeader />
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
    }, 1);
    return lastIndex + 1;
  }, [uiGroups]);

  return (
    <Create {...props} transform={transform} onSuccess={refreshData}>
      <SimpleForm>
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
        <TranslatableHeader />
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

const TranslatableHeader = () => {
  const [value, setValue] = useFieldValue(`header_text_loc_admin`);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<ILanguage[]>([]);
  const { selectedProject } = useProjects();
  const dataProvider = useRoundwareDataProvider();
  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    /** fetch all languages  */
    dataProvider
      .getList(`languages`, {
        filter: {},
        sort: {
          field: "id",
          order: "ASC",
        },
        pagination: {
          perPage: 0,
          page: 0,
        },
      })
      .then((res) => {
        const thisProjectLanguages = res.data.filter((l) =>
          selectedProject.language_ids.includes(Number(l.id))
        ) as ILanguage[];
        setLanguages(thisProjectLanguages);
        setSelectedLanguage(thisProjectLanguages?.[0]?.id);
      })
      .finally(() => setLoading(false));
  }, [selectedProject]);
  const [selectedLanguage, setSelectedLanguage] = useState<number>(
    languages?.[0]?.id
  );

  if (loading) return <LinearProgress />;
  return (
    <Card variant="outlined">
      <Tabs
        value={selectedLanguage}
        onChange={(_e, v) => setSelectedLanguage(Number(v))}
      >
        {languages.map((l) => (
          <Tab key={l.id} value={l.id} label={l.name} />
        ))}
      </Tabs>
      <Box p={2}>
        <TextField
          value={
            value &&
            value?.find?.(
              (h: IUIGroup[`header_text_loc_admin`][0]) =>
                h.language_id == selectedLanguage
            )?.text
          }
          variant="outlined"
          onChange={(e) => {
            const newText = e.target.value;

            const previousFilter = [...value].filter(
              (h: IUIGroup[`header_text_loc_admin`][0]) =>
                h.language_id !== selectedLanguage
            );

            const newLanguageObject = {
              ...[...value].find(
                (h: IUIGroup[`header_text_loc_admin`][0]) =>
                  h.language_id == selectedLanguage
              ),
              language_id: selectedLanguage,
              text: newText,
            };
            setValue([...previousFilter, newLanguageObject]);
          }}
          fullWidth
          label="Text"
        />
      </Box>
    </Card>
  );
};
