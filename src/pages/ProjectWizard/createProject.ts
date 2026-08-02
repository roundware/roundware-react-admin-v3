// ---------------------------------------------------------------------------
// Project Setup Wizard — Sequential API call orchestrator
// ---------------------------------------------------------------------------
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { CreationStep, TempId, WizardState } from "./types";
import { getTemplate, SCRATCH_CONFIG } from "./templates";

type ProgressCallback = (steps: CreationStep[]) => void;

interface IdMap {
  [tempId: string]: number;
}

function post(url: string, body: Record<string, unknown>) {
  return apiFetcher(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: new Headers({ "Content-Type": "application/json" }),
  });
}

/**
 * Execute all API calls to create the project and its associated resources.
 * Calls `onProgress` after each step so the UI can update.
 * Returns the newly created project's ID on success.
 */
export async function executeCreation(
  state: WizardState,
  onProgress: ProgressCallback
): Promise<number> {
  const steps: CreationStep[] = [
    { label: "Creating project...", status: "pending" },
    { label: "Creating audiotrack...", status: "pending" },
    { label: "Creating tag categories...", status: "pending" },
    { label: "Creating tags...", status: "pending" },
    { label: "Creating UI groups...", status: "pending" },
    { label: "Creating UI items...", status: "pending" },
  ];

  if (!state.skipSpeakers && state.speakers.length > 0) {
    steps.push({ label: "Creating speakers...", status: "pending" });
  }

  const update = (index: number, patch: Partial<CreationStep>) => {
    steps[index] = { ...steps[index], ...patch };
    onProgress([...steps]);
  };

  const catIdMap: IdMap = {};
  const tagIdMap: IdMap = {};
  const groupIdMap: IdMap = {};

  let stepIdx = 0;

  // 1. Create project
  update(stepIdx, { status: "in_progress" });
  let projectId: number;
  try {
    const projectBody: Record<string, unknown> = {
      name: state.project.name,
      description: state.project.description,
      latitude: state.project.latitude,
      longitude: state.project.longitude,
      language_ids: state.project.language_ids,
      audio_format: state.project.audio_format,
      max_recording_length_sec: state.project.max_recording_length_sec,
      auto_submit: state.project.auto_submit,
      listen_enabled: state.project.listen_enabled,
      geo_listen_enabled: state.project.geo_listen_enabled,
      speak_enabled: state.project.speak_enabled,
      geo_speak_enabled: state.project.geo_speak_enabled,
      recording_radius: state.project.recording_radius,
      out_of_range_distance: state.project.out_of_range_distance,
      repeat_mode: state.project.repeat_mode,
      ordering: state.project.ordering,
      recording_method: state.project.recording_method,
      sharing_url: state.project.sharing_url,
      legal_agreement: state.project.legal_agreement,
    };
    if (state.project.localizations) {
      projectBody.localizations = state.project.localizations;
    }
    // Seed ui_config_json from the chosen template. Read from the template
    // rather than wizard state because the wizard has no config step — the
    // document is applied once at creation and edited afterwards in the
    // project's Advanced configuration panel.
    const template = state.templateKey ? getTemplate(state.templateKey) : undefined;
    const seed = template?.config ?? SCRATCH_CONFIG;
    if (Object.keys(seed).length > 0) {
      projectBody.ui_config_json = seed;
    }
    const { json } = await post("/projects/", projectBody);
    projectId = json.id;
    update(stepIdx, { status: "completed" });
  } catch (e) {
    update(stepIdx, { status: "error", error: String(e) });
    throw e;
  }

  // 2. Create audiotrack
  stepIdx++;
  update(stepIdx, { status: "in_progress" });
  try {
    await post("/audiotracks/", {
      project_id: projectId,
      ...state.audiotrack,
    });
    update(stepIdx, { status: "completed" });
  } catch (e) {
    update(stepIdx, { status: "error", error: String(e) });
    throw e;
  }

  // 3. Create tag categories (reuse existing ones by name)
  stepIdx++;
  update(stepIdx, { status: "in_progress" });
  try {
    // Fetch existing tag categories for this tenant
    const { json: existingCats } = await apiFetcher("/tagcategories/");
    const existingByName: Record<string, number> = {};
    const catList = Array.isArray(existingCats)
      ? existingCats
      : existingCats?.results ?? existingCats?.data ?? [];
    for (const ec of catList) {
      if (ec.name && ec.id) {
        existingByName[ec.name.toLowerCase()] = ec.id;
      }
    }

    for (const cat of state.categories) {
      const existingId = existingByName[cat.name.toLowerCase()];
      if (existingId) {
        // Reuse existing category
        catIdMap[cat.tempId] = existingId;
      } else {
        // Create new category
        const { json } = await post("/tagcategories/", {
          name: cat.name,
          data: cat.data,
        });
        catIdMap[cat.tempId] = json.id;
        // Track newly created so subsequent categories with same name reuse it
        existingByName[cat.name.toLowerCase()] = json.id;
      }
    }
    update(stepIdx, { status: "completed" });
  } catch (e) {
    update(stepIdx, { status: "error", error: String(e) });
    throw e;
  }

  // 4. Create tags
  stepIdx++;
  update(stepIdx, { status: "in_progress" });
  try {
    for (const tag of state.tags) {
      const { json } = await post("/tags/", {
        project_id: projectId,
        value: tag.value,
        description: tag.description,
        tag_category_id: catIdMap[tag.categoryTempId],
        filter: tag.filter,
        data: tag.data,
      });
      tagIdMap[tag.tempId] = json.id;
    }
    update(stepIdx, { status: "completed" });
  } catch (e) {
    update(stepIdx, { status: "error", error: String(e) });
    throw e;
  }

  // 5. Create UI groups
  stepIdx++;
  update(stepIdx, { status: "in_progress" });
  try {
    for (let i = 0; i < state.uiGroups.length; i++) {
      const group = state.uiGroups[i];
      const { json } = await post("/uigroups/", {
        project_id: projectId,
        name: group.name,
        tag_category_id: catIdMap[group.categoryTempId],
        ui_mode: group.ui_mode,
        select_type: group.select_type,
        is_active: group.is_active,
        header_text: group.header_text,
        sort_index: i,
      });
      groupIdMap[group.tempId] = json.id;
    }
    update(stepIdx, { status: "completed" });
  } catch (e) {
    update(stepIdx, { status: "error", error: String(e) });
    throw e;
  }

  // 6. Create UI items (linking tags to groups)
  stepIdx++;
  update(stepIdx, { status: "in_progress" });
  try {
    for (const group of state.uiGroups) {
      const realGroupId = groupIdMap[group.tempId];
      for (let i = 0; i < group.tagTempIds.length; i++) {
        const tagTempId: TempId = group.tagTempIds[i];
        const realTagId = tagIdMap[tagTempId];
        if (realTagId !== undefined) {
          await post("/uiitems/", {
            ui_group_id: realGroupId,
            tag_id: realTagId,
            sort_index: i,
            is_active: true,
            is_default: false,
          });
        }
      }
    }
    update(stepIdx, { status: "completed" });
  } catch (e) {
    update(stepIdx, { status: "error", error: String(e) });
    throw e;
  }

  // 7. Create speakers (if not skipped)
  if (!state.skipSpeakers && state.speakers.length > 0) {
    stepIdx++;
    update(stepIdx, { status: "in_progress" });
    try {
      for (const spk of state.speakers) {
        await post("/speakers/", {
          project_id: projectId,
          code: spk.code,
          is_active: spk.is_active,
          attenuation_distance: spk.attenuation_distance,
          min_volume: spk.min_volume,
          max_volume: spk.max_volume,
          fill_color: spk.fill_color,
          border_color: spk.border_color,
        });
      }
      update(stepIdx, { status: "completed" });
    } catch (e) {
      update(stepIdx, { status: "error", error: String(e) });
      throw e;
    }
  }

  return projectId;
}
