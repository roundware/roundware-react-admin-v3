// ---------------------------------------------------------------------------
// A moving asset's path (server docs/030): drawn on the asset's map, with a
// panel to look at it and the few edits an editor needs — change its status,
// its mover's settings, stop it moving (or resume), and trim a bad stretch.
//
// Points are written by an outside mover (the balloon simulator), not here.
// The line and the panel share one fetch (react-query key ["asset-path", id]).
// ---------------------------------------------------------------------------
import RouteIcon from '@mui/icons-material/Route';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MarkerF, PolylineF, useGoogleMap } from '@react-google-maps/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { Confirm, useNotify, useRecordContext, useRefresh } from 'react-admin';
import { useRoundwareDataProvider } from 'context/DataProviderContext';
import { apiFetcher } from 'roundwareDataProvider/tokenAuthProvider';
import { IAsset } from '../../types/asset';

/** More than enough for a line on a map; the server thins evenly. */
const MAX_POINTS = 1000;
const LINE_COLOR = '#1e88e5';
const STATUSES = ['moving', 'landed', 'arrived', 'captured', 'ended'] as const;

interface PathPoint {
  t: string;
  latitude: number;
  longitude: number;
  altitude_m: number | null;
  segment: number;
}

interface PathDetail {
  kind: string;
  status: (typeof STATUSES)[number];
  params: Record<string, unknown> | null;
  started_at: string | null;
  ended_at: string | null;
  latest_at: string | null;
  latest_u: number | null;
  latest_v: number | null;
  latest_altitude_m: number | null;
  point_count: number;
  first_at: string | null;
}

const pathKey = (id: unknown) => ['asset-path', id];

/** The path and (thinned) points of the asset in context; nothing for an asset without one. */
function useAssetPath() {
  const record = useRecordContext<IAsset>();
  const id = record?.id;
  return useQuery({
    queryKey: pathKey(id),
    enabled: id != null && !!record?.path,
    queryFn: async () => {
      const { json } = await apiFetcher(`/assets/${id}/path/?max_points=${MAX_POINTS}`);
      return json as { path: PathDetail; points: PathPoint[] };
    },
  });
}

// --- On the map ------------------------------------------------------------

/** The path as a line (one per segment), with its starting point marked.
 *  Rendered inside the asset's map; the asset's own pin is where it is now. */
export const AssetPathLine = (): JSX.Element | null => {
  const map = useGoogleMap();
  const { data } = useAssetPath();
  const fitted = useRef(false);
  const points = data?.points ?? [];

  // Show the whole path once: the map opens zoomed in on the asset, and a
  // balloon's path can span an ocean.
  // Fits now, and again when the map next settles: the location card zooms
  // in on the asset as its map loads, which can land just after this.
  useEffect(() => {
    if (!map || fitted.current || points.length < 2) return;
    fitted.current = true;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
    map.fitBounds(bounds, 40);
    const listener = google.maps.event.addListenerOnce(map, 'idle', () => map.fitBounds(bounds, 40));
    return () => listener.remove();
  }, [map, points]);

  if (points.length === 0) return null;
  const segments = new Map<number, google.maps.LatLngLiteral[]>();
  for (const p of points) {
    const line = segments.get(p.segment) ?? [];
    line.push({ lat: p.latitude, lng: p.longitude });
    segments.set(p.segment, line);
  }
  const first = points[0];
  return (
    <>
      {[...segments.entries()].map(([segment, path]) => (
        <PolylineF
          key={segment}
          path={path}
          options={{ strokeColor: LINE_COLOR, strokeOpacity: 0.85, strokeWeight: 3, clickable: false, geodesic: true }}
        />
      ))}
      <MarkerF
        position={{ lat: first.latitude, lng: first.longitude }}
        title={`Start: ${new Date(first.t).toLocaleString()}`}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#ffffff',
          fillOpacity: 1,
          strokeColor: LINE_COLOR,
          strokeWeight: 3,
        }}
      />
    </>
  );
};

// --- The panel -------------------------------------------------------------

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

/** "12 m/s (43 km/h) toward ENE" from velocity east/north. */
function speed(u: number | null, v: number | null): string {
  if (u == null || v == null) return '—';
  const ms = Math.hypot(u, v);
  const deg = ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
  const compass = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][
    Math.round(deg / 22.5) % 16
  ];
  return `${ms.toFixed(1)} m/s (${(ms * 3.6).toFixed(0)} km/h) toward ${compass}`;
}

