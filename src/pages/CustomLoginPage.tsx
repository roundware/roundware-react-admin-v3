import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useLogin, useNotify } from "react-admin";
import { useNavigate } from "react-router-dom";

const CustomLoginPage = () => {
  const login = useLogin();
  const notify = useNotify();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // react-admin's login() calls authProvider.login()
      // It expects { username, password } by convention
      await login({ username: email, password });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed. Check your credentials.";
      setError(message);
      notify(message, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card
        sx={{
          width: 400,
          maxWidth: "90vw",
          boxShadow: 6,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <img
              src="/logo.png"
              alt="Roundware"
              style={{ width: 80, marginBottom: 8 }}
            />
            <Typography variant="h5" fontWeight="bold">
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Roundware Admin
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              fullWidth
              required
              autoFocus
              margin="normal"
              size="small"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              fullWidth
              required
              margin="normal"
              size="small"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 2, mb: 2, py: 1.2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>

            <Typography variant="body2" align="center">
              Don't have an account?{" "}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate("/register")}
                sx={{ fontWeight: "bold" }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomLoginPage;
