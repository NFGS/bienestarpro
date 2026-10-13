/** Utilidades de errores de base de datos compartidas. */

/** Detecta la violación de unicidad de PostgreSQL (23505), incluso envuelta por drizzle. */
export function isUniqueViolation(error: unknown): boolean {
  let current = error as { code?: string; cause?: unknown } | undefined;
  for (let depth = 0; current && depth < 5; depth++) {
    if (current.code === '23505') {
      return true;
    }
    current = current.cause as { code?: string; cause?: unknown } | undefined;
  }
  return false;
}