/** For a datetime-local input: local time, to the minute. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Stack direction="row" spacing={2}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
      {label}
    </Typography>
    <Typography variant="body2" component="div">
      {children}
    </Typography>
  </Stack>
);

export const AssetPathPanel = (): JSX.Element | null => {
  const record = useRecordContext<IAsset>();
  const { data, isLoading, error } = useAssetPath();
  const queryClient = useQueryClient();
  const refresh = useRefresh();
  const notify = useNotify();
  const dataProvider = useRoundwareDataProvider();

  const [status, setStatus] = useState<string>('');
  const [paramsText, setParamsText] = useState('');
  const [trimAfter, setTrimAfter] = useState('');
  const [confirmTrim, setConfirmTrim] = useState(false);
  const [busy, setBusy] = useState(false);

  const path = data?.path;
  useEffect(() => {
    if (!path) return;
    setStatus(path.status);
    setParamsText(path.params ? JSON.stringify(path.params, null, 2) : '');
  }, [path?.status, path?.params]);

  if (!record?.path) return null;

  /** Send one change, then reload the path and the asset (its position or moving flag may change). */
  const send = async (label: string, url: string, init: RequestInit) => {
    setBusy(true);
    try {
      await apiFetcher(url, init);
      notify(label, { type: 'info' });
      await queryClient.invalidateQueries({ queryKey: pathKey(record.id) });
      // The data provider keeps its own copy of each record: fetch this one
      // anew (its position, moving flag and path summary may have changed)
      // before asking the page to re-read it.
      await dataProvider.getOneJson('assets', record.id, { admin: 1 }, true);
      refresh();
    } catch (e) {
      notify(`Couldn't save: ${(e as Error).message}`, { type: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const patch = (label: string, body: object) =>
    send(label, `/assets/${record.id}/path/`, { method: 'PATCH', body: JSON.stringify(body) });

  const saveParams = () => {
    let params: unknown = null;
    if (paramsText.trim()) {
      try {
        params = JSON.parse(paramsText);
      } catch {
        notify('Settings must be valid JSON.', { type: 'error' });
        return;
      }
    }
    patch('Settings saved', { params });
  };

  const trim = () => {
    setConfirmTrim(false);
    send('Path trimmed', `/assets/${record.id}/path/points/?after=${encodeURIComponent(new Date(trimAfter).toISOString())}`, {
      method: 'DELETE',
    });
  };

  return (
    <Card variant="outlined" sx={{ width: '100%', mt: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <RouteIcon />
            <Typography variant="h6">Path</Typography>
            <Chip
              size="small"
              label={record.moving ? path?.status ?? record.path.status : 'not moving'}
              color={record.moving && (path?.status ?? record.path.status) === 'moving' ? 'success' : 'default'}
            />
          </Stack>

          {isLoading && <Typography variant="body2">Loading the path…</Typography>}
          {error && (
            <Typography variant="body2" color="error">
              Couldn't load the path: {(error as Error).message}
            </Typography>
          )}

          {path && (
            <>
              <Box>
                <Row label="Moved by">{path.kind}</Row>
                <Row label="Started">{when(path.first_at ?? path.started_at)}</Row>
                <Row label="Latest point">{when(path.latest_at)}</Row>
                {path.ended_at && <Row label="Ended">{when(path.ended_at)}</Row>}
                <Row label="Points">
                  {path.point_count.toLocaleString()}
                  {path.point_count > MAX_POINTS && ` (map shows ${MAX_POINTS.toLocaleString()}, evenly spaced)`}
                </Row>
                <Row label="Altitude">
                  {path.latest_altitude_m != null ? `${Math.round(path.latest_altitude_m).toLocaleString()} m` : '—'}
                </Row>
                <Row label="Speed">{speed(path.latest_u, path.latest_v)}</Row>
              </Box>

              {/* Status */}
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  sx={{ minWidth: 160 }}
                  helperText="The mover can't add points to an ended path until it's moving again."
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={busy || status === path.status}
                  onClick={() => patch(`Status set to ${status}`, { status })}
                >
                  Set status
                </Button>
              </Stack>

              {/* The mover's settings */}
              <Stack spacing={1}>
                <TextField
                  label="Mover settings (JSON)"
                  value={paramsText}
                  onChange={(e) => setParamsText(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
                />
                <Box>
                  <Button variant="outlined" size="small" disabled={busy} onClick={saveParams}>
                    Save settings
                  </Button>
                </Box>
              </Stack>

              {/* Stop or resume */}
              <Stack direction="row" spacing={1} alignItems="center">
                {record.moving ? (
                  <Button variant="outlined" size="small" disabled={busy} onClick={() => patch('Stopped: a fixed asset now', { moving: false })}>
                    Stop moving
                  </Button>
                ) : (
                  <Button variant="outlined" size="small" disabled={busy} onClick={() => patch('Moving again', { status: 'moving' })}>
                    Resume moving
                  </Button>
                )}
                <Typography variant="caption" color="text.secondary">
                  {record.moving
                    ? 'Ends the path and leaves the asset where it is, as an ordinary recording. The path is kept.'
                    : 'Makes it a moving asset again, so its mover can add points.'}
                </Typography>
              </Stack>

              {/* Trim */}
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  type="datetime-local"
                  size="small"
                  label="Delete points after"
                  value={trimAfter}
                  onChange={(e) => setTrimAfter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: toLocalInput(path.first_at), max: toLocalInput(path.latest_at) }}
                />
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  disabled={busy || !trimAfter}
                  onClick={() => setConfirmTrim(true)}
                >
                  Trim path
                </Button>
              </Stack>
              <Confirm
                isOpen={confirmTrim}
                title="Trim this path?"
                content={`Every point after ${trimAfter ? new Date(trimAfter).toLocaleString() : ''} is deleted for good, and the asset moves back to the last point left. Its recording isn't touched.`}
                confirm="Delete points"
                onConfirm={trim}
                onClose={() => setConfirmTrim(false)}
              />
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
