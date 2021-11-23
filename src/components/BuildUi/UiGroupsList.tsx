import React from "react";
import {
  Paper,
  Grid,
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
} from "@material-ui/core";
import { useBuildUI } from "providers/BuildUIContext";
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "react-beautiful-dnd";
import { EditButton, DeleteButton } from "react-admin";
import ReorderIcon from "@material-ui/icons/Reorder";
const UiGroupsList = (): JSX.Element => {
  const { uiGroups } = useBuildUI();

  const handleOnDragEnd: OnDragEndResponder = (result) => {
    console.log(result);
  };

  return (
    <Grid container direction="column" spacing={1}>
      {/* {uiGroups
        ?.sort((a, b) => (a.index - b.index ? 1 : -1))
        .map((g) => (
          <Grid key={g.id} item xs={12}>
            <Card>
              <CardHeader title={g.header_text_loc} />
            </Card>
          </Grid>
        ))} */}

      <TableContainer component={Paper}>
        <Table
        // className={classes.table}
        // size="small"
        >
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>
                <b>Header Text</b>
              </TableCell>
              <TableCell>ID</TableCell>

              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="droppable">
              {(provided, snapshot) => (
                <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                  {uiGroups.map((row) => (
                    <Draggable
                      key={row.id}
                      draggableId={row.id?.toString()}
                      index={row.index}
                    >
                      {(provided, snapshot) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <TableCell>
                            <ReorderIcon />
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {row.header_text_loc}
                          </TableCell>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>
                            <EditButton />
                            <DeleteButton />
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </TableBody>
              )}
            </Droppable>
          </DragDropContext>
        </Table>
      </TableContainer>
    </Grid>
  );
};

// const columns: GridColDef[] = [
//   { field: "id", headerName: "ID", width: 90 },
//   {
//     field: "header_text_loc",
//     headerName: "Header Text",
//     width: 150,
//     editable: true,
//   },
//   {
//     field: "index",
//     headerName: "Index",
//     sortable: true,
//     width: 160,
//   },
// ];

export default UiGroupsList;
