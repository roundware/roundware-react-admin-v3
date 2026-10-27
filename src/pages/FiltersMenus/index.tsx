// ---------------------------------------------------------------------------
// Filters & Menus — the questions contributors answer when they record
// (Speak) and the filters listeners can narrow by (Listen), with the app
// beside them showing the result.
//
// Underneath, each card is a "UI group" (one tag category, in one mode) and
// each tag in it a "UI item"; none of that vocabulary shows here. Edits save
// as they are made and the preview reloads a moment later, opened on the
// screen being edited.
//
// A Speak response can depend on an earlier answer (a UI item's parent_id):
// it shows only once that answer is chosen — Age range "Child", then only the
// kids' questions. Set with the button beside each response ("Show only
// after…"); the app's question steps and the embedded recorder honor it. It
// replaced the old "advanced editor" (removed 2026-10-27), whose tree had
// stopped rendering when MUI moved TreeView out of @mui/lab.
// ---------------------------------------------------------------------------
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CheckIcon from "@mui/icons-material/Check";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Grid,
  FormControlLabel,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Title } from "react-admin";
import { Link as RouterLink } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "../Publish/api";
import PreviewPanel from "../Publish/PreviewPanel";

type Mode = "speak" | "listen";

interface Item {
  id: number;
  tag_id: number;
  sort_index: number;
  is_active: boolean;
  parent_id: number | null;
  /** Selected by default: chosen already when the question or filter appears. */
  is_default: boolean;
}

interface Group {
  id: number;
  name: string;
  ui_mode: Mode;
  /** "multi": several answers allowed (Listen filters always are). */
  select_type: string;
  tag_category_id: number;
  sort_index: number;
  is_active: boolean;
  header_text: string;
  /** {language: {header_text}}; the default language's comes from the column. */
  localizations: Record<string, { header_text?: string | null }>;
  ui_items: Item[];
}

interface Tag {
  id: number;
  value: string;
  tag_category_id: number | null;
}

interface Category {
  id: number;
  name: string;
}

interface Lang {
  code: string;
  name: string;
}

const MODE_TEXT: Record<Mode, { intro: string; field: string; empty: string }> = {
  speak: {
    intro:
      "The questions contributors answer before they record — one screen each, in this order, picking one response per question (or several, where a question allows it).",
    field: "Question",
    empty: "Contributors aren’t asked anything before recording.",
  },
  listen: {
    intro:
      "What listeners can narrow the sound by, from the Filters button on the listening screen. They can choose as many as they like in each.",
    field: "Label",
    empty: "Listeners have no filters.",
  },
};

const asList = <T,>(json: unknown): T[] =>
  (Array.isArray(json) ? json : (json as { results?: T[] })?.results ?? []) as T[];

/** The app's listen sidebar filters, in the order it shows them. */
const SIDEBAR_FILTERS = ["date", "tags", "description"];

const byIndex = (a: { sort_index: number; id: number }, b: { sort_index: number; id: number }) =>
  a.sort_index - b.sort_index || a.id - b.id;

