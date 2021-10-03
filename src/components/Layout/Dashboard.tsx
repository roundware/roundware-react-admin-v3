import { makeStyles, Container, Typography, TextField, FormControl, FormControlLabel,  } from '@material-ui/core'
import { useRedirect } from 'ra-core';
import React, { useEffect} from 'react'
import { useProjects } from '../../providers/ProjectsContext';

interface Props {
    
}
const useStyles = makeStyles((theme) => ({
    container: {
        marginTop: theme.spacing(4)
    }
}))
const Dashboard = (props: Props) => {
    const classes = useStyles();
    const { selectedProject } = useProjects();

    return (
        <Container className={classes.container} >
            <Typography variant="h4" gutterBottom>{selectedProject?.name}</Typography> 
            
        </Container>
    )
}

export default Dashboard
