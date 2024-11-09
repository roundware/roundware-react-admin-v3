import { Container, Typography } from "@mui/material";
import * as React from "react";
import { ReactElement } from "react";

const AccessDenied = (): ReactElement => {
    return (
        <Container sx={styles.container}>
            <Typography variant="h4" sx={styles.heading}>
                Access Denied
            </Typography>
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
        backgroundColor: '#f8f9fa',
    },
    heading: {
        fontSize: '3rem',
        color: '#dc3545', // Red color for Access Denied
    },
};

export default AccessDenied;
