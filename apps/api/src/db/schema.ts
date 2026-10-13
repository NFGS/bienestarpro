import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Esquema inicial (rebanada 1, M4 Administración).
 *
 * Nota RLS (ADR-0003): las políticas Row-Level Security y el contexto
 * `SET LOCAL app.centro_id` se añaden como migraciones SQL explícitas cuando
 * lleguen las tablas multi-tenant de M9/M1 (ADR-0016, D2). Las tablas de esta
 * rebanada son de identidad (pre-tenant) y se protegen por rol de aplicación.
 */

export const centers = pgTable('centers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  region: text('region').notNull().default('Quindío'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id').references(() => centers.id),
  document: text('document').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  /** Rol global provisional; el RBAC por ámbito llega con el CRUD de usuarios (RF-02). */
  role: text('role').notNull().default('aprendiz'),
  status: text('status').notNull().default('activo'),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  /** Secreto TOTP cifrado con AES-256-GCM (TOTP_ENCRYPTION_KEY). */
  totpSecret: text('totp_secret'),
  /** Fecha de activación del segundo factor; nulo = no configurado. */
  totpEnabledAt: timestamp('totp_enabled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Bitácora de auditoría (RF-04): solo inserción.
 * Registra accesos, cambios de rol y operaciones críticas.
 * `detail` nunca contiene datos sensibles (contraseñas, tokens, contactos).
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id'),
    actorId: uuid('actor_id'),
    actorEmail: text('actor_email'),
    action: text('action').notNull(),
    entity: text('entity'),
    entityId: uuid('entity_id'),
    detail: jsonb('detail'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('audit_log_created_at_idx').on(table.createdAt),
    index('audit_log_action_idx').on(table.action),
    index('audit_log_actor_idx').on(table.actorId),
  ],
);
