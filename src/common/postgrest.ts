/** Escapa valores para filtros PostgREST (.or / .ilike) y evita inyectar operadores. */
export function escapePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
