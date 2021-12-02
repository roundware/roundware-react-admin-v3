import {
  Box,
  Card,
  LinearProgress,
  Tab,
  Tabs,
  TextField,
  FormLabel,
  CardContent,
} from "@material-ui/core";
import useFieldValue from "hooks/useFieldValue";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { useProjects } from "providers/ProjectsContext";
import React, { useEffect, useState } from "react";
import { ILanguage, LocalizedString } from "types";

interface Props {
  source: string;
  label?: string;
}
const TranslatableField = ({ source, label = "" }: Props): JSX.Element => {
  const [value, setValue] = useFieldValue(source);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<ILanguage[]>([]);
  const { selectedProject } = useProjects();
  const dataProvider = useRoundwareDataProvider();
  useEffect(() => {
    if (!selectedProject) return;
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
        const thisProjectLanguages = res.data.filter((l) =>
          selectedProject.language_ids.includes(Number(l.id))
        ) as ILanguage[];
        setLanguages(thisProjectLanguages);
        setSelectedLanguage(thisProjectLanguages?.[0]?.id);
      })
      .finally(() => setLoading(false));
  }, [selectedProject]);
  const [selectedLanguage, setSelectedLanguage] = useState<number>(
    languages?.[0]?.id
  );

  if (loading) return <LinearProgress />;
  return (
    <Card variant="outlined" style={{ marginBottom: 16 }}>
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
            value &&
            value?.find?.(
              (h: LocalizedString) => h.language_id == selectedLanguage
            )?.text
          }
          variant="outlined"
          onChange={(e) => {
            const newText = e.target.value;

            const previousFilter = [...value].filter(
              (h: LocalizedString) => h.language_id !== selectedLanguage
            );

            const newLanguageObject = {
              ...[...value].find(
                (h: LocalizedString) => h.language_id == selectedLanguage
              ),
              language_id: selectedLanguage,
              text: newText,
            };
            setValue([...previousFilter, newLanguageObject]);
          }}
          fullWidth
          label="Text"
        />
      </Box>
    </Card>
  );
};

export default TranslatableField;
