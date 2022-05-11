import * as React from "react";
import { Box, Card, CardActions, Button, Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import CodeIcon from "@mui/icons-material/Code";
import { EditButton, ShowButton } from "react-admin";
import makeStyles from "@mui/styles/makeStyles";
import { useTranslate } from "react-admin";
import { useProjects } from "../../../providers/ProjectsContext";

const useStyles = makeStyles((theme) => ({
  root: {
    color: "#000000",
    padding: 10,
    marginTop: theme.spacing(2),
    marginBottom: "1em",
  },
  media: {
    marginLeft: "auto",
  },
  actions: {
    [theme.breakpoints.down("lg")]: {
      padding: 0,
      flexWrap: "wrap",
      "& a": {
        marginTop: "1em",
        marginLeft: "0!important",
        marginRight: "1em",
      },
    },
  },
}));

const ProjectDetails = () => {
  const { selectedProject } = useProjects();
  const classes = useStyles();
  return (
    <Box display="flex" className={classes.root}>
      <Box flex="1">
        <Typography variant="h5" component="h2" gutterBottom>
          {selectedProject?.name}
        </Typography>
      </Box>
      <Box>
        <EditButton
          resource="projects"
          label="Edit Project"
          record={selectedProject!}
        />
        <ShowButton
          resource="projects"
          label="View Details"
          record={selectedProject!}
        />
      </Box>
    </Box>
  );
};

export default ProjectDetails;
