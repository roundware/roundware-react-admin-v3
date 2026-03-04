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
import { useNavigate } from "react-router-dom";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

interface RegisterForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization_name: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    organization_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof RegisterForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/3/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (data?.detail) {
          // Handle pydantic validation errors (array of objects)
          if (Array.isArray(data.detail)) {
            const messages = data.detail.map(
              (err: { msg?: string; loc?: string[] }) =>
                err.msg || JSON.stringify(err)
            );
            throw new Error(messages.join(". "));
          }
          throw new Error(data.detail);
        }
        throw new Error(`Registration failed (${response.status})`);
      }

      const data = await response.json();

      // Store auth data (same as login flow in AuthProvider)
      // Write tenant info BEFORE access_token (see AuthProvider for details)
      if (data.tenants?.length) {
        localStorage.setItem("tenants", JSON.stringify(data.tenants));
        localStorage.setItem("tenant_slug", data.tenants[0].slug);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      localStorage.setItem("access_token", data.access_token);

      // Redirect to plan selection for new users
      navigate("/onboarding/plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get started with Roundware
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="First Name"
              value={form.first_name}
              onChange={handleChange("first_name")}
              fullWidth
              required
              autoFocus
              margin="normal"
              size="small"
            />
            <TextField
              label="Last Name"
              value={form.last_name}
              onChange={handleChange("last_name")}
              fullWidth
              required
              margin="normal"
              size="small"
            />
            <TextField
              label="Organization Name"
              value={form.organization_name}
              onChange={handleChange("organization_name")}
              fullWidth
              required
              margin="normal"
              size="small"
              helperText="Your team or company name"
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              fullWidth
              required
              margin="normal"
              size="small"
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              fullWidth
              required
              margin="normal"
              size="small"
              helperText="At least 8 characters"
              slotProps={{ htmlInput: { minLength: 8 } }}
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
                "Sign Up"
              )}
            </Button>

            <Typography variant="body2" align="center">
              Already have an account?{" "}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate("/")}
                sx={{ fontWeight: "bold" }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
