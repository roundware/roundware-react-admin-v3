import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useMemo, useState } from "react";
import { useInput, useRecordContext } from "react-admin";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import webAppDefaults from "../../config/webAppDefaults.json";
import {
  buildRows,
  ConfigSchema,
  isPlainObject,
  Source,
  validate,
} from "./configReference";

/**
 * Raw editor for a project's `ui_config_json`, plus a read-only reference of
 * the resulting effective config.
 *
 * Design notes (roundware-server-v3/docs/009-configuration.md §6 step 6):
 *
 *  - The editable box holds **overrides only**, not the merged result. Saving a
 *    fully merged document would freeze all ~197 keys against future app
 *    defaults; absence has to keep meaning "use the default".
 *  - The reference panel exists because an empty override box gives an author
 *    no idea which keys are available. It shows every key, its effective value,
 *    and where that value came from.
 *  - The section and column rules come from `GET /config/schema/` rather than a
 *    local copy, so this cannot drift from what the server enforces.
 */

const DEFAULTS = (webAppDefaults as { defaults: Record<string, unknown> }).defaults;
const STAMP = (webAppDefaults as { _generated: { webappVersion: string; generatedAt: string } })
  ._generated;

const SOURCE_COLOR: Record<Source, "default" | "primary" | "secondary"> = {
  default: "default",
  override: "primary",
  column: "secondary",
};

const AdvancedConfigInput = (): JSX.Element => {
  const { field, fieldState } = useInput({ source: "ui_config_json" });
  const record = useRecordContext();
  const [schema, setSchema] = useState<ConfigSchema | null>(null);
  const [text, setText] = useState<string>(() =>
    JSON.stringify(field.value ?? {}, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    apiFetcher("/config/schema/")
      .then(({ json }) => setSchema(json as ConfigSchema))
      .catch(() => setSchema(null)); // reference panel still works; validation defers to the server
  }, []);

  // Re-seed the box when the record loads or is replaced, but never while the
  // author is mid-edit — that would fight their cursor.
  useEffect(() => {
    setText(JSON.stringify(field.value ?? {}, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id]);

  const parsed = useMemo(() => {
    try {
      return { value: JSON.parse(text || "{}") as unknown, error: null as string | null };
    } catch (e) {
      return { value: null, error: (e as Error).message };
    }
  }, [text]);

  const errors = useMemo(
    () => (parsed.value === null ? [] : validate(parsed.value, schema)),
    [parsed.value, schema]
  );

  const rows = useMemo(
    () =>
      buildRows(
        DEFAULTS,
        isPlainObject(parsed.value) ? parsed.value : {},
        record as Record<string, unknown> | undefined,
        schema
      ),
    [parsed.value, record, schema]
  );

  const visibleRows = useMemo(
    () =>
      filter.trim()
        ? rows.filter((r) => r.path.toLowerCase().includes(filter.trim().toLowerCase()))
        : rows,
    [rows, filter]
  );

  const handleChange = (next: string) => {
    setText(next);
    try {
      const value = JSON.parse(next || "{}");
      setParseError(null);
      field.onChange(value);
    } catch (e) {
      setParseError((e as Error).message);
      // Deliberately not calling onChange: keep the last valid document in the
      // form so a half-typed edit cannot be saved.
    }
  };

  const overrideCount = rows.filter((r) => r.source === "override").length;

  return (
    <Accordion sx={{ width: "100%" }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">Advanced configuration</Typography>
          {overrideCount > 0 && (
            <Chip size="small" color="primary" label={`${overrideCount} overridden`} />
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Alert severity="info" sx={{ mb: 2 }}>
          These settings control how the published app behaves. Anything you do
          not set here uses the app default, and stays up to date automatically
          as the app improves — so set only what you actually want to change.
        </Alert>

        <Typography variant="subtitle2" gutterBottom>
          Overrides for this project
        </Typography>
        <TextField
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          multiline
          minRows={8}
          maxRows={28}
          fullWidth
          spellCheck={false}
          error={Boolean(parseError) || errors.length > 0}
          slotProps={{
            input: { sx: { fontFamily: "monospace", fontSize: 13 } },
          }}
          helperText={parseError ? `Invalid JSON: ${parseError}` : " "}
        />
        {fieldState.error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {fieldState.error.message}
          </Alert>
        )}
        {errors.map((e) => (
          <Alert severity="warning" sx={{ mt: 1 }} key={e}>
            {e}
          </Alert>
        ))}

        <Box sx={{ mt: 3 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="baseline"
            justifyContent="space-between"
            flexWrap="wrap"
          >
            <Typography variant="subtitle2">
              Effective configuration ({rows.length} settings)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              defaults from web app v{STAMP.webappVersion}, {STAMP.generatedAt}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
            Read-only. <Chip size="small" label="override" color="primary" /> comes
            from the box above, <Chip size="small" label="field" color="secondary" />{" "}
            from a project field on this page (edit it there — setting it above is
            rejected), and the rest are app defaults.
          </Typography>
          <TextField
            size="small"
            placeholder="Filter settings, e.g. speaker"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ mb: 1, width: 280 }}
          />
          <Box
            sx={{
              maxHeight: 420,
              overflow: "auto",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            {visibleRows.map((r) => (
              <Stack
                key={r.path}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  px: 1,
                  py: 0.4,
                  borderBottom: 1,
                  borderColor: "divider",
                  bgcolor: r.source === "default" ? undefined : "action.hover",
                }}
              >
                <Box sx={{ flex: "1 1 42%", wordBreak: "break-all" }}>{r.path}</Box>
                <Box sx={{ flex: "1 1 38%", wordBreak: "break-all", opacity: 0.85 }}>
                  {JSON.stringify(r.value)}
                </Box>
                <Box sx={{ flex: "0 0 auto" }}>
                  {r.source !== "default" && (
                    <Chip
                      size="small"
                      color={SOURCE_COLOR[r.source]}
                      label={r.source === "column" ? r.column : "override"}
                    />
                  )}
                </Box>
              </Stack>
            ))}
            {visibleRows.length === 0 && (
              <Box sx={{ p: 2, opacity: 0.7 }}>No settings match “{filter}”.</Box>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
            Key names come from the web app&apos;s{" "}
            <Link
              href="https://github.com/roundware/roundware-web-app-v3/blob/main/src/configTypes.ts"
              target="_blank"
              rel="noreferrer"
            >
              configTypes.ts
            </Link>
            . A key that is not listed above will be stored but ignored by the app.
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default AdvancedConfigInput;
