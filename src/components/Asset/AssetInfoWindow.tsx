import {
  Divider,
  Grid,
  Modal,
  ThemeProvider,
  StyledEngineProvider,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle as MuiDialogTitle,
  IconButton,
} from "@mui/material";
import { makeStyles, withStyles, createStyles, WithStyles } from "@mui/styles";
import { InfoWindow } from "@react-google-maps/api";
import moment from "moment";
import React, { useEffect, useState, useContext, useRef } from "react";

import { AssetActionButtons } from "./AssetActionButtons";
import CloseIcon from "@mui/icons-material/Close";
import { Theme } from "@mui/material";
import { Interweave } from "interweave";
import { useListController, useRedirect } from "react-admin";
import { TagsDisplay } from "./AssetTags";
import AssetVainllaPlayer from "./AssetVanillaPlayer";
import { IAsset } from "types/asset";
import { Edit } from "@mui/icons-material";

import { Link } from "react-router-dom";
interface AssetInfoWindowInnerProps {
  asset: IAsset;
}

export const AssetInfoWindowInner = ({ asset }: AssetInfoWindowInnerProps) => {
  const [imageAssets, setImageAssets] = useState<IAsset[]>([]);
  const [textAssets, setTextAssets] = useState<IAsset[]>([]);

  const classes = useStyles();

  const [showDialog, setShowDialog] = useState(false);

  const { data } = useListController();
  useEffect(() => {
    if (Array.isArray(asset?.envelope_ids) && asset?.envelope_ids?.length > 0) {
      setImageAssets(
        data.filter(
          (a) =>
            a.media_type == "photo" &&
            a.envelope_ids.includes(parseInt(asset.envelope_ids.toString()))
        )
      );
      setTextAssets(
        data.filter(
          (a) =>
            a.media_type == "text" &&
            a.envelope_ids.includes(parseInt(asset.envelope_ids.toString()))
        )
      );
    }
  }, [asset]);

  const primaryImageUrl = imageAssets && imageAssets[0]?.file;
  const primaryTextUrl = textAssets && textAssets[0]?.file;

  const position = { lat: asset.latitude!, lng: asset.longitude! };

  const infoItemsResolver = (
    elementName: string,
    index: number,
    list: string[]
  ) => {
    function showDividerIfEligible(): React.ReactNode {
      const prev = list[index - 1];
      if (["description", "text", "tags", "date"].includes(prev)) {
        return <Divider style={{ marginTop: 5, marginBottom: 5 }} />;
      }
      return null;
    }
    const description = asset.description;

    switch (elementName) {
      case "date":
        return (
          <div key={elementName}>
            {showDividerIfEligible()}
            <Typography variant="body2">
              {moment(asset.created).format("LLL")}
            </Typography>
          </div>
        );

      case "tags":
        return (
          <div key={elementName}>
            {showDividerIfEligible()}
            <TagsDisplay
              tagIds={Array.isArray(asset.tag_ids) ? asset.tag_ids : []}
            />
          </div>
        );
      case "description":
        if (description)
          return (
            <div key={elementName} style={{ marginTop: 5 }}>
              {/* Example of asset description - eid=6328 */}
              {showDividerIfEligible()}
              <Typography variant="body2">Description:</Typography>

              <Interweave
                content={
                  description.length > 100
                    ? description.substr(0, 100) + "..."
                    : description
                }
              />
              {description.length > 100 && (
                <Button
                  onClick={() => setShowDialog(true)}
                  size="small"
                  className={classes.readMoreButton}
                >
                  Read more
                </Button>
              )}
              {showDialog && (
                <Dialog open={showDialog}>
                  <DialogTitle
                    id="description"
                    onClose={() => setShowDialog(false)}
                  >
                    Description
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      <Interweave content={description} />
                    </DialogContentText>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          );
        return null;

      case "photo":
        return primaryImageUrl ? (
          <LightboxModal
            key={elementName}
            imageUrl={primaryImageUrl as string}
          />
        ) : null;

      case "text":
        return primaryTextUrl ? (
          <div key={elementName}>
            {showDividerIfEligible()}
            <TextDisplay textUrl={primaryTextUrl! as string} />
          </div>
        ) : null;

      case "audio":
        return (
          <AssetVainllaPlayer
            key={elementName}
            style={{ width: "100%", marginTop: 10 }}
            asset={asset}
            captureEvents
          />
        );
      case "actions":
        return <AssetActionButtons key={elementName} asset={asset} />;
      default:
        return null;
    }
  };

  const redirect = useRedirect();
  return (
    <InfoWindow
      options={{
        disableAutoPan: false,
        pixelOffset: new google.maps.Size(0, -30),
        maxWidth: 320,
      }}
      position={position}
    >
      <StyledEngineProvider injectFirst>
        <Paper>
          {[
            `date`,
            `tags`,
            `description`,
            `photo`,
            `text`,
            `audio`,
            `actions`,
          ].map((item, index, list) => infoItemsResolver(item, index, list))}

          <Button
            size="small"
            onClick={() => redirect(`edit`, `assets`, asset.id)}
            startIcon={<Edit />}
          >
            Edit
          </Button>
        </Paper>
      </StyledEngineProvider>
    </InfoWindow>
  );
};

const LightboxModal = ({ imageUrl }: { imageUrl: string }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <img src={imageUrl} width={150} onClick={handleOpen} />
      <Modal open={open} onClose={handleClose}>
        <img src={imageUrl} className={classes.paper} />
      </Modal>
    </div>
  );
};
const TextDisplay = ({ textUrl }: { textUrl: string }) => {
  const [storedText, setStoredText] = useState<string>("");

  useEffect(() => {
    fetch(textUrl).then(function (response) {
      response.text().then(function (text) {
        setStoredText(text);
      });
    });
  }, []);
  const [showDialog, setShowDialog] = useState(false);
  const classes = useStyles();
  return (
    <div>
      <Interweave
        content={
          storedText.length > 100
            ? storedText.substr(0, 100) + "..."
            : storedText
        }
      />
      {storedText.length > 100 && (
        <Button
          onClick={() => setShowDialog(true)}
          size="small"
          className={classes.readMoreButton}
        >
          Read more
        </Button>
      )}
      {showDialog && (
        <Dialog open={showDialog}>
          <DialogTitle id="description" onClose={() => setShowDialog(false)}>
            Additional Info
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              <Interweave content={storedText} />
            </DialogContentText>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    position: "absolute",
    height: "auto",
    width: "auto",
    maxHeight: "90%",
    maxWidth: "90%",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    outline: 0,
    minWidth: 300,
  },
  readMoreButton: {
    color: theme.palette.info.dark,
  },
}));
const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: "absolute",
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  });
export interface DialogTitleProps extends WithStyles<typeof styles> {
  id: string;
  children: React.ReactNode;
  onClose: () => void;
}

const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
  const { children, onClose, ...other } = props;
  return (
    <MuiDialogTitle {...other}>
      <Grid container justifyContent="space-between">
        <Grid item>
          <Typography variant="h6">{children}</Typography>
        </Grid>
        {onClose ? (
          <Grid item>
            <IconButton aria-label="close" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Grid>
        ) : null}
      </Grid>
    </MuiDialogTitle>
  );
});
