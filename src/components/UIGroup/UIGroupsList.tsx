/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Box,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import BuildUIHeader from "components/UIGroup/BuildUIHeader";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import React, { useState, useMemo } from "react";
import {
  BooleanInput,
  Datagrid,
  DatagridRowProps,
  DeleteButton,
  EditButton,
  List,
  ListProps,
  RadioButtonGroupInput,
  ReferenceField,
  TextField,
  useListContext,
  DatagridBody,
  DatagridBodyProps,
  DatagridProps,
  DatagridHeaderProps,
  UpdateResult,
  Record,
} from "react-admin";
import UIGroupListActions from "./UIGroupListActions";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import TableHead from "@material-ui/core/TableHead";
import ReorderIcon from "@material-ui/icons/Reorder";
import { Fade } from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import {
  Draggable,
  Droppable,
  DragDropContext,
  OnDragEndResponder,
} from "react-beautiful-dnd";
export const UiGroupList = (props: ListProps): JSX.Element => {
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
                <EditButton label="" />
                <DeleteButton label="" />
              </DraggableDatagrid>
            </List>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

const DraggableDatagrid = (props: DatagridProps) => (
  <Datagrid
    {...props}
    header={<DatagridHeader />}
    body={<DraggableDatagridBody />}
  />
);

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    wrapper: {
      position: "absolute",

      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    overlay: {
      height: "100%",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.1)",
    },
  })
);

const DraggableDatagridBody = (props: DatagridBodyProps) => {
  const [loading, setLoading] = useState(false);
  const classes = useStyles();
  const { refetch, data } = useListContext();
  const dataProvider = useRoundwareDataProvider();
  const allGroups = useMemo(
    () => Object.values(data).sort((a, b) => (a.index > b.index ? 1 : -1)),
    [data]
  );
  const handleDragEnd: OnDragEndResponder = (result, provided) => {
    const { source, destination, draggableId } = result;

    // find the group which is moved
    const movedGroup = allGroups.find((g) => g.id == draggableId);
    if (!movedGroup) return;

    // destination.index is the new index for movedGroup

    // detemine direction:
    // if positive then moved downwards and negative upwards
    const movedDirection =
      destination!.index - source.index > 0 ? `up` : `down`;

    // promises of update requests
    const promises: Promise<UpdateResult<Record>>[] = [];

    // loop through all and push promises if need to update any object
    allGroups.forEach((g) => {
      let newIndex: number | null = null;
      if (g.id == movedGroup.id) return;
      if (movedDirection == "up" && g.index <= destination!.index) {
        newIndex = g.index + 1;
      } else if (movedDirection == "down" && g.index >= destination!.index) {
        newIndex = g.index - 1;
      }
      if (typeof newIndex == "number") {
        console.log(g.index, `changed to`, newIndex);
        const prom = dataProvider.update(`uigroups`, {
          data: {
            index: newIndex,
          },
          id: g.id,
          previousData: g,
        });
        promises.push(prom);
      }
    });

    // update movedGroup with its destination index
    const targetElementUpdate = dataProvider.update(`uigroups`, {
      data: {
        index: destination!.index,
      },
      id: movedGroup.id,
      previousData: movedGroup,
    });
    promises.push(targetElementUpdate);

    // resolve all prmises
    setLoading(true);
    Promise.all(promises)
      .then(() => refetch())
      .finally(() => setLoading(false));
  };

  return (
    <>
      {loading && (
        <div className={classes.wrapper}>
          <Fade in>
            <div className={classes.overlay}>
              <CircularProgress />
            </div>
          </Fade>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="uigroupdroppable">
          {(provided) => (
            <>
              <DatagridBody
                {...props}
                {...provided.droppableProps}
                ref={provided.innerRef}
                row={<DraggableDatagridRow />}
              />
              {provided.placeholder}
            </>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

const DraggableDatagridRow = ({
  record,
  resource,
  id,
  children,
  basePath,
}: DatagridRowProps) => (
  <>
    <Draggable
      key={id || ""}
      draggableId={id?.toString()!}
      index={record?.index!}
    >
      {(provided) => (
        <TableRow
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {/* first column: selection checkbox */}
          <TableCell>
            <ReorderIcon />
          </TableCell>
          {/* data columns based on children */}
          {React.Children.map(children, (field: any) => (
            <TableCell key={`${id}-${field?.props?.source}`}>
              {React.cloneElement(field!, {
                record,
                basePath,
                resource,
              })}
            </TableCell>
          ))}
        </TableRow>
      )}
    </Draggable>
  </>
);
function capitalizeFirstLetter(string: string) {
  return string?.charAt(0).toUpperCase() + string.slice(1);
}
const DatagridHeader = ({ children }: DatagridHeaderProps) => (
  <TableHead>
    <TableRow>
      <TableCell></TableCell> {/* empty cell to account for the reorder icon */}
      {React.Children.map(children, (child: any) => (
        <TableCell key={child.props.source}>
          {capitalizeFirstLetter(child.props.source || "")
            ?.replaceAll(`_`, ` `)
            .replaceAll(` id`, ``)}
        </TableCell>
      ))}
    </TableRow>
  </TableHead>
);

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