const FiltersMenusPage: React.FC = () => {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.id;

  const [groups, setGroups] = useState<Group[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Lang[]>([]);
  const [defaultCode, setDefaultCode] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("speak");
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  // The project's switch for asking the Speak questions at all
  // (allow_speak_tags): off, the app skips straight past them.
  const [askSpeak, setAskSpeak] = useState<boolean | null>(null);
  // Besides tags, the listen sidebar can filter by date and by words in the
  // description (the app's ui.listenSidebar.filter.available).
  const [listenFilters, setListenFilters] = useState<string[] | null>(null);
  const uiConfig = useRef<Record<string, any>>({});

  // Saves run one after another, so reorders and adds can't overtake each
  // other; the preview reloads once they settle.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const languageIds = selectedProject?.language_ids ?? [];
  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [g, t, c, l, p] = await Promise.all([
        apiFetcher(`/uigroups/?project_id=${projectId}&admin=1`),
        apiFetcher(`/tags/?project_id=${projectId}`),
        apiFetcher(`/tagcategories/`),
        apiFetcher(`/languages/`),
        apiFetcher(`/projects/${projectId}/`),
      ]);
      const all = asList<{ id: number; language_code: string; name: string }>(l.json);
      const langs = languageIds
        .map((id) => all.find((x) => x.id === Number(id)))
        .filter(Boolean)
        .map((x) => ({ code: x!.language_code, name: x!.name }));
      const def =
        all.find((x) => x.id === selectedProject?.default_language_id)?.language_code ??
        langs[0]?.code ??
        null;
      setGroups(asList<Group>(g.json).filter((x) => x.ui_mode === "speak" || x.ui_mode === "listen"));
      setTags(asList<Tag>(t.json));
      setCategories(asList<Category>(c.json));
      setAskSpeak(Boolean((p.json as { allow_speak_tags?: boolean }).allow_speak_tags));
      uiConfig.current = (p.json as { ui_config_json?: Record<string, any> }).ui_config_json ?? {};
      setListenFilters(uiConfig.current.ui?.listenSidebar?.filter?.available ?? SIDEBAR_FILTERS);
      setLanguages(langs);
      setDefaultCode(def);
      setLanguage((cur) => cur ?? def);
      setError(null);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [projectId, JSON.stringify(languageIds), selectedProject?.default_language_id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () => () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      Object.values(textTimers.current).forEach(clearTimeout);
    },
    []
  );

  const save = useCallback(
    (work: () => Promise<unknown>) => {
      setSaving((n) => n + 1);
      queue.current = queue.current
        .then(work)
        .catch((e) => {
          setError(errMessage(e));
          load(); // back to what the server has
        })
        .finally(() => {
          setSaving((n) => n - 1);
          if (previewTimer.current) clearTimeout(previewTimer.current);
          previewTimer.current = setTimeout(() => setRefreshKey((k) => k + 1), 500);
        });
    },
    [load]
  );

  const patchGroup = (id: number, body: Record<string, unknown>) =>
    apiFetcher(`/uigroups/${id}/`, { method: "PATCH", body: JSON.stringify(body) });
  const patchItem = (id: number, body: Record<string, unknown>) =>
    apiFetcher(`/uiitems/${id}/`, { method: "PATCH", body: JSON.stringify(body) });

  const updateGroup = (id: number, change: (g: Group) => Group) =>
    setGroups((gs) => gs.map((g) => (g.id === id ? change(g) : g)));

  // ---- what's shown ------------------------------------------------------

  const modeGroups = useMemo(
    () => groups.filter((g) => g.ui_mode === mode).sort(byIndex),
    [groups, mode]
  );
  // In the order they were made — the order a new question offers them in.
  const tagsOf = (categoryId: number) =>
    tags.filter((t) => t.tag_category_id === categoryId).sort((a, b) => a.id - b.id);
  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? "Untitled";
  // Categories this project has tags in, not yet asked or offered in this mode.
  const unused = useMemo(() => {
    const used = new Set(modeGroups.map((g) => g.tag_category_id));
    const withTags = new Set(tags.map((t) => t.tag_category_id).filter((x): x is number => x != null));
    return categories.filter((c) => withTags.has(c.id) && !used.has(c.id));
  }, [modeGroups, tags, categories]);

  const lang = language ?? defaultCode ?? "";
  const isDefault = !language || language === defaultCode;
  const textOf = (g: Group, code = lang) =>
    g.localizations?.[code]?.header_text ?? (code === defaultCode ? g.header_text : "") ?? "";

  // ---- edits ---------------------------------------------------------------

  const setText = (g: Group, text: string) => {
    const code = lang;
    updateGroup(g.id, (x) => ({
      ...x,
      header_text: code === defaultCode ? text : x.header_text,
      localizations: { ...x.localizations, [code]: { header_text: text } },
    }));
    const key = `${g.id}:${code}`;
    clearTimeout(textTimers.current[key]);
    textTimers.current[key] = setTimeout(() => {
      // Empty in another language clears the translation, so the default
      // language's shows; empty in the default language is kept.
      const sent = !text && code !== defaultCode ? null : text;
      save(() => patchGroup(g.id, { localizations: { [code]: { header_text: sent } } }));
    }, 700);
  };

  const setActive = (g: Group, on: boolean) => {
    updateGroup(g.id, (x) => ({ ...x, is_active: on }));
    save(() => patchGroup(g.id, { is_active: on }));
  };

  const setAsking = (on: boolean) => {
    setAskSpeak(on);
    save(() =>
      apiFetcher(`/projects/${projectId}/`, {
        method: "PATCH",
        body: JSON.stringify({ allow_speak_tags: on }),
      })
    );
  };

  const setListenFilter = (kind: string, on: boolean) => {
    const current = listenFilters ?? SIDEBAR_FILTERS;
    const next = SIDEBAR_FILTERS.filter((k) => (k === kind ? on : current.includes(k)));
    setListenFilters(next);
    // The whole settings document goes back, as the map editor sends it.
    const doc = structuredClone(uiConfig.current);
    doc.ui ??= {};
    doc.ui.listenSidebar ??= {};
    doc.ui.listenSidebar.filter ??= {};
    doc.ui.listenSidebar.filter.available = next;
    uiConfig.current = doc;
    save(() =>
      apiFetcher(`/projects/${projectId}/`, {
        method: "PATCH",
        body: JSON.stringify({ ui_config_json: doc }),
      })
    );
  };

  const reorderGroups = (from: number, to: number) => {
    const list = [...modeGroups];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    const changed = list
      .map((g, i) => ({ g, i }))
      .filter(({ g, i }) => g.sort_index !== i);
    setGroups((gs) =>
      gs.map((g) => {
        const i = list.findIndex((x) => x.id === g.id);
        return i >= 0 ? { ...g, sort_index: i } : g;
      })
    );
    save(() => Promise.all(changed.map(({ g, i }) => patchGroup(g.id, { sort_index: i }))));
  };

  const reorderItems = (g: Group, from: number, to: number) => {
    const shown = g.ui_items.filter((it) => it.is_active).sort(byIndex);
    const [moved] = shown.splice(from, 1);
    shown.splice(to, 0, moved);
    const changed = shown.map((it, i) => ({ it, i })).filter(({ it, i }) => it.sort_index !== i);
    updateGroup(g.id, (x) => ({
      ...x,
      ui_items: x.ui_items.map((it) => {
        const i = shown.findIndex((s) => s.id === it.id);
        return i >= 0 ? { ...it, sort_index: i } : it;
      }),
    }));
    save(() => Promise.all(changed.map(({ it, i }) => patchItem(it.id, { sort_index: i }))));
  };

  const showTag = (g: Group, tag: Tag) => {
    const end = Math.max(-1, ...g.ui_items.filter((i) => i.is_active).map((i) => i.sort_index)) + 1;
    const hidden = g.ui_items.find((i) => i.tag_id === tag.id);
    if (hidden) {
      updateGroup(g.id, (x) => ({
        ...x,
        ui_items: x.ui_items.map((i) => (i.id === hidden.id ? { ...i, is_active: true, sort_index: end } : i)),
      }));
      save(() => patchItem(hidden.id, { is_active: true, sort_index: end }));
      return;
    }
    save(async () => {
      const { json } = await apiFetcher(`/uiitems/`, {
        method: "POST",
        body: JSON.stringify({ ui_group_id: g.id, tag_id: tag.id, sort_index: end }),
      });
      updateGroup(g.id, (x) => ({ ...x, ui_items: [...x.ui_items, json as Item] }));
    });
  };

  // Selected by default. A question taking one answer has at most one.
  const setDefault = (g: Group, item: Item, on: boolean) => {
    const single = g.ui_mode === "speak" && g.select_type !== "multi";
    const others = single && on ? g.ui_items.filter((i) => i.is_default && i.id !== item.id) : [];
    updateGroup(g.id, (x) => ({
      ...x,
      ui_items: x.ui_items.map((i) =>
        i.id === item.id ? { ...i, is_default: on } : others.some((o) => o.id === i.id) ? { ...i, is_default: false } : i
      ),
    }));
    save(() =>
      Promise.all([
        patchItem(item.id, { is_default: on }),
        ...others.map((o) => patchItem(o.id, { is_default: false })),
      ])
    );
  };

  const setSeveral = (g: Group, several: boolean) => {
    updateGroup(g.id, (x) => ({ ...x, select_type: several ? "multi" : "single" }));
    save(() => patchGroup(g.id, { select_type: several ? "multi" : "single" }));
  };

  // ---- conditional responses (Speak) ----------------------------------------

  const allItems = groups.flatMap((g) => g.ui_items.map((i) => ({ group: g, item: i })));
  /** Responses that show only once one of these is chosen. Deleting their
   *  parent would delete them too (the database cascades), so they're
   *  released first: shown to everyone. */
  const dependentsOf = (ids: number[]) =>
    allItems.filter(({ item }) => item.parent_id != null && ids.includes(item.parent_id));
  const release = (deps: { group: Group; item: Item }[]) => {
    if (!deps.length) return Promise.resolve();
    setGroups((gs) =>
      gs.map((x) => ({
        ...x,
        ui_items: x.ui_items.map((i) => (deps.some((d) => d.item.id === i.id) ? { ...i, parent_id: null } : i)),
      }))
    );
    return Promise.all(deps.map((d) => patchItem(d.item.id, { parent_id: null })));
  };
  const dependentsNote = (deps: { group: Group; item: Item }[]) => {
    if (!deps.length) return "";
    const names = deps.map((d) => `“${tags.find((t) => t.id === d.item.tag_id)?.value ?? "?"}”`).join(", ");
    const one = deps.length === 1;
    return `\n\n${one ? "One response depends" : `${deps.length} responses depend`} on it (${names}); ${
      one ? "it" : "they"
    } will show to everyone.`;
  };

  const setParent = (g: Group, item: Item, parentId: number | null) => {
    updateGroup(g.id, (x) => ({
      ...x,
      ui_items: x.ui_items.map((i) => (i.id === item.id ? { ...i, parent_id: parentId } : i)),
    }));
    save(() => patchItem(item.id, { parent_id: parentId }));
  };

  const hideTag = (g: Group, item: Item) => {
    const deps = dependentsOf([item.id]);
    if (deps.length) {
      const name = tags.find((t) => t.id === item.tag_id)?.value ?? "this response";
      if (!window.confirm(`Untick “${name}”?${dependentsNote(deps)}`)) return;
    }
    updateGroup(g.id, (x) => ({ ...x, ui_items: x.ui_items.filter((i) => i.id !== item.id) }));
    save(async () => {
      await release(deps);
      await apiFetcher(`/uiitems/${item.id}/`, { method: "DELETE" });
    });
  };

  const addGroup = (category: Category) =>
    save(async () => {
      const end = Math.max(-1, ...modeGroups.map((g) => g.sort_index)) + 1;
      const { json } = await apiFetcher(`/uigroups/`, {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          name: category.name,
          tag_category_id: category.id,
          ui_mode: mode,
          select_type: mode === "listen" ? "multi" : "single",
          sort_index: end,
          is_active: true,
          header_text: "",
        }),
      });
      const group = { ...(json as Group), localizations: {}, ui_items: [] as Item[] };
      const items: Item[] = [];
      for (const [i, tag] of tagsOf(category.id).entries()) {
        const res = await apiFetcher(`/uiitems/`, {
          method: "POST",
          body: JSON.stringify({ ui_group_id: group.id, tag_id: tag.id, sort_index: i }),
        });
        items.push(res.json as Item);
      }
      setGroups((gs) => [...gs, { ...group, ui_items: items }]);
      setFocusedId(group.id);
    });

  const removeGroup = (g: Group) => {
    const what = mode === "speak" ? "question" : "filter";
    const deps = dependentsOf(g.ui_items.map((i) => i.id)).filter((d) => d.group.id !== g.id);
    const ask = `Remove the “${categoryName(g.tag_category_id)}” ${what}? Its tags are kept.${dependentsNote(deps)}`;
    if (!window.confirm(ask)) return;
    setGroups((gs) => gs.filter((x) => x.id !== g.id));
    save(async () => {
      await release(deps);
      await apiFetcher(`/uigroups/${g.id}/`, { method: "DELETE" });
    });
  };

  const onDragEnd = (r: DropResult) => {
    if (!r.destination || r.destination.index === r.source.index) return;
    if (r.type === "group") return reorderGroups(r.source.index, r.destination.index);
    const g = groups.find((x) => `items-${x.id}` === r.source.droppableId);
    if (g) reorderItems(g, r.source.index, r.destination.index);
  };

  // ---- the preview opens where the author is working ------------------------

  const activeSpeak = groups.filter((g) => g.ui_mode === "speak" && g.is_active).sort(byIndex);
  const focusedIndex = Math.max(0, activeSpeak.findIndex((g) => g.id === focusedId));
  // A question whose responses all depend on earlier answers has nothing to
  // show on its own, so the preview starts from the first question: answer
  // your way to it, as a contributor would.
  const focusedConditional = (activeSpeak[focusedIndex]?.ui_items ?? [])
    .filter((i) => i.is_active)
    .every((i) => i.parent_id != null);
  const startsEarlier = focusedIndex > 0 && focusedConditional;
  const focusedSpeak = startsEarlier ? 0 : focusedIndex;
  // With the questions switched off, the preview shows what contributors
  // get — recording skips past them — so it isn't held to them.
  const asking = mode === "speak" && askSpeak !== false && activeSpeak.length > 0;
  const previewPath = mode === "speak" ? (asking ? `/speak/tags/${focusedSpeak}` : "/speak") : "/listen";
  // The scope keeps the preview on these screens (the app's previewFocus.ts).
  const previewQuery = [
    lang && `lang=${encodeURIComponent(lang)}`,
    mode === "listen" && "rw_focus=filters",
    mode === "listen" ? "rw_scope=listen" : asking && "rw_scope=speak-tags",
  ]
    .filter(Boolean)
    .join("&");

  if (!selectedProject) {
    return (
      <Container sx={{ py: 4 }}>
        <Title title="Filters & Menus" />
        <Typography color="text.secondary">Select a project first.</Typography>
      </Container>
    );
  }

  const text = MODE_TEXT[mode];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Title title="Filters & Menus" />
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h4">Filters &amp; Menus</Typography>
        {saving > 0 && <CircularProgress size={18} />}
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        What contributors are asked about their recordings, and what listeners can filter by — both
        made from your tags. Changes save as you go; the preview shows them a moment later.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 1 }}>
            <Tabs value={mode} onChange={(_e, v) => setMode(v)}>
              {(["speak", "listen"] as Mode[]).map((m) => (
                <Tab
                  key={m}
                  value={m}
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{m === "speak" ? "Speak" : "Listen"}</span>
                      <Chip
                        size="small"
                        label={groups.filter((g) => g.ui_mode === m && g.is_active).length}
                      />
                    </Stack>
                  }
                />
              ))}
            </Tabs>
            {languages.length > 1 && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: { sm: "auto" } }}>
                <Typography variant="body2" color="text.secondary">
                  Text in
                </Typography>
                <ToggleButtonGroup size="small" exclusive value={lang} onChange={(_e, v) => v && setLanguage(v)}>
                  {languages.map((l) => (
                    <ToggleButton key={l.code} value={l.code} sx={{ px: 1.5 }}>
                      {l.name}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {text.intro} Drag to reorder.
          </Typography>
          {mode === "speak" && askSpeak !== null && (
            <Alert
              severity={askSpeak ? "success" : "warning"}
              sx={{ mb: 2, alignItems: "center" }}
              action={
                <Switch
                  checked={askSpeak}
                  onChange={(_e, on) => setAsking(on)}
                  slotProps={{ input: { "aria-label": "Ask contributors these questions" } }}
                />
              }
            >
              {askSpeak
                ? "Contributors are asked these questions before they record."
                : "Contributors aren’t asked these questions — recording skips straight past them. Switch on to ask them."}
            </Alert>
          )}

          {mode === "listen" && listenFilters !== null && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="subtitle2">Besides tags, listeners can filter by</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ sm: 3 }}>
                  {[
                    { kind: "date", label: "Date", help: "when it was recorded" },
                    { kind: "description", label: "Description", help: "words in it" },
                  ].map(({ kind, label, help }) => (
                    <Stack key={kind} direction="row" alignItems="center">
                      <Switch
                        checked={listenFilters.includes(kind)}
                        onChange={(_e, on) => setListenFilter(kind, on)}
                        slotProps={{ input: { "aria-label": `Let listeners filter by ${label.toLowerCase()}` } }}
                      />
                      <Typography variant="body2">
                        {label}{" "}
                        <Typography component="span" variant="body2" color="text.secondary">
                          ({help})
                        </Typography>
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <CircularProgress />
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="groups" type="group">
                {(drop) => (
                  <Stack spacing={2} ref={drop.innerRef} {...drop.droppableProps}>
                    {modeGroups.map((g, index) => (
                      <Draggable key={g.id} draggableId={`group-${g.id}`} index={index}>
                        {(drag) => (
                          <Box ref={drag.innerRef} {...drag.draggableProps}>
                            <GroupCard
                              group={g}
                              earlier={mode === "speak" ? modeGroups.slice(0, index) : []}
                              later={mode === "speak" ? modeGroups.slice(index + 1) : []}
                              tagName={(id) => tags.find((t) => t.id === id)?.value ?? `Tag ${id}`}
                              categoryName={categoryName}
                              onParent={(i, parentId) => setParent(g, i, parentId)}
                              firstListen={mode === "listen" && g.id === modeGroups.find((x) => x.is_active)?.id}
                              mode={mode}
                              category={categoryName(g.tag_category_id)}
                              tags={tagsOf(g.tag_category_id)}
                              text={textOf(g)}
                              fallback={isDefault ? "" : textOf(g, defaultCode ?? "")}
                              fieldLabel={text.field}
                              focused={g.id === focusedId}
                              dragHandle={drag.dragHandleProps}
                              onFocus={() => setFocusedId(g.id)}
                              onText={(t) => setText(g, t)}
                              onActive={(on) => setActive(g, on)}
                              onShowTag={(t) => showTag(g, t)}
                              onHideTag={(i) => hideTag(g, i)}
                              onDefault={(i, on) => setDefault(g, i, on)}
                              onSeveral={(on) => setSeveral(g, on)}
                              onRemove={() => removeGroup(g)}
                            />
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {drop.placeholder}
                  </Stack>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {!loading && modeGroups.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              {text.empty}
            </Typography>
          )}

          {!loading && unused.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                {mode === "speak" ? "Also ask about" : "Also let listeners filter by"}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {unused.map((c) => (
                  <Button key={c.id} size="small" variant="outlined" onClick={() => addGroup(c)}>
                    + {c.name}
                  </Button>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Each is one of your tag categories; its tags become the responses. Tags are edited under{" "}
                <Link component={RouterLink} to={`/project/${projectId}/tags`}>
                  Tags
                </Link>
                .
              </Typography>
            </Box>
          )}

          {mode === "speak" && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
              A response can appear only after a particular earlier response — say, the kids’ questions only
              for someone who answered “Child”. Use the{" "}
              <AccountTreeOutlinedIcon sx={{ fontSize: 16, verticalAlign: "text-bottom" }} /> button beside a
              response, from the second question on.
            </Typography>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ position: { md: "sticky" }, top: { md: 80 } }}>
            <CardContent>
              <PreviewPanel
                projectId={selectedProject.id}
                refreshKey={refreshKey}
                path={previewPath}
                query={previewQuery}
                title={mode === "speak" ? "Preview: recording" : "Preview: listening"}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {mode === "speak"
                  ? startsEarlier
                    ? "That question’s responses all depend on earlier answers, so the preview starts from the first question: answer your way to it, as a contributor would."
                    : "Shows the question you last worked on. Answering moves to the next question, as it would for a contributor; the preview stays on the questions."
                  : "Opens with the Filters panel showing, as listeners see it after pressing Filters."}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

interface CardProps {
  group: Group;
  /** The Speak questions before this one, in order: what a response can
   *  depend on. Empty for Listen, whose filters don't. */
  earlier: Group[];
  /** And after it: a response depending on one of theirs never shows. */
  later: Group[];
  tagName: (tagId: number) => string;
  categoryName: (categoryId: number) => string;
  onParent: (i: Item, parentId: number | null) => void;
  /** The first Listen filter that's on: its choices also set what plays at the start. */
  firstListen: boolean;
  mode: Mode;
  category: string;
  tags: Tag[];
  text: string;
  fallback: string;
  fieldLabel: string;
  focused: boolean;
  dragHandle: React.HTMLAttributes<HTMLElement> | null | undefined;
  onFocus: () => void;
  onText: (t: string) => void;
  onActive: (on: boolean) => void;
  onShowTag: (t: Tag) => void;
  onHideTag: (i: Item) => void;
  onDefault: (i: Item, on: boolean) => void;
  onSeveral: (on: boolean) => void;
  onRemove: () => void;
}

const GroupCard: React.FC<CardProps> = (p) => {
  const { group: g } = p;
  const shown = g.ui_items.filter((i) => i.is_active).sort(byIndex);
  const shownTagIds = new Set(shown.map((i) => i.tag_id));
  const notShown = p.tags.filter((t) => !shownTagIds.has(t.id));
  const tagName = p.tagName;
  // "Show only after…": which response's menu is open.
  const [menu, setMenu] = useState<{ item: Item; anchor: HTMLElement } | null>(null);
  const findParent = (id: number) => {
    for (const q of [...p.earlier, ...p.later]) {
      const it = q.ui_items.find((i) => i.id === id);
      if (it) return { group: q, item: it, before: p.earlier.includes(q) };
    }
    return null;
  };
  /** Under a conditional response: what it waits for, or why it can't show. */
  const condition = (item: Item): { text: string; problem: boolean } | null => {
    if (item.parent_id == null) return null;
    const found = findParent(item.parent_id);
    if (!found) return null;
    const what = `“${tagName(found.item.tag_id)}” (${p.categoryName(found.group.tag_category_id)})`;
    if (!found.before)
      return { text: `Only after ${what} — but that’s asked later. Move it above this question.`, problem: true };
    if (!found.group.is_active || !found.item.is_active)
      return { text: `Only after ${what}, which isn’t shown, so this never shows.`, problem: true };
    return { text: `Only after ${what}`, problem: false };
  };
  const allConditional = shown.length > 0 && shown.every((i) => i.parent_id != null);

  return (
    <Card
      variant="outlined"
      onFocusCapture={p.onFocus}
      onClick={p.onFocus}
      sx={{
        borderColor: p.focused ? "primary.main" : undefined,
        borderWidth: p.focused ? 2 : 1,
        opacity: g.is_active ? 1 : 0.6,
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box {...p.dragHandle} sx={{ display: "flex", color: "text.secondary", cursor: "grab" }} aria-label="Drag to reorder">
            <DragIndicatorIcon />
          </Box>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {p.category}
          </Typography>
          <Tooltip title={g.is_active ? "Shown to participants" : "Hidden from participants"}>
            <Switch
              checked={g.is_active}
              onChange={(_e, on) => p.onActive(on)}
              slotProps={{ input: { "aria-label": `Show ${p.category} to participants` } }}
            />
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton size="small" onClick={p.onRemove} aria-label={`Remove ${p.category}`}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <TextField
          label={p.fieldLabel}
          value={p.text}
          onChange={(e) => p.onText(e.target.value)}
          placeholder={p.fallback || undefined}
          InputLabelProps={p.fallback ? { shrink: true } : undefined}
          error={!p.text && !p.fallback}
          helperText={
            p.fallback && !p.text
              ? "Not translated: participants see the default language’s, shown in grey."
              : !p.text
              ? p.mode === "speak"
                ? "Empty: contributors see no question."
                : "Empty: the filter has no label."
              : undefined
          }
          fullWidth
          size="small"
          sx={{ mt: 1.5 }}
        />

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, mb: 0.5 }}>
          <Typography variant="subtitle2">{p.mode === "speak" ? "Responses" : "Choices"}</Typography>
          {p.mode === "speak" && (
            <FormControlLabel
              control={
                <Switch size="small" checked={g.select_type === "multi"} onChange={(_e, on) => p.onSeveral(on)} />
              }
              label={<Typography variant="body2">Allow several answers</Typography>}
              sx={{ mr: 0 }}
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {p.mode === "speak"
            ? g.select_type === "multi"
              ? "Contributors choose one or more, then press Next. Starred responses start chosen."
              : "Contributors choose one and move on. A starred response starts chosen; they can press Next to keep it."
            : "Starred choices start selected, so they’re what plays before listeners choose anything."}
          {p.firstListen &&
            " With none starred in any filter, what plays first is recordings with at least one of this filter’s choices — untick one, and recordings with only that tag won’t play."}
        </Typography>
        {allConditional && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Every response here depends on an earlier one: contributors whose earlier answers match none of
            them skip this question.
          </Typography>
        )}
        <>
            <Droppable droppableId={`items-${g.id}`} type={`items-${g.id}`}>
              {(drop) => (
                <Box ref={drop.innerRef} {...drop.droppableProps}>
                  {shown.map((item, index) => (
                    <Draggable key={item.id} draggableId={`item-${item.id}`} index={index}>
                      {(drag) => (
                        <Stack
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          direction="row"
                          alignItems="center"
                          sx={{ py: 0.25, bgcolor: "background.paper" }}
                        >
                          <Box {...drag.dragHandleProps} sx={{ display: "flex", color: "text.disabled", cursor: "grab" }}>
                            <DragIndicatorIcon fontSize="small" />
                          </Box>
                          <Checkbox
                            size="small"
                            checked
                            onChange={() => p.onHideTag(item)}
                            slotProps={{ input: { "aria-label": tagName(item.tag_id) } }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2">{tagName(item.tag_id)}</Typography>
                            {condition(item) && (
                              <Typography
                                variant="caption"
                                color={condition(item)!.problem ? "error" : "primary"}
                                sx={{ display: "block" }}
                              >
                                {condition(item)!.text}
                              </Typography>
                            )}
                          </Box>
                          {p.earlier.length > 0 && (
                            <Tooltip
                              title={item.parent_id != null ? "Shown only after an earlier response" : "Show only after…"}
                            >
                              <IconButton
                                size="small"
                                onClick={(e) => setMenu({ item, anchor: e.currentTarget })}
                                aria-label={`${tagName(item.tag_id)}: show only after an earlier response`}
                                aria-haspopup="menu"
                              >
                                <AccountTreeOutlinedIcon
                                  fontSize="small"
                                  sx={{ color: item.parent_id != null ? "primary.main" : "text.disabled" }}
                                />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={item.is_default ? "Selected by default" : "Select by default"}>
                            <IconButton
                              size="small"
                              onClick={() => p.onDefault(item, !item.is_default)}
                              aria-label={`${tagName(item.tag_id)}: selected by default`}
                              aria-pressed={item.is_default}
                            >
                              {item.is_default ? (
                                <StarIcon fontSize="small" color="primary" />
                              ) : (
                                <StarBorderIcon fontSize="small" sx={{ color: "text.disabled" }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </Draggable>
                  ))}
                  {drop.placeholder}
                </Box>
              )}
            </Droppable>
            {notShown.map((t) => (
              <Stack key={t.id} direction="row" alignItems="center" sx={{ py: 0.25, pl: 2.5 }}>
                <Checkbox
                  size="small"
                  checked={false}
                  onChange={() => p.onShowTag(t)}
                  slotProps={{ input: { "aria-label": t.value } }}
                />
                <Typography variant="body2" color="text.secondary">
                  {t.value}
                </Typography>
              </Stack>
            ))}
            {shown.length === 0 && (
              <Typography variant="caption" color="error">
                No {p.mode === "speak" ? "responses" : "choices"} ticked — participants will see an empty{" "}
                {p.mode === "speak" ? "question" : "filter"}.
              </Typography>
            )}
        </>
        <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
          <MenuItem
            selected={menu?.item.parent_id == null}
            onClick={() => {
              if (menu) p.onParent(menu.item, null);
              setMenu(null);
            }}
          >
            <ListItemIcon>{menu?.item.parent_id == null && <CheckIcon fontSize="small" />}</ListItemIcon>
            <ListItemText primary="Always" secondary="Whatever was answered before" />
          </MenuItem>
          {p.earlier.flatMap((q) => {
            const answers = q.ui_items.filter((i) => i.is_active).sort(byIndex);
            if (!answers.length) return [];
            return [
              <ListSubheader key={`h-${q.id}`} sx={{ lineHeight: "32px" }}>
                Only after this answer to {p.categoryName(q.tag_category_id)}
              </ListSubheader>,
              ...answers.map((a) => (
                <MenuItem
                  key={a.id}
                  selected={menu?.item.parent_id === a.id}
                  onClick={() => {
                    if (menu) p.onParent(menu.item, a.id);
                    setMenu(null);
                  }}
                >
                  <ListItemIcon>{menu?.item.parent_id === a.id && <CheckIcon fontSize="small" />}</ListItemIcon>
                  <ListItemText primary={tagName(a.tag_id)} />
                </MenuItem>
              )),
            ];
          })}
        </Menu>
      </CardContent>
    </Card>
  );
};

export default FiltersMenusPage;
