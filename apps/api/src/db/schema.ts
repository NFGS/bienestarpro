import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
