/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState } from "react";
import {
  CreateProps,
  ListProps,
  EditProps,
  List,
  Create,
  Edit,
  Datagrid,
  SimpleForm,
  TextInput,
  TextField,
  ReferenceField,
  ArrayField,
  SingleFieldList,
  ChipField,
  EditButton,
  DeleteButton,
  RadioButtonGroupInput,
  BooleanField,
  BooleanInput,
  ReferenceInput,
  SelectInput,
  ArrayInput,
  useEditController,
  SimpleFormIterator,
  DatagridRowProps,
  useListContext,
  TranslatableInputs,
} from "react-admin";
import { Grid, IconButton, Tooltip, CircularProgress } from "@material-ui/core";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import { useRoundwareDataProvider } from "providers/DataProviderContext";

export const UiGroupList = (props: ListProps): JSX.Element => {
  return (
    <List
      {...props}
      filters={[
        <RadioButtonGroupInput
          source="ui_mode"
          key="ui-mode-filter"
          alwaysOn
          style={{ marginTop: 35 }}
          choices={[
            { id: "listen", name: "Listen" },
            { id: "speak", name: "Speak" },
            { id: "browse", name: "Browse" },
          ]}
        />,
        <BooleanInput
          source="active"
          label="Show Active Groups"
          key="active-filter"
        />,
      ]}
      sort={{
        field: "index",
        order: "ASC",
      }}
      filterDefaultValues={{
        ui_mode: "speak",
        active: true,
      }}
    >
      <Datagrid
        expand={<UiGroupEdit />}
        currentSort={{ field: "index", order: "ASC" }}
      >
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <IndexEditor label="Order" />
        <TextField source="id" sortable={false} />
        <TextField source="name" />
        <ReferenceField
          label="Tag Category"
          source="tag_category_id"
          reference="tagcategories"
        >
          <TextField source="name" />
        </ReferenceField>
        <ArrayField source="ui_items">
          <SingleFieldList>
            <ReferenceField source="tag_id" reference="tags">
              <ChipField source="value" />
            </ReferenceField>
          </SingleFieldList>
        </ArrayField>

        <BooleanField source="active" />
        <EditButton label="" />
        <DeleteButton label="" />
      </Datagrid>
    </List>
  );
};

export const UiGroupEdit = (props: EditProps): JSX.Element => {
  const { record } = useEditController(props);
  return (
    <Edit {...props}>
      <SimpleForm>
        <Grid container style={{ width: "100%" }} spacing={2}>
          <Grid item xs={12} md={6}>
            <ArrayInput label="UI Items" source="ui_items">
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
            </ArrayInput>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextInput disabled source="id" required />

            <ReferenceInput
              source="tag_category_id"
              reference="tagcategories"
              label="Select Tag Category"
            >
              <SelectInput optionText="name" fullWidth />
            </ReferenceInput>
            <TextInput source="name" fullWidth required />
            <TranslatableInputs locales={["en"]}>
              <TextInput source="header_text_loc" fullWidth />
            </TranslatableInputs>
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
          </Grid>
        </Grid>
      </SimpleForm>
    </Edit>
  );
};

export const UiGroupCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create {...props}>
      <SimpleForm>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};

export const IndexEditor = ({ record }: DatagridRowProps): JSX.Element => {
  const context = useListContext();

  const dataProvider = useRoundwareDataProvider();

  const [movingUp, setMovingUp] = useState(false);
  const [movingDown, setMovingDown] = useState(false);
  const handleMoveUp = async () => {
    const list = Object.values(context.data)?.sort((a, b) => a.index - b.index);

    const index = list?.findIndex((r) => r.id == record?.id);
    const prevElement = list[index - 1];
    if (!prevElement) return alert(`Already first Element`);

    try {
      setMovingUp(true);
      const prom1 = dataProvider.update(`uigroups`, {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        previousData: record!,
        data: {
          index: prevElement?.index,
        },
        id: record!.id,
      });

      const prom2 = dataProvider.update(`uigroups`, {
        previousData: prevElement,
        data: {
          index: record!.index,
        },
        id: prevElement.id,
      });

      await Promise.all([prom1, prom2]);
      context.refetch();
    } finally {
      setMovingUp(false);
    }
  };
  const handleMoveDown = async () => {
    const list = Object.values(context.data)?.sort((a, b) => a.index - b.index);
    const index = list?.findIndex((r) => r.id == record?.id);
    const nextElement = list[index + 1];
    if (!nextElement) return alert(`Already last Element`);

    try {
      setMovingDown(true);
      const prom1 = dataProvider.update(`uigroups`, {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        previousData: record!,
        data: {
          index: nextElement?.index,
        },
        id: record!.id,
      });

      const prom2 = dataProvider.update(`uigroups`, {
        previousData: nextElement,
        data: {
          index: record!.index,
        },
        id: nextElement.id,
      });

      await Promise.all([prom1, prom2]);
      context.refetch();
    } finally {
      setMovingDown(false);
    }
  };
  return (
    <Grid
      container
      direction="row"
      alignItems="center"
      justifyContent="center"
      style={{ flexWrap: "nowrap" }}
    >
      <Grid item>
        <Tooltip title={`Mov${movingUp ? `ing` : `e`} Up`}>
          <IconButton onClick={handleMoveUp} disabled={movingUp || movingDown}>
            {movingUp ? <CircularProgress size={16} /> : <ArrowUpwardIcon />}
          </IconButton>
        </Tooltip>
      </Grid>
      <Grid item>{record?.index}</Grid>
      <Grid item>
        <Tooltip title={`Mov${movingDown ? `ing` : `e`} Down`}>
          <IconButton
            onClick={handleMoveDown}
            disabled={movingUp || movingDown}
          >
            {movingDown ? (
              <CircularProgress size={16} />
            ) : (
              <ArrowDownwardIcon />
            )}
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};
