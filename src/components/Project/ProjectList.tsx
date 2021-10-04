import {
  CardActionArea,
  Grid,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Card from "@material-ui/core/Card";
import AddIcon from "@material-ui/icons/Add";
import { useListContext, useRedirect } from "ra-core";
import React, { useEffect } from "react";
import { List, ListProps, TextInput } from "react-admin";
import { IProject, useProjects } from "../../providers/ProjectsContext";
import { Search } from "@material-ui/icons";
const useStyles = makeStyles((theme) => ({
  topTextInput: {
    marginTop: "40px",
  },
}));
const ProjectList = (props: ListProps) => {
  const classes = useStyles();
  return (
    <List
      hasCreate={false}
      hasEdit={false}
      hasShow
      pagination={false}
      bulkActionButtons={false}
      component={ProjectListWrapper}
      filters={[
        <TextInput
          source="name"
          label="Search by Name"
          alwaysOn
          className={classes.topTextInput}
        />,
      ]}
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
    <Grid alignContent="center" container spacing={2}>
      {children}
    </Grid>
  );
};
const ProjectCard = () => {
  const { data } = useListContext<IProject>();
  const redirect = useRedirect();
  const classes = useCardStyles();
  const { selectProject, setProjectsList } = useProjects();

  const handleOnProjectSelect = (p: IProject) => {
    selectProject(p);
    redirect(`projects/${p.id}/show`);
  };

  useEffect(() => {
    if (Array.isArray(Object.values(data))) {
      setProjectsList(Object.values(data));
    }
  }, [data]);
  return (
    <>
      <Grid item>
        <CreateProjectCard />
      </Grid>
      {Array.isArray(Object.values(data)) &&
        Object.values(data).map((p) => (
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
