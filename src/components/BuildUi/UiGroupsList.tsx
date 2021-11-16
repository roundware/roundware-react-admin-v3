import React from "react";
import { IUIGroup } from "types/uiGroups";
import {
  useList,
  UseListOptions,
  ListContextProvider,
  Datagrid,
  TextField,
} from "react-admin";
interface Props {
  data: IUIGroup[];
}

const UiGroupsList = ({ data }: Props): JSX.Element => {
  const uiGroupsListContext = useList({
    data,
    ids: data.map((d) => d.id),
    basePath: `/uigroups`,
    resource: "uigroups",
  } as unknown as UseListOptions);

  return (
    <ListContextProvider value={uiGroupsListContext}>
      <Datagrid>
        <TextField source="id" />
      </Datagrid>
    </ListContextProvider>
  );
};

export default UiGroupsList;
