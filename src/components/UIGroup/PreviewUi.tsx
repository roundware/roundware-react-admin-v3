import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Button as MuiButton,
} from "@mui/material";
import { Button } from "react-admin";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import ResetIcon from "@mui/icons-material/Restore";
import ArrowBack from "@mui/icons-material/ArrowBackIos";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useBuildUI } from "context/BuildUIContext";
import React, { useState } from "react";
import { IUIGroup } from "types/uiGroups";
const PreviewUi = (): JSX.Element => {
  const { uiGroups, uiItemsList } = useBuildUI();
  const [show, setShow] = useState(false);
  const handleOpen = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    handleReset();
  };

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => {
      if (prev + 1 >= uiGroups.length) {
        handleClose();

        return 0;
      }
      return prev + 1;
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      if (prev == 0) return prev;
      return prev - 1;
    });
  };

  const [selectedTags, setSelectedTags] = useState<number[]>(
    uiItemsList?.filter((i) => i.default)?.map((i) => i.id)
  );

  const handleOnItemSelect = (itemId: number) => {
    setSelectedTags((prev) => {
      if (prev.includes(itemId)) return [...prev].filter((l) => l !== itemId);
      return [...prev, itemId];
    });
  };

  const handleReset = () => setSelectedTags([]);

  const currentGroup = uiGroups?.[currentIndex] || null;
  return (
    <>
      <Button
        variant="contained"
        startIcon={<VisibilityIcon />}
        color="primary"
        onClick={handleOpen}
        label="Preview"
        size="small"
      />

      <Dialog open={show} maxWidth="xs" fullWidth onClose={handleClose}>
        <DialogTitle>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid>{currentGroup?.header_text_loc}</Grid>

            <Grid>
              <IconButton onClick={handleClose} size="large">
                <CloseIcon />
              </IconButton>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>
          <Grid container direction="column" spacing={2}>
            {currentGroup?.ui_items?.filter(
              (i) => i.parent_id == null || selectedTags.includes(i.parent_id)
            ).length
              ? currentGroup?.ui_items
                  ?.filter(
                    (i) =>
                      i.parent_id == null || selectedTags.includes(i.parent_id)
                  )
                  .map((i: IUIGroup[`ui_items`][0]) => (
                    <Grid
                      key={i?.id}
                      size={{ xs: 12 }}
                      onClick={() => handleOnItemSelect(i.id)}
                    >
                      <MuiButton
                        size="large"
                        color={`primary`}
                        fullWidth
                        variant={
                          selectedTags.includes(i.id) ? `contained` : `outlined`
                        }
                        startIcon={
                          selectedTags.includes(i.id) ? <CheckIcon /> : null
                        }
                      >
                        {uiItemsList.find((li) => li?.id == i?.id)?.displayText}
                      </MuiButton>
                    </Grid>
                  ))
              : `No Items to Show`}
          </Grid>
        </DialogContent>
        <DialogActions>
          <MuiButton
            onClick={handlePrev}
            color="primary"
            startIcon={<ArrowBack />}
          >
            Previous
          </MuiButton>
          <MuiButton
            onClick={handleNext}
            startIcon={<ChevronRightIcon />}
            color="primary"
          >
            Next
          </MuiButton>

          <MuiButton
            onClick={handleReset}
            color="primary"
            startIcon={<ResetIcon />}
          >
            Reset
          </MuiButton>
          <MuiButton onClick={handleClose}>Close</MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PreviewUi;
