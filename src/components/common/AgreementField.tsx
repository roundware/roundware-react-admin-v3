// ---------------------------------------------------------------------------
// What a participant agreed to before contributing (2026-10-28): when, and
// the project's terms exactly as they were shown, in their language. For a
// contribution (assets) or a looping-mode loop (speakers). Server:
// core/agreement.py, GET /{resource}/{id}/agreement/.
// ---------------------------------------------------------------------------
import { Box, Button, Collapse, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Labeled, useRecordContext } from "react-admin";
import { apiFetcher } from "roundwareDataProvider/tokenAuthProvider";

interface Agreement {
  agreed_at: string | null;
  version: { id: number; language_code: string | null; first_agreed_at: string; text: string } | null;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });

const AgreementField: React.FC<{ resource: "assets" | "speakers" }> = ({ resource }) => {
  const record = useRecordContext<{ id: number }>();
  const [data, setData] = useState<Agreement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!record?.id) return;
    apiFetcher(`/${resource}/${record.id}/agreement/`)
      .then(({ json }) => setData(json as Agreement))
      .catch(() => setData(null));
  }, [record?.id, resource]);

  if (!data?.agreed_at) return null;
  return (
    <Labeled label="Agreed to the project's terms" fullWidth>
      <Box component="span" sx={{ fontSize: 14 }}>
        {when(data.agreed_at)}
        {data.version?.language_code ? ` (in ${data.version.language_code})` : ""}
        {data.version && (
          <>
            {" "}
            <Button size="small" onClick={() => setShow((s) => !s)} sx={{ ml: 1, py: 0 }}>
              {show ? "Hide the terms" : "Show the terms"}
            </Button>
            <Collapse in={show}>
              <Typography
                variant="body2"
                component="div"
                sx={{ whiteSpace: "pre-line", mt: 1, p: 1.5, bgcolor: "action.hover", borderRadius: 1, maxWidth: 720 }}
              >
                {data.version.text}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This version was first agreed to on {when(data.version.first_agreed_at)}.
              </Typography>
            </Collapse>
          </>
        )}
      </Box>
    </Labeled>
  );
};

export default AgreementField;
