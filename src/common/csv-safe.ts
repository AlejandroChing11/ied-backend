const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Neutraliza celdas que Excel/Sheets interpretarían como fórmula. */
export function neutralizeCsvCell(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (FORMULA_PREFIX.test(trimmed)) return `'${trimmed}`;
  return trimmed;
}
