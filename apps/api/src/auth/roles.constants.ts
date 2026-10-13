/** Roles del sistema (SPEC §3). El RBAC por ámbito llega en una iteración posterior. */
export const APP_ROLES = [
  'superadmin',
  'coordinacion',
  'auxiliar',
  'instructor',
  'vocero',
  'aprendiz',
  'cafeteria',
  'porteria',
] as const;

export type AppRole = (typeof APP_ROLES)[number];
