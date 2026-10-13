import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
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

/**
 * M9 — Directorio maestro (rebanada 2). Tablas multi-tenant:
 * protegidas con Row-Level Security (ver migración SQL de políticas, ADR-0003).
 * Toda consulta pasa por `DbService.withTenant` (contexto `app.centro_id`).
 */

export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('activo'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Fichas de formación (con jornada mañana/tarde/noche). */
export const groups = pgTable(
  'groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id),
    code: text('code').notNull(),
    journey: text('journey').notNull(),
    startDate: date('start_date', { mode: 'string' }),
    endDate: date('end_date', { mode: 'string' }),
    status: text('status').notNull().default('activa'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('groups_center_code_unique').on(table.centerId, table.code),
    index('groups_center_journey_idx').on(table.centerId, table.journey),
  ],
);

/** Aprendices (historial conservado: el retiro cambia `status`). */
export const learners = pgTable(
  'learners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    document: text('document').notNull(),
    fullName: text('full_name').notNull(),
    email: text('email'),
    status: text('status').notNull().default('activo'),
    retiredAt: timestamp('retired_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('learners_center_document_unique').on(
      table.centerId,
      table.document,
    ),
  ],
);

/** Asignación de instructores a fichas (director o instructor). */
export const groupInstructors = pgTable(
  'group_instructors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    instructorId: uuid('instructor_id')
      .notNull()
      .references(() => users.id),
    roleInGroup: text('role_in_group').notNull().default('instructor'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('group_instructors_unique').on(table.groupId, table.instructorId),
  ],
);

/** Consentimientos de tratamiento de datos (Ley 1581): versionados y revocables. */
export const consents = pgTable('consents', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  learnerId: uuid('learner_id')
    .notNull()
    .references(() => learners.id),
  policyVersion: text('policy_version').notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

/**
 * M1 — Refrigerios (rebanada 3). Tablas multi-tenant con RLS
 * (ver migración 0008: políticas + función de confirmación pública).
 */

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  date: date('date', { mode: 'string' }).notNull(),
  journey: text('journey').notNull(),
  /** borrador | activo | cerrado */
  status: text('status').notNull().default('borrador'),
  /** Reglas aplicadas al calcular los cupos (RF-13), congeladas al publicar. */
  rulesSnapshot: jsonb('rules_snapshot'),
  confirmationDeadline: timestamp('confirmation_deadline', {
    withTimezone: true,
  }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closeSummary: jsonb('close_summary'),
  cafeteriaPreparedAt: timestamp('cafeteria_prepared_at', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const eventGroups = pgTable(
  'event_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    calculatedQuota: integer('calculated_quota').notNull().default(0),
    adjustedQuota: integer('adjusted_quota'),
  },
  (table) => [unique('event_groups_unique').on(table.eventId, table.groupId)],
);

export const eventParticipants = pgTable(
  'event_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    learnerId: uuid('learner_id')
      .notNull()
      .references(() => learners.id),
    /** convocado | confirmado | rechazado | entregado | no_reclamado */
    status: text('status').notNull().default('convocado'),
    qrToken: uuid('qr_token').notNull().unique(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('event_participants_unique').on(table.eventId, table.learnerId),
  ],
);

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id),
  participantId: uuid('participant_id')
    .notNull()
    .references(() => eventParticipants.id),
  /** qr | manual */
  method: text('method').notNull(),
  registeredBy: uuid('registered_by')
    .notNull()
    .references(() => users.id),
  /** Idempotencia para sincronización offline (UUID generado en el cliente). */
  clientUuid: uuid('client_uuid').notNull().unique(),
  /** Motivo en entrega manual o autorización de excepción. */
  reason: text('reason'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
