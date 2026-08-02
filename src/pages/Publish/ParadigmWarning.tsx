import React, { useEffect, useState } from "react";
import { Alert, AlertTitle, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { IProject } from "../../context/ProjectsContext";

/**
 * Warns when a looping project has no base loop.
 *
 * In the looping paradigm a contribution becomes a *speaker* joining a
 * continuous mix, so the project needs at least one active speaker carrying
 * audio before anyone can take part — the first participant has nothing to sync
 * against otherwise.
 *
 * This warns rather than blocks, deliberately. Publishing a broken project
 * harms only that project, so it is not a trust boundary and the server stays
 * out of it (roundware-server-v3/docs/009-configuration.md §7 decision 6).
 */

interface Props {
  project: IProject;
}

interface Speaker {
  id: number;
  is_active: boolean;
  uri: string | null;
}

function isLooping(project: IProject): boolean {
  return (
    project.ui_config_json?.speak?.uploadAsSpeaker === true ||
    project.recording_method === "looping"
  );
}

const ParadigmWarning: React.FC<Props> = ({ project }) => {
  const [speakers, setSpeakers] = useState<Speaker[] | null>(null);
  const looping = isLooping(project);

  useEffect(() => {
    if (!looping) return;
    let cancelled = false;
    apiFetcher(`/speakers/?project_id=${project.id}`)
      .then(({ json }) => {
        if (cancelled) return;
        const list = Array.isArray(json) ? json : json?.results ?? [];
        setSpeakers(list as Speaker[]);
      })
      .catch(() => !cancelled && setSpeakers([]));
    return () => {
      cancelled = true;
    };
  }, [looping, project.id]);

  if (!looping || speakers === null) return null;

  const playable = speakers.filter((s) => s.is_active && s.uri);
  if (playable.length > 0) return null;

  const inactiveWithAudio = speakers.filter((s) => !s.is_active && s.uri).length;

  return (
    <Alert severity="warning" sx={{ mb: 3 }}>
      <AlertTitle>This project has no base loop yet</AlertTitle>
      It is set up for looping recording, where each contribution joins a shared
      continuous mix. Participants need at least one active speaker with audio to
      record against — without one, the app will load but there will be nothing
      to hear or sing along to.
      {inactiveWithAudio > 0 && (
        <>
          {" "}
          You have {inactiveWithAudio} speaker
          {inactiveWithAudio === 1 ? "" : "s"} with audio that {inactiveWithAudio === 1 ? "is" : "are"}{" "}
          not active — activating one may be all you need.
        </>
      )}{" "}
      <Link component={RouterLink} to={`/project/${project.id}/speakers`}>
        Manage speakers
      </Link>
      . You can publish anyway; this is only a warning.
    </Alert>
  );
};

export default ParadigmWarning;
