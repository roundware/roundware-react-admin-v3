/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Box, Divider, Grid } from "@material-ui/core";
import BuildUIHeader from "components/UIGroup/BuildUIHeader";
import { useBuildUI } from "providers/BuildUIContext";
import React from "react";
import {
  BooleanInput,
  DatagridRowProps,
  DeleteButton,
  EditButton,
  List,
  ListProps,
  RadioButtonGroupInput,
  ReferenceField,
  TextField,
} from "react-admin";
import { IUIGroup } from "types/uiGroups";
import AddCommonItem from "./AddCommonItem";
import { DraggableDatagrid } from "./DraggableDatagrid";
import UIGroupListActions from "./UIGroupListActions";
import UIItemsTreeView from "./UIItemsTreeView";
export const UiGroupList = (props: ListProps): JSX.Element => {
  const { setUiMode } = useBuildUI();
  return (
    <>
      <Box pt={5}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <BuildUIHeader />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12} md={6}>
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
                  label="Select UI Mode"
                  onChange={(v) =>
                    setUiMode(v as unknown as IUIGroup[`ui_mode`])
                  }
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
              actions={<UIGroupListActions />}
              bulkActionButtons={false}
            >
              <DraggableDatagrid
                rowClick="edit"
                currentSort={{ field: "index", order: "ASC" }}
              >
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                {/* <IndexEditor label="Order" /> */}
                <TextField source="index" sortable />
                <TextField source="id" sortable={false} />
                <TextField source="name" />
                <ReferenceField
                  label="Tag Category"
                  source="tag_category_id"
                  reference="tagcategories"
                >
                  <TextField source="name" />
                </ReferenceField>
                {/* <ArrayField source="ui_items">
                  <SingleFieldList>
                    <ReferenceField source="tag_id" reference="tags">
                      <ChipField source="value" />
                    </ReferenceField>
                  </SingleFieldList>
                </ArrayField> */}

                {/* <BooleanField source="active" /> */}
                <RowActions />
              </DraggableDatagrid>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <UIItemsTreeView />
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

const RowActions = (props: DatagridRowProps): JSX.Element => {
  return (
    <Grid container spacing={1} direction="row" wrap="nowrap">
      <Grid item>
        <EditButton
          record={props.record}
          basePath={props.basePath}
          size="small"
          label=""
        />
      </Grid>
      <Grid item>
        <AddCommonItem {...props} />
      </Grid>
      <Grid item>
        <DeleteButton
          record={props.record}
          basePath={props.basePath}
          size="small"
          label=""
          undoable={false}
        />
      </Grid>
    </Grid>
  );
};
