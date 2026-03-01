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
}
const TranslatableField = ({
  source,
  label = "",
  fromProject,
}: Props): JSX.Element => {
  const [value, setValue] = useFieldValue<LocalizedString[]>(source, []);
  const [language_ids] = useFieldValue<number[]>(`language_ids`, []);

  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<ILanguage[]>([]);
  const { selectedProject } = useProjects();
  const dataProvider = useDataProvider();

  const dep = useMemo(
    () =>
      JSON.stringify(selectedProject?.language_ids) +
      JSON.stringify(language_ids),
    [selectedProject?.language_ids, language_ids]
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
        const neededIds =
          (fromProject ? language_ids : selectedProject?.language_ids) || [];
        const thisProjectLanguages = res.data.filter((l) => {
          return neededIds.includes(Number(l.id));
        }) as ILanguage[];
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
        {languages.map((l) => (
          <Tab key={l.id} value={l.id} label={l.name} />
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
            setValue(
              [...previousFilter, newLanguageObject].filter((t) => {
                if (t.id) {
                  return true;
                  // it text it being created but not text then filter out
                } else if (t?.text?.length < 1) {
                  return false;
                }
                return true;
              })
            );
          }}
          fullWidth
          label="Text"
        />
      </Box>
    </Card>
  );
};

export default TranslatableField;
