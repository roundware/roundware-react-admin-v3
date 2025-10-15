import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import {
    Box,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { UseInputValue, useGetList, useInput } from 'react-admin';

type IdType = string | number;

export type DualListReferenceInputProps = {
  source: string;
  reference: string;
  label?: string;
  optionText?: string | ((record: any) => string);
  optionValue?: string;
  filter?: Record<string, unknown>;
  perPage?: number;
  disabled?: boolean;
};

function getOptionLabel(record: any, optionText?: DualListReferenceInputProps['optionText']): string {
  if (!record) return '';
  if (typeof optionText === 'function') return optionText(record);
  if (typeof optionText === 'string') return record?.[optionText] ?? '';
  return record?.name ?? record?.title ?? String(record?.id ?? '');
}

export default function DualListReferenceInput(props: DualListReferenceInputProps): JSX.Element {
  const {
    source,
    reference,
    label,
    optionText,
    optionValue = 'id',
    filter,
    perPage = 10000,
    disabled,
  } = props;

  const {
    field,
    fieldState,
    isRequired,
  }: UseInputValue<IdType[]> = useInput<IdType[]>({ source });

  const currentIds: IdType[] = Array.isArray(field.value) ? field.value : [];

  const { data: records, isLoading, refetch } = useGetList<any>(reference, {
    pagination: { page: 1, perPage },
    sort: { field: optionText && typeof optionText === 'string' ? optionText : 'id', order: 'ASC' },
    filter: filter || {},
  });

  useEffect(() => {
    // keep data fresh when filter changes
    void refetch();
  }, [JSON.stringify(filter)]);

  const [availableSearch, setAvailableSearch] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');

  const all = records || [];
  const selectedRecords = useMemo(() => {
    const idSet = new Set(currentIds);
    return all.filter((r) => idSet.has(r?.[optionValue] as IdType));
  }, [all, currentIds, optionValue]);

  const availableRecords = useMemo(() => {
    const idSet = new Set(currentIds);
    return all.filter((r) => !idSet.has(r?.[optionValue] as IdType));
  }, [all, currentIds, optionValue]);

  const filteredAvailable = useMemo(() => {
    const q = availableSearch.trim().toLowerCase();
    if (!q) return availableRecords;
    return availableRecords.filter((r) => getOptionLabel(r, optionText).toLowerCase().includes(q));
  }, [availableRecords, availableSearch, optionText]);

  const filteredSelected = useMemo(() => {
    const q = selectedSearch.trim().toLowerCase();
    if (!q) return selectedRecords;
    return selectedRecords.filter((r) => getOptionLabel(r, optionText).toLowerCase().includes(q));
  }, [selectedRecords, selectedSearch, optionText]);

  const [availableChecked, setAvailableChecked] = useState<Set<IdType>>(new Set());
  const [selectedChecked, setSelectedChecked] = useState<Set<IdType>>(new Set());

  const toggleAvailable = (id: IdType) => {
    setAvailableChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelected = (id: IdType) => {
    setSelectedChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const moveToSelected = () => {
    if (availableChecked.size === 0) return;
    const idsToAdd = all
      .filter((r) => availableChecked.has(r?.[optionValue] as IdType))
      .map((r) => r?.[optionValue] as IdType);
    const next = Array.from(new Set([...(currentIds || []), ...idsToAdd]));
    field.onChange(next);
    setAvailableChecked(new Set());
  };

  const moveToAvailable = () => {
    if (selectedChecked.size === 0) return;
    const idsToRemove = new Set(selectedChecked);
    const next = (currentIds || []).filter((id) => !idsToRemove.has(id));
    field.onChange(next);
    setSelectedChecked(new Set());
  };

  const moveAllToSelected = () => {
    const idsToAdd = availableRecords.map((r) => r?.[optionValue] as IdType);
    const next = Array.from(new Set([...(currentIds || []), ...idsToAdd]));
    field.onChange(next);
    setAvailableChecked(new Set());
  };

  const moveAllToAvailable = () => {
    field.onChange([]);
    setSelectedChecked(new Set());
  };

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          {label}
          {isRequired ? ' *' : ''}
        </Typography>
      )}
      <Grid container spacing={2} alignItems='stretch'>
        <Grid item xs={5}>
          <Stack spacing={1} sx={{ height: '100%' }}>
            <TextField
              size='small'
              placeholder='Search available'
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              disabled={disabled || isLoading}
            />
            <List dense disablePadding sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'auto', minHeight: 200, maxHeight: 300 }}>
              {filteredAvailable.map((r) => {
                const id = r?.[optionValue] as IdType;
                const checked = availableChecked.has(id);
                return (
                  <ListItem key={String(id)} disablePadding>
                    <ListItemButton onClick={() => toggleAvailable(id)} selected={checked} disabled={disabled || isLoading}>
                      <ListItemText primary={getOptionLabel(r, optionText)} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Stack>
        </Grid>
        <Grid item xs={2}>
          <Stack alignItems='center' justifyContent='center' spacing={1} sx={{ height: '100%' }}>
            <IconButton aria-label='Add selected' onClick={moveToSelected} disabled={disabled || isLoading || availableChecked.size === 0}>
              <ArrowForwardIcon />
            </IconButton>
            <IconButton aria-label='Add all' onClick={moveAllToSelected} disabled={disabled || isLoading || availableRecords.length === 0}>
              <KeyboardDoubleArrowRightIcon />
            </IconButton>
            <IconButton aria-label='Remove selected' onClick={moveToAvailable} disabled={disabled || isLoading || selectedChecked.size === 0}>
              <ArrowBackIcon />
            </IconButton>
            <IconButton aria-label='Remove all' onClick={moveAllToAvailable} disabled={disabled || isLoading || (currentIds || []).length === 0}>
              <KeyboardDoubleArrowLeftIcon />
            </IconButton>
          </Stack>
        </Grid>
        <Grid item xs={5}>
          <Stack spacing={1} sx={{ height: '100%' }}>
            <TextField
              size='small'
              placeholder='Search selected'
              value={selectedSearch}
              onChange={(e) => setSelectedSearch(e.target.value)}
              disabled={disabled || isLoading}
            />
            <List dense disablePadding sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'auto', minHeight: 200, maxHeight: 300 }}>
              {filteredSelected.map((r) => {
                const id = r?.[optionValue] as IdType;
                const checked = selectedChecked.has(id);
                return (
                  <ListItem key={String(id)} disablePadding>
                    <ListItemButton onClick={() => toggleSelected(id)} selected={checked} disabled={disabled || isLoading}>
                      <ListItemText primary={getOptionLabel(r, optionText)} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Stack>
        </Grid>
      </Grid>
      {fieldState?.error && (
        <Typography variant='caption' color='error'>
          {fieldState.error.message}
        </Typography>
      )}
      {/* Keep a hidden input so react-hook-form registers the field */}
      <input type='hidden' name={field.name} value={(currentIds || []).join(',')} readOnly />
    </Box>
  );
}


