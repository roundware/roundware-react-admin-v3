import React from "react";
import {
  ArrayField,
  ChipField,
  Datagrid,
  DeleteButton,
  EditButton,
  ListContextProvider,
  ReferenceField,
  SingleFieldList,
  TextField,
  useList,
  UseListOptions,
} from "react-admin";
import { IUIGroup } from "types/uiGroups";
interface Props {
  data: IUIGroup[];
  uiMode: IUIGroup[`ui_mode`];
}

const UiGroupsList = ({ data, uiMode }: Props): JSX.Element => {
  const uiGroupsListContext = useList({
    data,
    ids: data.map((d) => d.id),
  } as unknown as UseListOptions);

  return (
    <ListContextProvider value={uiGroupsListContext}>
      <Datagrid>
        <TextField source="id" />
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
        <EditButton label="" />
        <DeleteButton label="" />
      </Datagrid>
    </ListContextProvider>
  );
};

export default UiGroupsList;
