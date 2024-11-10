import { Button, Container, Typography } from "@mui/material";
import * as React from "react";
import { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

const AccessDenied = (): ReactElement => {

    const navigate = useNavigate();

    const handleRedirect = () => {
        navigate("/projects");
    };

    return (
        <Container sx={styles.container}>
            <Typography variant="h4" sx={styles.heading}>
                Access Denied
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={handleRedirect}
                sx={styles.button}
            >
                Go to Home
            </Button>
        </Container>
    );
};

// Styles for the AccessDeniedPage component
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '100vh',
        textAlign: 'center',

    },
    heading: {
        fontSize: '3rem',
        color: '#dc3545', // Red color for Access Denied
    },
    button: {
        marginTop: '20px',
    },
};

export default AccessDenied;
