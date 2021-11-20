import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  CardContent,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { useBuildUI } from "providers/BuildUIContext";
import React, { useEffect, useState } from "react";
import { IUIGroup } from "types/uiGroups";
const PreviewUi = (): JSX.Element => {
  const { uiGroups } = useBuildUI();
  const [show, setShow] = useState(false);
  const handleOpen = () => setShow(true);
  const handleClose = () => setShow(false);

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

  const currentGroup = uiGroups?.[currentIndex] || null;
  return (
    <>
      <Button
        variant="contained"
        startIcon={<VisibilityIcon />}
        color="primary"
        onClick={handleOpen}
      >
        Preview UI
      </Button>

      <Dialog open={show} maxWidth="xs" fullWidth onClose={handleClose}>
        <DialogTitle>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>{currentGroup?.header_text_loc}</Grid>

            <Grid item>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>
          <Grid item container direction="column" spacing={2}>
            {currentGroup?.ui_items?.length
              ? currentGroup?.ui_items?.map((i: IUIGroup[`ui_items`][0]) => (
                  <Grid item key={i?.id} xs={12}>
                    <Paper>
                      <CardContent>{i?.tag_id}</CardContent>
                    </Paper>
                  </Grid>
                ))
              : `No Tags Added.`}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNext} color="primary">
            Next
          </Button>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PreviewUi;
