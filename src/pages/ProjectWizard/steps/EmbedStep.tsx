// ---------------------------------------------------------------------------
// Optional step — the recorder on the author's own site (server docs/023)
// ---------------------------------------------------------------------------
// Offered by templates about collecting recordings (their optionalSteps).
// Only the first setup: the sites allowed to show it and its choices, kept on
// the project. The working code comes from Publish once the project is live,
// since the recorder is served from the live site's address.
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, FormControlLabel, Stack, Switch, Typography } from "@mui/material";

import { WizardState } from "../types";
import { WizardAction } from "../wizardReducer";
import StepInstruction from "../components/StepInstruction";
import { apiFetcher } from "../../../roundwareDataProvider/tokenAuthProvider";
import {
  EmbedLanguage,
  EmbedSitesField,
  RecorderOptionsFields,
  embedOptionsFor,
} from "../../Publish/RecorderOptions";

interface EmbedStepProps {
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}

const EmbedStep: React.FC<EmbedStepProps> = ({ state, dispatch }) => {
  const { embed, project } = state;
  const [allLanguages, setAllLanguages] = useState<EmbedLanguage[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiFetcher("/languages/")
      .then(({ json }) => {
        if (!cancelled) setAllLanguages(Array.isArray(json) ? json : json?.results ?? []);
      })
      .catch(() => {
        /* the language menu just offers the visitor's own */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const languages = useMemo(
    () => allLanguages.filter((l) => project.language_ids.includes(l.id)),
    [allLanguages, project.language_ids]
  );
  // Until changed, it follows the project's own settings (photos, tags…).
  const options = embed.options ?? embedOptionsFor(project);

  return (
    <Box>
      <StepInstruction title="Recording Embed">
        <Chip label="Optional" size="small" sx={{ mr: 1, mb: 0.5 }} />
        Put the recorder on your own web page — a contact page, say — so people can record
        without leaving it. This is only its first setup: the code to paste comes once the
        project is published, from the <strong>Recording embed</strong> card on Publish, where
        you can change all of this too.
      </StepInstruction>

      <FormControlLabel
        control={
          <Switch
            checked={embed.include}
            onChange={(e) => dispatch({ type: "UPDATE_EMBED", patch: { include: e.target.checked } })}
          />
        }
        label="Set up a recording embed now"
        sx={{ mb: 2 }}
      />

      {embed.include ? (
        <Stack spacing={2.5}>
          <EmbedSitesField
            sites={embed.sites}
            onChange={(sites) => dispatch({ type: "UPDATE_EMBED", patch: { sites } })}
            warnWhenEmpty={false}
          />
          {embed.sites.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
              Not sure yet? Leave it empty and add the site on Publish — browsers show the
              recorder only on the sites listed.
            </Typography>
          )}
          <RecorderOptionsFields
            value={options}
            onChange={(patch) => dispatch({ type: "UPDATE_EMBED_OPTIONS", options: { ...options, ...patch } })}
            languages={languages}
          />
          <Alert severity="info">
            Next, after creating the project: publish it, then copy the code from Publish's
            Recording embed card.
          </Alert>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Skipped — you can set up an embed any time from Publish.
        </Typography>
      )}
    </Box>
  );
};

export default EmbedStep;
