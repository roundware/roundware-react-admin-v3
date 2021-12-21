import {
  Box,
  Card,
  FormLabel,
  LinearProgress,
  Tab,
  Tabs,
  TextField,
} from "@material-ui/core";
import useFieldValue from "hooks/useFieldValue";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { useProjects } from "providers/ProjectsContext";
import React, { useEffect, useState } from "react";
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
  const [value, setValue] = useFieldValue<LocalizedString[]>(source);
  const [language_ids] = useFieldValue<number[]>(`language_ids`);

  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<ILanguage[]>([]);
  const { selectedProject } = useProjects();
  const dataProvider = useRoundwareDataProvider();
  useEffect(() => {
    console.log("fetching all languages");
    if (!fromProject && !selectedProject) return;
    console.log("yes");
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
        console.log(language_ids);
        const neededIds = fromProject
          ? language_ids
          : selectedProject?.language_ids || [];
        const thisProjectLanguages = res.data.filter((l) => {
          return neededIds.includes(Number(l.id));
        }) as ILanguage[];
        setLanguages(thisProjectLanguages);
        setSelectedLanguage(thisProjectLanguages?.[0]?.id);
      })
      .finally(() => setLoading(false));
  }, [selectedProject, language_ids]);
  const [selectedLanguage, setSelectedLanguage] = useState<number>(
    languages?.[0]?.id
  );

  if (loading) return <LinearProgress />;
  if (fromProject && !languages?.length)
    return (
      <TextField
        label={label}
        disabled
        variant="filled"
        helperText="Please add languages to this project to enable this field."
      />
    );

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

            const newLanguageObject: LocalizedString = {
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
