import LocationOnIcon from "@mui/icons-material/LocationOn";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import throttle from "lodash/throttle";
import React from "react";

/**
 * Place search, built on the Places API (New).
 *
 * This used `google.maps.places.AutocompleteService`, which Google closed to
 * new customers on 1 March 2025. Any Cloud project created after that date —
 * including the one behind the SaaS Maps key — gets an empty result set from
 * it, with only a console notice to explain why, so the search box looked
 * broken rather than unavailable. `AutocompleteSuggestion` replaces it.
 *
 * It needs "Places API (New)" enabled on the Cloud project; if it is not, the
 * request rejects and the failure is shown under the field rather than
 * swallowed, because a silently empty list is indistinguishable from "no
 * matches" and costs an afternoon to diagnose.
 */

interface Props {
  onSelect: (lat: number, lng: number) => void;
  /** Bias results towards this point — usually the project location. */
  locationBias?: { lat: number; lng: number };
  label?: string;
  fullWidth?: boolean;
}

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  /** [start, end) offsets of the matched substrings within mainText. */
  matches: Array<[number, number]>;
  prediction: google.maps.places.PlacePrediction;
}

const isNewPlacesAvailable = () =>
  typeof google !== "undefined" &&
  typeof google.maps !== "undefined" &&
  typeof google.maps.places?.AutocompleteSuggestion !== "undefined";

/** Split `text` into highlighted / plain runs from a list of match ranges. */
const splitHighlights = (
  text: string,
  matches: Array<[number, number]>
): Array<{ text: string; highlight: boolean }> => {
  if (matches.length === 0) return [{ text, highlight: false }];
  const parts: Array<{ text: string; highlight: boolean }> = [];
  let cursor = 0;
  for (const [start, end] of matches) {
    if (start > cursor) {
      parts.push({ text: text.slice(cursor, start), highlight: false });
    }
    parts.push({ text: text.slice(start, end), highlight: true });
    cursor = end;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlight: false });
  }
  return parts;
};

const toSuggestion = (
  s: google.maps.places.AutocompleteSuggestion
): Suggestion | null => {
  const p = s.placePrediction;
  if (!p) return null;
  const main = p.mainText ?? p.text;
  return {
    placeId: p.placeId,
    mainText: main?.text ?? "",
    secondaryText: p.secondaryText?.text ?? "",
    matches: (main?.matches ?? []).map(
      (m) => [m.startOffset, m.endOffset] as [number, number]
    ),
    prediction: p,
  };
};

const PlacesAutoComplete = ({
  onSelect,
  locationBias,
  label = "Type a Place",
  fullWidth,
}: Props): JSX.Element => {
  const [value, setValue] = React.useState<Suggestion | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<Suggestion[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(isNewPlacesAvailable());

  // One token per typing session; reset after a selection so Google bills the
  // keystrokes and the follow-up detail fetch as a single autocomplete session.
  const sessionToken = React.useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );

  // The Maps script is loaded by whichever map is on the page, which may mount
  // after this does — poll rather than assume it is already there.
  React.useEffect(() => {
    if (ready) return;
    const interval = setInterval(() => {
      if (isNewPlacesAvailable()) {
        setReady(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [ready]);

  const fetchSuggestions = React.useMemo(
    () =>
      throttle(
        (input: string, callback: (s: Suggestion[], err: string | null) => void) => {
          if (!sessionToken.current) {
            sessionToken.current = new google.maps.places.AutocompleteSessionToken();
          }
          const request: google.maps.places.AutocompleteRequest = {
            input,
            sessionToken: sessionToken.current,
          };
          if (locationBias) {
            request.locationBias = locationBias;
          }
          google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          )
            .then(({ suggestions }) => {
              callback(
                suggestions
                  .map(toSuggestion)
                  .filter((s): s is Suggestion => s !== null),
                null
              );
            })
            .catch((e: unknown) => {
              callback([], String(e));
            });
        },
        250
      ),
    [locationBias?.lat, locationBias?.lng]
  );

  React.useEffect(() => {
    let active = true;
    if (!ready) return undefined;

    if (inputValue === "") {
      setOptions(value ? [value] : []);
      setError(null);
      return undefined;
    }

    fetchSuggestions(inputValue, (results, err) => {
      if (!active) return;
      setError(err);
      setOptions(value ? [value, ...results] : results);
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetchSuggestions, ready]);

  if (!ready) {
    return (
      <TextField
        label="Loading Google Maps..."
        variant="outlined"
        fullWidth
        disabled
        sx={fullWidth ? { width: "100%" } : { width: 300 }}
      />
    );
  }

  const handleChange = async (newValue: Suggestion | null) => {
    setOptions(newValue ? [newValue, ...options] : options);
    setValue(newValue);
    if (!newValue) return;
    try {
      const place = newValue.prediction.toPlace();
      await place.fetchFields({ fields: ["location"] });
      const loc = place.location;
      if (loc) onSelect(loc.lat(), loc.lng());
      setError(null);
    } catch (e) {
      setError(`Could not look up that place: ${String(e)}`);
    } finally {
      // The session ends with the detail fetch.
      sessionToken.current = null;
    }
  };

  return (
    <Autocomplete<Suggestion>
      id="places-autocomplete"
      sx={fullWidth ? { width: "100%" } : { width: 300 }}
      getOptionLabel={(option) =>
        option.secondaryText
          ? `${option.mainText}, ${option.secondaryText}`
          : option.mainText
      }
      isOptionEqualToValue={(a, b) => a.placeId === b.placeId}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      noOptionsText={error ? "Place search unavailable" : "No matches"}
      onChange={(_e, newValue) => {
        void handleChange(newValue);
      }}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          fullWidth
          error={Boolean(error)}
          helperText={
            error
              ? "Place search failed — check that Places API (New) is enabled for this Maps key."
              : undefined
          }
        />
      )}
      renderOption={(p, option) => (
        <li {...p} key={option.placeId}>
          <Grid container alignItems="center">
            <Grid>
              <LocationOnIcon sx={{ color: "text.secondary", marginRight: 2 }} />
            </Grid>
            <Grid size="grow">
              {splitHighlights(option.mainText, option.matches).map(
                (part, index) => (
                  <span
                    key={index}
                    style={{ fontWeight: part.highlight ? 700 : 400 }}
                  >
                    {part.text}
                  </span>
                )
              )}
              <Typography variant="body2" color="textSecondary">
                {option.secondaryText}
              </Typography>
            </Grid>
          </Grid>
        </li>
      )}
    />
  );
};

export default PlacesAutoComplete;
