import {
  Box,
  Card,
  FormLabel,
  LinearProgress,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import useFieldValue from "hooks/useFieldValue";
import { useProjects } from "context/ProjectsContext";
import React, { useEffect, useMemo, useState } from "react";
import { useDataProvider } from "react-admin";
import { ILanguage, LocalizedString } from "types";

interface Props {
  source: string;
  label?: string;
  fromProject?: boolean;
  /** Several lines (descriptions, agreements, messages). */
  multiline?: boolean;
  helperText?: string;
}

/**
 * One text in each of the project's languages, a tab per language.
 *
 * The first tab is the project's default language: the server lists the
 * project's languages default first, and keeps the default language's text
 * in the field itself, other languages as translations (server docs/017). A
 * language left empty falls back to the default language for participants.
 */
const TranslatableField = ({
  source,
  label = "",
  fromProject,
  multiline,
  helperText,
}: Props): JSX.Element => {
  const [value, setValue] = useFieldValue<LocalizedString[]>(source, []);
  const [language_ids] = useFieldValue<number[]>(`language_ids`, []);
  // On the project form, the default being chosen there leads.
  const [formDefaultId] = useFieldValue<number | null>(`default_language_id`, null);

  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<ILanguage[]>([]);
  const { selectedProject } = useProjects();
  const dataProvider = useDataProvider();

  const dep = useMemo(
    () =>
      JSON.stringify(selectedProject?.language_ids) +
      JSON.stringify(language_ids) +
      String(fromProject ? formDefaultId : ""),
    [selectedProject?.language_ids, language_ids, formDefaultId, fromProject]
  );
  useEffect(() => {
    if (!fromProject && !selectedProject) return;

    setLoading(true);

    /** fetch all languages  */
    dataProvider
      .getList(`languages`, {
        filter: {},
        sort: {
          field: "id",
          order: "ASC",
        },
        pagination: {
          perPage: 0,
          page: 0,
        },
      })
      .then((res) => {
        let neededIds: number[] =
          ((fromProject ? language_ids : selectedProject?.language_ids) || []).map(Number);
        if (fromProject && formDefaultId && neededIds.includes(Number(formDefaultId))) {
          neededIds = [Number(formDefaultId), ...neededIds.filter((id) => id !== Number(formDefaultId))];
        }
        // In the project's order — its default language first.
        const thisProjectLanguages = neededIds
          .map((id) => res.data.find((l) => Number(l.id) === id))
          .filter(Boolean) as ILanguage[];
        setLanguages(thisProjectLanguages);
        setSelectedLanguage(thisProjectLanguages?.[0]?.id);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dep]);
  const [selectedLanguage, setSelectedLanguage] = useState<number>(
    languages?.[0]?.id
  );

  if (loading) return <LinearProgress />;
  if (fromProject && !languages?.length)
    return (
      <TextField
        label={label}
        disabled
        variant="outlined"
        fullWidth
        helperText="Please add languages to this project to enable this field."
      />
    );

  return (
    <Card variant="outlined" style={{ marginBottom: 16, width: "100%" }}>
      <Box p={2}>
        <FormLabel>{label}</FormLabel>
      </Box>
      <Tabs
        value={selectedLanguage}
        onChange={(_e, v) => setSelectedLanguage(Number(v))}
      >
        {languages.map((l, i) => (
          <Tab key={l.id} value={l.id} label={i === 0 && languages.length > 1 ? `${l.name} (default)` : l.name} />
        ))}
      </Tabs>
      <Box p={2}>
        <TextField
          value={
            Array.isArray(value)
              ? value?.find?.(
                  (h: LocalizedString) => h.language_id == selectedLanguage
                )?.text || ""
              : ""
          }
          variant="outlined"
          onChange={(e) => {
            const newText = e.target.value;

            const previousFilter = [...value].filter(
              (h: LocalizedString) => h.language_id !== selectedLanguage
            );

            const lang = languages.find((l) => l.id === selectedLanguage);
            const newLanguageObject: LocalizedString = {
              ...[...value].find(
                (h: LocalizedString) => h.language_id == selectedLanguage
              ),
              language_id: selectedLanguage,
              language_code: lang?.language_code,
              text: newText,
            };
            // Every touched language is kept, empty or not: empty is sent as
            // null, which clears it. (Empty new entries used to be dropped,
            // so clearing the default language's text never saved — its
            // entry has no row id; it is the field itself.)
            setValue([...previousFilter, newLanguageObject]);
          }}
          fullWidth
          multiline={multiline}
          minRows={multiline ? 2 : undefined}
          label={languages.find((l) => l.id === selectedLanguage)?.name ?? "Text"}
          helperText={
            helperText ??
            (languages.length > 1 && selectedLanguage !== languages[0]?.id
              ? `Left empty, participants see the ${languages[0]?.name} text.`
              : undefined)
          }
        />
      </Box>
    </Card>
  );
};

export default TranslatableField;
