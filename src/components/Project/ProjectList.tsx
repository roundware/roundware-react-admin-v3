import { CardActionArea, Grid, Typography, TextField, Container } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import Card from "@mui/material/Card";
import AddIcon from "@mui/icons-material/Add";
import { useListContext, useRedirect } from "ra-core";
import React, { useEffect, useState } from "react";
import { List, ListProps } from "react-admin";
import { IProject, useProjects } from "../../providers/ProjectsContext";
import SearchIcon from "@mui/icons-material/Search";
const ProjectList = (props: ListProps): JSX.Element => {
  return (
    <List
      hasCreate={false}
      hasEdit={false}
      hasShow
      pagination={false}
      perPage={0}
      bulkActionButtons={false}
      component={ProjectListWrapper}
      {...props}
    >
      <ProjectCard />
    </List>
  );
};

const ProjectListWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <ProjectCardWrapper>{children}</ProjectCardWrapper>
    </>
  );
};

const useCardStyles = makeStyles((theme) => ({
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
    height: "100%",
    padding: theme.spacing(2),
  },
}));
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
  const { data } = useListContext<IProject>();
  const redirect = useRedirect();
  const classes = useCardStyles();
  const { selectProject, setProjectsList, projectsList } = useProjects();

  const handleOnProjectSelect = (p: IProject) => {
    selectProject(p);
    redirect(`/`);
  };

  useEffect(() => {
    if (Array.isArray(Object.values(data))) {
      setProjectsList(
        Object.values(data)?.filter((p) =>
          process.env.REACT_APP_INCLUDE_PROJECT_IDS === `all`
            ? true
            : process.env.REACT_APP_INCLUDE_PROJECT_IDS?.split(`,`).includes(
                p?.id?.toString()
              )
        )
      );
    }
  }, [data]);

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
