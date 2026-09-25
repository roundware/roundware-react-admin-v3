import { Alert, AlertTitle, Box, Button, Stack, Typography } from "@mui/material";
import React from "react";

/**
 * Catch a render error inside the wizard and offer a way out.
 *
 * React unmounts the whole tree when a render throws, so before this the
 * wizard became a blank screen with no controls — the only escape was the
 * browser's back button, which left react-admin somewhere unrelated and
 * discarded every answer. One bug in a preview component cost a full project
 * setup.
 *
 * The answers are in sessionStorage by then, so reloading resumes where the
 * crash happened. That is deliberately the default action: it is almost always
 * right, and "start over" is the destructive one.
 */

interface Props {
  children: React.ReactNode;
  /** Wipes the saved draft — only for the explicit "start over" path. */
  onReset: () => void;
}

interface State {
  error: Error | null;
}

class WizardErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // No error reporting service yet (see docs/010, "Deferred hardening"), so
    // the console is the only record of what actually broke.
    console.error("Wizard crashed:", error, info.componentStack);
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Something broke in the wizard</AlertTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Your answers were saved. Reloading should pick up where you left
            off — you may need to choose any audio file again, since files
            cannot be saved.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {error.message}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => window.location.reload()}
            >
              Reload and continue
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => {
                this.props.onReset();
                window.location.reload();
              }}
            >
              Start over
            </Button>
          </Stack>
        </Alert>
      </Box>
    );
  }
}

export default WizardErrorBoundary;
