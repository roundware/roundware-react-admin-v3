import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import {
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Typography,
} from '@mui/material';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import PlacesAutoComplete from 'components/common/LocationSelector/PlacesAutoComplete';
import { useSpeakers } from 'context/SpeakersContext';
import React, { useEffect, useState } from 'react';
import { ISpeaker } from '../../types/speaker';
import { mapLibraries } from '../../utils.tsx';
import SpeakerDrawer from './SpeakerDrawer';
import SpeakerPolygonGroup from './SpeakerPolygon';
const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '600px',
};

// const center = {
//   lat: 34.0479,
//   lng: 100.6197,
// };

interface SpeakerShapesControlProps {
  speakers?: ISpeaker[];
}

/**
 * shows / edit / create any shapes of type ISpeakerShape
 *
 */
const SpeakerShapesControl = ({ speakers: propSpeakers }: SpeakerShapesControlProps): JSX.Element => {
  const { selectedSpeaker, speakers: contextSpeakers } = useSpeakers();
  const speakers = propSpeakers || contextSpeakers;
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
     
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

  const [, setMap] = React.useState<google.maps.Map | null>(null);

  // on load set the center
  // as center of boundry box of all the polygons of speakers
  const onLoad = React.useCallback(
    (map: google.maps.Map) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      google.maps.Polygon.prototype.getBounds = function () {
        const bounds = new google.maps.LatLngBounds();
        this.getPaths().forEach((p: google.maps.MVCArray<google.maps.LatLng>) => {
          p.forEach((element: google.maps.LatLng) => bounds.extend(element));
        });
        return bounds;
      };
      setMap(map);

      // Fit map to existing speaker shapes, or default to zoom 15
      const shapedSpeakers = (speakers || []).filter((s) => s?.shape?.coordinates);
      if (shapedSpeakers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        shapedSpeakers.forEach((s) => {
          // Walk all [lng, lat] pairs in the GeoJSON MultiPolygon
          try {
            // coordinates: [polygon][ring][point] where point = [lng, lat]
            const points: number[][] = s.shape.coordinates.flat(2);
            points.forEach((pt: number[]) => {
              if (Array.isArray(pt) && pt.length >= 2) {
                bounds.extend(new google.maps.LatLng(pt[1], pt[0]));
              }
            });
          } catch {
            // skip malformed shapes
          }
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds);
        } else {
          map.panTo(new google.maps.LatLng(0, 0));
          map.setZoom(15);
        }
      } else {
        map.panTo(new google.maps.LatLng(0, 0));
        map.setZoom(15);
      }
    },
    [speakers]
  );

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  const [scaleFactor, setScaleFactor] = React.useState(1);

  useEffect(() => {
    setScaleFactor(1.01);
    setTimeout(() => {
      setScaleFactor(1);
    }, 200);
  }, [selectedSpeaker]);

  const [center, setCenter] = useState({ lat: 0, lng: 0 });

  return (
    <div
      style={{
        // everytime selectedSpeaker changes scale to 1.02 for 1 second and then back to 1
        transform: `scale(${scaleFactor})`,
        transition: 'transform 0.1s ease-in-out',
      }}
    >
      <Card variant='elevation' elevation={4} style={{ width: '100%', height: '100%' }}>
        <CardContent style={{ height: '100%' }}>
          <Grid container direction='column' spacing={2}>
            {/* speaker info */}
            <Grid>
              <Typography variant='h5'>Shapes</Typography>
              {selectedSpeaker ? (
                <Typography
                  variant='body1'
                  style={{ fontWeight: 'bold' }}
                >
                  Selected Speaker #{selectedSpeaker}
                </Typography>
              ) : (
                <div style={{ fontWeight: 'normal' }}>
                  <Grid container direction='row' alignItems='center'>
                    Select a Speaker to Edit using{' '}
                    <LocationOnOutlinedIcon fontSize={'medium'} /> Icon from
                    List, Or Double Click any shape
                  </Grid>
                </div>
              )}
            </Grid>

            {/* locatoin seelctor */}
            <Grid>
              <PlacesAutoComplete
                onSelect={(lat, lng) =>
                  setCenter({
                    lat,
                    lng,
                  })
                }
              />
            </Grid>

            {/* map */}
            <Grid>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                  center={center}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: true,
                  }}
                >
                  {/* show a drawing manager only when there no shape, */}
                  <SpeakerDrawer />
                  {/* all other polygons */}
                  {speakers
                    ?.filter((s) => s.shape)
                    ?.map((s) => (
                      <SpeakerPolygonGroup speaker={s} key={s.id} />
                    ))}
                </GoogleMap>
              ) : (
                <CircularProgress />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpeakerShapesControl;

// const paths = [
//   { lat: 25.774, lng: -80.19 },
//   { lat: 18.466, lng: -66.118 },
//   { lat: 32.321, lng: -64.757 },
//   { lat: 25.774, lng: -80.19 },
// ];
