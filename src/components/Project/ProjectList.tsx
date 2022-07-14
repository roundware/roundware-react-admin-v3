import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import {
  CardActionArea,
  Container,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import Card from "@mui/material/Card";
import makeStyles from "@mui/styles/makeStyles";
import { useRedirect } from "ra-core";
import React, { useState } from "react";
import { List } from "react-admin";
import { useNavigate } from "react-router-dom";
import { IProject, useProjects } from "../../context/ProjectsContext";
const ProjectList = (): JSX.Element => {
  const { setProjectsList } = useProjects();
  return (
    <List
      pagination={false}
      queryOptions={{
        onSuccess: (data) => {
          setProjectsList(data.data);
        },
      }}
      perPage={0}
      component={ProjectCardWrapper}
    >
      <ProjectCard />
    </List>
  );
};

const ProjectCardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Container>
      <Grid alignContent="center" container spacing={2}>
        {children}
      </Grid>
    </Container>
  );
};
const ProjectCard = () => {
  const classes = useCardStyles();
  const { selectProject, projectsList } = useProjects();

  const navigate = useNavigate();
  const handleOnProjectSelect = (p: IProject) => {
    selectProject(p);
    navigate(`/project/${p.id}/`);
  };

  const [textFilter, setTextFilter] = useState("");
  return (
    <>
      <Grid item xs={12}>
        <TextField
          placeholder="Search By Project Name"
          onChange={(e) => setTextFilter(e.target.value)}
          value={textFilter}
          InputProps={{
            startAdornment: <SearchIcon />,
          }}
        />
      </Grid>
      <Grid item>
        <CreateProjectCard />
      </Grid>
      {Array.isArray(projectsList) &&
        projectsList
          .filter((p) =>
            textFilter
              ? p?.name?.toLowerCase().indexOf(textFilter?.toLowerCase()) != -1
              : true
          )
          .map((p) => (
            <Grid key={p?.id} item>
              <Card
                onClick={() => handleOnProjectSelect(p)}
                key={p?.id}
                className={classes.root}
              >
                <CardActionArea className={classes.cardContent}>
                  <Typography
                    className={classes.title}
                    color="textSecondary"
                    gutterBottom
                  >
                    Project #{p?.id}
                  </Typography>
                  <Typography variant="h5" component="h2">
                    {p?.name}
                  </Typography>
                  <Typography className={classes.pos} color="textSecondary">
                    Created: {new Date(p?.pub_date).toLocaleString()}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
    </>
  );
};

const CreateProjectCard = () => {
  const classes = useCardStyles();
  const redirect = useRedirect();
  return (
    <Card
      className={classes.root}
      onClick={() => redirect(`create`, `/projects`)}
    >
      <CardActionArea className={classes.createContent}>
        <AddIcon fontSize="large" />

        <Typography variant="h6" component="h2">
          Create new Project
        </Typography>
      </CardActionArea>
    </Card>
  );
};

export default ProjectList;

const useCardStyles = makeStyles(() => ({
  root: {
    width: 275,
    height: 160,
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
  createContent: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    height: "100%",
  },
  cardContent: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",

    height: "100%",
    padding: 2,
  },
}));
