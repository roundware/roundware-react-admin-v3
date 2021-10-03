import React, { useEffect} from "react";
import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  EditButton,
  DeleteButton,
  ListProps,
  Show,
  SimpleShowLayout,
  CardActions
} from "react-admin";
import { IProject, useProjects } from "../providers/ProjectsContext";
import { useAuthState, useDataProvider, useListContext, useRedirect } from "ra-core";
import Card from '@material-ui/core/Card';
import { CardActionArea, CardContent, CardMedia, Button, makeStyles, Typography, CardHeader, Grid } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/DeleteRounded';
const ProjectList = (props: ListProps) => {

  const { setProjectsList, projectsList, selectedProject } = useProjects();
  const { authenticated } = useAuthState();
  const dataProvider = useDataProvider();
  useEffect(() => {
    if (!authenticated) return;
  // @ts-ignore
  dataProvider.getList<IProject>(`projects`).then((project) => {
      setProjectsList(project.data)
    })
  }, [authenticated]);

  return <List hasCreate={false} hasEdit={false} hasShow={false} bulkActionButtons={false} pagination={false} component={ProjectCardWrapper}  {...props} >
    <ProjectCard />
  </List>
}


const useCardStyles = makeStyles(theme => ({
  root: {
    width: 275,
    height: 160,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
  createContent: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    height: "100%"
  },
  cardContent: {
    height: "100%",
    padding: theme.spacing(2)
  }
}));
const ProjectCardWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Grid alignContent="center" justify="center" container spacing={2}>{children}</Grid>
}
const ProjectCard = () => {
  const { data } = useListContext<IProject>();
  const redirect = useRedirect();
  const classes = useCardStyles();
  const { selectProject } = useProjects();

  const handleOnProjectSelect = (p: IProject) => {
    selectProject(p);
    redirect(`list`, `/`)
  }
  return (<>
      <Grid item>
      <CreateProjectCard />
      </Grid>
    {Array.isArray(Object.values(data)) && Object.values(data).map((p) => <Grid key={p?.id} item><Card onClick={()=>handleOnProjectSelect(p)} key={p?.id} className={classes.root}>

      <CardActionArea className={classes.cardContent}>
        
        <Typography className={classes.title} color="textSecondary" gutterBottom>
          Project #{p?.id}
        </Typography>
        <Typography variant="h5" component="h2">
          {p?.name}
        </Typography>
        <Typography className={classes.pos} color="textSecondary">
            Created: {new Date(p?.pub_date).toLocaleString()}
        </Typography>
      
      </CardActionArea>
      
    </Card></Grid>)}</>)
  
}

const CreateProjectCard = () => {
  const classes = useCardStyles();
  return <Card className={classes.root}>
    <CardActionArea className={classes.createContent}>
      
      
        <AddIcon fontSize="large" />
      
      <Typography  variant="h6" component="h2">
        Create new Project
      </Typography>
      
      
  </CardActionArea>
  
</Card>
}

export default ProjectList;
