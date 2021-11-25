/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CircularProgress, Fade } from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import ReorderIcon from "@material-ui/icons/Reorder";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import React, { useMemo, useState } from "react";
import {
  Datagrid,
  DatagridBody,
  DatagridBodyProps,
  DatagridHeaderProps,
  DatagridProps,
  DatagridRowProps,
  Record,
  UpdateResult,
  useListContext,
  useNotify,
} from "react-admin";
import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from "react-beautiful-dnd";

export const DraggableDatagrid = (props: DatagridProps): JSX.Element => (
  <Datagrid
    {...props}
    header={<DatagridHeader />}
    body={<DraggableDatagridBody />}
  />
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const notify = useNotify();
  const { refetch, data } = useListContext();
  const dataProvider = useRoundwareDataProvider();
  const allGroups = useMemo(
    () => Object.values(data).sort((a, b) => (a.index > b.index ? 1 : -1)),
    [data]
  );

  /** order changes */
  const handleDragEnd: OnDragEndResponder = (result, provided) => {
    /** source and destination index */
    const { source, destination, draggableId } = result;

    /** not destination nothing changed return go home tata byebye */
    if (!destination) return;

    // find the group which is moved
    const movedGroup = allGroups.find((g) => g.id == draggableId);
    if (!movedGroup) return;

    /** tell user that this will affect ui items */
    const res = confirm(
      `Changing order or UI Groups will partially reset UI Items because they depend on the group order. Are you sure you want to do this?`
    );
    /** user doesn't want this, bye */
    if (!res) return;

    // detemine direction:
    // if positive then moved downwards and negative upwards
    const movedDirection =
      destination!.index - source.index < 0 ? `up` : `down`;

    console.log(movedDirection);

    // promises of dataProvider calls
    const promises: Promise<UpdateResult<Record>>[] = [];

    /** affected ui group ids */
    const affectedUiGroupIds = [];
    // loop through all and push promises if need to update any object
    allGroups.forEach((g) => {
      let newIndex: number | null = null;

      /** its the same element don'tdo anything here */
      if (g.id == movedGroup.id) return;

      /** find if its affected and increment or decrement its index */
      if (
        movedDirection == "up" &&
        g.index >= destination!.index &&
        g.index <= source!.index
      ) {
        newIndex = g.index + 1;
      } else if (
        movedDirection == "down" &&
        g.index <= destination!.index &&
        g.index >= source.index
      ) {
        newIndex = g.index - 1;
      }

      /** if its affected  */
      if (typeof newIndex == "number") {
        /** 1. update its index to new index */
        console.log(g.index, `changed to`, newIndex);
        const prom = dataProvider.update(`uigroups`, {
          data: {
            index: newIndex,
          },
          id: g.id,
          previousData: g,
        });
        promises.push(prom);

        /** 2. add to id as we need to delete its ui items */
        affectedUiGroupIds.push(g.id);
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
      .then(() => {
        refetch();
        notify(`Changed UI Groups order`, `info`);
      })
      .catch(() =>
        notify(
          `Couldn't change order. Something went wrong. Please try again.`,
          `error`
        )
      )
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
        <TableRow ref={provided.innerRef} {...provided.draggableProps}>
          {/* first column: selection checkbox */}
          <TableCell {...provided.dragHandleProps}>
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
