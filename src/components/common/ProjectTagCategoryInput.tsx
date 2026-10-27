import { Box, FormControlLabel, Switch, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { SelectInput } from "react-admin";
import { useWatch } from "react-hook-form";
import { useProjects } from "../../context/ProjectsContext";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";

interface Category {
  id: number;
  name: string;
}

const asList = <T,>(json: unknown): T[] =>
  (Array.isArray(json) ? json : (json as { results?: T[] })?.results ?? []) as T[];

interface Props {
  source: string;
  label?: string;
  required?: boolean;
  /** A list filter: only this project's categories, no switch — any other
   *  would filter its tags down to nothing. */
  filter?: boolean;
  /** For react-admin's filter bar. */
  alwaysOn?: boolean;
}

/**
 * The tag category picker, on the project being edited (2026-10-27). Tag
 * categories belong to the organization and are shared by its projects, so
 * the whole list was offered — every imported project's categories, in an
 * organization with many. Now: the categories this project's tags use, and
 * in a form, a switch for all of the organization's, to reuse one. A
 * project with no tags yet gets them all. New categories: Tag Categories.
 */
const ProjectTagCategoryInput: React.FC<Props> = ({ source, label = "Tag Category", required, filter }) => {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [used, setUsed] = useState<Set<number> | null>(null);
  const [showAll, setShowAll] = useState(false);
  const current = useWatch({ name: source }) as number | string | undefined | null;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    Promise.all([apiFetcher(`/tagcategories/`), apiFetcher(`/tags/?project_id=${projectId}`)])
      .then(([c, t]) => {
        if (cancelled) return;
        setCategories(asList<Category>(c.json).sort((a, b) => a.name.localeCompare(b.name)));
        setUsed(
          new Set(
            asList<{ tag_category_id: number | null }>(t.json)
              .map((x) => x.tag_category_id)
              .filter((x): x is number => x != null)
          )
        );
      })
      .catch(() => !cancelled && setUsed(new Set()));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const own = useMemo(
    () => categories.filter((c) => used?.has(c.id) || (current != null && c.id === Number(current))),
    [categories, used, current]
  );
  // Nothing of its own yet (a new project): everything, nothing to switch.
  const none = used !== null && used.size === 0;
  const all = !filter && (showAll || none);
  const choices = all ? categories : own;
  const others = categories.length - own.length;

  return (
    <Box sx={{ width: "100%" }}>
      <SelectInput
        source={source}
        label={label}
        choices={choices}
        optionText="name"
        optionValue="id"
        isLoading={used === null}
        required={required}
        fullWidth
      />
      {!filter && !none && others > 0 && (
        <FormControlLabel
          sx={{ mt: -1, mb: 1 }}
          control={<Switch size="small" checked={showAll} onChange={(_e, on) => setShowAll(on)} />}
          label={
            <Typography variant="body2" color="text.secondary">
              Show all of your organization’s categories ({others} more, shared with its other projects)
            </Typography>
          }
        />
      )}
    </Box>
  );
};

export default ProjectTagCategoryInput;
