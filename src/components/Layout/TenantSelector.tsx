import { FormControl, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import React from "react";
import { StoredTenant, switchTenant } from "../../context/AuthProvider";

/**
 * Dropdown in the AppBar for switching between tenants.
 * Only renders when the user belongs to more than one tenant.
 */
const TenantSelector = (): JSX.Element | null => {
  const tenants: StoredTenant[] = JSON.parse(
    localStorage.getItem("tenants") || "[]"
  );
  const currentSlug = localStorage.getItem("tenant_slug") || "";

  if (tenants.length <= 1) return null;

  const handleChange = (event: SelectChangeEvent<string>) => {
    const slug = event.target.value;
    if (slug !== currentSlug) {
      switchTenant(slug);
    }
  };

  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <Select
        value={currentSlug}
        onChange={handleChange}
        size="small"
        sx={{
          color: "#fff",
          ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" },
          ".MuiSvgIcon-root": { color: "#fff" },
        }}
      >
        {tenants.map((t) => (
          <MenuItem key={t.slug} value={t.slug}>
            {t.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TenantSelector;
