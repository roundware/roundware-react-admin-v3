// ---------------------------------------------------------------------------
// The embeddable recorder's choices (server docs/023): the sites allowed to
// show it, and its steps and looks. Shared by Publish's embed card and the
// wizard's optional embed step; the project keeps them (embed_allowed_sites,
// embed_options), and the embed code is made from them.
// ---------------------------------------------------------------------------
import React from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export interface EmbedOptions {
  questions: boolean;
  location: boolean;
  photo: boolean;
  text: boolean;
  contact: boolean;
  upload: "auto" | "always" | "never";
  layout: "auto" | "horizontal" | "vertical";
  size: "compact" | "comfortable";
  /** "" for the project's own setting (Customize). */
  appearance: "" | "light" | "dark" | "auto";
  /** "" for the visitor's own language. */
  lang: string;
  /** The space it's given on the host's page, in px: in the code, not the
   *  link. The recorder fills it; panels open over the page below. */
  height?: number;
}

export interface EmbedLanguage {
  id: number;
  language_code: string;
  name: string;
}

/** Where a project with no saved choices starts: its own settings for the
 *  steps it has, then whatever it saved over them. */
export function embedOptionsFor(
  project: {
    allow_speak_tags?: boolean;
    allow_photos?: boolean;
    allow_text?: boolean;
    geo_speak_enabled?: boolean;
  },
  saved?: Partial<EmbedOptions> | null
): EmbedOptions {
  return {
    questions: !!project.allow_speak_tags,
    location: project.geo_speak_enabled ?? true,
    photo: !!project.allow_photos,
    text: !!project.allow_text,
    contact: false,
    upload: "auto",
    layout: "auto",
    size: "compact",
    appearance: "",
    lang: "",
    ...(saved ?? {}),
  };
}

/** The embed address's query: every step said, the rest only when not the default. */
export function embedQuery(o: EmbedOptions): string {
  const q = new URLSearchParams();
  q.set("questions", o.questions ? "1" : "0");
  q.set("location", o.location ? "1" : "0");
  q.set("photo", o.photo ? "1" : "0");
  q.set("text", o.text ? "1" : "0");
  if (o.contact) q.set("contact", "1");
  if (o.upload !== "auto") q.set("upload", o.upload);
  if (o.layout !== "auto") q.set("layout", o.layout);
  if (o.size !== "compact") q.set("size", o.size);
  if (o.appearance) q.set("appearance", o.appearance);
  if (o.lang) q.set("lang", o.lang);
  return q.toString();
}

export const EmbedSitesField: React.FC<{
  sites: string[];
  onChange: (sites: string[]) => void;
  /** Warn that nothing shows it yet; off where sites can be added later. */
  warnWhenEmpty?: boolean;
}> = ({ sites, onChange, warnWhenEmpty = true }) => (
  <Box>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      Sites allowed to show it
    </Typography>
    <Autocomplete
      multiple
      freeSolo
      options={[]}
      value={sites}
      onChange={(_e, value) => onChange(value as string[])}
      renderTags={(value, getTagProps) =>
        value.map((site, index) => <Chip size="small" label={site} {...getTagProps({ index })} key={site} />)
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder={sites.length ? "Add another" : "mypodcast.com"}
          helperText="Type a site and press Enter. Any page on it works, and its subdomains (www., shop. …)."
        />
      )}
    />
    {warnWhenEmpty && sites.length === 0 && (
      <Alert severity="warning" sx={{ mt: 1 }}>
        No sites yet: browsers won't show the recorder anywhere until you add the site your page
        is on.
      </Alert>
    )}
  </Box>
);

export const RecorderOptionsFields: React.FC<{
  value: EmbedOptions;
  onChange: (patch: Partial<EmbedOptions>) => void;
  languages: EmbedLanguage[];
}> = ({ value: o, onChange, languages }) => (
  <>
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        What it asks
      </Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap columnGap={1}>
        <FormControlLabel
          control={<Checkbox checked={o.questions} onChange={(e) => onChange({ questions: e.target.checked })} />}
          label="Questions (Filters & Menus)"
        />
        <FormControlLabel
          control={<Checkbox checked={o.location} onChange={(e) => onChange({ location: e.target.checked })} />}
          label="Location"
        />
        <FormControlLabel
          control={<Checkbox checked={o.photo} onChange={(e) => onChange({ photo: e.target.checked })} />}
          label="Add a photo"
        />
        <FormControlLabel
          control={<Checkbox checked={o.text} onChange={(e) => onChange({ text: e.target.checked })} />}
          label="Add text"
        />
        <FormControlLabel
          control={<Checkbox checked={o.contact} onChange={(e) => onChange({ contact: e.target.checked })} />}
          label="Name and email"
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block">
        Recordings are placed at the project's location
        {o.location ? " unless the contributor changes it" : ""}. Name and email are optional for
        contributors, and only your team sees them.
      </Typography>
    </Box>

    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap flexWrap="wrap">
      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel>Uploading an audio file</InputLabel>
        <Select
          label="Uploading an audio file"
          value={o.upload}
          onChange={(e) => onChange({ upload: e.target.value as EmbedOptions["upload"] })}
        >
          <MenuItem value="auto">On wide screens (as in the app)</MenuItem>
          <MenuItem value="always">Always offered</MenuItem>
          <MenuItem value="never">Never</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel shrink>Language</InputLabel>
        <Select label="Language" notched displayEmpty value={o.lang} onChange={(e) => onChange({ lang: e.target.value })}>
          <MenuItem value="">The visitor's own</MenuItem>
          {languages.map((l) => (
            <MenuItem key={l.id} value={l.language_code}>
              {l.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 170 }}>
        <InputLabel>Layout</InputLabel>
        <Select
          label="Layout"
          value={o.layout}
          onChange={(e) => onChange({ layout: e.target.value as EmbedOptions["layout"] })}
        >
          <MenuItem value="auto">By its width</MenuItem>
          <MenuItem value="horizontal">Horizontal</MenuItem>
          <MenuItem value="vertical">Vertical</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Size</InputLabel>
        <Select label="Size" value={o.size} onChange={(e) => onChange({ size: e.target.value as EmbedOptions["size"] })}>
          <MenuItem value="compact">Compact</MenuItem>
          <MenuItem value="comfortable">Comfortable</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel shrink>Light or dark</InputLabel>
        <Select
          label="Light or dark"
          notched
          displayEmpty
          value={o.appearance}
          onChange={(e) => onChange({ appearance: e.target.value as EmbedOptions["appearance"] })}
        >
          <MenuItem value="">The project's setting</MenuItem>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
          <MenuItem value="auto">Follow the visitor's device</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  </>
);
