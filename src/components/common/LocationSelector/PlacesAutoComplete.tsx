import LocationOnIcon from "@mui/icons-material/LocationOn";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import parse from "autosuggest-highlight/parse";
import throttle from "lodash/throttle";
import React from "react";

interface Props {
  onSelect: (lat: number, lng: number) => void;
}

const PlacesAutoComplete = ({ onSelect }: Props): JSX.Element => {
  const [value, setValue] =
    React.useState<google.maps.places.AutocompletePrediction | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<PlaceType[]>([]);

  const fetch = React.useMemo(
    () =>
      throttle(
        (
          request: { input: string },
          callback: (
            a: google.maps.places.AutocompletePrediction[] | null,
            b: google.maps.places.PlacesServiceStatus
          ) => void
        ) => {
          autocompleteService.current?.getPlacePredictions(request, callback);
        },
        200
      ),
    []
  );

  React.useEffect(() => {
    let active = true;

    if (!autocompleteService.current && window.google) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
    }
    if (!autocompleteService.current) {
      return undefined;
    }

    if (inputValue === "") {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch(
      { input: inputValue },
      (results: google.maps.places.AutocompletePrediction[] | null) => {
        if (active) {
          let newOptions: google.maps.places.AutocompletePrediction[] = [];

          if (value) {
            newOptions = [value];
          }

          if (results) {
            newOptions = [...newOptions, ...results];
          }

          setOptions(newOptions);
        }
      }
    );

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  return (
    <Autocomplete
      id="google-map-demo"
      style={{ width: 300 }}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.description
      }
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      onChange={(_e, newValue: PlaceType | null) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
        if (!newValue) return;
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ placeId: newValue.place_id }, (results, status) => {
          if (status === "OK") {
            if (Array.isArray(results) && results[0]) {
              onSelect(
                results[0].geometry.location.lat(),
                results[0].geometry.location.lng()
              );
            }
          }
        });
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Type a Place"
          variant="outlined"
          fullWidth
        />
      )}
      renderOption={(p, option) => {
        const matches =
          option.structured_formatting.main_text_matched_substrings;
        const parts = parse(
          option.structured_formatting.main_text,
          matches.map((match) => [match.offset, match.offset + match.length])
        );

        return (
          <li {...p}>
            <Grid container alignItems="center">
              <Grid item>
                <LocationOnIcon 
                  sx={{ 
                    color: "text.secondary",
                    marginRight: 2 
                  }} 
                />
              </Grid>
              <Grid item xs>
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{ fontWeight: part.highlight ? 700 : 400 }}
                  >
                    {part.text}
                  </span>
                ))}
                <Typography variant="body2" color="textSecondary">
                  {option.structured_formatting.secondary_text}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
};
const autocompleteService: {
  current: null | google.maps.places.AutocompleteService;
} = { current: null };


type PlaceType = google.maps.places.AutocompletePrediction;
export default PlacesAutoComplete;
