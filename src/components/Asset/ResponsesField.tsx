// ---------------------------------------------------------------------------
// Likes, flags and any other votes on a contribution (2026-11-13), on its own
// page: a vote means something next to what it's about, so there is no page
// of votes on their own. A flag's email links here. Counts are of sessions,
// as on the list and in the flag email, so a double tap counts once; each
// vote is listed with when and who. Server: GET /votes/?asset_id=.
// ---------------------------------------------------------------------------
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Labeled, useRecordContext } from "react-admin";
import { apiFetcher } from "roundwareDataProvider/tokenAuthProvider";
import { ParticipantLink } from "../../pages/Participants";

interface Vote {
  id: number;
  session_id: number;
  type: string;
  value: number | null;
  created_at: string;
  participant_id: number | null;
  contact_name: string;
}

const SHOWN = 20;

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

const label = (v: Vote) =>
  v.type === "like"
    ? "Like"
    : v.type === "flag"
    ? "Flag"
    : v.type === "rate"
    ? `Rating${v.value != null ? ` ${v.value}` : ""}`
    : v.type.charAt(0).toUpperCase() + v.type.slice(1);

/** "3 likes · 1 flag · 4 ratings, 4.5 on average": sessions, not taps. */
const summary = (votes: Vote[]): string => {
  const sessions = (type: string) => new Set(votes.filter((v) => v.type === type).map((v) => v.session_id)).size;
  const parts = [plural(sessions("like"), "like"), plural(sessions("flag"), "flag")];
  const ratings = votes.filter((v) => v.type === "rate" && v.value != null);
  if (ratings.length) {
    const average = ratings.reduce((sum, v) => sum + (v.value as number), 0) / ratings.length;
    parts.push(`${plural(ratings.length, "rating")}, ${average.toFixed(1)} on average`);
  }
  const others = votes.filter((v) => !["like", "flag", "rate"].includes(v.type)).length;
  if (others) parts.push(plural(others, "other"));
  return parts.join(" · ");
};

const ResponsesField: React.FC = () => {
  const record = useRecordContext<{ id: number }>();
  const [votes, setVotes] = useState<Vote[] | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    if (!record?.id) return;
    apiFetcher(`/votes/?asset_id=${record.id}&ordering=-created_at`)
      .then(({ json }) => setVotes(json as Vote[]))
      .catch(() => setVotes(null));
  }, [record?.id]);

  if (votes == null) return null;
  const shown = all ? votes : votes.slice(0, SHOWN);
  return (
    <Labeled label="Responses in the app" fullWidth>
      <Box component="span" sx={{ fontSize: 14, display: "block" }}>
        {votes.length === 0 ? (
          "No likes or flags yet."
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {summary(votes)}
            </Typography>
            <Stack spacing={0.5}>
              {shown.map((v) => (
                <Stack key={v.id} direction="row" spacing={1.5} alignItems="center" useFlexGap flexWrap="wrap">
                  <Chip
                    label={label(v)}
                    size="small"
                    color={v.type === "flag" ? "error" : "default"}
                    variant={v.type === "flag" ? "filled" : "outlined"}
                    sx={{ minWidth: 64 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {when(v.created_at)}
                  </Typography>
                  <Typography variant="body2" component="span">
                    {v.contact_name}
                    {v.contact_name && v.participant_id ? " · " : ""}
                    {v.participant_id ? <ParticipantLink id={v.participant_id} /> : !v.contact_name && `Session #${v.session_id}`}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            {votes.length > SHOWN && (
              <Button size="small" onClick={() => setAll((a) => !a)} sx={{ mt: 1, px: 0 }}>
                {all ? "Show fewer" : `Show all ${votes.length.toLocaleString()}`}
              </Button>
            )}
          </>
        )}
      </Box>
    </Labeled>
  );
};

export default ResponsesField;
