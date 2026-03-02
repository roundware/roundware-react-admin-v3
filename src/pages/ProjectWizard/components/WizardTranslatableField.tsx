// ---------------------------------------------------------------------------
// Tabbed translatable text field for the wizard (standalone, no form context)
// Matches the visual pattern of the admin's TranslatableField component.
// Tabs are draggable — drag a tab left to make it the default language.
// ---------------------------------------------------------------------------
import React, { useRef, useState } from "react";
import {
  Box,
  Card,
  FormLabel,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface LanguageOption {
  id: number;
  language_code: string;
  name: string;
}

interface WizardTranslatableFieldProps {
  label: string;
  /** The default (non-localized) value — used as the "primary" language tab */
  defaultValue: string;
  onDefaultChange: (value: string) => void;
  /** Localizations dict: { lang_code: { field: text } } */
  localizations: Record<string, Record<string, string | null>> | null;
  onLocalizationsChange: (
    loc: Record<string, Record<string, string | null>>
  ) => void;
  /** The backend field name for this localized field (e.g. "legal_agreement") */
  fieldName: string;
  /** Selected languages for this project (order determines default) */
  languages: LanguageOption[];
  /** Called when user drags tabs to reorder; updates language_ids in parent */
  onReorderLanguages?: (reordered: LanguageOption[]) => void;
  /** Optional: render multiline */
  multiline?: boolean;
  rows?: number;
  helperText?: string;
}

const WizardTranslatableField: React.FC<WizardTranslatableFieldProps> = ({
  label,
  defaultValue,
  onDefaultChange,
  localizations,
  onLocalizationsChange,
  fieldName,
  languages,
  onReorderLanguages,
  multiline = false,
  rows = 1,
  helperText,
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (languages.length === 0) {
    return (
      <TextField
        label={label}
        value={defaultValue}
        onChange={(e) => onDefaultChange(e.target.value)}
        fullWidth
        multiline={multiline}
        rows={rows}
        size="small"
        helperText={helperText || "Select languages first to enable translations."}
        disabled
      />
    );
  }

  // Tab 0 = "default" (primary language), tabs 1+ = additional languages
  const isDefault = selectedTab === 0;
  const currentLang = languages[selectedTab] as LanguageOption | undefined;

  const getLocValue = (): string => {
    if (isDefault) return defaultValue;
    if (!currentLang || !localizations) return "";
    return localizations[currentLang.language_code]?.[fieldName] ?? "";
  };

  const setLocValue = (text: string) => {
    if (isDefault) {
      onDefaultChange(text);
      return;
    }
    if (!currentLang) return;
    const updated = { ...(localizations ?? {}) };
    updated[currentLang.language_code] = {
      ...(updated[currentLang.language_code] ?? {}),
      [fieldName]: text || null,
    };
    onLocalizationsChange(updated);
  };

  // ---- Drag-and-drop handlers ----
  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    dragIndexRef.current = idx;
    e.dataTransfer.effectAllowed = "move";
    // Set some data so Firefox allows the drag
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndexRef.current !== null && dragIndexRef.current !== idx) {
      setDragOverIndex(idx);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (dropIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    const fromIdx = dragIndexRef.current;
    dragIndexRef.current = null;
    if (fromIdx === null || fromIdx === dropIdx || !onReorderLanguages) return;

    // Reorder: remove from old position, insert at new position
    const reordered = [...languages];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);

    // Keep the selected tab on the same language
    const currentLangId = languages[selectedTab]?.id;
    onReorderLanguages(reordered);
    if (currentLangId !== undefined) {
      const newIdx = reordered.findIndex((l) => l.id === currentLangId);
      if (newIdx >= 0) setSelectedTab(newIdx);
    }
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const canDrag = languages.length > 1 && !!onReorderLanguages;

  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <Box sx={{ px: 2, pt: 2 }}>
        <FormLabel>{label}</FormLabel>
      </Box>
      <Tabs
        value={selectedTab}
        onChange={(_, v) => setSelectedTab(v)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {languages.map((lang, idx) => (
          <Tab
            key={lang.id}
            draggable={canDrag}
            onDragStart={handleDragStart(idx)}
            onDragOver={handleDragOver(idx)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(idx)}
            onDragEnd={handleDragEnd}
            sx={{
              cursor: canDrag ? "grab" : undefined,
              borderBottom:
                dragOverIndex === idx ? "3px solid" : undefined,
              borderColor:
                dragOverIndex === idx ? "primary.main" : undefined,
              transition: "border-bottom 0.15s",
              minHeight: "auto",
              "& .MuiTab-iconWrapper": {
                mr: 0.5,
              },
            }}
            icon={canDrag ? <DragIndicatorIcon fontSize="small" sx={{ opacity: 0.4 }} /> : undefined}
            iconPosition="start"
            label={
              <Tooltip
                title={
                  canDrag
                    ? idx === 0
                      ? "Default language — drag tabs to reorder"
                      : "Drag to the left to make this the default"
                    : ""
                }
                placement="top"
              >
                <Typography variant="body2" component="span">
                  {idx === 0 ? `${lang.name} (Default)` : lang.name}
                </Typography>
              </Tooltip>
            }
          />
        ))}
      </Tabs>
      <Box sx={{ p: 2 }}>
        <TextField
          value={getLocValue()}
          onChange={(e) => setLocValue(e.target.value)}
          fullWidth
          multiline={multiline}
          rows={rows}
          variant="outlined"
          label={isDefault ? `${currentLang?.name ?? "Default"}` : currentLang?.name}
          helperText={
            isDefault
              ? helperText || "This is the default language for the project"
              : `Translation for ${currentLang?.name} (${currentLang?.language_code})`
          }
        />
      </Box>
    </Card>
  );
};

export default WizardTranslatableField;
