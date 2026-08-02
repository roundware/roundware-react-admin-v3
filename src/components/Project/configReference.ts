/**
 * Pure logic behind the Advanced configuration panel — no React, no MUI, so it
 * can be exercised directly.
 *
 * See roundware-server-v3/docs/009-configuration.md. The precedence implemented
 * in `buildRows` must match the web app's `ServerConfigProvider`:
 *
 *     local defaults  <  ui_config_json  <  project columns
 */

export type ConfigSchema = {
  known_sections: string[];
  scalar_sections: string[];
  column_backed: Record<string, string>;
};

export type Source = "default" | "override" | "column";

export interface Row {
  path: string;
  value: unknown;
  source: Source;
  column?: string;
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Flatten to dotted leaf paths.
 *
 * Arrays are treated as leaves, not descended into, because the web app's merge
 * replaces arrays wholesale rather than merging them by index (docs/009 §2.2).
 * Showing `loopFractions.0`, `loopFractions.1`, … would imply you can override
 * one element, which you cannot.
 */
export function flatten(
  obj: Record<string, unknown> | null | undefined,
  prefix = ""
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  // Tolerate a missing document. This runs inside the project edit form, and
  // an exception here would take down the whole page rather than just the
  // reference panel.
  if (!isPlainObject(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) Object.assign(out, flatten(v, path));
    else out[path] = v;
  }
  return out;
}

export function buildRows(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
  record: Record<string, unknown> | undefined,
  schema: ConfigSchema | null
): Row[] {
  const flatDefaults = flatten(defaults);
  const flatOverrides = flatten(overrides);
  const columnFor = schema?.column_backed ?? {};

  const paths = new Set([
    ...Object.keys(flatDefaults),
    ...Object.keys(flatOverrides),
  ]);
  const rows: Row[] = [];

  for (const path of Array.from(paths).sort()) {
    const column = columnFor[path];
    if (column && record && record[column] !== undefined && record[column] !== null) {
      rows.push({ path, value: record[column], source: "column", column });
    } else if (path in flatOverrides) {
      rows.push({ path, value: flatOverrides[path], source: "override" });
    } else {
      rows.push({ path, value: flatDefaults[path], source: "default" });
    }
  }
  return rows;
}

/**
 * Mirror of the server's `validate_ui_config`, driven by the rules fetched from
 * `GET /config/schema/` so it cannot drift from what the server enforces.
 */
export function validate(doc: unknown, schema: ConfigSchema | null): string[] {
  if (!isPlainObject(doc)) return ["Config must be a JSON object."];
  if (!schema) return [];

  const errors: string[] = [];
  for (const [section, contents] of Object.entries(doc)) {
    if (!schema.known_sections.includes(section)) {
      errors.push(
        `Unknown section "${section}". Known sections: ${schema.known_sections.join(", ")}.`
      );
      continue;
    }
    if (schema.scalar_sections.includes(section)) continue;
    if (!isPlainObject(contents)) {
      errors.push(`Section "${section}" must be an object.`);
      continue;
    }
    for (const key of Object.keys(contents)) {
      const column = schema.column_backed[`${section}.${key}`];
      if (column) {
        errors.push(
          `"${section}.${key}" is controlled by the "${column}" field above and would be ignored here. Set that field instead.`
        );
      }
    }
  }
  return errors;
}
