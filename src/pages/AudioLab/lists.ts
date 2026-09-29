// Text ↔ number lists for the Audio lab's list fields.

/** A loop fraction as text: 0.5 → "1/2", -0.25 → "-1/4", 1 → "1". */
export function fractionText(value: number): string {
  if (Number.isInteger(value)) return String(value);
  for (let den = 2; den <= 16; den++) {
    const num = Math.round(value * den);
    if (Math.abs(num / den - value) < 1e-9) return `${num}/${den}`;
  }
  return String(value);
}

/**
 * "1/2, 1, -1/4" → [0.5, 1, -0.25]. Fractions of the recording, reversed when
 * negative; each must be non-zero and no longer than the recording.
 */
export function parseFractions(text: string): { values: number[] } | { error: string } {
  const values: number[] = [];
  for (const token of text.split(",").map((t) => t.trim()).filter(Boolean)) {
    const m = /^(-?\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?$/.exec(token);
    if (!m) return { error: `"${token}" is not a fraction like 1/2 or -1/4.` };
    const value = m[2] ? parseFloat(m[1]) / parseFloat(m[2]) : parseFloat(m[1]);
    if (!value || Math.abs(value) > 1)
      return { error: `"${token}": use a non-zero fraction no longer than the whole (−1 to 1).` };
    values.push(value);
  }
  if (!values.length) return { error: "Give at least one fraction, e.g. 1." };
  return { values };
}

/** "-0.8, -0.4, 0.4" → [-0.8, -0.4, 0.4]; each from −1 (left) to 1 (right). */
export function parsePans(text: string): { values: number[] } | { error: string } {
  const values: number[] = [];
  for (const token of text.split(",").map((t) => t.trim()).filter(Boolean)) {
    const value = Number(token);
    if (!Number.isFinite(value) || value < -1 || value > 1)
      return { error: `"${token}": each position is a number from −1 (left) to 1 (right).` };
    values.push(value);
  }
  return { values };
}
