import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  TextInput,
  NumberInput,
  useNotify,
  useMutation,
  useRecordContext,
} from "react-admin";
import Add from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import { Draggable, DragDropContext, Droppable } from "react-beautiful-dnd";
import { OnDragEndResponder } from "react-beautiful-dnd";
import { IUIGroup } from "types/uiGroups";

const DraggableUiItems = (): JSX.Element => {
  const record = useRecordContext();
  const notify = useNotify();
  const [mutate, { loading }] = useMutation(
    {
      type: `update`,
      resource: `uiitems`,
      payload: {
        id: record.id,
        data: {},
      },
    },
    {
      // https://marmelab.com/react-admin/Actions.html#optimistic-rendering-and-undo
      mutationMode: "undoable",

      onSuccess: () => {
        notify("Items reordered", "info", {}, true);
      },
      onFailure: (error) => notify(`Error: ${error.message}`, "warning"),
    }
  );

  const reorder = (newUiItems: IUIGroup[`ui_items`]) =>
    mutate({
      type: "update",
      resource: "uigroups",
      payload: {
        id: record.id,
        data: { uiitems: newUiItems },
      },
    });

  const onDragEnd: OnDragEndResponder = (result, provided) => {
    const { source, destination } = result;
    console.log(provided, result);

    if (!destination?.index) return;

    // Get the item
    const item = record.ui_items[source.index];

    // Remove item from array
    const newArray = record.ui_items.filter(
      (el, index) => index !== source.index
    );

    // Insert item at destination
    newArray.splice(destination?.index, 0, item);

    // Call mutation function
    reorder(newArray);
  };
  const { control } = useFormContext();
  const { fields, remove, push } = useFieldArray({
    control,
    name: "questions",
  });

  return (
    <DragDropContext
      onDragEnd={onDragEnd} // modified
    >
      <TableContainer>
        <Table aria-label="questions list">
          <Droppable droppableId="droppable-questions" type="QUESTION">
            {(provided, snapshot) => (
              <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                {fields.map((question, index) => {
                  return (
                    <Draggable
                      key={String(question.id)}
                      draggableId={String(question.id)}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <TableRow
                          hover
                          tabIndex={-1}
                          key={index}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <TableCell {...provided.dragHandleProps}>
                            <DragHandleIcon />
                          </TableCell>
                          <TableCell align="left">
                            <NumberInput
                              helperText="Unique id"
                              label="Question ID"
                              source={`questions[${index}].id`}
                            />
                          </TableCell>
                          <TableCell align="left">
                            <TextInput
                              helperText="i.e. How do you do?"
                              label="Question Text"
                              source={`questions[${index}].text`}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              style={{ color: "red" }}
                              type="button"
                              onClick={() => remove(index)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </TableBody>
            )}
          </Droppable>
        </Table>
        <Button
          type="button"
          onClick={() => push({ id: "", question: "" })}
          color="secondary"
          variant="contained"
          style={{ marginTop: "16px" }}
        >
          <Add />
        </Button>
      </TableContainer>
    </DragDropContext>
  );
};

export default DraggableUiItems;
